import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import {
  Prisma,
  DiaSemana,
  TipoExcepcion,
  FranjaHoraria,
  ExcepcionHorario,
} from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { esErrorPrisma, esErrorTablaInexistente } from "../../prisma/prisma-errors.util";
import { type CrearFranjaHorariaDto } from "./dto/crear-franja-horaria.dto";
import { type ActualizarFranjaHorariaDto } from "./dto/actualizar-franja-horaria.dto";
import { type CrearExcepcionHorarioDto } from "./dto/crear-excepcion-horario.dto";
import { type ActualizarExcepcionHorarioDto } from "./dto/actualizar-excepcion-horario.dto";

// Mapeo día -> número que devuelve EXTRACT(DOW FROM ...) en Postgres
// (0 = domingo ... 6 = sábado). Coincide con Date.getUTCDay() de JS.
const DOW_POR_DIA: Record<DiaSemana, number> = {
  domingo: 0,
  lunes: 1,
  martes: 2,
  miercoles: 3,
  jueves: 4,
  viernes: 5,
  sabado: 6,
};

const DIA_POR_DOW: Record<number, DiaSemana> = Object.fromEntries(
  Object.entries(DOW_POR_DIA).map(([dia, dow]) => [dow, dia as DiaSemana]),
);

@Injectable()
export class HorariosService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================================
  // FRANJAS HORARIAS
  // ============================================================

  async findAllFranjas(diaSemana?: DiaSemana, soloActivas?: boolean) {
    return this.prisma.franjaHoraria.findMany({
      where: {
        ...(diaSemana ? { dia_semana: diaSemana } : {}),
        ...(soloActivas ? { activo: true } : {}),
      },
      orderBy: [{ dia_semana: "asc" }, { hora_inicio: "asc" }],
    });
  }

  async findOneFranja(id: number): Promise<FranjaHoraria> {
    const franja = await this.prisma.franjaHoraria.findUnique({
      where: { id },
    });
    if (!franja) {
      throw new NotFoundException(`No existe la franja horaria #${id}`);
    }
    return franja;
  }

  async createFranja(dto: CrearFranjaHorariaDto) {
    this.validarRangoHorario(dto.hora_inicio, dto.hora_fin);

    try {
      return await this.prisma.franjaHoraria.create({
        data: {
          dia_semana: dto.dia_semana,
          hora_inicio: this.aFechaHora(dto.hora_inicio),
          hora_fin: this.aFechaHora(dto.hora_fin),
          activo: true, // controlado por el sistema, nunca por el body
        },
      });
    } catch (error) {
      throw this.mapearErrorPrisma(error);
    }
  }

  async updateFranja(id: number, dto: ActualizarFranjaHorariaDto) {
    const franjaActual = await this.findOneFranja(id);

    const horaInicio = dto.hora_inicio ?? this.aHHmm(franjaActual.hora_inicio);
    const horaFin = dto.hora_fin ?? this.aHHmm(franjaActual.hora_fin);
    const diaSemana = dto.dia_semana ?? franjaActual.dia_semana;
    this.validarRangoHorario(horaInicio, horaFin);

    // RF41: si cambia el día o el rango horario, hay que asegurarse de que
    // no queden turnos reservados que dependían del rango viejo.
    const cambiaRango =
      dto.dia_semana !== undefined ||
      dto.hora_inicio !== undefined ||
      dto.hora_fin !== undefined;

    if (cambiaRango) {
      await this.asegurarSinTurnosEnConflicto(
        franjaActual.dia_semana,
        franjaActual.hora_inicio,
        franjaActual.hora_fin,
      );
    }

    try {
      return await this.prisma.franjaHoraria.update({
        where: { id },
        data: {
          dia_semana: diaSemana,
          hora_inicio: this.aFechaHora(horaInicio),
          hora_fin: this.aFechaHora(horaFin),
        },
      });
    } catch (error) {
      throw this.mapearErrorPrisma(error);
    }
  }

  // Endpoint propio para activar/desactivar (PATCH /horarios/franjas/:id/estado),
  // no un PATCH genérico, mismo criterio que el toggle de servicios.
  async toggleEstadoFranja(id: number) {
    const franja = await this.findOneFranja(id);

    if (franja.activo) {
      // Solo bloqueamos al desactivar: activar nunca genera conflicto.
      await this.asegurarSinTurnosEnConflicto(
        franja.dia_semana,
        franja.hora_inicio,
        franja.hora_fin,
      );
    }

    return this.prisma.franjaHoraria.update({
      where: { id },
      data: { activo: !franja.activo },
    });
  }

  async removeFranja(id: number) {
    const franja = await this.findOneFranja(id);

    await this.asegurarSinTurnosEnConflicto(
      franja.dia_semana,
      franja.hora_inicio,
      franja.hora_fin,
    );

    try {
      await this.prisma.franjaHoraria.delete({ where: { id } });
    } catch (error) {
      throw this.mapearErrorPrisma(error);
    }
    return { mensaje: "Franja horaria eliminada" };
  }

  // --- Métodos pensados para ser consumidos por el módulo de turnos ---
  // (cálculo de disponibilidad, RF04/RF06/CU-06). Turnos debe inyectar
  // HorariosService y llamar a estos métodos, no duplicar la consulta.

  async obtenerFranjasActivasPorDia(
    diaSemana: DiaSemana,
  ): Promise<FranjaHoraria[]> {
    return this.prisma.franjaHoraria.findMany({
      where: { dia_semana: diaSemana, activo: true },
      orderBy: { hora_inicio: "asc" },
    });
  }

  // Nota: NO aplica excepciones_horario acá — para eso está
  // obtenerExcepcionesParaFecha, justo abajo. Turnos combina las dos.
  async obtenerFranjasActivasPorFecha(fecha: Date): Promise<FranjaHoraria[]> {
    const diaSemana = DIA_POR_DOW[fecha.getUTCDay()];
    return this.obtenerFranjasActivasPorDia(diaSemana);
  }

  // Para turnos (CU-06/RF04/RF06): excepciones vigentes para una fecha
  // puntual (feriados, cierres, horarios especiales). Puede devolver más
  // de una si se solapan rangos cargados por la admin.
  async obtenerExcepcionesParaFecha(fecha: Date): Promise<ExcepcionHorario[]> {
    return this.prisma.excepcionHorario.findMany({
      where: {
        fecha_desde: { lte: fecha },
        fecha_hasta: { gte: fecha },
      },
    });
  }

  // ============================================================
  // EXCEPCIONES DE HORARIO (feriados / bloqueos / horarios especiales)
  // ============================================================

  async findAllExcepciones(desde?: string, hasta?: string) {
    return this.prisma.excepcionHorario.findMany({
      where: {
        ...(desde ? { fecha_hasta: { gte: new Date(desde) } } : {}),
        ...(hasta ? { fecha_desde: { lte: new Date(hasta) } } : {}),
      },
      orderBy: { fecha_desde: "asc" },
    });
  }

  async findOneExcepcion(id: number): Promise<ExcepcionHorario> {
    const excepcion = await this.prisma.excepcionHorario.findUnique({
      where: { id },
    });
    if (!excepcion) {
      throw new NotFoundException(`No existe la excepción de horario #${id}`);
    }
    return excepcion;
  }

  async createExcepcion(dto: CrearExcepcionHorarioDto) {
    this.validarFechasYHoras(dto);

    await this.asegurarSinTurnosEnConflictoExcepcion(
      new Date(dto.fecha_desde),
      new Date(dto.fecha_hasta),
      dto.tipo,
      dto.hora_inicio,
      dto.hora_fin,
    );

    try {
      return await this.prisma.excepcionHorario.create({
        data: {
          fecha_desde: new Date(dto.fecha_desde),
          fecha_hasta: new Date(dto.fecha_hasta),
          tipo: dto.tipo,
          descripcion: dto.descripcion,
          hora_inicio: dto.hora_inicio
            ? this.aFechaHora(dto.hora_inicio)
            : null,
          hora_fin: dto.hora_fin ? this.aFechaHora(dto.hora_fin) : null,
        },
      });
    } catch (error) {
      throw this.mapearErrorPrisma(error);
    }
  }

  async updateExcepcion(id: number, dto: ActualizarExcepcionHorarioDto) {
    const actual = await this.findOneExcepcion(id);

    const fusion = {
      fecha_desde:
        dto.fecha_desde ?? actual.fecha_desde.toISOString().substring(0, 10),
      fecha_hasta:
        dto.fecha_hasta ?? actual.fecha_hasta.toISOString().substring(0, 10),
      tipo: dto.tipo ?? actual.tipo,
      hora_inicio:
        dto.hora_inicio ??
        (actual.hora_inicio ? this.aHHmm(actual.hora_inicio) : undefined),
      hora_fin:
        dto.hora_fin ??
        (actual.hora_fin ? this.aHHmm(actual.hora_fin) : undefined),
    };
    this.validarFechasYHoras(fusion as CrearExcepcionHorarioDto);

    // Validamos contra el rango VIEJO (por si se achica/mueve la excepción
    // y ya había turnos apoyados en que ese bloqueo existía tal cual estaba).
    await this.asegurarSinTurnosEnConflictoExcepcion(
      actual.fecha_desde,
      actual.fecha_hasta,
      actual.tipo,
      actual.hora_inicio ? this.aHHmm(actual.hora_inicio) : undefined,
      actual.hora_fin ? this.aHHmm(actual.hora_fin) : undefined,
    );

    try {
      return await this.prisma.excepcionHorario.update({
        where: { id },
        data: {
          fecha_desde: new Date(fusion.fecha_desde),
          fecha_hasta: new Date(fusion.fecha_hasta),
          tipo: fusion.tipo,
          descripcion: dto.descripcion ?? actual.descripcion,
          hora_inicio: fusion.hora_inicio
            ? this.aFechaHora(fusion.hora_inicio)
            : null,
          hora_fin: fusion.hora_fin ? this.aFechaHora(fusion.hora_fin) : null,
        },
      });
    } catch (error) {
      throw this.mapearErrorPrisma(error);
    }
  }

  async removeExcepcion(id: number) {
    const excepcion = await this.findOneExcepcion(id);

    await this.asegurarSinTurnosEnConflictoExcepcion(
      excepcion.fecha_desde,
      excepcion.fecha_hasta,
      excepcion.tipo,
      excepcion.hora_inicio ? this.aHHmm(excepcion.hora_inicio) : undefined,
      excepcion.hora_fin ? this.aHHmm(excepcion.hora_fin) : undefined,
    );

    await this.prisma.excepcionHorario.delete({ where: { id } });
    return { mensaje: "Excepción de horario eliminada" };
  }

  // ============================================================
  // helpers privados
  // ============================================================

  private validarRangoHorario(horaInicio: string, horaFin: string) {
    if (horaInicio >= horaFin) {
      throw new BadRequestException(
        "hora_inicio debe ser anterior a hora_fin",
      );
    }
  }

  private validarFechasYHoras(dto: CrearExcepcionHorarioDto) {
    if (dto.fecha_desde > dto.fecha_hasta) {
      throw new BadRequestException(
        "fecha_desde no puede ser posterior a fecha_hasta",
      );
    }
    if (dto.tipo === TipoExcepcion.horario_especial) {
      if (!dto.hora_inicio || !dto.hora_fin) {
        throw new BadRequestException(
          "Un horario_especial requiere hora_inicio y hora_fin",
        );
      }
      if (dto.hora_inicio >= dto.hora_fin) {
        throw new BadRequestException(
          "hora_inicio debe ser anterior a hora_fin",
        );
      }
    }
  }

  // Prisma mapea columnas Time a Date (fecha base 1970-01-01) — armamos
  // ese Date a partir del "HH:mm" que manda el front.
  private aFechaHora(horaHHmm: string): Date {
    return new Date(`1970-01-01T${horaHHmm}:00.000Z`);
  }

  private aHHmm(fecha: Date): string {
    return fecha.toISOString().substring(11, 16);
  }

  // RF41 / CU-21 (franjas): busca turnos confirmados (un turno reprogramado ya no ocupa su horario viejo),
  // futuros, cuyo día de semana y horario caigan dentro del rango de la
  // franja. Si existen, bloquea el cambio hasta que se resuelvan a mano.
  private async asegurarSinTurnosEnConflicto(
    diaSemana: DiaSemana,
    horaInicio: Date,
    horaFin: Date,
  ) {
    const dow = DOW_POR_DIA[diaSemana];
    const horaInicioHHmm = this.aHHmm(horaInicio);
    const horaFinHHmm = this.aHHmm(horaFin);

    const turnosEnConflicto = await this.consultarTurnosEnConflicto(
      Prisma.sql`
        SELECT id FROM "turnos"
        WHERE estado = 'confirmado'
          AND fecha_hora_inicio >= NOW()
          AND EXTRACT(DOW FROM fecha_hora_inicio) = ${dow}
          AND TO_CHAR(fecha_hora_inicio, 'HH24:MI') >= ${horaInicioHHmm}
          AND TO_CHAR(fecha_hora_inicio, 'HH24:MI') < ${horaFinHHmm}
        LIMIT 1
      `,
    );

    if (turnosEnConflicto.length > 0) {
      throw new ConflictException(
        "No se puede modificar/eliminar esta franja: existen turnos " +
          "reservados dentro de este horario. Atendé, cancelá o " +
          "reprogramá esos turnos primero.",
      );
    }
  }

  // CU-21 (excepciones): mismo criterio, pero sobre un rango de fechas en
  // vez de un día de semana recurrente.
  private async asegurarSinTurnosEnConflictoExcepcion(
    fechaDesde: Date,
    fechaHasta: Date,
    tipo: TipoExcepcion,
    horaInicio?: string,
    horaFin?: string,
  ) {
    const esBloqueoTotal = tipo === TipoExcepcion.bloqueo_total;

    const turnosEnConflicto = await this.consultarTurnosEnConflicto(
      esBloqueoTotal
        ? Prisma.sql`
            SELECT id FROM "turnos"
            WHERE estado = 'confirmado'
              AND fecha_hora_inicio >= NOW()
              AND fecha_hora_inicio::date BETWEEN ${fechaDesde}::date AND ${fechaHasta}::date
            LIMIT 1
          `
        : Prisma.sql`
            SELECT id FROM "turnos"
            WHERE estado = 'confirmado'
              AND fecha_hora_inicio >= NOW()
              AND fecha_hora_inicio::date BETWEEN ${fechaDesde}::date AND ${fechaHasta}::date
              AND TO_CHAR(fecha_hora_inicio, 'HH24:MI') >= ${horaInicio}
              AND TO_CHAR(fecha_hora_inicio, 'HH24:MI') < ${horaFin}
            LIMIT 1
          `,
    );

    if (turnosEnConflicto.length > 0) {
      throw new ConflictException(
        "No se puede guardar esta excepción: existen turnos reservados " +
          "dentro del rango afectado. Atendé, cancelá o reprogramá esos " +
          "turnos primero.",
      );
    }
  }

  // Wrapper de $queryRaw contra "Turno" usado por los dos chequeos de
  // conflicto de arriba. Mientras el módulo de turnos no haya migrado esa
  // tabla todavía (trabajo en paralelo entre chats/compañeros), si la
  // tabla no existe es lógicamente imposible que haya turnos en conflicto
  // — dejamos pasar la operación en vez de romper el CRUD de horarios.
  // Una vez que exista la tabla, esto vuelve a validar de verdad.
  private async consultarTurnosEnConflicto(
    query: Prisma.Sql,
  ): Promise<{ id: number }[]> {
    try {
      return await this.prisma.$queryRaw<{ id: number }[]>(query);
    } catch (error) {
      if (this.esErrorTablaTurnoInexistente(error)) {
        return [];
      }
      throw error;
    }
  }

  private esErrorTablaTurnoInexistente(error: unknown): boolean {
    return esErrorTablaInexistente(error);
  }

  private mapearErrorPrisma(error: unknown) {
    if (esErrorPrisma(error, "P2002")) {
      return new ConflictException(
        "Ya existe un registro idéntico (mismo día/horario o mismo rango)",
      );
    }
    if (esErrorPrisma(error, "P2003")) {
      return new ConflictException("No se puede eliminar: hay turnos asociados");
    }
    return error;
  }
}