import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import { Prisma, RolUsuario } from "@prisma/client";
import { UsuariosService } from "./usuarios.service";
import { PrismaService } from "../../prisma/prisma.service";

const prismaMock = {
  usuario: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

const admin = { id: 1, rol: RolUsuario.admin };
const cliente = { id: 2, rol: RolUsuario.cliente };

function usuarioBase(extra: Record<string, unknown> = {}) {
  return {
    id: 2,
    nombre: "Ana",
    apellido: null,
    telefono: "+5493644111111",
    email: null,
    direccion: null,
    rol: RolUsuario.cliente,
    perfil_completo: false,
    fecha_alta: new Date(),
    ...extra,
  };
}

function errorPrisma(code: string) {
  return new Prisma.PrismaClientKnownRequestError("error", { code, clientVersion: "test" });
}

describe("UsuariosService", () => {
  let service: UsuariosService;

  beforeEach(async () => {
    jest.clearAllMocks();
    prismaMock.usuario.findFirst.mockResolvedValue(null);

    const module: TestingModule = await Test.createTestingModule({
      providers: [UsuariosService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    service = module.get(UsuariosService);
  });

  describe("findOne", () => {
    it("lanza NotFound si no existe", async () => {
      prismaMock.usuario.findUnique.mockResolvedValue(null);
      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe("findAll", () => {
    it("filtra por rol y busca por nombre/apellido/email/teléfono", async () => {
      prismaMock.usuario.findMany.mockResolvedValue([]);
      await service.findAll({ busqueda: "ana 364", rol: RolUsuario.cliente });

      const { where } = prismaMock.usuario.findMany.mock.calls[0][0];
      expect(where.rol).toBe(RolUsuario.cliente);
      expect(where.OR).toHaveLength(4);
    });

    it("sin dígitos en la búsqueda no filtra por teléfono", async () => {
      prismaMock.usuario.findMany.mockResolvedValue([]);
      await service.findAll({ busqueda: "ana" });
      expect(prismaMock.usuario.findMany.mock.calls[0][0].where.OR).toHaveLength(3);
    });
  });

  describe("create", () => {
    it("normaliza el teléfono, pasa el email a minúsculas y fuerza rol cliente por defecto", async () => {
      prismaMock.usuario.create.mockResolvedValue(usuarioBase());
      await service.create({ nombre: " Ana ", telefono: "3644-401020", email: "ANA@Mail.com" });

      const { data } = prismaMock.usuario.create.mock.calls[0][0];
      expect(data.telefono).toBe("+5493644401020");
      expect(data.email).toBe("ana@mail.com");
      expect(data.nombre).toBe("Ana");
      expect(data.rol).toBe(RolUsuario.cliente);
      expect(data.perfil_completo).toBe(false);
    });

    it("marca el perfil completo si hay apellido, email y dirección", async () => {
      prismaMock.usuario.create.mockResolvedValue(usuarioBase());
      await service.create({
        nombre: "Ana",
        apellido: "Pérez",
        email: "ana@mail.com",
        direccion: "Calle 1",
      });
      expect(prismaMock.usuario.create.mock.calls[0][0].data.perfil_completo).toBe(true);
    });

    it("un admin sin teléfono es BadRequest", async () => {
      await expect(service.create({ nombre: "Admin", rol: RolUsuario.admin })).rejects.toThrow(
        BadRequestException,
      );
      expect(prismaMock.usuario.create).not.toHaveBeenCalled();
    });

    it("teléfono repetido → 409 con mensaje específico", async () => {
      prismaMock.usuario.findFirst.mockResolvedValueOnce({ id: 7 });
      await expect(service.create({ nombre: "Ana", telefono: "3644401020" })).rejects.toThrow(
        "Ya existe un usuario con ese teléfono",
      );
    });

    it("email repetido → 409 con mensaje específico", async () => {
      prismaMock.usuario.findFirst.mockResolvedValueOnce({ id: 7 });
      await expect(service.create({ nombre: "Ana", email: "ana@mail.com" })).rejects.toThrow(
        "Ya existe un usuario con ese email",
      );
    });

    it("P2002 de la base (carrera) → 409", async () => {
      prismaMock.usuario.create.mockRejectedValue(errorPrisma("P2002"));
      await expect(service.create({ nombre: "Ana" })).rejects.toThrow(ConflictException);
    });

    it("otros errores de Prisma se propagan sin traducir", async () => {
      const error = errorPrisma("P2025");
      prismaMock.usuario.create.mockRejectedValue(error);
      await expect(service.create({ nombre: "Ana" })).rejects.toBe(error);
    });
  });

  describe("update", () => {
    beforeEach(() => {
      prismaMock.usuario.findUnique.mockResolvedValue(usuarioBase());
      prismaMock.usuario.update.mockResolvedValue(usuarioBase());
    });

    it("un cliente no puede editar a otro", async () => {
      await expect(service.update(5, { nombre: "X" }, cliente)).rejects.toThrow(ForbiddenException);
    });

    it("un cliente puede editar sus propios datos y se recalcula perfil_completo", async () => {
      await service.update(
        2,
        { apellido: "Pérez", email: "ana@mail.com", direccion: "Calle 1" },
        cliente,
      );
      const { data } = prismaMock.usuario.update.mock.calls[0][0];
      expect(data.perfil_completo).toBe(true);
    });

    it("perfil_completo considera los datos ya guardados", async () => {
      prismaMock.usuario.findUnique.mockResolvedValue(
        usuarioBase({ apellido: "Pérez", email: "ana@mail.com" }),
      );
      await service.update(2, { direccion: "Calle 1" }, cliente);
      expect(prismaMock.usuario.update.mock.calls[0][0].data.perfil_completo).toBe(true);
    });

    it("un cliente no puede cambiar su teléfono", async () => {
      await expect(service.update(2, { telefono: "3644999999" }, cliente)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it("un cliente puede reenviar su mismo teléfono sin error", async () => {
      await expect(
        service.update(2, { telefono: "+5493644111111" }, cliente),
      ).resolves.toBeDefined();
    });

    it("un admin sí puede cambiar el teléfono, normalizado", async () => {
      await service.update(2, { telefono: "3644999999" }, admin);
      expect(prismaMock.usuario.update.mock.calls[0][0].data.telefono).toBe("+5493644999999");
    });

    it("email que ya usa otro usuario → 409", async () => {
      prismaMock.usuario.findFirst.mockResolvedValueOnce({ id: 8 });
      await expect(service.update(2, { email: "otro@mail.com" }, cliente)).rejects.toThrow(
        "Ya existe un usuario con ese email",
      );
    });

    it("no chequea duplicado si el email no cambió", async () => {
      prismaMock.usuario.findUnique.mockResolvedValue(usuarioBase({ email: "ana@mail.com" }));
      await service.update(2, { email: "ANA@mail.com" }, cliente);
      expect(prismaMock.usuario.findFirst).not.toHaveBeenCalled();
    });
  });

  describe("cambiarRol", () => {
    it("no permite cambiarse el rol a uno mismo", async () => {
      prismaMock.usuario.findUnique.mockResolvedValue(usuarioBase({ id: 1, rol: RolUsuario.admin }));
      await expect(service.cambiarRol(1, RolUsuario.cliente, admin)).rejects.toThrow(
        "No podés cambiar tu propio rol",
      );
    });

    it("no hace nada si el rol ya es ese", async () => {
      prismaMock.usuario.findUnique.mockResolvedValue(usuarioBase());
      await service.cambiarRol(2, RolUsuario.cliente, admin);
      expect(prismaMock.usuario.update).not.toHaveBeenCalled();
    });

    it("no se puede hacer admin a alguien sin teléfono", async () => {
      prismaMock.usuario.findUnique.mockResolvedValue(usuarioBase({ telefono: null }));
      await expect(service.cambiarRol(2, RolUsuario.admin, admin)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("promueve a admin", async () => {
      prismaMock.usuario.findUnique.mockResolvedValue(usuarioBase());
      prismaMock.usuario.update.mockResolvedValue(usuarioBase({ rol: RolUsuario.admin }));
      await service.cambiarRol(2, RolUsuario.admin, admin);
      expect(prismaMock.usuario.update.mock.calls[0][0].data).toEqual({ rol: RolUsuario.admin });
    });
  });

  describe("remove", () => {
    it("no permite eliminarse a uno mismo", async () => {
      prismaMock.usuario.findUnique.mockResolvedValue(usuarioBase({ id: 1 }));
      await expect(service.remove(1, admin)).rejects.toThrow("No podés eliminar tu propio usuario");
      expect(prismaMock.usuario.delete).not.toHaveBeenCalled();
    });

    it("P2003 (turnos/pedidos asociados) → 409 claro", async () => {
      prismaMock.usuario.findUnique.mockResolvedValue(usuarioBase());
      prismaMock.usuario.delete.mockRejectedValue(errorPrisma("P2003"));
      await expect(service.remove(2, admin)).rejects.toThrow(
        "No se puede eliminar: el usuario tiene turnos o pedidos asociados",
      );
    });

    it("elimina y devuelve mensaje", async () => {
      prismaMock.usuario.findUnique.mockResolvedValue(usuarioBase());
      prismaMock.usuario.delete.mockResolvedValue({});
      await expect(service.remove(2, admin)).resolves.toEqual({
        mensaje: "Usuario 2 eliminado correctamente",
      });
    });
  });
});
