// El Service contiene toda la lógica de negocio.
// El Controller no procesa datos — solo delega al Service.
// PrismaService se inyecta automáticamente gracias al decorador @Global()
// del PrismaModule, sin necesidad de importarlo en UsuariosModule.

import { Injectable, NotFoundException } from "@nestjs/common";
import { type CrearUsuarioDto } from "./dto/crear-usuario.dto";
import { type ActualizarUsuarioDto } from "./dto/actualizar-usuario.dto";
import { type PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class UsuariosService {
  // Inyección de dependencias: NestJS instancia PrismaService automáticamente
  constructor(private readonly prisma: PrismaService) {}

  // GET /api/usuarios — Retorna todos los usuarios
  async findAll() {
    return this.prisma.usuario.findMany({
      select: {
        id: true,
        nombre: true,
        apellido: true,
        telefono: true,
        email: true,
        rol: true,
        perfil_completo: true,
        direccion: true,
        fecha_alta: true,
        // password_hash se excluye siempre por seguridad
      },
    });
  }

  // GET /api/usuarios/:id — Retorna un usuario por ID
  async findOne(id: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        telefono: true,
        email: true,
        rol: true,
        perfil_completo: true,
        direccion: true,
        fecha_alta: true,
      },
    });

    // Si Prisma no encuentra el registro devuelve null
    if (!usuario) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    }

    return usuario;
  }

  // POST /api/usuarios — Crea un usuario nuevo
  async create(dto: CrearUsuarioDto) {
    return this.prisma.usuario.create({
      data: {
        nombre: dto.nombre,
        apellido: dto.apellido,
        telefono: dto.telefono,
        email: dto.email,
        direccion: dto.direccion,
        rol: "cliente", // Por defecto siempre es cliente
        perfil_completo: false, // Por defecto siempre empieza incompleto
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        telefono: true,
        email: true,
        rol: true,
        perfil_completo: true,
        direccion: true,
        fecha_alta: true,
      },
    });
  }

  // PATCH /api/usuarios/:id — Actualiza parcialmente un usuario
  async update(id: number, dto: ActualizarUsuarioDto) {
    // Verificamos que el usuario exista antes de actualizar
    await this.findOne(id);

    return this.prisma.usuario.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        nombre: true,
        apellido: true,
        telefono: true,
        email: true,
        rol: true,
        perfil_completo: true,
        direccion: true,
        fecha_alta: true,
      },
    });
  }

  // DELETE /api/usuarios/:id — Elimina un usuario
  async remove(id: number) {
    // Verificamos que el usuario exista antes de eliminar
    await this.findOne(id);

    await this.prisma.usuario.delete({
      where: { id },
    });

    return { mensaje: `Usuario ${id} eliminado correctamente` };
  }
}
