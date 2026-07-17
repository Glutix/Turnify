import { Test, type TestingModule } from "@nestjs/testing";
import { CategoriasServicioController } from "./categorias-servicio.controller";

describe("CategoriasServicioController", () => {
  let controller: CategoriasServicioController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriasServicioController],
    }).compile();

    controller = module.get<CategoriasServicioController>(
      CategoriasServicioController,
    );
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
