import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiQuery } from "@nestjs/swagger";
import { DiaSemana } from "@prisma/client";
import { HorariosService } from "./horarios.service";
// OJO: estos 4 imports NO llevan "type" a propósito. Son los DTOs de los
// parámetros @Body() de este controller, y ValidationPipe necesita la
// referencia real de la clase en runtime (vía emitDecoratorMetadata) para
// poder validar. Con "import type" / "import { type X }", TypeScript borra
// el import del JS compilado, Nest ve el parámetro como "Object" genérico,
// y con whitelist:true termina descartando TODAS las propiedades del body
// (sin tirar ningún error — simplemente lo vacía).
import { CrearFranjaHorariaDto } from "./dto/crear-franja-horaria.dto";
import { ActualizarFranjaHorariaDto } from "./dto/actualizar-franja-horaria.dto";
import { CrearExcepcionHorarioDto } from "./dto/crear-excepcion-horario.dto";
import { ActualizarExcepcionHorarioDto } from "./dto/actualizar-excepcion-horario.dto";

// El prefijo 'horarios' se aplica a todas las rutas de este controller:
// GET/POST /horarios/franjas..., GET/POST /horarios/excepciones...
@ApiTags("horarios")
@Controller("horarios")
export class HorariosController {
  constructor(private readonly horariosService: HorariosService) {}

  // ============================================================
  // FRANJAS HORARIAS
  // ============================================================

  @Get("franjas")
  @ApiOperation({ summary: "Listar franjas horarias" })
  @ApiQuery({ name: "dia_semana", enum: DiaSemana, required: false })
  @ApiQuery({ name: "solo_activas", type: Boolean, required: false })
  findAllFranjas(
    @Query("dia_semana") diaSemana?: DiaSemana,
    @Query("solo_activas") soloActivas?: string,
  ) {
    return this.horariosService.findAllFranjas(
      diaSemana,
      soloActivas === undefined ? undefined : soloActivas === "true",
    );
  }

  @Get("franjas/:id")
  @ApiOperation({ summary: "Obtener una franja horaria por id" })
  findOneFranja(@Param("id", ParseIntPipe) id: number) {
    return this.horariosService.findOneFranja(id);
  }

  @Post("franjas")
  @ApiOperation({ summary: "Crear una franja horaria" })
  createFranja(@Body() dto: CrearFranjaHorariaDto) {
    return this.horariosService.createFranja(dto);
  }

  @Patch("franjas/:id")
  @ApiOperation({ summary: "Actualizar una franja horaria" })
  updateFranja(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: ActualizarFranjaHorariaDto,
  ) {
    return this.horariosService.updateFranja(id, dto);
  }

  @Patch("franjas/:id/estado")
  @ApiOperation({ summary: "Activar/desactivar una franja horaria" })
  toggleEstadoFranja(@Param("id", ParseIntPipe) id: number) {
    return this.horariosService.toggleEstadoFranja(id);
  }

  @Delete("franjas/:id")
  @ApiOperation({ summary: "Eliminar una franja horaria" })
  removeFranja(@Param("id", ParseIntPipe) id: number) {
    return this.horariosService.removeFranja(id);
  }

  // ============================================================
  // EXCEPCIONES DE HORARIO
  // ============================================================

  @Get("excepciones")
  @ApiOperation({ summary: "Listar excepciones de horario" })
  @ApiQuery({ name: "desde", required: false, example: "2026-10-01" })
  @ApiQuery({ name: "hasta", required: false, example: "2026-12-31" })
  findAllExcepciones(
    @Query("desde") desde?: string,
    @Query("hasta") hasta?: string,
  ) {
    return this.horariosService.findAllExcepciones(desde, hasta);
  }

  @Get("excepciones/:id")
  @ApiOperation({ summary: "Obtener una excepción de horario por id" })
  findOneExcepcion(@Param("id", ParseIntPipe) id: number) {
    return this.horariosService.findOneExcepcion(id);
  }

  @Post("excepciones")
  @ApiOperation({ summary: "Crear una excepción de horario (feriado, etc.)" })
  createExcepcion(@Body() dto: CrearExcepcionHorarioDto) {
    return this.horariosService.createExcepcion(dto);
  }

  @Patch("excepciones/:id")
  @ApiOperation({ summary: "Actualizar una excepción de horario" })
  updateExcepcion(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: ActualizarExcepcionHorarioDto,
  ) {
    return this.horariosService.updateExcepcion(id, dto);
  }

  @Delete("excepciones/:id")
  @ApiOperation({ summary: "Eliminar una excepción de horario" })
  removeExcepcion(@Param("id", ParseIntPipe) id: number) {
    return this.horariosService.removeExcepcion(id);
  }
}