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
// Sin "type" en estos 4 (son los DTOs de @Body() de este controller — ver
// el bug que ya resolvimos en horarios/usuarios con ValidationPipe).
import { ReservarTurnoDto } from "./dto/reservar-turno.dto";
import { CancelarTurnoDto } from "./dto/cancelar-turno.dto";
import { ReprogramarTurnoDto } from "./dto/reprogramar-turno.dto";
import { ReservarTurnoAdminDto } from "./dto/reservar-turno-admin.dto";
import { ReprogramarTurnoAdminDto } from "./dto/reprogramar-turno-admin.dto";

@ApiTags("turnos")
@Controller("turnos")
export class TurnosController {
  constructor(private readonly turnosService: TurnosService) {}

  // ============================================================
  // Público / invitado (CU-06, CU-07, CU-09, CU-10, CU-11)
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

  @Post("reservar")
  @ApiOperation({ summary: "Reservar turno como invitado, valida OTP (CU-07)" })
  reservar(@Body() dto: ReservarTurnoDto) {
    return this.turnosService.reservarComoInvitado(dto);
  }

  @Get("historial")
  @ApiOperation({ summary: "Historial de turnos por teléfono (CU-11)" })
  @ApiQuery({ name: "telefono", example: "3644401020" })
  historial(@Query("telefono") telefono: string) {
    if (!telefono) throw new BadRequestException("Falta el parámetro telefono");
    return this.turnosService.historialPorTelefono(telefono);
  }

  @Patch(":id/cancelar")
  @ApiOperation({ summary: "Cancelar turno propio, valida 12hs de anticipación (CU-09)" })
  cancelar(@Param("id", ParseIntPipe) id: number, @Body() dto: CancelarTurnoDto) {
    return this.turnosService.cancelarComoCliente(id, dto.telefono);
  }

  @Patch(":id/reprogramar")
  @ApiOperation({ summary: "Reprogramar turno propio, valida 12hs y disponibilidad (CU-10)" })
  reprogramar(@Param("id", ParseIntPipe) id: number, @Body() dto: ReprogramarTurnoDto) {
    return this.turnosService.reprogramarComoCliente(id, dto);
  }

  // ============================================================
  // Administración (CU-20, CU-28, CU-40, CU-41, CU-42)
  // TODO: sin guard de autenticación todavía — ver nota en turnos.service.ts
  // ============================================================

  @Get("admin/agenda")
  @ApiOperation({ summary: "Agenda de turnos de un día (CU-20/RF31)" })
  @ApiQuery({ name: "fecha", required: false, example: "2026-10-15" })
  agenda(@Query("fecha") fecha?: string) {
    return this.turnosService.agendaAdmin(fecha);
  }

  @Post("admin/reservar")
  @ApiOperation({ summary: "Cargar turno manualmente desde el panel, sin OTP (CU-41)" })
  reservarDesdeAdmin(@Body() dto: ReservarTurnoAdminDto) {
    return this.turnosService.reservarComoAdmin(dto);
  }

  @Patch(":id/cancelar-admin")
  @ApiOperation({ summary: "Cancelar turno desde el panel, sin regla de 12hs (CU-40)" })
  cancelarDesdeAdmin(@Param("id", ParseIntPipe) id: number) {
    return this.turnosService.cancelarComoAdmin(id);
  }

  @Patch(":id/reprogramar-admin")
  @ApiOperation({ summary: "Reprogramar turno desde el panel, sin regla de 12hs (CU-42)" })
  reprogramarDesdeAdmin(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: ReprogramarTurnoAdminDto,
  ) {
    return this.turnosService.reprogramarComoAdmin(id, dto.fecha, dto.hora_inicio);
  }

  @Patch(":id/atendido")
  @ApiOperation({ summary: "Marcar un turno como atendido (CU-20)" })
  marcarAtendido(@Param("id", ParseIntPipe) id: number) {
    return this.turnosService.marcarAtendido(id);
  }

  @Get("admin/clientes/:usuarioId/historial")
  @ApiOperation({ summary: "Historial de turnos de un cliente puntual (CU-28/RF43)" })
  historialPorUsuario(@Param("usuarioId", ParseIntPipe) usuarioId: number) {
    return this.turnosService.historialPorUsuarioId(usuarioId);
  }
}