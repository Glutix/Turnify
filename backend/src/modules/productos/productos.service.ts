import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  ConflictException,
} from "@nestjs/common";
import { type Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CategoriasProductoService } from "../categorias-producto/categorias-producto.service";
import { CrearProductoDto } from "./dto/crear-producto.dto";
import { ActualizarProductoDto } from "./dto/actualizar-producto.dto";
import { ActualizarStockProductoDto } from "./dto/actualizar-stock-producto.dto";
import { CloudinaryService } from "../cloudinary/cloudinary.service";
import { createHash } from "node:crypto";

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

    const nombreArchivo = createHash("sha256")
      .update(archivo.buffer)
      .digest("hex");
    const carpeta = `${CARPETA_IMAGENES}/${productoId}`;

    // Chequeo rápido para no subir a Cloudinary lo que seguro se rechaza.
    // El definitivo se repite abajo, con la fila del producto bloqueada.
    const previo = await this.evaluarImagenNueva(
      this.prisma,
      productoId,
      `${carpeta}/${nombreArchivo}`,
    );
    if (previo.rechazo) throw this.errorRechazoImagen(previo.rechazo);

    const { url, publicId } = await this.cloudinaryService.subirImagen(
      archivo.buffer,
      carpeta,
      nombreArchivo,
    );

    let rechazo: "duplicada" | "limite" | null;
    try {
      rechazo = await this.prisma.$transaction(async (tx) => {
        // Bloquea el producto: serializa las altas de imagen simultáneas.
        await tx.$queryRaw`SELECT id FROM productos WHERE id = ${productoId} FOR UPDATE`;

        const evaluacion = await this.evaluarImagenNueva(
          tx,
          productoId,
          publicId,
        );
        if (evaluacion.rechazo) return evaluacion.rechazo;

        await tx.imagenProducto.create({
          data: {
            producto_id: productoId,
            url_cloudinary: url,
            public_id: publicId,
            es_principal: evaluacion.cantidad === 0,
          },
        });
        return null;
      });
    } catch (error) {
      await this.eliminarSiQuedoHuerfana(publicId);
      throw error;
    }

    if (rechazo) {
      await this.eliminarSiQuedoHuerfana(publicId);
      throw this.errorRechazoImagen(rechazo);
    }

    return this.findOne(productoId);
  }

  async reemplazarImagen(
    productoId: number,
    imagenId: number,
    archivo: Express.Multer.File,
  ) {
    await this.buscarImagen(productoId, imagenId);

    const nombreArchivo = createHash("sha256")
      .update(archivo.buffer)
      .digest("hex");
    const carpeta = `${CARPETA_IMAGENES}/${productoId}`;

    // Chequeo rápido para no subir lo que seguro se rechaza; el definitivo
    // se repite abajo con la fila del producto bloqueada.
    const repetidaPrevia = await this.prisma.imagenProducto.findFirst({
      where: {
        producto_id: productoId,
        public_id: `${carpeta}/${nombreArchivo}`,
      },
    });
    if (repetidaPrevia) throw this.errorRechazoImagen("duplicada");

    const { url, publicId } = await this.cloudinaryService.subirImagen(
      archivo.buffer,
      carpeta,
      nombreArchivo,
    );

    let anterior: string;
    try {
      anterior = await this.prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM productos WHERE id = ${productoId} FOR UPDATE`;

        const actual = await tx.imagenProducto.findFirst({
          where: { id: imagenId, producto_id: productoId },
        });
        if (!actual) {
          throw new NotFoundException(
            `Imagen con id ${imagenId} no encontrada en el producto ${productoId}`,
          );
        }

        const repetida = await tx.imagenProducto.findFirst({
          where: { producto_id: productoId, public_id: publicId },
        });
        if (repetida) throw this.errorRechazoImagen("duplicada");

        await tx.imagenProducto.update({
          where: { id: imagenId },
          data: { url_cloudinary: url, public_id: publicId },
        });
        return actual.public_id;
      });
    } catch (error) {
      await this.eliminarSiQuedoHuerfana(publicId);
      throw error;
    }

    await this.eliminarSiQuedoHuerfana(anterior);

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

  private async evaluarImagenNueva(
    db: Prisma.TransactionClient,
    productoId: number,
    publicId: string,
  ) {
    const [cantidad, repetida] = await Promise.all([
      db.imagenProducto.count({ where: { producto_id: productoId } }),
      db.imagenProducto.findFirst({
        where: { producto_id: productoId, public_id: publicId },
      }),
    ]);

    const rechazo = repetida
      ? ("duplicada" as const)
      : cantidad >= MAX_IMAGENES_POR_PRODUCTO
        ? ("limite" as const)
        : null;

    return { rechazo, cantidad };
  }

  private errorRechazoImagen(rechazo: "duplicada" | "limite") {
    return rechazo === "duplicada"
      ? new ConflictException("Esa imagen ya está cargada en este producto")
      : new BadRequestException(
          `Un producto puede tener hasta ${MAX_IMAGENES_POR_PRODUCTO} imágenes`,
        );
  }

  // Una imagen repetida comparte archivo con la ya guardada, por eso solo se
  // borra de Cloudinary si ninguna fila la referencia.
  private async eliminarSiQuedoHuerfana(publicId: string) {
    try {
      const enUso = await this.prisma.imagenProducto.findFirst({
        where: { public_id: publicId },
      });
      if (!enUso) await this.eliminarDeCloudinary(publicId);
    } catch {
      this.logger.warn(`No se pudo verificar ${publicId} para limpiarla`);
    }
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
