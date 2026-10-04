// El Service contiene toda la lógica de negocio.
// El Controller no procesa datos — solo delega al Service.
// PrismaService se inyecta automáticamente gracias al decorador @Global()
// del PrismaModule, sin necesidad de importarlo en UsuariosModule.

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, RolUsuario } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { normalizarTelefono } from "../auth/utils/normalizar-telefono";
import { type UsuarioAutenticado } from "../auth/types/usuario-autenticado";
import { type CrearUsuarioDto } from "./dto/crear-usuario.dto";
import { type ActualizarUsuarioDto } from "./dto/actualizar-usuario.dto";
import { type ListarUsuariosDto } from "./dto/listar-usuarios.dto";

// password_hash se excluye siempre por seguridad.
const SELECT_USUARIO = {
  id: true,
  nombre: true,
  apellido: true,
  telefono: true,
  email: true,
  rol: true,
  perfil_completo: true,
  direccion: true,
  fecha_alta: true,
} satisfies Prisma.UsuarioSelect;

// RF19: el perfil se considera completo cuando tiene apellido, email y dirección.
function calcularPerfilCompleto(datos: {
  apellido?: string | null;
  email?: string | null;
  direccion?: string | null;
}): boolean {
  return [datos.apellido, datos.email, datos.direccion].every(
    (valor) => !!valor && valor.trim().length > 0,
  );
}

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  // GET /api/usuarios — Lista usuarios, con búsqueda y filtro por rol opcionales
  async findAll(filtros: ListarUsuariosDto = {}) {
    const where: Prisma.UsuarioWhereInput = {};

    if (filtros.rol) where.rol = filtros.rol;

    const busqueda = filtros.busqueda?.trim();
    if (busqueda) {
      const soloDigitos = busqueda.replace(/\D/g, "");
      where.OR = [
        { nombre: { contains: busqueda, mode: "insensitive" } },
        { apellido: { contains: busqueda, mode: "insensitive" } },
        { email: { contains: busqueda, mode: "insensitive" } },
        ...(soloDigitos ? [{ telefono: { contains: soloDigitos } }] : []),
      ];
    }

    return this.prisma.usuario.findMany({
      where,
      orderBy: [{ nombre: "asc" }, { apellido: "asc" }],
      select: SELECT_USUARIO,
    });
  }

  // GET /api/usuarios/:id — Retorna un usuario por ID
  async findOne(id: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      select: SELECT_USUARIO,
    });

    if (!usuario) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    }

    return usuario;
  }

  // POST /api/usuarios — Alta desde el panel admin
  async create(dto: CrearUsuarioDto) {
    const telefono = dto.telefono ? normalizarTelefono(dto.telefono) : undefined;
    const email = dto.email?.trim().toLowerCase();
    const rol = dto.rol ?? RolUsuario.cliente;

    // El login es por teléfono + OTP: un admin sin teléfono no podría entrar nunca.
    if (rol === RolUsuario.admin && !telefono) {
      throw new BadRequestException("Un administrador necesita teléfono para iniciar sesión");
    }

    await this.asegurarContactoUnico({ telefono, email });

    try {
      return await this.prisma.usuario.create({
        data: {
          nombre: dto.nombre.trim(),
          apellido: dto.apellido?.trim(),
          telefono,
          email,
          direccion: dto.direccion?.trim(),
          rol,
          perfil_completo: calcularPerfilCompleto({
            apellido: dto.apellido,
            email,
            direccion: dto.direccion,
          }),
        },
        select: SELECT_USUARIO,
      });
    } catch (error) {
      this.lanzarSiEsDuplicado(error);
      throw error;
    }
  }

  // PATCH /api/usuarios/:id — Un admin edita a cualquiera; un cliente, solo lo suyo (RF21 / CU-38)
  async update(id: number, dto: ActualizarUsuarioDto, actual: UsuarioAutenticado) {
    const existente = await this.findOne(id);
    const esAdmin = actual.rol === RolUsuario.admin;

    if (!esAdmin && actual.id !== id) {
      throw new ForbiddenException("Solo podés editar tus propios datos");
    }

    const telefono = dto.telefono ? normalizarTelefono(dto.telefono) : undefined;
    const email = dto.email?.trim().toLowerCase();

    // El teléfono es la identidad del login (verificada por OTP): solo la admin lo cambia.
    if (!esAdmin && telefono && telefono !== existente.telefono) {
      throw new ForbiddenException("El teléfono solo puede modificarlo el salón");
    }

    await this.asegurarContactoUnico(
      {
        telefono: telefono !== existente.telefono ? telefono : undefined,
        email: email !== existente.email ? email : undefined,
      },
      id,
    );

    const data: Prisma.UsuarioUpdateInput = {};
    if (dto.nombre !== undefined) data.nombre = dto.nombre.trim();
    if (dto.apellido !== undefined) data.apellido = dto.apellido.trim();
    if (dto.direccion !== undefined) data.direccion = dto.direccion.trim();
    if (telefono !== undefined) data.telefono = telefono;
    if (email !== undefined) data.email = email;

    data.perfil_completo = calcularPerfilCompleto({
      apellido: (data.apellido as string | undefined) ?? existente.apellido,
      email: (data.email as string | undefined) ?? existente.email,
      direccion: (data.direccion as string | undefined) ?? existente.direccion,
    });

    try {
      return await this.prisma.usuario.update({
        where: { id },
        data,
        select: SELECT_USUARIO,
      });
    } catch (error) {
      this.lanzarSiEsDuplicado(error);
      throw error;
    }
  }

  // PATCH /api/usuarios/:id/rol — Solo admin. No permite tocar el propio rol,
  // así nunca se puede dejar el sistema sin administradores.
  async cambiarRol(id: number, rol: RolUsuario, actual: UsuarioAutenticado) {
    const usuario = await this.findOne(id);

    if (usuario.rol === rol) return usuario;

    if (actual.id === id) {
      throw new ConflictException("No podés cambiar tu propio rol");
    }

    if (rol === RolUsuario.admin && !usuario.telefono) {
      throw new BadRequestException(
        "El usuario necesita un teléfono para poder iniciar sesión como administrador",
      );
    }

    return this.prisma.usuario.update({
      where: { id },
      data: { rol },
      select: SELECT_USUARIO,
    });
  }

  // DELETE /api/usuarios/:id — Solo admin
  async remove(id: number, actual: UsuarioAutenticado) {
    await this.findOne(id);

    if (actual.id === id) {
      throw new ConflictException("No podés eliminar tu propio usuario");
    }

    try {
      await this.prisma.usuario.delete({ where: { id } });
    } catch (error) {
      // P2003 = FK con dependencias (turnos / pedidos con onDelete: Restrict)
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
        throw new ConflictException(
          "No se puede eliminar: el usuario tiene turnos o pedidos asociados",
        );
      }
      throw error;
    }

    return { mensaje: `Usuario ${id} eliminado correctamente` };
  }

  // Chequeo previo para dar un mensaje específico (teléfono vs. email).
  // El P2002 de la base queda como red de seguridad ante una carrera.
  private async asegurarContactoUnico(
    datos: { telefono?: string; email?: string },
    excluirId?: number,
  ) {
    const excluir = excluirId ? { id: { not: excluirId } } : {};

    if (datos.telefono) {
      const repetido = await this.prisma.usuario.findFirst({
        where: { telefono: datos.telefono, ...excluir },
        select: { id: true },
      });
      if (repetido) throw new ConflictException("Ya existe un usuario con ese teléfono");
    }

    if (datos.email) {
      const repetido = await this.prisma.usuario.findFirst({
        where: { email: datos.email, ...excluir },
        select: { id: true },
      });
      if (repetido) throw new ConflictException("Ya existe un usuario con ese email");
    }
  }

  // P2002 = violación de constraint unique (teléfono o email)
  private lanzarSiEsDuplicado(error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ConflictException("El teléfono o el email ya están registrados");
    }
  }
}
