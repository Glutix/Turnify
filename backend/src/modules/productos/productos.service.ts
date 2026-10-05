import { Injectable, NotFoundException } from "@nestjs/common";
import { type Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CategoriasProductoService } from "../categorias-producto/categorias-producto.service";
import { CrearProductoDto } from "./dto/crear-producto.dto";
import { ActualizarProductoDto } from "./dto/actualizar-producto.dto";
import { ActualizarStockProductoDto } from "./dto/actualizar-stock-producto.dto";

const INCLUIR_RELACIONES = {
  categoria: { select: { id: true, nombre: true } },
  imagenes: {
    select: { id: true, url_cloudinary: true, es_principal: true },
    orderBy: [{ es_principal: "desc" }, { id: "asc" }],
  },
} satisfies Prisma.ProductoInclude;

// El id es un Int de 32 bits en la base: un valor mayor no puede existir
// y haría fallar la consulta con un 500.
const ID_MAXIMO = 2147483647;

@Injectable()
export class ProductosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly categoriasProductoService: CategoriasProductoService,
  ) {}

  async findAll() {
    return this.prisma.producto.findMany({
      include: INCLUIR_RELACIONES,
      orderBy: { nombre: "asc" },
    });
  }

  async findOne(id: number) {
    if (id > ID_MAXIMO) {
      throw new NotFoundException(`Producto con id ${id} no encontrado`);
    }

    const producto = await this.prisma.producto.findUnique({
      where: { id },
      include: INCLUIR_RELACIONES,
    });

    if (!producto) {
      throw new NotFoundException(`Producto con id ${id} no encontrado`);
    }

    return producto;
  }

  async create(dto: CrearProductoDto) {
    await this.categoriasProductoService.findOne(dto.categoria_id);

    return this.prisma.producto.create({
      data: {
        categoria_id: dto.categoria_id,
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        precio: dto.precio,
        stock: dto.stock,
        activo: dto.activo,
      },
      include: INCLUIR_RELACIONES,
    });
  }

  async update(id: number, dto: ActualizarProductoDto) {
    await this.findOne(id);

    if (dto.categoria_id !== undefined) {
      await this.categoriasProductoService.findOne(dto.categoria_id);
    }

    return this.prisma.producto.update({
      where: { id },
      data: dto,
      include: INCLUIR_RELACIONES,
    });
  }

  async actualizarStock(id: number, dto: ActualizarStockProductoDto) {
    await this.findOne(id);

    return this.prisma.producto.update({
      where: { id },
      data: { stock: dto.stock },
      include: INCLUIR_RELACIONES,
    });
  }

  // Borrado lógico: el producto queda inactivo y se conserva para no perder
  // el historial de pedidos que lo referencian.
  async remove(id: number) {
    await this.findOne(id);

    await this.prisma.producto.update({
      where: { id },
      data: { activo: false },
    });

    return { mensaje: `Producto ${id} eliminado del catálogo (desactivado)` };
  }
}
