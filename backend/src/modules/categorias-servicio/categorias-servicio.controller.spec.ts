import { Test, type TestingModule } from "@nestjs/testing";
import { CategoriasServicioController } from "./categorias-servicio.controller";
import { CategoriasServicioService } from "./categorias-servicio.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

const serviceMock = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe("CategoriasServicioController", () => {
  let controller: CategoriasServicioController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriasServicioController],
      providers: [{ provide: CategoriasServicioService, useValue: serviceMock }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(CategoriasServicioController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  it("findAll delega al service", async () => {
    serviceMock.findAll.mockResolvedValue([{ id: 1 }]);
    await expect(controller.findAll()).resolves.toEqual([{ id: 1 }]);
  });
});
