import { Test, type TestingModule } from "@nestjs/testing";
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { ProductosService } from "./productos.service";
import { PrismaService } from "../../prisma/prisma.service";
import { CategoriasProductoService } from "../categorias-producto/categorias-producto.service";
import { CloudinaryService } from "../cloudinary/cloudinary.service";
import { createHash } from "node:crypto";

const prismaMock = {
  producto: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  imagenProducto: {
    count: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
  },
  $queryRaw: jest.fn(),
  $transaction: jest.fn(),
};

const cloudinaryMock = {
  subirImagen: jest.fn(),
  eliminarImagen: jest.fn(),
};

const categoriasMock = { findOne: jest.fn() };

const producto = {
  id: 1,
  categoria_id: 1,
  nombre: "Shampoo reparador",
  descripcion: null,
  precio: "8500.50",
  stock: 10,
  activo: true,
};

describe("ProductosService", () => {
  let service: ProductosService;

  beforeEach(async () => {
    jest.resetAllMocks();
    prismaMock.$transaction.mockImplementation(async (arg) =>
      typeof arg === "function" ? arg(prismaMock) : Promise.all(arg),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductosService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: CategoriasProductoService, useValue: categoriasMock },
        { provide: CloudinaryService, useValue: cloudinaryMock },
      ],
    }).compile();

    service = module.get<ProductosService>(ProductosService);
  });

  describe("findAll", () => {
    it("devuelve todos los productos ordenados por nombre", async () => {
      prismaMock.producto.findMany.mockResolvedValue([producto]);

      const resultado = await service.findAll();

      expect(resultado).toEqual([producto]);
      expect(prismaMock.producto.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { nombre: "asc" } }),
      );
    });
  });

  describe("findOne", () => {
    it("lanza NotFoundException si no existe", async () => {
      prismaMock.producto.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });

    it("lanza NotFoundException sin consultar la base si el id supera el máximo", async () => {
      await expect(service.findOne(3000000000)).rejects.toThrow(
        NotFoundException,
      );
      expect(prismaMock.producto.findUnique).not.toHaveBeenCalled();
    });

    it("devuelve el producto si existe", async () => {
      prismaMock.producto.findUnique.mockResolvedValue(producto);

      await expect(service.findOne(1)).resolves.toEqual(producto);
    });
  });

  describe("create", () => {
    const dto = {
      categoria_id: 1,
      nombre: "Shampoo reparador",
      descripcion: "Para cabello dañado",
      precio: 8500.5,
      stock: 10,
      activo: true,
    };

    it("valida la categoría y crea el producto", async () => {
      categoriasMock.findOne.mockResolvedValue({ id: 1 });
      prismaMock.producto.create.mockResolvedValue(producto);

      const resultado = await service.create(dto);

      expect(resultado).toEqual(producto);
      expect(categoriasMock.findOne).toHaveBeenCalledWith(1);
      expect(prismaMock.producto.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: dto }),
      );
    });

    it("no crea el producto si la categoría no existe", async () => {
      categoriasMock.findOne.mockRejectedValue(new NotFoundException());

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
      expect(prismaMock.producto.create).not.toHaveBeenCalled();
    });
  });

  describe("update", () => {
    it("lanza NotFoundException y no actualiza si el producto no existe", async () => {
      prismaMock.producto.findUnique.mockResolvedValue(null);

      await expect(service.update(999, { nombre: "Nuevo" })).rejects.toThrow(
        NotFoundException,
      );
      expect(prismaMock.producto.update).not.toHaveBeenCalled();
    });

    it("valida la categoría cuando se cambia", async () => {
      prismaMock.producto.findUnique.mockResolvedValue(producto);
      categoriasMock.findOne.mockResolvedValue({ id: 2 });
      prismaMock.producto.update.mockResolvedValue(producto);

      await service.update(1, { categoria_id: 2 });

      expect(categoriasMock.findOne).toHaveBeenCalledWith(2);
    });

    it("no valida la categoría si no viene en el body", async () => {
      prismaMock.producto.findUnique.mockResolvedValue(producto);
      prismaMock.producto.update.mockResolvedValue(producto);

      await service.update(1, { nombre: "Nuevo nombre" });

      expect(categoriasMock.findOne).not.toHaveBeenCalled();
    });

    it("actualiza solo los campos recibidos", async () => {
      prismaMock.producto.findUnique.mockResolvedValue(producto);
      prismaMock.producto.update.mockResolvedValue(producto);

      await service.update(1, { nombre: "Nuevo nombre" });

      expect(prismaMock.producto.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: { nombre: "Nuevo nombre" },
        }),
      );
    });
  });

  describe("actualizarStock", () => {
    it("lanza NotFoundException y no actualiza si no existe", async () => {
      prismaMock.producto.findUnique.mockResolvedValue(null);

      await expect(service.actualizarStock(999, { stock: 5 })).rejects.toThrow(
        NotFoundException,
      );
      expect(prismaMock.producto.update).not.toHaveBeenCalled();
    });

    it("fija el stock como valor absoluto", async () => {
      prismaMock.producto.findUnique.mockResolvedValue(producto);
      prismaMock.producto.update.mockResolvedValue({ ...producto, stock: 25 });

      await service.actualizarStock(1, { stock: 25 });

      expect(prismaMock.producto.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 1 }, data: { stock: 25 } }),
      );
    });

    it("permite desactivar y reactivar el producto con activo", async () => {
      prismaMock.producto.findUnique.mockResolvedValue(producto);
      prismaMock.producto.update.mockResolvedValue(producto);

      await service.update(1, { activo: false });
      await service.update(1, { activo: true });

      expect(prismaMock.producto.update).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ data: { activo: false } }),
      );
      expect(prismaMock.producto.update).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ data: { activo: true } }),
      );
    });
  });

  //! Catálogo público (sin autenticación): solo productos activos
  describe("findAllCatalogo", () => {
    it("pide solo productos activos, sin el campo activo y ordenados por nombre", async () => {
      prismaMock.producto.findMany.mockResolvedValue([producto]);

      await service.findAllCatalogo();

      expect(prismaMock.producto.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { activo: true },
          omit: { activo: true },
          orderBy: { nombre: "asc" },
        }),
      );
    });
  });

  describe("findOneCatalogo", () => {
    it("lanza NotFoundException sin consultar la base si el id supera el máximo", async () => {
      await expect(service.findOneCatalogo(3000000000)).rejects.toThrow(
        NotFoundException,
      );
      expect(prismaMock.producto.findUnique).not.toHaveBeenCalled();
    });

    it("busca solo entre los activos y lanza NotFoundException si no aparece", async () => {
      prismaMock.producto.findUnique.mockResolvedValue(null);

      await expect(service.findOneCatalogo(1)).rejects.toThrow(
        NotFoundException,
      );
      expect(prismaMock.producto.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 1, activo: true } }),
      );
    });

    it("devuelve el producto si está activo", async () => {
      prismaMock.producto.findUnique.mockResolvedValue(producto);

      await expect(service.findOneCatalogo(1)).resolves.toEqual(producto);
    });
  });

  //! Imágenes de productos
  describe("imágenes", () => {
    const archivo = {
      buffer: Buffer.from("contenido de prueba"),
      mimetype: "image/jpeg",
      size: 19,
    } as Express.Multer.File;
    const hash = createHash("sha256").update(archivo.buffer).digest("hex");
    const carpeta = "turnify/productos/1";
    const publicId = `${carpeta}/${hash}`;
    const subida = { url: "https://res.cloudinary.com/x/nueva.webp", publicId };
    const imagen = {
      id: 5,
      producto_id: 1,
      public_id: `${carpeta}/vieja`,
      es_principal: true,
    };

    beforeEach(() => {
      prismaMock.producto.findUnique.mockResolvedValue(producto);
      prismaMock.imagenProducto.count.mockResolvedValue(0);
      prismaMock.imagenProducto.findFirst.mockResolvedValue(null);
      cloudinaryMock.subirImagen.mockResolvedValue(subida);
    });

    describe("agregarImagen", () => {
      it("lanza NotFoundException y no sube nada si el producto no existe", async () => {
        prismaMock.producto.findUnique.mockResolvedValue(null);

        await expect(service.agregarImagen(1, archivo)).rejects.toThrow(
          NotFoundException,
        );
        expect(cloudinaryMock.subirImagen).not.toHaveBeenCalled();
      });

      it("rechaza con 400 sin subir nada si ya tiene el máximo de imágenes", async () => {
        prismaMock.imagenProducto.count.mockResolvedValue(5);

        await expect(service.agregarImagen(1, archivo)).rejects.toThrow(
          BadRequestException,
        );
        expect(cloudinaryMock.subirImagen).not.toHaveBeenCalled();
      });

      it("rechaza con 409 sin subir nada si la imagen ya está en el producto", async () => {
        prismaMock.imagenProducto.findFirst.mockResolvedValueOnce({ id: 9 });

        await expect(service.agregarImagen(1, archivo)).rejects.toThrow(
          ConflictException,
        );
        expect(cloudinaryMock.subirImagen).not.toHaveBeenCalled();
      });

      it("sube a la carpeta del producto con el hash como nombre y guarda la primera como principal", async () => {
        await service.agregarImagen(1, archivo);

        expect(cloudinaryMock.subirImagen).toHaveBeenCalledWith(
          archivo.buffer,
          carpeta,
          hash,
        );
        expect(prismaMock.$queryRaw).toHaveBeenCalled();
        expect(prismaMock.imagenProducto.create).toHaveBeenCalledWith({
          data: {
            producto_id: 1,
            url_cloudinary: subida.url,
            public_id: publicId,
            es_principal: true,
          },
        });
      });

      it("no marca como principal a las imágenes que se suman después", async () => {
        prismaMock.imagenProducto.count.mockResolvedValue(2);

        await service.agregarImagen(1, archivo);

        expect(prismaMock.imagenProducto.create).toHaveBeenCalledWith({
          data: expect.objectContaining({ es_principal: false }),
        });
      });

      it("si el límite se alcanza mientras se sube, rechaza con 400 y borra la imagen subida", async () => {
        prismaMock.imagenProducto.count
          .mockResolvedValueOnce(4)
          .mockResolvedValueOnce(5);

        await expect(service.agregarImagen(1, archivo)).rejects.toThrow(
          BadRequestException,
        );
        expect(prismaMock.imagenProducto.create).not.toHaveBeenCalled();
        expect(cloudinaryMock.eliminarImagen).toHaveBeenCalledWith(publicId);
      });

      it("si la misma imagen aparece mientras se sube, rechaza con 409 y NO borra el archivo que usa otra fila", async () => {
        prismaMock.imagenProducto.findFirst
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({ id: 9 })
          .mockResolvedValueOnce({ id: 9 });

        await expect(service.agregarImagen(1, archivo)).rejects.toThrow(
          ConflictException,
        );
        expect(cloudinaryMock.eliminarImagen).not.toHaveBeenCalled();
      });

      it("si falla el guardado en la base, borra la imagen subida y propaga el error", async () => {
        prismaMock.imagenProducto.create.mockRejectedValue(
          new Error("base caída"),
        );

        await expect(service.agregarImagen(1, archivo)).rejects.toThrow(
          "base caída",
        );
        expect(cloudinaryMock.eliminarImagen).toHaveBeenCalledWith(publicId);
      });
    });

    describe("eliminarImagen", () => {
      it("lanza NotFoundException si la imagen no existe en el producto", async () => {
        await expect(service.eliminarImagen(1, 5)).rejects.toThrow(
          NotFoundException,
        );
      });

      it("lanza NotFoundException sin consultar la base si el id de la imagen supera el máximo", async () => {
        await expect(service.eliminarImagen(1, 3000000000)).rejects.toThrow(
          NotFoundException,
        );
        expect(prismaMock.imagenProducto.findFirst).not.toHaveBeenCalled();
      });

      it("al eliminar la principal, promueve a la más antigua que queda y borra el archivo", async () => {
        prismaMock.imagenProducto.findFirst
          .mockResolvedValueOnce(imagen)
          .mockResolvedValueOnce({ id: 7 });

        await service.eliminarImagen(1, 5);

        expect(prismaMock.imagenProducto.delete).toHaveBeenCalledWith({
          where: { id: 5 },
        });
        expect(prismaMock.imagenProducto.update).toHaveBeenCalledWith({
          where: { id: 7 },
          data: { es_principal: true },
        });
        expect(cloudinaryMock.eliminarImagen).toHaveBeenCalledWith(
          imagen.public_id,
        );
      });

      it("no promueve a nadie si la imagen eliminada no era la principal", async () => {
        prismaMock.imagenProducto.findFirst.mockResolvedValueOnce({
          ...imagen,
          es_principal: false,
        });

        await service.eliminarImagen(1, 5);

        expect(prismaMock.imagenProducto.update).not.toHaveBeenCalled();
      });

      it("no promueve a nadie si no quedan más imágenes", async () => {
        prismaMock.imagenProducto.findFirst
          .mockResolvedValueOnce(imagen)
          .mockResolvedValueOnce(null);

        await service.eliminarImagen(1, 5);

        expect(prismaMock.imagenProducto.update).not.toHaveBeenCalled();
      });

      it("no falla si Cloudinary no puede borrar el archivo", async () => {
        prismaMock.imagenProducto.findFirst.mockResolvedValueOnce({
          ...imagen,
          es_principal: false,
        });
        cloudinaryMock.eliminarImagen.mockRejectedValue(new Error("sin red"));

        await expect(service.eliminarImagen(1, 5)).resolves.toBeDefined();
      });
    });

    describe("marcarImagenPrincipal", () => {
      it("lanza NotFoundException si la imagen no existe en el producto", async () => {
        await expect(service.marcarImagenPrincipal(1, 5)).rejects.toThrow(
          NotFoundException,
        );
      });

      it("desmarca todas las del producto y marca la elegida en una sola transacción", async () => {
        prismaMock.imagenProducto.findFirst.mockResolvedValueOnce(imagen);

        await service.marcarImagenPrincipal(1, 5);

        expect(prismaMock.imagenProducto.updateMany).toHaveBeenCalledWith({
          where: { producto_id: 1 },
          data: { es_principal: false },
        });
        expect(prismaMock.imagenProducto.update).toHaveBeenCalledWith({
          where: { id: 5 },
          data: { es_principal: true },
        });
        expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
      });
    });

    describe("reemplazarImagen", () => {
      it("lanza NotFoundException y no sube nada si la imagen no existe", async () => {
        await expect(service.reemplazarImagen(1, 5, archivo)).rejects.toThrow(
          NotFoundException,
        );
        expect(cloudinaryMock.subirImagen).not.toHaveBeenCalled();
      });

      it("rechaza con 409 sin subir nada si el archivo ya está en el producto", async () => {
        prismaMock.imagenProducto.findFirst
          .mockResolvedValueOnce(imagen)
          .mockResolvedValueOnce({ id: 9 });

        await expect(service.reemplazarImagen(1, 5, archivo)).rejects.toThrow(
          ConflictException,
        );
        expect(cloudinaryMock.subirImagen).not.toHaveBeenCalled();
      });

      it("cambia la URL y el public_id de la misma fila y borra el archivo anterior", async () => {
        prismaMock.imagenProducto.findFirst
          .mockResolvedValueOnce(imagen)
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(imagen)
          .mockResolvedValueOnce(null);

        await service.reemplazarImagen(1, 5, archivo);

        expect(prismaMock.imagenProducto.update).toHaveBeenCalledWith({
          where: { id: 5 },
          data: { url_cloudinary: subida.url, public_id: publicId },
        });
        expect(cloudinaryMock.eliminarImagen).toHaveBeenCalledWith(
          imagen.public_id,
        );
      });

      it("si la imagen desaparece mientras se sube, rechaza con 404 y borra solo el archivo nuevo", async () => {
        prismaMock.imagenProducto.findFirst
          .mockResolvedValueOnce(imagen)
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(null);

        await expect(service.reemplazarImagen(1, 5, archivo)).rejects.toThrow(
          NotFoundException,
        );
        expect(prismaMock.imagenProducto.update).not.toHaveBeenCalled();
        expect(cloudinaryMock.eliminarImagen).toHaveBeenCalledTimes(1);
        expect(cloudinaryMock.eliminarImagen).toHaveBeenCalledWith(publicId);
      });
    });
  });
});
