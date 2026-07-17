import { Test, type TestingModule } from "@nestjs/testing";
import { CategoriasServicioService } from "./categorias-servicio.service";

describe("CategoriasServicioService", () => {
  let service: CategoriasServicioService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CategoriasServicioService],
    }).compile();

    service = module.get<CategoriasServicioService>(CategoriasServicioService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
