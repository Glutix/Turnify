import { type ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { type JwtService } from "@nestjs/jwt";
import { RolUsuario } from "@prisma/client";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { type PrismaService } from "../../../prisma/prisma.service";
import { type RequestAutenticada } from "../types/usuario-autenticado";

const jwtMock = { verifyAsync: jest.fn() };
const prismaMock = { usuario: { findUnique: jest.fn() } };

function contextoCon(request: RequestAutenticada): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe("JwtAuthGuard", () => {
  let guard: JwtAuthGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new JwtAuthGuard(
      jwtMock as unknown as JwtService,
      prismaMock as unknown as PrismaService,
    );
  });

  it("rechaza si no hay header Authorization", async () => {
    await expect(guard.canActivate(contextoCon({ headers: {} }))).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it("rechaza si el esquema no es Bearer", async () => {
    const request = { headers: { authorization: "Basic abc" } };
    await expect(guard.canActivate(contextoCon(request))).rejects.toThrow(UnauthorizedException);
    expect(jwtMock.verifyAsync).not.toHaveBeenCalled();
  });

  it("rechaza un token inválido o expirado", async () => {
    jwtMock.verifyAsync.mockRejectedValue(new Error("jwt expired"));
    const request = { headers: { authorization: "Bearer malo" } };
    await expect(guard.canActivate(contextoCon(request))).rejects.toThrow(UnauthorizedException);
  });

  it("rechaza si el usuario del token ya no existe", async () => {
    jwtMock.verifyAsync.mockResolvedValue({ sub: 9, rol: "admin" });
    prismaMock.usuario.findUnique.mockResolvedValue(null);
    const request = { headers: { authorization: "Bearer ok" } };
    await expect(guard.canActivate(contextoCon(request))).rejects.toThrow(UnauthorizedException);
  });

  it("deja el usuario en request.user con el rol actual de la base (no el del token)", async () => {
    jwtMock.verifyAsync.mockResolvedValue({ sub: 3, rol: "admin" });
    prismaMock.usuario.findUnique.mockResolvedValue({ id: 3, rol: RolUsuario.cliente });
    const request: RequestAutenticada = { headers: { authorization: "Bearer ok" } };

    await expect(guard.canActivate(contextoCon(request))).resolves.toBe(true);
    expect(request.user).toEqual({ id: 3, rol: RolUsuario.cliente });
  });
});
