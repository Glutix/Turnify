// El Controller maneja las solicitudes HTTP.
// Su única responsabilidad es recibir la request, extraer
// los datos necesarios y delegarlos al Service.
// NUNCA debe contener lógica de negocio.

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  ParseIntPipe, // Convierte el :id de string a number automáticamente
} from "@nestjs/common";
import { CategoriasServicioService } from "./categorias-servicio.service";
import { CrearCategoriaDto } from "./dto/crear-categoria.dto";
import { ActualizarCategoriaDto } from "./dto/actualizar-categoria.dto";
import { SoloAdmin } from "../auth/decorators/auth.decorators";

// El prefijo 'categorias-servicio' se aplica a todas las rutas de este controller.
@Controller("categorias-servicio")
export class CategoriasServicioController {
  // NestJS inyecta el Service automáticamente gracias al decorador @Injectable()
  constructor(
    private readonly categoriasServicioService: CategoriasServicioService,
  ) {}

  // GET /categorias-servicio
  @Get()
  findAll() {
    return this.categoriasServicioService.findAll();
  }

  // GET /categorias-servicio/:id
  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.categoriasServicioService.findOne(id);
  }

  // POST /categorias-servicio
  @SoloAdmin()
  @Post()
  create(@Body() dto: CrearCategoriaDto) {
    return this.categoriasServicioService.create(dto);
  }

  // PATCH /categorias-servicio/:id
  @SoloAdmin()
  @Patch(":id")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: ActualizarCategoriaDto,
  ) {
    return this.categoriasServicioService.update(id, dto);
  }

  // DELETE /categorias-servicio/:id
  @SoloAdmin()
  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.categoriasServicioService.remove(id);
  }
}
