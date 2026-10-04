import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { CrearCategoriaProductoDto } from "./dto/crear-categoria-producto.dto";
import { ActualizarCategoriaProductoDto } from "./dto/actualizar-categoria-producto.dto";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class CategoriasProductoService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.categoriaProducto.findMany({
      orderBy: { nombre: "asc" },
    });
  }

  async findOne(id: number) {
    const categoria = await this.prisma.categoriaProducto.findUnique({
      where: { id },
    });

    if (!categoria) {
      throw new NotFoundException(
        `Categoría de producto con id ${id} no encontrada`,
      );
    }

    return categoria;
  }

  async create(dto: CrearCategoriaProductoDto) {
    try {
      return await this.prisma.categoriaProducto.create({
        data: {
          nombre: dto.nombre,
          descripcion: dto.descripcion,
        },
      });
    } catch (error) {
      if (this.esNombreDuplicado(error)) {
        throw new ConflictException(
          `Ya existe una categoría de producto con el nombre "${dto.nombre}"`,
        );
      }
      throw error;
    }
  }

  async update(id: number, dto: ActualizarCategoriaProductoDto) {
    await this.findOne(id);

    try {
      return await this.prisma.categoriaProducto.update({
        where: { id },
        data: dto,
      });
    } catch (error) {
      if (this.esNombreDuplicado(error)) {
        throw new ConflictException(
          `Ya existe una categoría de producto con el nombre "${dto.nombre}"`,
        );
      }
      throw error;
    }
  }

  async remove(id: number) {
    await this.findOne(id);

    try {
      await this.prisma.categoriaProducto.delete({ where: { id } });

      return { mensaje: `Categoría de producto ${id} eliminada correctamente` };
    } catch (error) {
      // Producto.categoria tiene onDelete: Restrict, la base rechaza el borrado
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2003"
      ) {
        throw new ConflictException(
          "No se puede eliminar la categoría porque tiene productos asociados. Reasigná o eliminá esos productos primero.",
        );
      }
      throw error;
    }
  }

  private esNombreDuplicado(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    );
  }
}
