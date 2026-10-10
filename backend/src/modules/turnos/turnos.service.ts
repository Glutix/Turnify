import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { EstadoTurno, type Prisma, type Usuario, type Servicio } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { HorariosService } from "../horarios/horarios.service";
import { normalizarTelefono } from "../auth/utils/normalizar-telefono";
import { type ReservarTurnoDto } from "./dto/reservar-turno.dto";
import { type ReservarTurnoAutenticadoDto } from "./dto/reservar-turno-autenticado.dto";
import { type ReprogramarTurnoDto } from "./dto/reprogramar-turno.dto";
import { type ReservarTurnoAdminDto } from "./dto/reservar-turno-admin.dto";
import { type ListarTurnosAdminDto } from "./dto/listar-turnos-admin.dto";
import {
  minutosDesdeMedianoche,
  hhmmAMinutos,
  minutosAHhmm,
  combinarFechaYMinutos,
  seSuperponen,
  soloFecha,
  ahoraDelSalon,
} from "./utils/franja-horaria.util";

const PASO_MINUTOS_SLOT = 15;
const HORAS_MINIMAS_ANTICIPACION = 12;
// Duración máxima de un turno: 3 h 45 min. Duplicada en el frontend
// (utils/servicio.ts → MAX_DURACION_TURNO_MINUTOS) para avisar antes de reservar.
const MAX_DURACION_TURNO_MINUTOS = 225;
const MAX_RANGO_DIAS_HABILITADOS = 62;
// Clave del advisory lock de Postgres que serializa las altas/reprogramaciones
// de turnos (una sola profesional = una sola agenda).
const CLAVE_LOCK_AGENDA = 7301001;

// Duplicado a propósito de AuthService.validarCodigo — ver nota en
// verificarCodigoOtp() más abajo sobre por qué no se reutilizó AuthService
// directamente bajo la presión de tiempo del entrega. Candidato a
// refactor: extraer un OtpService compartido entre auth y turnos.
const MAX_INTENTOS_CODIGO = 3; // CU-07: máximo 3 intentos de OTP

@Injectable()
export class TurnosService {
  private readonly logger = new Logger(TurnosService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly horariosService: HorariosService,
  ) {}

  // ============================================================
  // CU-06 / RF04 / RF06 — Consultar disponibilidad
  // ============================================================

  // `excluirTurnoId`: al reprogramar, el turno original no debe bloquear su propio
  // horario (el backend ya lo ignora al validar; acá se ignora al ofrecer slots).
  async consultarDisponibilidad(servicioIds: number[], fechaStr: string, excluirTurnoId?: number) {
    const { duracionTotalMinutos } = await this.obtenerServiciosValidos(servicioIds);
    const fecha = soloFecha(fechaStr);

    const excepciones = await this.horariosService.obtenerExcepcionesParaFecha(fecha);
    if (excepciones.some((e) => e.tipo === "bloqueo_total")) {
      // RF04/CU-06: sin horarios ese día — el front debe sugerir otra fecha.
      return [];
    }

    const franjas = await this.horariosService.obtenerFranjasActivasPorFecha(fecha);
    if (franjas.length === 0) return [];

    const bloqueosParciales = excepciones.filter((e) => e.tipo === "horario_especial");

    const inicioDia = fecha;
    const finDia = combinarFechaYMinutos(fecha, 24 * 60);
    const turnosDelDia = await this.prisma.turno.findMany({
      where: {
        estado: EstadoTurno.confirmado,
        fecha_hora_inicio: { lt: finDia },
        fecha_hora_fin: { gt: inicioDia },
        ...(excluirTurnoId !== undefined ? { id: { not: excluirTurnoId } } : {}),
      },
      select: { fecha_hora_inicio: true, fecha_hora_fin: true },
    });

    const ahora = ahoraDelSalon();
    const slots: { hora_inicio: string; hora_fin: string }[] = [];

    for (const franja of franjas) {
      const inicioFranjaMin = minutosDesdeMedianoche(franja.hora_inicio);
      const finFranjaMin = minutosDesdeMedianoche(franja.hora_fin);

      for (
        let candidatoMin = inicioFranjaMin;
        candidatoMin + duracionTotalMinutos <= finFranjaMin;
        candidatoMin += PASO_MINUTOS_SLOT
      ) {
        const finCandidatoMin = candidatoMin + duracionTotalMinutos;
        const inicioCandidato = combinarFechaYMinutos(fecha, candidatoMin);
        const finCandidato = combinarFechaYMinutos(fecha, finCandidatoMin);

        if (inicioCandidato <= ahora) continue; // no ofrecer horarios pasados

        const ocupado = turnosDelDia.some((t) =>
          seSuperponen(inicioCandidato, finCandidato, t.fecha_hora_inicio, t.fecha_hora_fin),
        );
        if (ocupado) continue;

        const bloqueado = bloqueosParciales.some((e) => {
          if (!e.hora_inicio || !e.hora_fin) return false;
          const inicioBloqueo = combinarFechaYMinutos(
            fecha,
            minutosDesdeMedianoche(e.hora_inicio),
          );
          const finBloqueo = combinarFechaYMinutos(fecha, minutosDesdeMedianoche(e.hora_fin));
          return seSuperponen(inicioCandidato, finCandidato, inicioBloqueo, finBloqueo);
        });
        if (bloqueado) continue;

        slots.push({
          hora_inicio: minutosAHhmm(candidatoMin),
          hora_fin: minutosAHhmm(finCandidatoMin),
        });
      }
    }

    return slots;
  }

  // Días con atención entre dos fechas (inclusive): excluye pasados, días sin
  // franjas activas (p. ej. sábados y domingos) y feriados/cierres
  // (bloqueo_total). Lo usa el frontend para ofrecer solo fechas válidas.
  // Si la fecha es HOY, además exige que quede alguna franja que termine después
  // de la hora actual del salón (si ya pasó la última franja, "hoy" no se ofrece).
  // No conoce los servicios elegidos, así que no verifica que entre uno puntual.
  async diasHabilitados(desdeStr: string, hastaStr: string): Promise<string[]> {
    const formato = /^\d{4}-\d{2}-\d{2}$/;
    if (!formato.test(desdeStr ?? "") || !formato.test(hastaStr ?? "")) {
      throw new BadRequestException("desde y hasta deben tener formato YYYY-MM-DD");
    }
    const DIA_MS = 24 * 60 * 60 * 1000;
    const ahora = ahoraDelSalon();
    const hoy = Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), ahora.getUTCDate());
    const desde = Math.max(soloFecha(desdeStr).getTime(), hoy);
    const hasta = soloFecha(hastaStr).getTime();
    if (Number.isNaN(desde) || Number.isNaN(hasta) || hasta < desde) return [];
    if ((hasta - desde) / DIA_MS > MAX_RANGO_DIAS_HABILITADOS) {
      throw new BadRequestException(
        `El rango máximo es de ${MAX_RANGO_DIAS_HABILITADOS} días`,
      );
    }

    const ahoraMin = ahora.getUTCHours() * 60 + ahora.getUTCMinutes();
    const fechas: Date[] = [];
    for (let t = desde; t <= hasta; t += DIA_MS) fechas.push(new Date(t));

    const habilitados = await Promise.all(
      fechas.map(async (fecha) => {
        const excepciones = await this.horariosService.obtenerExcepcionesParaFecha(fecha);
        if (excepciones.some((e) => e.tipo === "bloqueo_total")) return null;
        const franjas = await this.horariosService.obtenerFranjasActivasPorFecha(fecha);
        const esHoy = fecha.getTime() === hoy;
        const franjasConTiempo = esHoy
          ? franjas.filter((f) => minutosDesdeMedianoche(f.hora_fin) > ahoraMin)
          : franjas;
        return franjasConTiempo.length > 0 ? fecha.toISOString().slice(0, 10) : null;
      }),
    );
    return habilitados.filter((d): d is string => d !== null);
  }

  // ============================================================
  // CU-07 — Reservar turno (invitado, con OTP)
  // ============================================================

  async reservarComoInvitado(dto: ReservarTurnoDto) {
    const telefono = await this.verificarCodigoOtp(dto.telefono, dto.codigo);

    const { servicios, duracionTotalMinutos } = await this.obtenerServiciosValidos(
      dto.servicios,
    );
    const fecha = soloFecha(dto.fecha);
    const horaInicioMin = hhmmAMinutos(dto.hora_inicio);

    await this.validarDisponibilidadSlot(
      fecha,
      horaInicioMin,
      duracionTotalMinutos,
    );

    const usuario = await this.obtenerOCrearUsuarioPorTelefono(telefono, dto.nombre);

    const turno = await this.enAgendaBloqueada(
      fecha,
      horaInicioMin,
      duracionTotalMinutos,
      undefined,
      (tx, inicio, fin) => this.crearTurnoConServicios(usuario.id, inicio, fin, servicios, undefined, tx),
    );

    this.notificarReservaConfirmada(usuario, turno.id, dto.fecha, dto.hora_inicio);

    return turno;
  }

  // ============================================================
  // CU-07 (variante) — Reservar turno con sesión iniciada
  // ============================================================
  // Los datos salen del usuario del token (no del body). El OTP se sigue
  // exigiendo, enviado al teléfono del usuario: es la barrera anti-bot /
  // anti-script contra reservas masivas (un código sirve para UNA reserva
  // porque verificarCodigoOtp lo marca como verificado).
  // Se valida servicio + horario ANTES de consumir el código, así un 409
  // por horario ocupado no obliga a pedir otro OTP.
  async reservarComoAutenticado(usuarioId: number, dto: ReservarTurnoAutenticadoDto) {
    const usuario = await this.obtenerUsuarioPorId(usuarioId);
    if (!usuario.telefono) {
      throw new BadRequestException(
        "Tu cuenta no tiene un teléfono asociado, no se puede verificar la reserva",
      );
    }

    const { servicios, duracionTotalMinutos } = await this.obtenerServiciosValidos(
      dto.servicios,
    );
    const fecha = soloFecha(dto.fecha);
    const horaInicioMin = hhmmAMinutos(dto.hora_inicio);

    await this.validarDisponibilidadSlot(
      fecha,
      horaInicioMin,
      duracionTotalMinutos,
    );

    await this.verificarCodigoOtp(usuario.telefono, dto.codigo);

    const turno = await this.enAgendaBloqueada(
      fecha,
      horaInicioMin,
      duracionTotalMinutos,
      undefined,
      (tx, inicio, fin) => this.crearTurnoConServicios(usuario.id, inicio, fin, servicios, undefined, tx),
    );

    this.notificarReservaConfirmada(usuario, turno.id, dto.fecha, dto.hora_inicio);

    return turno;
  }

  // ============================================================
  // CU-09 / RF11-13 — Cancelar turno (cliente con sesión)
  // ============================================================
  // Se identifica por la sesión (usuarioId del token), NO por teléfono: antes
  // cualquiera que conociera un teléfono y un id podía cancelar. Un turno
  // ajeno responde 404 (no 401, que desloguea en el frontend ni revela que existe).

  async cancelarMiTurno(usuarioId: number, turnoId: number) {
    const turno = await this.findOneConUsuario(turnoId);
    this.asegurarTurnoDelUsuario(turno.usuario_id, usuarioId, turnoId);

    this.asegurarTurnoConfirmado(turno.estado, "cancelar");
    this.asegurarAnticipacionMinima(turno.fecha_hora_inicio);

    const actualizado = await this.prisma.turno.update({
      where: { id: turnoId },
      data: { estado: EstadoTurno.cancelado },
    });

    // RF14: notificar a la admin cuando el cliente cancela.
    this.notificarAdmin(
      `Turno #${turnoId} cancelado por ${turno.usuario.nombre} (${turno.usuario.telefono})`,
    );

    return actualizado;
  }

  // ============================================================
  // CU-10 / RF11-13 — Reprogramar turno (cliente con sesión)
  // ============================================================

  async reprogramarMiTurno(usuarioId: number, turnoId: number, dto: ReprogramarTurnoDto) {
    const turnoOriginal = await this.findOneConServiciosYUsuario(turnoId);
    this.asegurarTurnoDelUsuario(turnoOriginal.usuario_id, usuarioId, turnoId);

    this.asegurarTurnoConfirmado(turnoOriginal.estado, "reprogramar");
    this.asegurarAnticipacionMinima(turnoOriginal.fecha_hora_inicio);

    const duracionTotalMinutos = turnoOriginal.turno_servicios.reduce(
      (acc, ts) => acc + ts.servicio.duracion_minutos,
      0,
    );
    const fecha = soloFecha(dto.fecha);
    const horaInicioMin = hhmmAMinutos(dto.hora_inicio);

    const nuevoTurno = await this.ejecutarReprogramacion(
      turnoOriginal,
      fecha,
      horaInicioMin,
      duracionTotalMinutos,
    );

    // RF14/15: notificar a la admin cuando el cliente reprograma.
    this.notificarAdmin(
      `Turno #${turnoId} reprogramado por ${turnoOriginal.usuario.nombre} ` +
        `(${turnoOriginal.usuario.telefono}) → ${dto.fecha} ${dto.hora_inicio}`,
    );

    return nuevoTurno;
  }

  // ============================================================
  // CU-11 / RF16-17 — Mis turnos (historial del usuario con sesión)
  // ============================================================

  async misTurnos(usuarioId: number) {
    return this.prisma.turno.findMany({
      where: { usuario_id: usuarioId },
      orderBy: { fecha_hora_inicio: "desc" },
      include: { turno_servicios: { include: { servicio: true } } },
    });
  }

  // ============================================================
  // Lado ADMIN — CU-20/28/40/41/42, RF31-33/42/43
  // ============================================================
  // TODO (deuda técnica conocida): ninguna de estas rutas tiene guard de
  // autenticación todavía (no hay JwtAuthGuard/RolesGuard en el proyecto
  // — lo marcamos como pendiente desde el mensaje anterior). Hoy cualquiera
  // puede pegarle a estos endpoints. Hay que resolverlo antes de producción.

  async agendaAdmin(fechaStr?: string) {
    const fecha = fechaStr ? soloFecha(fechaStr) : soloFecha(ahoraDelSalon().toISOString().slice(0, 10));
    const finDia = combinarFechaYMinutos(fecha, 24 * 60);

    return this.prisma.turno.findMany({
      where: {
        fecha_hora_inicio: { gte: fecha, lt: finDia },
      },
      orderBy: { fecha_hora_inicio: "asc" },
      include: {
        usuario: { select: { id: true, nombre: true, apellido: true, telefono: true } },
        turno_servicios: { include: { servicio: true } },
      },
    });
  }

  // Próximos turnos (CU-20/RF31): confirmados desde el comienzo de hoy (hora del
  // salón) en adelante, ordenados por fecha. Tope de 100 para no devolver una
  // lista ilimitada; el histórico completo está en listarAdmin.
  async proximosAdmin() {
    const ahora = ahoraDelSalon();
    const hoy = new Date(
      Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), ahora.getUTCDate()),
    );

    return this.prisma.turno.findMany({
      where: {
        estado: EstadoTurno.confirmado,
        fecha_hora_inicio: { gte: hoy },
      },
      orderBy: { fecha_hora_inicio: "asc" },
      take: 100,
      include: {
        usuario: { select: { id: true, nombre: true, apellido: true, telefono: true } },
        turno_servicios: { include: { servicio: true } },
      },
    });
  }

  // Listado administrativo de todos los turnos, con filtros y paginación
  // (TurnosAdminPage). A diferencia de agendaAdmin, no se limita a un día.
  async listarAdmin(filtros: ListarTurnosAdminDto) {
    const pagina = filtros.pagina ?? 1;
    const limite = filtros.limite ?? 20;

    const where: Prisma.TurnoWhereInput = {};

    if (filtros.estado) where.estado = filtros.estado;

    if (filtros.desde || filtros.hasta) {
      where.fecha_hora_inicio = {
        ...(filtros.desde ? { gte: soloFecha(filtros.desde) } : {}),
        // "hasta" es inclusivo: se corta al comienzo del día siguiente.
        ...(filtros.hasta
          ? { lt: combinarFechaYMinutos(soloFecha(filtros.hasta), 24 * 60) }
          : {}),
      };
    }

    const busqueda = filtros.busqueda?.trim();
    if (busqueda) {
      const soloDigitos = busqueda.replace(/\D/g, "");
      where.usuario = {
        OR: [
          { nombre: { contains: busqueda, mode: "insensitive" } },
          { apellido: { contains: busqueda, mode: "insensitive" } },
          ...(soloDigitos ? [{ telefono: { contains: soloDigitos } }] : []),
        ],
      };
    }

    const [total, data] = await this.prisma.$transaction([
      this.prisma.turno.count({ where }),
      this.prisma.turno.findMany({
        where,
        orderBy: { fecha_hora_inicio: "desc" },
        skip: (pagina - 1) * limite,
        take: limite,
        include: {
          usuario: { select: { id: true, nombre: true, apellido: true, telefono: true } },
          turno_servicios: { include: { servicio: true } },
        },
      }),
    ]);

    return { data, total, pagina, limite };
  }

  async cancelarComoAdmin(turnoId: number) {
    const turno = await this.findOneConUsuario(turnoId);
    this.asegurarTurnoConfirmado(turno.estado, "cancelar");

    const actualizado = await this.prisma.turno.update({
      where: { id: turnoId },
      data: { estado: EstadoTurno.cancelado },
    });

    // RF42: notificar a la clienta cuando la admin cancela.
    this.notificarCliente(
      turno.usuario.telefono,
      `Tu turno del ${this.formatearFechaHora(turno.fecha_hora_inicio)} fue cancelado.`,
    );

    return actualizado;
  }

  async reprogramarComoAdmin(turnoId: number, fechaStr: string, horaInicio: string) {
    const turnoOriginal = await this.findOneConServiciosYUsuario(turnoId);
    this.asegurarTurnoConfirmado(turnoOriginal.estado, "reprogramar");

    const duracionTotalMinutos = turnoOriginal.turno_servicios.reduce(
      (acc, ts) => acc + ts.servicio.duracion_minutos,
      0,
    );
    const fecha = soloFecha(fechaStr);
    const horaInicioMin = hhmmAMinutos(horaInicio);

    const nuevoTurno = await this.ejecutarReprogramacion(
      turnoOriginal,
      fecha,
      horaInicioMin,
      duracionTotalMinutos,
    );

    // RF42: notificar a la clienta cuando la admin reprograma.
    this.notificarCliente(
      turnoOriginal.usuario.telefono,
      `Tu turno fue reprogramado para el ${fechaStr} a las ${horaInicio}.`,
    );

    return nuevoTurno;
  }

  async reservarComoAdmin(dto: ReservarTurnoAdminDto) {
    const { servicios, duracionTotalMinutos } = await this.obtenerServiciosValidos(dto.servicios);
    const fecha = soloFecha(dto.fecha);
    const horaInicioMin = hhmmAMinutos(dto.hora_inicio);

    await this.validarDisponibilidadSlot(
      fecha,
      horaInicioMin,
      duracionTotalMinutos,
    );

    const usuario = dto.usuario_id
      ? await this.obtenerUsuarioPorId(dto.usuario_id)
      : await this.obtenerOCrearUsuarioPorTelefono(dto.telefono as string, dto.nombre);

    return this.enAgendaBloqueada(
      fecha,
      horaInicioMin,
      duracionTotalMinutos,
      undefined,
      (tx, inicio, fin) => this.crearTurnoConServicios(usuario.id, inicio, fin, servicios, undefined, tx),
    );
  }

  async marcarAtendido(turnoId: number) {
    const turno = await this.findOne(turnoId);
    this.asegurarTurnoConfirmado(turno.estado, "marcar como atendido");

    // Solo desde el día del turno en adelante (si la admin se olvidó, puede
    // marcarlo días después; lo que no tiene sentido es "atender" un turno futuro).
    const ahora = ahoraDelSalon();
    const inicioDeManiana = Date.UTC(
      ahora.getUTCFullYear(),
      ahora.getUTCMonth(),
      ahora.getUTCDate() + 1,
    );
    if (turno.fecha_hora_inicio.getTime() >= inicioDeManiana) {
      throw new BadRequestException(
        "Solo se puede marcar como atendido un turno del día de hoy o anterior",
      );
    }
    return this.prisma.turno.update({
      where: { id: turnoId },
      data: { estado: EstadoTurno.atendido },
    });
  }

  // CU-28/RF43: historial de turnos de un cliente puntual, por id (para el
  // detalle de clienta en el panel admin). El historial de "compras" (lado
  // pedidos) no se incluye acá — depende del módulo de pedidos, que
  // pertenece al otro chat y todavía no tiene nada implementado.
  async historialPorUsuarioId(usuarioId: number) {
    await this.obtenerUsuarioPorId(usuarioId);
    return this.prisma.turno.findMany({
      where: { usuario_id: usuarioId },
      orderBy: { fecha_hora_inicio: "desc" },
      include: { turno_servicios: { include: { servicio: true } } },
    });
  }

  // ============================================================
  // helpers privados
  // ============================================================

  // Solo un turno confirmado puede cancelarse o marcarse como atendido desde el
  // panel. Evita, por ejemplo, "atender" un turno ya cancelado o reprogramado.
  private asegurarTurnoConfirmado(estado: EstadoTurno, accion: string) {
    if (estado !== EstadoTurno.confirmado) {
      throw new ConflictException(
        `No se puede ${accion} un turno en estado "${estado}". Solo aplica a turnos confirmados.`,
      );
    }
  }

  private asegurarTurnoDelUsuario(duenioId: number, usuarioId: number, turnoId: number) {
    if (duenioId !== usuarioId) {
      throw new NotFoundException(`No existe el turno #${turnoId}`);
    }
  }

  private async findOne(id: number) {
    const turno = await this.prisma.turno.findUnique({ where: { id } });
    if (!turno) throw new NotFoundException(`No existe el turno #${id}`);
    return turno;
  }

  private async findOneConUsuario(id: number) {
    const turno = await this.prisma.turno.findUnique({
      where: { id },
      include: { usuario: true },
    });
    if (!turno) throw new NotFoundException(`No existe el turno #${id}`);
    return turno;
  }

  private async findOneConServiciosYUsuario(id: number) {
    const turno = await this.prisma.turno.findUnique({
      where: { id },
      include: {
        usuario: true,
        turno_servicios: { include: { servicio: true } },
      },
    });
    if (!turno) throw new NotFoundException(`No existe el turno #${id}`);
    return turno;
  }

  private async obtenerUsuarioPorId(id: number): Promise<Usuario> {
    const usuario = await this.prisma.usuario.findUnique({ where: { id } });
    if (!usuario) throw new NotFoundException(`No existe el usuario #${id}`);
    return usuario;
  }

  private async obtenerServiciosValidos(
    servicioIds: number[],
  ): Promise<{ servicios: Servicio[]; duracionTotalMinutos: number }> {
    const servicios = await this.prisma.servicio.findMany({
      where: { id: { in: servicioIds }, activo: true },
    });
    if (servicios.length !== servicioIds.length) {
      throw new BadRequestException(
        "Alguno de los servicios seleccionados no existe o no está activo",
      );
    }
    const duracionTotalMinutos = servicios.reduce((acc, s) => acc + s.duracion_minutos, 0);
    if (duracionTotalMinutos > MAX_DURACION_TURNO_MINUTOS) {
      throw new BadRequestException(
        "La duración máxima de un turno es de 3 h 45 min. Elegí menos servicios o sacá dos turnos para realizarte todos.",
      );
    }
    return { servicios, duracionTotalMinutos };
  }

  // RF08/CU-08: si el teléfono ya tiene perfil, se usa ese perfil tal cual
  // (ignorando el nombre que se haya tipeado en el form); si no existe,
  // se crea un perfil "incompleto" (sin apellido, sin email) con ese
  // nombre — exactamente lo que pide RNF02 (reservar solo con nombre y
  // teléfono, sin pasos obligatorios extra).
  private async obtenerOCrearUsuarioPorTelefono(
    telefonoCrudo: string,
    nombre?: string,
  ): Promise<Usuario> {
    const telefono = normalizarTelefono(telefonoCrudo);

    const usuarioExistente = await this.prisma.usuario.findUnique({ where: { telefono } });
    if (usuarioExistente) return usuarioExistente;

    return this.prisma.usuario.create({
      data: {
        telefono,
        nombre: nombre ?? "Cliente",
        rol: "cliente",
        perfil_completo: false,
      },
    });
  }

  // Duplicado deliberadamente de AuthService.validarCodigo (mismas reglas:
  // 3 intentos, expiración, etc.). No se inyectó AuthService acá para no
  // tener que tocar auth.module.ts (que hoy no exporta AuthService) bajo
  // presión de tiempo antes de la entrega. Si en algún momento se
  // refactoriza, esto debería vivir en un OtpService compartido entre
  // auth y turnos — hoy, si cambia una regla de OTP, hay que cambiarla acá
  // Y en auth.service.ts.
  private async verificarCodigoOtp(telefonoCrudo: string, codigo: string): Promise<string> {
    const telefono = normalizarTelefono(telefonoCrudo);

    const registro = await this.prisma.otpVerificacion.findFirst({
      where: { telefono, verificado: false, expira_en: { gt: new Date() } },
      orderBy: { fecha_creacion: "desc" },
    });

    if (!registro) {
      throw new BadRequestException("Código inválido o expirado");
    }

    if (registro.intentos >= MAX_INTENTOS_CODIGO) {
      throw new BadRequestException({
        message: "Superaste el máximo de intentos, pedí un código nuevo",
        intentosRestantes: 0,
      });
    }

    if (registro.codigo !== codigo) {
      const actualizado = await this.prisma.otpVerificacion.update({
        where: { id: registro.id },
        data: { intentos: { increment: 1 } },
      });
      const intentosRestantes = Math.max(MAX_INTENTOS_CODIGO - actualizado.intentos, 0);
      // 400 y NO 401: el interceptor de axios desloguea ante cualquier 401, y un
      // código mal tipeado no puede sacar de la sesión a quien reserva logueado.
      throw new BadRequestException({ message: "Código incorrecto", intentosRestantes });
    }

    await this.prisma.otpVerificacion.update({
      where: { id: registro.id },
      data: { verificado: true },
    });

    return telefono;
  }

  // RF11/RF12/RF13: 12hs mínimas de anticipación para cancelar/reprogramar.
  private asegurarAnticipacionMinima(fechaHoraInicio: Date) {
    const horasRestantes = (fechaHoraInicio.getTime() - ahoraDelSalon().getTime()) / (1000 * 60 * 60);
    if (horasRestantes < HORAS_MINIMAS_ANTICIPACION) {
      throw new BadRequestException(
        "Ya falta menos de 12hs para el turno — contactá directamente a la profesional para resolverlo.",
      );
    }
  }

  // Re-valida disponibilidad justo antes de confirmar (protege contra
  // condiciones de carrera entre consultar-disponibilidad y reservar, y
  // es la validación real para cuando la admin reserva/reprograma a mano,
  // que nunca pasó por GET /turnos/disponibilidad).
  private async validarDisponibilidadSlot(
    fecha: Date,
    horaInicioMin: number,
    duracionMinutos: number,
    excluirTurnoId?: number,
    db: Prisma.TransactionClient = this.prisma,
  ): Promise<{ inicioCandidato: Date; finCandidato: Date }> {
    const horaFinMin = horaInicioMin + duracionMinutos;

    const excepciones = await this.horariosService.obtenerExcepcionesParaFecha(fecha);
    if (excepciones.some((e) => e.tipo === "bloqueo_total")) {
      throw new ConflictException("Ese día no hay atención (feriado/cierre)");
    }

    const franjas = await this.horariosService.obtenerFranjasActivasPorFecha(fecha);
    const dentroDeFranja = franjas.some((f) => {
      const inicioFranjaMin = minutosDesdeMedianoche(f.hora_inicio);
      const finFranjaMin = minutosDesdeMedianoche(f.hora_fin);
      return horaInicioMin >= inicioFranjaMin && horaFinMin <= finFranjaMin;
    });
    if (!dentroDeFranja) {
      throw new ConflictException("Ese horario está fuera de la atención disponible");
    }

    const bloqueadoPorEspecial = excepciones.some((e) => {
      if (e.tipo !== "horario_especial" || !e.hora_inicio || !e.hora_fin) return false;
      const inicioBloqueoMin = minutosDesdeMedianoche(e.hora_inicio);
      const finBloqueoMin = minutosDesdeMedianoche(e.hora_fin);
      return horaInicioMin < finBloqueoMin && inicioBloqueoMin < horaFinMin;
    });
    if (bloqueadoPorEspecial) {
      throw new ConflictException("Ese horario no está disponible (bloqueo especial)");
    }

    const inicioCandidato = combinarFechaYMinutos(fecha, horaInicioMin);
    const finCandidato = combinarFechaYMinutos(fecha, horaFinMin);

    const turnosEnConflicto = await db.turno.findMany({
      where: {
        estado: EstadoTurno.confirmado,
        ...(excluirTurnoId ? { id: { not: excluirTurnoId } } : {}),
        fecha_hora_inicio: { lt: finCandidato },
        fecha_hora_fin: { gt: inicioCandidato },
      },
      select: { id: true },
    });
    if (turnosEnConflicto.length > 0) {
      throw new ConflictException("Ese horario ya fue reservado, elegí otro");
    }

    return { inicioCandidato, finCandidato };
  }

  // Evita el doble-booking: dos reservas simultáneas del mismo horario pasaban
  // las dos la validación (leer-y-después-escribir). Acá se toma un advisory
  // lock transaccional (se libera solo al terminar la transacción), se vuelve a
  // validar el slot DENTRO de la transacción y recién ahí se escribe. La
  // segunda reserva espera el lock, ve el turno de la primera y recibe 409.
  // No requiere cambios en schema.prisma (compartido con Ricardo).
  private async enAgendaBloqueada<T>(
    fecha: Date,
    horaInicioMin: number,
    duracionMinutos: number,
    excluirTurnoId: number | undefined,
    accion: (tx: Prisma.TransactionClient, inicio: Date, fin: Date) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SELECT pg_advisory_xact_lock(${CLAVE_LOCK_AGENDA})`);
      const { inicioCandidato, finCandidato } = await this.validarDisponibilidadSlot(
        fecha,
        horaInicioMin,
        duracionMinutos,
        excluirTurnoId,
        tx,
      );
      return accion(tx, inicioCandidato, finCandidato);
    });
  }

  // Reprogramar (cliente o admin): el original queda "reprogramado" y se crea
  // uno nuevo con turno_origen_id y los mismos servicios/precios, todo bajo el
  // lock de agenda.
  private async ejecutarReprogramacion(
    turnoOriginal: {
      id: number;
      usuario_id: number;
      turno_servicios: { servicio_id: number; precio_unitario: Prisma.Decimal | string }[];
    },
    fecha: Date,
    horaInicioMin: number,
    duracionTotalMinutos: number,
  ) {
    return this.enAgendaBloqueada(
      fecha,
      horaInicioMin,
      duracionTotalMinutos,
      turnoOriginal.id,
      async (tx, inicio, fin) => {
        await tx.turno.update({
          where: { id: turnoOriginal.id },
          data: { estado: EstadoTurno.reprogramado },
        });
        return tx.turno.create({
          data: {
            usuario_id: turnoOriginal.usuario_id,
            turno_origen_id: turnoOriginal.id,
            fecha_hora_inicio: inicio,
            fecha_hora_fin: fin,
            estado: EstadoTurno.confirmado,
            turno_servicios: {
              create: turnoOriginal.turno_servicios.map((ts) => ({
                servicio_id: ts.servicio_id,
                precio_unitario: ts.precio_unitario,
              })),
            },
          },
          include: { turno_servicios: { include: { servicio: true } } },
        });
      },
    );
  }

  private async crearTurnoConServicios(
    usuarioId: number,
    fechaHoraInicio: Date,
    fechaHoraFin: Date,
    servicios: Servicio[],
    turnoOrigenId?: number,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    return db.turno.create({
      data: {
        usuario_id: usuarioId,
        turno_origen_id: turnoOrigenId,
        fecha_hora_inicio: fechaHoraInicio,
        fecha_hora_fin: fechaHoraFin,
        estado: EstadoTurno.confirmado,
        turno_servicios: {
          create: servicios.map((s) => ({
            servicio_id: s.id,
            precio_unitario: s.precio,
          })),
        },
      },
      include: { turno_servicios: { include: { servicio: true } } },
    });
  }

  private formatearFechaHora(fecha: Date): string {
    return fecha.toISOString().slice(0, 16).replace("T", " ");
  }

  // RF09 + RF10 al confirmar una reserva (invitado o con sesión).
  private notificarReservaConfirmada(
    usuario: Usuario,
    turnoId: number,
    fecha: string,
    horaInicio: string,
  ) {
    // RF09: notificar a la admin al confirmar.
    this.notificarAdmin(
      `Nuevo turno reservado: ${usuario.nombre} ${usuario.apellido ?? ""} (${usuario.telefono}) ` +
        `el ${fecha} a las ${horaInicio}`,
    );
    // RF10: recordatorio 24hs antes — todavía no hay scheduler/cron armado.
    this.logger.warn(
      `[TODO] Programar recordatorio 24hs antes para el turno #${turnoId} (RF10, pendiente de NotificacionesModule)`,
    );
  }

  // RF09/RF14/RF15/RF42: notificaciones simuladas por consola, mismo
  // criterio que ConsoleNotificadorOtp. Reemplazar por una integración
  // real con NotificacionesModule (WhatsApp) cuando ese módulo exista.
  private notificarAdmin(mensaje: string) {
    this.logger.log(`[NOTIFICACION ADMIN SIMULADA] → ${mensaje}`);
  }

  private notificarCliente(telefono: string | null, mensaje: string) {
    this.logger.log(`[NOTIFICACION CLIENTE SIMULADA] → ${telefono ?? "sin teléfono"}: ${mensaje}`);
  }
}