import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  ParseIntPipe,
  BadRequestException,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiQuery } from "@nestjs/swagger";
import { TurnosService } from "./turnos.service";
import { SoloAdmin, Autenticado, UsuarioActual } from "../auth/decorators/auth.decorators";
import { type UsuarioAutenticado } from "../auth/types/usuario-autenticado";
// Sin "type" en estos (son los DTOs de @Body() de este controller — ver
// el bug que ya resolvimos en horarios/usuarios con ValidationPipe).
import { ReservarTurnoDto } from "./dto/reservar-turno.dto";
import { ReservarTurnoAutenticadoDto } from "./dto/reservar-turno-autenticado.dto";
import { ReprogramarTurnoDto } from "./dto/reprogramar-turno.dto";
import { ReservarTurnoAdminDto } from "./dto/reservar-turno-admin.dto";
import { ReprogramarTurnoAdminDto } from "./dto/reprogramar-turno-admin.dto";
// Sin "type": es el DTO de @Query() y ValidationPipe necesita la clase real.
import { ListarTurnosAdminDto } from "./dto/listar-turnos-admin.dto";

@ApiTags("turnos")
@Controller("turnos")
export class TurnosController {
  constructor(private readonly turnosService: TurnosService) {}

  // ============================================================
  // Público / invitado (CU-06, CU-07) y cliente con sesión (CU-09, CU-10, CU-11)
  // ============================================================

  @Get("disponibilidad")
  @ApiOperation({ summary: "Horarios disponibles para una fecha y servicios dados (CU-06)" })
  @ApiQuery({ name: "servicios", example: "1,2", description: "IDs separados por coma" })
  @ApiQuery({ name: "fecha", example: "2026-10-15" })
  consultarDisponibilidad(
    @Query("servicios") serviciosParam: string,
    @Query("fecha") fecha: string,
  ) {
    if (!serviciosParam) {
      throw new BadRequestException("Falta el parámetro servicios");
    }
    const servicios = serviciosParam
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => !Number.isNaN(n));

    if (servicios.length === 0) {
      throw new BadRequestException("servicios debe tener al menos un id numérico válido");
    }

    return this.turnosService.consultarDisponibilidad(servicios, fecha);
  }

  @Get("dias-habilitados")
  @ApiOperation({
    summary: "Días con atención entre dos fechas (sin fines de semana cerrados ni feriados)",
  })
  @ApiQuery({ name: "desde", example: "2026-10-08" })
  @ApiQuery({ name: "hasta", example: "2026-11-30" })
  diasHabilitados(@Query("desde") desde: string, @Query("hasta") hasta: string) {
    return this.turnosService.diasHabilitados(desde, hasta);
  }

  @Post("reservar")
  @ApiOperation({ summary: "Reservar turno como invitado, valida OTP (CU-07)" })
  reservar(@Body() dto: ReservarTurnoDto) {
    return this.turnosService.reservarComoInvitado(dto);
  }

  @Autenticado()
  @Post("reservar-autenticado")
  @ApiOperation({
    summary: "Reservar turno con sesión iniciada: datos del token + OTP anti-bot (CU-07)",
  })
  reservarAutenticado(
    @UsuarioActual() actual: UsuarioAutenticado,
    @Body() dto: ReservarTurnoAutenticadoDto,
  ) {
    return this.turnosService.reservarComoAutenticado(actual.id, dto);
  }

  // ---- Cliente con sesión (CU-09, CU-10, CU-11) ----

  @Autenticado()
  @Get("mis-turnos")
  @ApiOperation({ summary: "Mis turnos: historial del usuario logueado (CU-11)" })
  misTurnos(@UsuarioActual() actual: UsuarioAutenticado) {
    return this.turnosService.misTurnos(actual.id);
  }

  @Autenticado()
  @Patch("mis-turnos/:id/cancelar")
  @ApiOperation({ summary: "Cancelar un turno propio, valida 12hs de anticipación (CU-09)" })
  cancelarMiTurno(
    @UsuarioActual() actual: UsuarioAutenticado,
    @Param("id", ParseIntPipe) id: number,
  ) {
    return this.turnosService.cancelarMiTurno(actual.id, id);
  }

  @Autenticado()
  @Patch("mis-turnos/:id/reprogramar")
  @ApiOperation({ summary: "Reprogramar un turno propio, valida 12hs y disponibilidad (CU-10)" })
  reprogramarMiTurno(
    @UsuarioActual() actual: UsuarioAutenticado,
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: ReprogramarTurnoDto,
  ) {
    return this.turnosService.reprogramarMiTurno(actual.id, id, dto);
  }

  // ============================================================
  // Administración (CU-20, CU-28, CU-40, CU-41, CU-42)
  // Protegido con @SoloAdmin() (JWT + rol admin).
  // ============================================================

  @SoloAdmin()
  @Get("admin/agenda")
  @ApiOperation({ summary: "Agenda de turnos de un día (CU-20/RF31)" })
  @ApiQuery({ name: "fecha", required: false, example: "2026-10-15" })
  agenda(@Query("fecha") fecha?: string) {
    return this.turnosService.agendaAdmin(fecha);
  }

  @SoloAdmin()
  @Get("admin")
  @ApiOperation({ summary: "Listado de todos los turnos con filtros y paginación (gestión admin)" })
  listarAdmin(@Query() filtros: ListarTurnosAdminDto) {
    return this.turnosService.listarAdmin(filtros);
  }

  @SoloAdmin()
  @Post("admin/reservar")
  @ApiOperation({ summary: "Cargar turno manualmente desde el panel, sin OTP (CU-41)" })
  reservarDesdeAdmin(@Body() dto: ReservarTurnoAdminDto) {
    return this.turnosService.reservarComoAdmin(dto);
  }

  @SoloAdmin()
  @Patch(":id/cancelar-admin")
  @ApiOperation({ summary: "Cancelar turno desde el panel, sin regla de 12hs (CU-40)" })
  cancelarDesdeAdmin(@Param("id", ParseIntPipe) id: number) {
    return this.turnosService.cancelarComoAdmin(id);
  }

  @SoloAdmin()
  @Patch(":id/reprogramar-admin")
  @ApiOperation({ summary: "Reprogramar turno desde el panel, sin regla de 12hs (CU-42)" })
  reprogramarDesdeAdmin(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: ReprogramarTurnoAdminDto,
  ) {
    return this.turnosService.reprogramarComoAdmin(id, dto.fecha, dto.hora_inicio);
  }

  @SoloAdmin()
  @Patch(":id/atendido")
  @ApiOperation({ summary: "Marcar un turno como atendido (CU-20)" })
  marcarAtendido(@Param("id", ParseIntPipe) id: number) {
    return this.turnosService.marcarAtendido(id);
  }

  @SoloAdmin()
  @Get("admin/clientes/:usuarioId/historial")
  @ApiOperation({ summary: "Historial de turnos de un cliente puntual (CU-28/RF43)" })
  historialPorUsuario(@Param("usuarioId", ParseIntPipe) usuarioId: number) {
    return this.turnosService.historialPorUsuarioId(usuarioId);
  }
}