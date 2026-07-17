// El Service contiene toda la lógica de negocio.
// El Controller no procesa datos — solo delega al Service.
// PrismaService se inyecta automáticamente gracias al decorador @Global()
// del PrismaModule, sin necesidad de importarlo en ServiciosModule.
// CategoriasServicioService se inyecta explícitamente porque ServiciosModule
// importa CategoriasServicioModule.

import { Injectable, NotFoundException } from "@nestjs/common";
import { CrearServicioDto } from "./dto/crear-servicio.dto";
import { ActualizarServicioDto } from "./dto/actualizar-servicio.dto";
import { PrismaService } from "../../prisma/prisma.service";
import { CategoriasServicioService } from "../categorias-servicio/categorias-servicio.service";

@Injectable()
export class ServiciosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly categoriasServicioService: CategoriasServicioService,
  ) {}

  // GET /api/servicios — Retorna todos los servicios (activos e inactivos)
  // Incluye la categoría para que el frontend pueda agrupar sin requests extra.
  async findAll() {
    return this.prisma.servicio.findMany({
      include: { categoria: true },
      orderBy: { nombre: "asc" },
    });
  }

  // GET /api/servicios/:id — Retorna un servicio por ID
  async findOne(id: number) {
    const servicio = await this.prisma.servicio.findUnique({
      where: { id },
      include: { categoria: true },
    });

    // Si Prisma no encuentra el registro devuelve null
    if (!servicio) {
      throw new NotFoundException(`Servicio con id ${id} no encontrado`);
    }

    return servicio;
  }

  // POST /api/servicios — Crea un servicio nuevo
  async create(dto: CrearServicioDto) {
    // Verificamos que la categoría exista antes de crear el servicio.
    // findOne ya lanza NotFoundException si no existe.
    await this.categoriasServicioService.findOne(dto.categoria_id);

    return this.prisma.servicio.create({
      data: {
        categoria_id: dto.categoria_id,
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        duracion_minutos: dto.duracion_minutos,
        precio: dto.precio,
        activo: true, // Por defecto siempre se crea activo, no se confía en el body
      },
      include: { categoria: true },
    });
  }

  // PATCH /api/servicios/:id — Actualiza parcialmente un servicio
  async update(id: number, dto: ActualizarServicioDto) {
    // Verificamos que el servicio exista antes de actualizar
    await this.findOne(id);

    // Si viene categoria_id en el body, verificamos que esa categoría exista
    if (dto.categoria_id !== undefined) {
      await this.categoriasServicioService.findOne(dto.categoria_id);
    }

    return this.prisma.servicio.update({
      where: { id },
      data: dto,
      include: { categoria: true },
    });
  }

  // PATCH /api/servicios/:id/estado — Activa o desactiva un servicio (borrado lógico)
  // Endpoint separado de update() para que quede como una acción explícita e intencional.
  async toggleEstado(id: number) {
    const servicio = await this.findOne(id);

    return this.prisma.servicio.update({
      where: { id },
      data: { activo: !servicio.activo },
      include: { categoria: true },
    });
  }
}