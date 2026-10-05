import { Test, type TestingModule } from "@nestjs/testing";
import { RolUsuario } from "@prisma/client";
import { UsuariosController } from "./usuarios.controller";
import { UsuariosService } from "./usuarios.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

// El controller solo delega: la lógica está en usuarios.service.spec.ts y las
// reglas de acceso en auth/guards/*.spec.ts.
const serviceMock = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  miPerfil: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  cambiarRol: jest.fn(),
  remove: jest.fn(),
};

const admin = { id: 1, rol: RolUsuario.admin };

describe("UsuariosController", () => {
  let controller: UsuariosController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsuariosController],
      providers: [{ provide: UsuariosService, useValue: serviceMock }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(UsuariosController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  it("findAll delega los filtros", async () => {
    serviceMock.findAll.mockResolvedValue([{ id: 1 }]);
    const filtros = { busqueda: "ana", rol: RolUsuario.cliente };
    await expect(controller.findAll(filtros)).resolves.toEqual([{ id: 1 }]);
    expect(serviceMock.findAll).toHaveBeenCalledWith(filtros);
  });

  it("update delega id, dto y usuario actual", async () => {
    serviceMock.update.mockResolvedValue({ id: 5 });
    await controller.update(5, { nombre: "Ana" }, admin);
    expect(serviceMock.update).toHaveBeenCalledWith(5, { nombre: "Ana" }, admin);
  });

  it("obtenerMiPerfil lee SIEMPRE al usuario autenticado, no un id del request", async () => {
    serviceMock.miPerfil.mockResolvedValue({ id: 2 });
    await expect(controller.obtenerMiPerfil({ id: 2, rol: RolUsuario.cliente })).resolves.toEqual({ id: 2 });
    expect(serviceMock.miPerfil).toHaveBeenCalledWith(2);
  });

  it("actualizarMiPerfil edita al usuario autenticado", async () => {
    const cliente = { id: 2, rol: RolUsuario.cliente };
    serviceMock.update.mockResolvedValue({ id: 2 });
    await controller.actualizarMiPerfil({ email: "a@b.com" }, cliente);
    expect(serviceMock.update).toHaveBeenCalledWith(2, { email: "a@b.com" }, cliente);
  });

  it("cambiarRol delega solo el rol del dto", async () => {
    await controller.cambiarRol(5, { rol: RolUsuario.admin }, admin);
    expect(serviceMock.cambiarRol).toHaveBeenCalledWith(5, RolUsuario.admin, admin);
  });

  it("remove delega id y usuario actual", async () => {
    await controller.remove(5, admin);
    expect(serviceMock.remove).toHaveBeenCalledWith(5, admin);
  });
});
