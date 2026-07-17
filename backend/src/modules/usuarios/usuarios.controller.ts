// El Controller maneja las solicitudes HTTP.
// Su única responsabilidad es recibir la request, extraer
// los datos necesarios y delegarlos al Service.
// NNUNCA debe contener lógica de negocio.

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
import { UsuariosService } from "./usuarios.service";
import { type CrearUsuarioDto } from "./dto/crear-usuario.dto";
import { type ActualizarUsuarioDto } from "./dto/actualizar-usuario.dto";

// El prefijo 'usuarios' se aplica a todas las rutas de este controller.
// Es decir: GET /usuarios, POST /usuarios, GET /usuarios/:id, etc.
@Controller("usuarios")
export class UsuariosController {
  // NestJS inyecta el Service automáticamente gracias al decorador @Injectable()
  constructor(private readonly usuariosService: UsuariosService) {}

  // GET /usuarios
  // Retorna todos los usuarios. HTTP 200 por defecto.
  @Get()
  findAll() {
    return this.usuariosService.findAll();
  }

  // GET /usuarios/:id
  // ParseIntPipe convierte el parámetro :id de string a number.
  // Si no es un número válido, NestJS retorna 400 automáticamente.
  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.usuariosService.findOne(id);
  }

  // POST /usuarios
  // @Body() extrae el cuerpo de la request y lo valida contra CrearUsuarioDto.
  // HTTP 201 Created por defecto en POST.
  @Post()
  create(@Body() dto: CrearUsuarioDto) {
    return this.usuariosService.create(dto);
  }

  // PATCH /usuarios/:id
  // Actualización parcial: solo actualiza los campos que lleguen en el body.
  // Usar PATCH en lugar de PUT para actualizaciones parciales.
  @Patch(":id")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: ActualizarUsuarioDto,
  ) {
    return this.usuariosService.update(id, dto);
  }

  // DELETE /usuarios/:id
  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.usuariosService.remove(id);
  }
}
