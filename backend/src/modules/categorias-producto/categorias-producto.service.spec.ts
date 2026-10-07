import { Test, type TestingModule } from "@nestjs/testing";
import { NotFoundException, ConflictException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { CategoriasProductoService } from "./categorias-producto.service";
import { PrismaService } from "../../prisma/prisma.service";

const prismaMock = {
  categoriaProducto: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

function crearErrorPrisma(code: string) {
  return new Prisma.PrismaClientKnownRequestError("mock error", {
    code,
    clientVersion: "7.8.0",
  });
}

const categoria = { id: 1, nombre: "Cuidado capilar", descripcion: null };

describe("CategoriasProductoService", () => {
  let service: CategoriasProductoService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriasProductoService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<CategoriasProductoService>(CategoriasProductoService);
  });

  describe("findAll", () => {
    it("devuelve las categorías ordenadas por nombre", async () => {
      prismaMock.categoriaProducto.findMany.mockResolvedValue([categoria]);

      const resultado = await service.findAll();

      expect(resultado).toEqual([categoria]);
      expect(prismaMock.categoriaProducto.findMany).toHaveBeenCalledWith({
        orderBy: { nombre: "asc" },
      });
    });
  });

  describe("findOne", () => {
    it("lanza NotFoundException si no existe", async () => {
      prismaMock.categoriaProducto.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });

    it("devuelve la categoría si existe", async () => {
      prismaMock.categoriaProducto.findUnique.mockResolvedValue(categoria);

      await expect(service.findOne(1)).resolves.toEqual(categoria);
    });
  });

  describe("create", () => {
    it("crea la categoría con nombre y descripción", async () => {
      prismaMock.categoriaProducto.create.mockResolvedValue(categoria);

      const resultado = await service.create({
        nombre: "Cuidado capilar",
        descripcion: "Shampoos",
      });

      expect(resultado).toEqual(categoria);
      expect(prismaMock.categoriaProducto.create).toHaveBeenCalledWith({
        data: { nombre: "Cuidado capilar", descripcion: "Shampoos" },
      });
    });

    it("lanza ConflictException si el nombre ya existe (P2002)", async () => {
      prismaMock.categoriaProducto.create.mockRejectedValue(
        crearErrorPrisma("P2002"),
      );

      await expect(
        service.create({ nombre: "Cuidado capilar" }),
      ).rejects.toThrow(ConflictException);
    });

    it("relanza cualquier otro error sin transformarlo", async () => {
      const errorInesperado = new Error("falló la conexión");
      prismaMock.categoriaProducto.create.mockRejectedValue(errorInesperado);

      await expect(service.create({ nombre: "Cuidado capilar" })).rejects.toBe(
        errorInesperado,
      );
    });
  });

  describe("update", () => {
    it("lanza NotFoundException y no actualiza si no existe", async () => {
      prismaMock.categoriaProducto.findUnique.mockResolvedValue(null);

      await expect(service.update(999, { nombre: "Nuevo" })).rejects.toThrow(
        NotFoundException,
      );
      expect(prismaMock.categoriaProducto.update).not.toHaveBeenCalled();
    });

    it("actualiza solo los campos recibidos", async () => {
      prismaMock.categoriaProducto.findUnique.mockResolvedValue(categoria);
      prismaMock.categoriaProducto.update.mockResolvedValue({
        ...categoria,
        descripcion: "Cambiada",
      });

      await service.update(1, { descripcion: "Cambiada" });

      expect(prismaMock.categoriaProducto.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { descripcion: "Cambiada" },
      });
    });

    it("lanza ConflictException si el nuevo nombre ya existe (P2002)", async () => {
      prismaMock.categoriaProducto.findUnique.mockResolvedValue(categoria);
      prismaMock.categoriaProducto.update.mockRejectedValue(
        crearErrorPrisma("P2002"),
      );

      await expect(service.update(1, { nombre: "Repetido" })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe("remove", () => {
    it("lanza NotFoundException y no borra si no existe", async () => {
      prismaMock.categoriaProducto.findUnique.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
      expect(prismaMock.categoriaProducto.delete).not.toHaveBeenCalled();
    });

    it("elimina la categoría y devuelve un mensaje", async () => {
      prismaMock.categoriaProducto.findUnique.mockResolvedValue(categoria);
      prismaMock.categoriaProducto.delete.mockResolvedValue(categoria);

      const resultado = await service.remove(1);

      expect(resultado.mensaje).toContain("1");
      expect(prismaMock.categoriaProducto.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it("lanza ConflictException si tiene productos asociados (P2003)", async () => {
      prismaMock.categoriaProducto.findUnique.mockResolvedValue(categoria);
      prismaMock.categoriaProducto.delete.mockRejectedValue(
        crearErrorPrisma("P2003"),
      );

      await expect(service.remove(1)).rejects.toThrow(ConflictException);
    });
  });
});
