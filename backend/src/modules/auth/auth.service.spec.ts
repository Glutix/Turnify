import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import { JwtService } from "@nestjs/jwt";
import { RolUsuario } from "@prisma/client";
import { AuthService } from "./auth.service";
import { PrismaService } from "../../prisma/prisma.service";
import { NotificadorOtp } from "./notificadores/notificador-otp.abstract";
import { hashearPassword } from "./utils/password";

const prismaMock = {
  usuario: { findUnique: jest.fn(), update: jest.fn(), create: jest.fn() },
  otpVerificacion: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
};
const jwtMock = { sign: jest.fn().mockReturnValue("token-firmado") };
const notificadorMock = { enviarCodigo: jest.fn() };

const TELEFONO = "3644-401020";
const PASSWORD = "ClaveSegura123";

describe("AuthService", () => {
  let service: AuthService;
  let hash: string;

  beforeAll(async () => {
    hash = await hashearPassword(PASSWORD);
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: NotificadorOtp, useValue: notificadorMock },
        { provide: JwtService, useValue: jwtMock },
      ],
    }).compile();
    service = module.get(AuthService);
  });

  function usuarioConPassword(extra: Record<string, unknown> = {}) {
    return {
      id: 1,
      nombre: "Gisela",
      apellido: "Toloza",
      telefono: "+5493644401020",
      email: null,
      direccion: null,
      rol: RolUsuario.admin,
      perfil_completo: true,
      fecha_alta: new Date(),
      password_hash: hash,
      ...extra,
    };
  }

  describe("loginConPassword", () => {
    it("con credenciales correctas devuelve token y usuario SIN password_hash", async () => {
      prismaMock.usuario.findUnique.mockResolvedValue(usuarioConPassword());
      const resultado = await service.loginConPassword(TELEFONO, PASSWORD);

      expect(resultado.token).toBe("token-firmado");
      expect(resultado.usuario).not.toHaveProperty("password_hash");
      expect(resultado.usuario.rol).toBe(RolUsuario.admin);
      expect(jwtMock.sign).toHaveBeenCalledWith({ sub: 1, rol: RolUsuario.admin });
    });

    it("normaliza el teléfono antes de buscar", async () => {
      prismaMock.usuario.findUnique.mockResolvedValue(usuarioConPassword());
      await service.loginConPassword(TELEFONO, PASSWORD);
      expect(prismaMock.usuario.findUnique.mock.calls[0][0].where).toEqual({ telefono: "+5493644401020" });
    });

    it("contraseña incorrecta → 401 con intentos restantes", async () => {
      prismaMock.usuario.findUnique.mockResolvedValue(usuarioConPassword());
      await expect(service.loginConPassword(TELEFONO, "otra")).rejects.toMatchObject({
        response: { message: "Teléfono o contraseña incorrectos", intentosRestantes: 4 },
      });
    });

    it("teléfono inexistente → mismo 401 (no revela qué cuentas existen)", async () => {
      prismaMock.usuario.findUnique.mockResolvedValue(null);
      await expect(service.loginConPassword(TELEFONO, PASSWORD)).rejects.toThrow(UnauthorizedException);
      await expect(service.loginConPassword(TELEFONO, PASSWORD)).rejects.toMatchObject({
        response: { message: "Teléfono o contraseña incorrectos" },
      });
    });

    it("usuario sin contraseña cargada → 401", async () => {
      prismaMock.usuario.findUnique.mockResolvedValue(usuarioConPassword({ password_hash: null }));
      await expect(service.loginConPassword(TELEFONO, PASSWORD)).rejects.toThrow(UnauthorizedException);
    });

    it("cliente con perfil incompleto no puede entrar con contraseña (RF18)", async () => {
      prismaMock.usuario.findUnique.mockResolvedValue(
        usuarioConPassword({ rol: RolUsuario.cliente, perfil_completo: false }),
      );
      await expect(service.loginConPassword(TELEFONO, PASSWORD)).rejects.toThrow(UnauthorizedException);
    });

    it("cliente con perfil completo sí puede (RF20)", async () => {
      prismaMock.usuario.findUnique.mockResolvedValue(usuarioConPassword({ rol: RolUsuario.cliente }));
      await expect(service.loginConPassword(TELEFONO, PASSWORD)).resolves.toMatchObject({
        token: "token-firmado",
      });
    });

    it("5 fallos seguidos bloquean con 429, incluso con la contraseña correcta (CU-19)", async () => {
      prismaMock.usuario.findUnique.mockResolvedValue(usuarioConPassword());
      for (let i = 0; i < 4; i++) {
        await expect(service.loginConPassword(TELEFONO, "mala")).rejects.toThrow(UnauthorizedException);
      }
      await expect(service.loginConPassword(TELEFONO, "mala")).rejects.toMatchObject({ status: 429 });

      // ya bloqueada: la correcta tampoco entra
      await expect(service.loginConPassword(TELEFONO, PASSWORD)).rejects.toMatchObject({ status: 429 });
    });

    it("un login correcto reinicia el contador de fallos", async () => {
      prismaMock.usuario.findUnique.mockResolvedValue(usuarioConPassword());
      for (let i = 0; i < 3; i++) {
        await expect(service.loginConPassword(TELEFONO, "mala")).rejects.toThrow(UnauthorizedException);
      }
      await service.loginConPassword(TELEFONO, PASSWORD);
      await expect(service.loginConPassword(TELEFONO, "mala")).rejects.toMatchObject({
        response: { intentosRestantes: 4 },
      });
    });
  });

  describe("establecerPassword", () => {
    it("un cliente con perfil incompleto no puede crear contraseña", async () => {
      prismaMock.usuario.findUnique.mockResolvedValue(
        usuarioConPassword({ rol: RolUsuario.cliente, perfil_completo: false, password_hash: null }),
      );
      await expect(service.establecerPassword(1, { passwordNueva: "NuevaClave123" })).rejects.toThrow(
        ForbiddenException,
      );
    });

    it("sin contraseña previa la crea (guardando un hash, no el texto)", async () => {
      prismaMock.usuario.findUnique.mockResolvedValue(usuarioConPassword({ password_hash: null }));
      await service.establecerPassword(1, { passwordNueva: "NuevaClave123" });

      const guardado = prismaMock.usuario.update.mock.calls[0][0].data.password_hash as string;
      expect(guardado).toMatch(/^scrypt\$/);
      expect(guardado).not.toContain("NuevaClave123");
    });

    it("con contraseña previa exige la actual", async () => {
      prismaMock.usuario.findUnique.mockResolvedValue(usuarioConPassword());
      await expect(service.establecerPassword(1, { passwordNueva: "NuevaClave123" })).rejects.toThrow(
        "Ingresá tu contraseña actual",
      );
      expect(prismaMock.usuario.update).not.toHaveBeenCalled();
    });

    it("la actual incorrecta → 400 (no 401, para no desloguear al usuario)", async () => {
      prismaMock.usuario.findUnique.mockResolvedValue(usuarioConPassword());
      await expect(
        service.establecerPassword(1, { passwordActual: "mala", passwordNueva: "NuevaClave123" }),
      ).rejects.toThrow(BadRequestException);
    });

    it("con la actual correcta la reemplaza", async () => {
      prismaMock.usuario.findUnique.mockResolvedValue(usuarioConPassword());
      await expect(
        service.establecerPassword(1, { passwordActual: PASSWORD, passwordNueva: "NuevaClave123" }),
      ).resolves.toEqual({ mensaje: "Contraseña guardada correctamente" });
      expect(prismaMock.usuario.update).toHaveBeenCalled();
    });

    it("usuario inexistente → 404", async () => {
      prismaMock.usuario.findUnique.mockResolvedValue(null);
      await expect(service.establecerPassword(9, { passwordNueva: "NuevaClave123" })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("validarCodigo — máximo 3 intentos (CU-07)", () => {
    it("fallo → quedan 2 intentos; con 3 gastados responde 400 intentosRestantes 0", async () => {
      prismaMock.otpVerificacion.findFirst.mockResolvedValue({ id: 1, codigo: "123456", intentos: 0 });
      prismaMock.otpVerificacion.update.mockResolvedValue({ id: 1, intentos: 1 });
      await expect(service.validarCodigo(TELEFONO, "000000")).rejects.toMatchObject({
        response: { intentosRestantes: 2 },
      });

      prismaMock.otpVerificacion.findFirst.mockResolvedValue({ id: 1, codigo: "123456", intentos: 3 });
      await expect(service.validarCodigo(TELEFONO, "123456")).rejects.toMatchObject({
        response: { intentosRestantes: 0 },
      });
    });
  });

  describe("validarCodigo", () => {
    it("no devuelve password_hash: pide solo los campos públicos", async () => {
      prismaMock.otpVerificacion.findFirst.mockResolvedValue({ id: 1, codigo: "123456", intentos: 0 });
      prismaMock.usuario.findUnique.mockResolvedValue({ id: 1, rol: RolUsuario.cliente });

      await service.validarCodigo(TELEFONO, "123456");

      const select = prismaMock.usuario.findUnique.mock.calls[0][0].select;
      expect(select).toBeDefined();
      expect(select.password_hash).toBeUndefined();
    });
  });
});
