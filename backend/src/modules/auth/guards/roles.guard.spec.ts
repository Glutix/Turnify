import { type ExecutionContext, ForbiddenException } from "@nestjs/common";
import { type Reflector } from "@nestjs/core";
import { RolUsuario } from "@prisma/client";
import { RolesGuard } from "./roles.guard";
import { type RequestAutenticada } from "../types/usuario-autenticado";

const reflectorMock = { getAllAndOverride: jest.fn() };

function contextoCon(request: RequestAutenticada): ExecutionContext {
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe("RolesGuard", () => {
  let guard: RolesGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new RolesGuard(reflectorMock as unknown as Reflector);
  });

  it("deja pasar si la ruta no declara roles", () => {
    reflectorMock.getAllAndOverride.mockReturnValue(undefined);
    expect(guard.canActivate(contextoCon({ headers: {} }))).toBe(true);
  });

  it("deja pasar a un admin en una ruta de admin", () => {
    reflectorMock.getAllAndOverride.mockReturnValue([RolUsuario.admin]);
    const request = { headers: {}, user: { id: 1, rol: RolUsuario.admin } };
    expect(guard.canActivate(contextoCon(request))).toBe(true);
  });

  it("responde 403 a un cliente en una ruta de admin", () => {
    reflectorMock.getAllAndOverride.mockReturnValue([RolUsuario.admin]);
    const request = { headers: {}, user: { id: 2, rol: RolUsuario.cliente } };
    expect(() => guard.canActivate(contextoCon(request))).toThrow(ForbiddenException);
  });

  it("responde 403 si no hay usuario en la request", () => {
    reflectorMock.getAllAndOverride.mockReturnValue([RolUsuario.admin]);
    expect(() => guard.canActivate(contextoCon({ headers: {} }))).toThrow(ForbiddenException);
  });
});
