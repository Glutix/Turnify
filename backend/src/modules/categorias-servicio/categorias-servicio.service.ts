// El Service contiene toda la lógica de negocio.
// El Controller no procesa datos — solo delega al Service.
// PrismaService se inyecta automáticamente gracias al decorador @Global()
// del PrismaModule, sin necesidad de importarlo en CategoriasServicioModule.

import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { CrearCategoriaDto } from "./dto/crear-categoria.dto";
import { ActualizarCategoriaDto } from "./dto/actualizar-categoria.dto";
import { PrismaService } from "../../prisma/prisma.service";

// El id es un Int de 32 bits en la base: un valor mayor no puede existir
// y haría fallar la consulta con un 500.
const ID_MAXIMO = 2147483647;

@Injectable()
export class CategoriasServicioService {
  // Inyección de dependencias: NestJS instancia PrismaService automáticamente
  constructor(private readonly prisma: PrismaService) {}

  // GET /api/categorias-servicio — Retorna todas las categorías
  async findAll() {
    return this.prisma.categoriaServicio.findMany({
      orderBy: { nombre: "asc" },
    });
  }

  // GET /api/categorias-servicio/:id — Retorna una categoría por ID
  async findOne(id: number) {
    if (id > ID_MAXIMO) {
      throw new NotFoundException(
        `Categoría de producto con id ${id} no encontrada`,
      );
    }

    const categoria = await this.prisma.categoriaServicio.findUnique({
      where: { id },
    });

    // Si Prisma no encuentra el registro devuelve null
    if (!categoria) {
      throw new NotFoundException(`Categoría con id ${id} no encontrada`);
    }

    return categoria;
  }

  // POST /api/categorias-servicio — Crea una categoría nueva
  async create(dto: CrearCategoriaDto) {
    try {
      return await this.prisma.categoriaServicio.create({
        data: {
          nombre: dto.nombre,
          descripcion: dto.descripcion,
        },
      });
    } catch (error) {
      // P2002 = violación de constraint unique (nombre duplicado)
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException(
          `Ya existe una categoría con el nombre "${dto.nombre}"`,
        );
      }
      throw error;
    }
  }

  // PATCH /api/categorias-servicio/:id — Actualiza parcialmente una categoría
  async update(id: number, dto: ActualizarCategoriaDto) {
    // Verificamos que la categoría exista antes de actualizar
    await this.findOne(id);

    try {
      return await this.prisma.categoriaServicio.update({
        where: { id },
        data: dto,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException(
          `Ya existe una categoría con el nombre "${dto.nombre}"`,
        );
      }
      throw error;
    }
  }

  // DELETE /api/categorias-servicio/:id — Elimina una categoría
  async remove(id: number) {
    // Verificamos que la categoría exista antes de eliminar
    await this.findOne(id);

    try {
      await this.prisma.categoriaServicio.delete({
        where: { id },
      });

      return { mensaje: `Categoría ${id} eliminada correctamente` };
    } catch (error) {
      // P2003 = violación de foreign key (hay servicios usando esta categoría)
      // La relación Servicio.categoria tiene onDelete: Restrict en el schema,
      // por lo que la base de datos rechaza el borrado automáticamente.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2003"
      ) {
        throw new ConflictException(
          "No se puede eliminar la categoría porque tiene servicios asociados. Reasigná o eliminá esos servicios primero.",
        );
      }
      throw error;
    }
  }
}
