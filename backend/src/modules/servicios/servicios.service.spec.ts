import { NotFoundException } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import { ServiciosService } from "./servicios.service";
import { PrismaService } from "../../prisma/prisma.service";
import { CategoriasServicioService } from "../categorias-servicio/categorias-servicio.service";

const prismaMock = {
  servicio: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};
const categoriasMock = { findOne: jest.fn() };

describe("ServiciosService", () => {
  let service: ServiciosService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiciosService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: CategoriasServicioService, useValue: categoriasMock },
      ],
    }).compile();
    service = module.get(ServiciosService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("findOne inexistente → 404", async () => {
    prismaMock.servicio.findUnique.mockResolvedValue(null);
    await expect(service.findOne(9)).rejects.toThrow(NotFoundException);
  });

  it("create valida la categoría y fuerza activo=true aunque el body diga otra cosa", async () => {
    categoriasMock.findOne.mockResolvedValue({ id: 1 });
    prismaMock.servicio.create.mockResolvedValue({ id: 5 });

    await service.create({
      categoria_id: 1,
      nombre: "Corte",
      duracion_minutos: 30,
      precio: 5000,
      activo: false,
    } as never);

    expect(categoriasMock.findOne).toHaveBeenCalledWith(1);
    expect(prismaMock.servicio.create.mock.calls[0][0].data.activo).toBe(true);
  });

  it("create con categoría inexistente propaga el 404 y no crea", async () => {
    categoriasMock.findOne.mockRejectedValue(new NotFoundException());
    await expect(
      service.create({ categoria_id: 99, nombre: "X", duracion_minutos: 10, precio: 1 } as never),
    ).rejects.toThrow(NotFoundException);
    expect(prismaMock.servicio.create).not.toHaveBeenCalled();
  });

  it("update verifica que exista y, si cambia de categoría, que esa exista", async () => {
    prismaMock.servicio.findUnique.mockResolvedValue({ id: 1, activo: true });
    categoriasMock.findOne.mockResolvedValue({ id: 2 });
    prismaMock.servicio.update.mockResolvedValue({ id: 1 });

    await service.update(1, { categoria_id: 2 });
    expect(categoriasMock.findOne).toHaveBeenCalledWith(2);
  });

  it("toggleEstado invierte activo", async () => {
    prismaMock.servicio.findUnique.mockResolvedValue({ id: 1, activo: true });
    prismaMock.servicio.update.mockResolvedValue({ id: 1, activo: false });

    await service.toggleEstado(1);
    expect(prismaMock.servicio.update.mock.calls[0][0].data).toEqual({ activo: false });
  });
});
