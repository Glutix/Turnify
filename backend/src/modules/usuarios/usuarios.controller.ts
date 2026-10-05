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
  Query,
  ParseIntPipe, // Convierte el :id de string a number automáticamente
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { UsuariosService } from "./usuarios.service";
import {
  Autenticado,
  SoloAdmin,
  UsuarioActual,
} from "../auth/decorators/auth.decorators";
import { type UsuarioAutenticado } from "../auth/types/usuario-autenticado";
// OJO: sin "type" a propósito (ver fix de horarios.controller.ts). Estos
// DTOs son parámetros de @Body() / @Query(), y ValidationPipe necesita la clase
// real en runtime para validar — con "import type" Nest los ve como "Object" y,
// con whitelist:true, termina vaciando el body entero sin tirar error.
import { CrearUsuarioDto } from "./dto/crear-usuario.dto";
import { ActualizarUsuarioDto } from "./dto/actualizar-usuario.dto";
import { CambiarRolUsuarioDto } from "./dto/cambiar-rol-usuario.dto";
import { ListarUsuariosDto } from "./dto/listar-usuarios.dto";

// El prefijo usuarios se aplica a todas las rutas de este controller.
@ApiTags("usuarios")
@Controller("usuarios")
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  // GET /usuarios?busqueda=&rol=
  @SoloAdmin()
  @Get()
  findAll(@Query() filtros: ListarUsuariosDto) {
    return this.usuariosService.findAll(filtros);
  }

  // GET /usuarios/me — el cliente lee su propio perfil (CU-12 / CU-38).
  // OJO: tiene que declararse ANTES de ":id", si no Nest toma "me" como un id
  // y ParseIntPipe responde 400.
  @Autenticado()
  @Get("me")
  obtenerMiPerfil(@UsuarioActual() actual: UsuarioAutenticado) {
    return this.usuariosService.miPerfil(actual.id);
  }

  // PATCH /usuarios/me — el cliente completa o edita sus propios datos.
  // Reutiliza update(): las reglas (teléfono solo lo cambia la admin, email
  // único, perfil_completo automático) son las mismas que en PATCH /:id.
  @Autenticado()
  @Patch("me")
  actualizarMiPerfil(@Body() dto: ActualizarUsuarioDto, @UsuarioActual() actual: UsuarioAutenticado) {
    return this.usuariosService.update(actual.id, dto, actual);
  }

  // GET /usuarios/:id
  @SoloAdmin()
  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.usuariosService.findOne(id);
  }

  // POST /usuarios
  @SoloAdmin()
  @Post()
  create(@Body() dto: CrearUsuarioDto) {
    return this.usuariosService.create(dto);
  }

  // PATCH /usuarios/:id
  // Admin: cualquiera. Cliente: solo el propio (lo valida el service).
  @Autenticado()
  @Patch(":id")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: ActualizarUsuarioDto,
    @UsuarioActual() actual: UsuarioAutenticado,
  ) {
    return this.usuariosService.update(id, dto, actual);
  }

  // PATCH /usuarios/:id/rol — acción de estado con endpoint propio
  @SoloAdmin()
  @Patch(":id/rol")
  cambiarRol(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: CambiarRolUsuarioDto,
    @UsuarioActual() actual: UsuarioAutenticado,
  ) {
    return this.usuariosService.cambiarRol(id, dto.rol, actual);
  }

  // DELETE /usuarios/:id
  @SoloAdmin()
  @Delete(":id")
  remove(
    @Param("id", ParseIntPipe) id: number,
    @UsuarioActual() actual: UsuarioAutenticado,
  ) {
    return this.usuariosService.remove(id, actual);
  }
}
