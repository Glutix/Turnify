import { Test, type TestingModule } from "@nestjs/testing";
import { ThrottlerGuard } from "@nestjs/throttler";
import { RolUsuario } from "@prisma/client";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";

const serviceMock = {
  solicitarCodigo: jest.fn(),
  validarCodigo: jest.fn(),
  registrarUsuario: jest.fn(),
  loginConPassword: jest.fn(),
  establecerPassword: jest.fn(),
};

describe("AuthController", () => {
  let controller: AuthController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: serviceMock }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(AuthController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  it("login delega teléfono y contraseña", async () => {
    serviceMock.loginConPassword.mockResolvedValue({ token: "t" });
    await expect(controller.login({ telefono: "3644401020", password: "x" })).resolves.toEqual({ token: "t" });
    expect(serviceMock.loginConPassword).toHaveBeenCalledWith("3644401020", "x");
  });

  it("establecerPassword usa el id del usuario autenticado", async () => {
    const dto = { passwordNueva: "ClaveNueva123" };
    await controller.establecerPassword(dto, { id: 7, rol: RolUsuario.admin });
    expect(serviceMock.establecerPassword).toHaveBeenCalledWith(7, dto);
  });
});
