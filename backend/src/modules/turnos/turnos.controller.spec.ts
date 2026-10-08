import { Test, type TestingModule } from "@nestjs/testing";
import { TurnosController } from "./turnos.controller";
import { TurnosService } from "./turnos.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

describe("TurnosController", () => {
  let controller: TurnosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TurnosController],
      providers: [{ provide: TurnosService, useValue: {} }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(TurnosController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
