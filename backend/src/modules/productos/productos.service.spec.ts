import { Test, type TestingModule } from "@nestjs/testing";
import { NotFoundException } from "@nestjs/common";
import { ProductosService } from "./productos.service";
import { PrismaService } from "../../prisma/prisma.service";
import { CategoriasProductoService } from "../categorias-producto/categorias-producto.service";

const prismaMock = {
  producto: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
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
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductosService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: CategoriasProductoService, useValue: categoriasMock },
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
});
