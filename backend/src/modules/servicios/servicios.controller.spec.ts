import { Test, type TestingModule } from "@nestjs/testing";
import { ServiciosController } from "./servicios.controller";
import { ServiciosService } from "./servicios.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

const serviceMock = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  toggleEstado: jest.fn(),
};

describe("ServiciosController", () => {
  let controller: ServiciosController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServiciosController],
      providers: [{ provide: ServiciosService, useValue: serviceMock }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(ServiciosController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
