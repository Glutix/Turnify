import { ConflictException, NotFoundException } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import { CategoriasServicioService } from "./categorias-servicio.service";
import { PrismaService } from "../../prisma/prisma.service";

const prismaMock = {
  categoriaServicio: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe("CategoriasServicioService", () => {
  let service: CategoriasServicioService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [CategoriasServicioService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();
    service = module.get(CategoriasServicioService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("findOne inexistente → 404", async () => {
    prismaMock.categoriaServicio.findUnique.mockResolvedValue(null);
    await expect(service.findOne(9)).rejects.toThrow(NotFoundException);
  });

  it("create con nombre duplicado (P2002) → 409", async () => {
    prismaMock.categoriaServicio.create.mockRejectedValue({ code: "P2002" });
    await expect(service.create({ nombre: "Uñas" })).rejects.toThrow(ConflictException);
  });

  it("remove de una categoría con servicios (P2003) → 409", async () => {
    prismaMock.categoriaServicio.findUnique.mockResolvedValue({ id: 1 });
    prismaMock.categoriaServicio.delete.mockRejectedValue({ code: "P2003" });
    await expect(service.remove(1)).rejects.toThrow(ConflictException);
  });

  it("remove sin dependencias elimina", async () => {
    prismaMock.categoriaServicio.findUnique.mockResolvedValue({ id: 1 });
    prismaMock.categoriaServicio.delete.mockResolvedValue({ id: 1 });
    await expect(service.remove(1)).resolves.toEqual({ mensaje: "Categoría 1 eliminada correctamente" });
  });

  it("remove de una categoría inexistente → 404 sin intentar borrar", async () => {
    prismaMock.categoriaServicio.findUnique.mockResolvedValue(null);
    await expect(service.remove(9)).rejects.toThrow(NotFoundException);
    expect(prismaMock.categoriaServicio.delete).not.toHaveBeenCalled();
  });
});
