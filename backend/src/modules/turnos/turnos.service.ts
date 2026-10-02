import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
} from "@nestjs/common";
import { EstadoTurno, type Usuario, type Servicio } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { HorariosService } from "../horarios/horarios.service";
import { normalizarTelefono } from "../auth/utils/normalizar-telefono";
import { type ReservarTurnoDto } from "./dto/reservar-turno.dto";
import { type ReprogramarTurnoDto } from "./dto/reprogramar-turno.dto";
import { type ReservarTurnoAdminDto } from "./dto/reservar-turno-admin.dto";
import {
  minutosDesdeMedianoche,
  hhmmAMinutos,
  minutosAHhmm,
  combinarFechaYMinutos,
  seSuperponen,
  soloFecha,
} from "./utils/franja-horaria.util";

const PASO_MINUTOS_SLOT = 15;
const HORAS_MINIMAS_ANTICIPACION = 12;

// Duplicado a propósito de AuthService.validarCodigo — ver nota en
// verificarCodigoOtp() más abajo sobre por qué no se reutilizó AuthService
// directamente bajo la presión de tiempo del entrega. Candidato a
// refactor: extraer un OtpService compartido entre auth y turnos.
const MAX_INTENTOS_CODIGO = 5;

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

  async consultarDisponibilidad(servicioIds: number[], fechaStr: string) {
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
        estado: { in: [EstadoTurno.confirmado, EstadoTurno.reprogramado] },
        fecha_hora_inicio: { lt: finDia },
        fecha_hora_fin: { gt: inicioDia },
      },
      select: { fecha_hora_inicio: true, fecha_hora_fin: true },
    });

    const ahora = new Date();
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

    const { inicioCandidato, finCandidato } = await this.validarDisponibilidadSlot(
      fecha,
      horaInicioMin,
      duracionTotalMinutos,
    );

    const usuario = await this.obtenerOCrearUsuarioPorTelefono(telefono, dto.nombre);

    const turno = await this.crearTurnoConServicios(
      usuario.id,
      inicioCandidato,
      finCandidato,
      servicios,
    );

    // RF09: notificar a la admin al confirmar.
    this.notificarAdmin(
      `Nuevo turno reservado: ${usuario.nombre} ${usuario.apellido ?? ""} (${usuario.telefono}) ` +
        `el ${dto.fecha} a las ${dto.hora_inicio}`,
    );
    // RF10: recordatorio 24hs antes — todavía no hay scheduler/cron armado.
    this.logger.warn(
      `[TODO] Programar recordatorio 24hs antes para el turno #${turno.id} (RF10, pendiente de NotificacionesModule)`,
    );

    return turno;
  }

  // ============================================================
  // CU-09 / RF11-13 — Cancelar turno (cliente)
  // ============================================================

  async cancelarComoCliente(turnoId: number, telefonoCrudo: string) {
    const turno = await this.findOneConUsuario(turnoId);
    const telefono = normalizarTelefono(telefonoCrudo);

    if (turno.usuario.telefono !== telefono) {
      throw new UnauthorizedException("Este turno no pertenece a ese teléfono");
    }

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
  // CU-10 / RF11-13 — Reprogramar turno (cliente)
  // ============================================================

  async reprogramarComoCliente(turnoId: number, dto: ReprogramarTurnoDto) {
    const turnoOriginal = await this.findOneConServiciosYUsuario(turnoId);
    const telefono = normalizarTelefono(dto.telefono);

    if (turnoOriginal.usuario.telefono !== telefono) {
      throw new UnauthorizedException("Este turno no pertenece a ese teléfono");
    }

    this.asegurarAnticipacionMinima(turnoOriginal.fecha_hora_inicio);

    const duracionTotalMinutos = turnoOriginal.turno_servicios.reduce(
      (acc, ts) => acc + ts.servicio.duracion_minutos,
      0,
    );
    const fecha = soloFecha(dto.fecha);
    const horaInicioMin = hhmmAMinutos(dto.hora_inicio);

    const { inicioCandidato, finCandidato } = await this.validarDisponibilidadSlot(
      fecha,
      horaInicioMin,
      duracionTotalMinutos,
      turnoId,
    );

    const serviciosOriginales = turnoOriginal.turno_servicios.map((ts) => ({
      id: ts.servicio_id,
      precio: ts.precio_unitario,
    }));

    const [, nuevoTurno] = await this.prisma.$transaction([
      this.prisma.turno.update({
        where: { id: turnoId },
        data: { estado: EstadoTurno.reprogramado },
      }),
      this.prisma.turno.create({
        data: {
          usuario_id: turnoOriginal.usuario_id,
          turno_origen_id: turnoId,
          fecha_hora_inicio: inicioCandidato,
          fecha_hora_fin: finCandidato,
          estado: EstadoTurno.confirmado,
          turno_servicios: {
            create: serviciosOriginales.map((s) => ({
              servicio_id: s.id,
              precio_unitario: s.precio,
            })),
          },
        },
      }),
    ]);

    // RF14/15: notificar a la admin cuando el cliente reprograma.
    this.notificarAdmin(
      `Turno #${turnoId} reprogramado por ${turnoOriginal.usuario.nombre} ` +
        `(${turnoOriginal.usuario.telefono}) → ${dto.fecha} ${dto.hora_inicio}`,
    );

    return nuevoTurno;
  }

  // ============================================================
  // CU-11 / RF16-17 — Historial por teléfono
  // ============================================================

  async historialPorTelefono(telefonoCrudo: string) {
    const telefono = normalizarTelefono(telefonoCrudo);

    return this.prisma.turno.findMany({
      where: { usuario: { telefono } },
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
    const fecha = fechaStr ? soloFecha(fechaStr) : soloFecha(new Date().toISOString().slice(0, 10));
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

  async cancelarComoAdmin(turnoId: number) {
    const turno = await this.findOneConUsuario(turnoId);

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

    const duracionTotalMinutos = turnoOriginal.turno_servicios.reduce(
      (acc, ts) => acc + ts.servicio.duracion_minutos,
      0,
    );
    const fecha = soloFecha(fechaStr);
    const horaInicioMin = hhmmAMinutos(horaInicio);

    const { inicioCandidato, finCandidato } = await this.validarDisponibilidadSlot(
      fecha,
      horaInicioMin,
      duracionTotalMinutos,
      turnoId,
    );

    const serviciosOriginales = turnoOriginal.turno_servicios.map((ts) => ({
      id: ts.servicio_id,
      precio: ts.precio_unitario,
    }));

    const [, nuevoTurno] = await this.prisma.$transaction([
      this.prisma.turno.update({
        where: { id: turnoId },
        data: { estado: EstadoTurno.reprogramado },
      }),
      this.prisma.turno.create({
        data: {
          usuario_id: turnoOriginal.usuario_id,
          turno_origen_id: turnoId,
          fecha_hora_inicio: inicioCandidato,
          fecha_hora_fin: finCandidato,
          estado: EstadoTurno.confirmado,
          turno_servicios: {
            create: serviciosOriginales.map((s) => ({
              servicio_id: s.id,
              precio_unitario: s.precio,
            })),
          },
        },
      }),
    ]);

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

    const { inicioCandidato, finCandidato } = await this.validarDisponibilidadSlot(
      fecha,
      horaInicioMin,
      duracionTotalMinutos,
    );

    const usuario = dto.usuario_id
      ? await this.obtenerUsuarioPorId(dto.usuario_id)
      : await this.obtenerOCrearUsuarioPorTelefono(dto.telefono as string, dto.nombre);

    return this.crearTurnoConServicios(usuario.id, inicioCandidato, finCandidato, servicios);
  }

  async marcarAtendido(turnoId: number) {
    await this.findOne(turnoId);
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
  // 5 intentos, expiración, etc.). No se inyectó AuthService acá para no
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
      throw new UnauthorizedException({ message: "Código incorrecto", intentosRestantes });
    }

    await this.prisma.otpVerificacion.update({
      where: { id: registro.id },
      data: { verificado: true },
    });

    return telefono;
  }

  // RF11/RF12/RF13: 12hs mínimas de anticipación para cancelar/reprogramar.
  private asegurarAnticipacionMinima(fechaHoraInicio: Date) {
    const horasRestantes = (fechaHoraInicio.getTime() - Date.now()) / (1000 * 60 * 60);
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

    const turnosEnConflicto = await this.prisma.turno.findMany({
      where: {
        estado: { in: [EstadoTurno.confirmado, EstadoTurno.reprogramado] },
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

  private async crearTurnoConServicios(
    usuarioId: number,
    fechaHoraInicio: Date,
    fechaHoraFin: Date,
    servicios: Servicio[],
    turnoOrigenId?: number,
  ) {
    return this.prisma.turno.create({
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