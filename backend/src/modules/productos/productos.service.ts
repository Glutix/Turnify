import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { type Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CategoriasProductoService } from "../categorias-producto/categorias-producto.service";
import { CrearProductoDto } from "./dto/crear-producto.dto";
import { ActualizarProductoDto } from "./dto/actualizar-producto.dto";
import { ActualizarStockProductoDto } from "./dto/actualizar-stock-producto.dto";
import { CloudinaryService } from "../cloudinary/cloudinary.service";

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
const MAX_IMAGENES_POR_PRODUCTO = 5;
const CARPETA_IMAGENES = "turnify/productos";

@Injectable()
export class ProductosService {
  private readonly logger = new Logger(ProductosService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly categoriasProductoService: CategoriasProductoService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  //! Administración (solo admin)
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

  //! Catálogo público (sin autenticación): solo productos activos
  async findAllCatalogo() {
    return this.prisma.producto.findMany({
      where: { activo: true },
      include: INCLUIR_RELACIONES,
      omit: { activo: true },
      orderBy: { nombre: "asc" },
    });
  }

  async findOneCatalogo(id: number) {
    if (id > ID_MAXIMO) {
      throw new NotFoundException(`Producto con id ${id} no encontrado`);
    }

    const producto = await this.prisma.producto.findUnique({
      where: { id, activo: true },
      include: INCLUIR_RELACIONES,
      omit: { activo: true },
    });

    if (!producto) {
      throw new NotFoundException(`Producto con id ${id} no encontrado`);
    }

    return producto;
  }


  //! Cloudinary
    async agregarImagen(productoId: number, archivo: Express.Multer.File) {
    await this.findOne(productoId);

    const cantidad = await this.prisma.imagenProducto.count({
      where: { producto_id: productoId },
    });

    if (cantidad >= MAX_IMAGENES_POR_PRODUCTO) {
      throw new BadRequestException(
        `Un producto puede tener hasta ${MAX_IMAGENES_POR_PRODUCTO} imágenes`,
      );
    }

    const { url, publicId } = await this.cloudinaryService.subirImagen(
      archivo.buffer,
      CARPETA_IMAGENES,
    );

    try {
      await this.prisma.imagenProducto.create({
        data: {
          producto_id: productoId,
          url_cloudinary: url,
          public_id: publicId,
          es_principal: cantidad === 0,
        },
      });
    } catch (error) {
      await this.eliminarDeCloudinary(publicId);
      throw error;
    }

    return this.findOne(productoId);
  }

  async eliminarImagen(productoId: number, imagenId: number) {
    const imagen = await this.buscarImagen(productoId, imagenId);

    await this.prisma.$transaction(async (tx) => {
      await tx.imagenProducto.delete({ where: { id: imagenId } });

      if (imagen.es_principal) {
        const siguiente = await tx.imagenProducto.findFirst({
          where: { producto_id: productoId },
          orderBy: { id: "asc" },
        });

        if (siguiente) {
          await tx.imagenProducto.update({
            where: { id: siguiente.id },
            data: { es_principal: true },
          });
        }
      }
    });

    await this.eliminarDeCloudinary(imagen.public_id);

    return this.findOne(productoId);
  }

  async marcarImagenPrincipal(productoId: number, imagenId: number) {
    await this.buscarImagen(productoId, imagenId);

    await this.prisma.$transaction([
      this.prisma.imagenProducto.updateMany({
        where: { producto_id: productoId },
        data: { es_principal: false },
      }),
      this.prisma.imagenProducto.update({
        where: { id: imagenId },
        data: { es_principal: true },
      }),
    ]);

    return this.findOne(productoId);
  }

  private async buscarImagen(productoId: number, imagenId: number) {
    await this.findOne(productoId);

    const imagen =
      imagenId > ID_MAXIMO
        ? null
        : await this.prisma.imagenProducto.findFirst({
            where: { id: imagenId, producto_id: productoId },
          });

    if (!imagen) {
      throw new NotFoundException(
        `Imagen con id ${imagenId} no encontrada en el producto ${productoId}`,
      );
    }

    return imagen;
  }

  // Si Cloudinary falla, la base ya quedó correcta: a lo sumo queda un archivo
  // huérfano en Cloudinary, que es preferible a una URL rota en el catálogo.
  private async eliminarDeCloudinary(publicId: string) {
    try {
      await this.cloudinaryService.eliminarImagen(publicId);
    } catch {
      this.logger.warn(`No se pudo borrar ${publicId} de Cloudinary`);
    }
  }
}
