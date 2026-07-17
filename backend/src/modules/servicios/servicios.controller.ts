// El Controller maneja las solicitudes HTTP.
// Su única responsabilidad es recibir la request, extraer
// los datos necesarios y delegarlos al Service.
// NUNCA debe contener lógica de negocio.

import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  ParseIntPipe,
} from "@nestjs/common";
import { ServiciosService } from "./servicios.service";
import { type CrearServicioDto } from "./dto/crear-servicio.dto";
import { type ActualizarServicioDto } from "./dto/actualizar-servicio.dto";

// El prefijo 'servicios' se aplica a todas las rutas de este controller.
@Controller("servicios")
export class ServiciosController {
  constructor(private readonly serviciosService: ServiciosService) {}

  // GET /servicios
  @Get()
  findAll() {
    return this.serviciosService.findAll();
  }

  // GET /servicios/:id
  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.serviciosService.findOne(id);
  }

  // POST /servicios
  @Post()
  create(@Body() dto: CrearServicioDto) {
    return this.serviciosService.create(dto);
  }

  // PATCH /servicios/:id
  @Patch(":id")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: ActualizarServicioDto,
  ) {
    return this.serviciosService.update(id, dto);
  }

  // PATCH /servicios/:id/estado
  @Patch(":id/estado")
  toggleEstado(@Param("id", ParseIntPipe) id: number) {
    return this.serviciosService.toggleEstado(id);
  }
}
