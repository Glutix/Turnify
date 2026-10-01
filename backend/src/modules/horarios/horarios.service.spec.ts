import { Test, type TestingModule } from "@nestjs/testing";
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { HorariosService } from "./horarios.service";
import { PrismaService } from "../../prisma/prisma.service";
import { type CrearFranjaHorariaDto } from "./dto/crear-franja-horaria.dto";
import { type ActualizarFranjaHorariaDto } from "./dto/actualizar-franja-horaria.dto";
import { type CrearExcepcionHorarioDto } from "./dto/crear-excepcion-horario.dto";

// Mock mínimo de PrismaService: solo los métodos que HorariosService usa.
// jest-mock-extended no está instalado en el proyecto, así que lo armamos
// a mano con jest.fn() por cada método.
const prismaMock = {
  franjaHoraria: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  excepcionHorario: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  $queryRaw: jest.fn(),
};

// Helper para construir un error de Prisma con el código que queramos,
// tal como lo lanzaría el cliente real ante una constraint violada.
function crearErrorPrisma(code: string) {
  return new Prisma.PrismaClientKnownRequestError("mock error", {
    code,
    clientVersion: "7.8.0",
  });
}

describe("HorariosService", () => {
  let service: HorariosService;

  beforeEach(async () => {
    jest.clearAllMocks();
    // Por defecto, sin turnos en conflicto (así los tests que no prueban
    // conflicto no tienen que preocuparse por esto explícitamente).
    prismaMock.$queryRaw.mockResolvedValue([]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HorariosService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<HorariosService>(HorariosService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  // ============================================================
  // FRANJAS HORARIAS
  // ============================================================

  describe("findOneFranja", () => {
    it("lanza NotFoundException si no existe", async () => {
      prismaMock.franjaHoraria.findUnique.mockResolvedValue(null);

      await expect(service.findOneFranja(999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("devuelve la franja si existe", async () => {
      const franja = { id: 1, dia_semana: "lunes" };
      prismaMock.franjaHoraria.findUnique.mockResolvedValue(franja);

      await expect(service.findOneFranja(1)).resolves.toEqual(franja);
    });
  });

  describe("createFranja", () => {
    it("rechaza si hora_inicio >= hora_fin", async () => {
      await expect(
        service.createFranja({
          dia_semana: "lunes",
          hora_inicio: "14:00",
          hora_fin: "10:00",
        } as CrearFranjaHorariaDto),
      ).rejects.toThrow(BadRequestException);

      expect(prismaMock.franjaHoraria.create).not.toHaveBeenCalled();
    });

    it("fuerza activo=true y nunca confía en el body para ese campo", async () => {
      prismaMock.franjaHoraria.create.mockResolvedValue({ id: 1 });

      await service.createFranja({
        dia_semana: "lunes",
        hora_inicio: "09:00",
        hora_fin: "13:00",
      } as CrearFranjaHorariaDto);

      expect(prismaMock.franjaHoraria.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ activo: true }),
        }),
      );
    });

    it("mapea P2002 a ConflictException (franja duplicada)", async () => {
      prismaMock.franjaHoraria.create.mockRejectedValue(crearErrorPrisma("P2002"));

      await expect(
        service.createFranja({
          dia_semana: "lunes",
          hora_inicio: "09:00",
          hora_fin: "13:00",
        } as CrearFranjaHorariaDto),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe("updateFranja — RF41 (bloquear si hay turnos en conflicto)", () => {
    const franjaExistente = {
      id: 1,
      dia_semana: "lunes",
      hora_inicio: new Date("1970-01-01T09:00:00.000Z"),
      hora_fin: new Date("1970-01-01T13:00:00.000Z"),
      activo: true,
    };

    it("permite el cambio si no hay turnos en conflicto", async () => {
      prismaMock.franjaHoraria.findUnique.mockResolvedValue(franjaExistente);
      prismaMock.$queryRaw.mockResolvedValue([]); // sin conflictos
      prismaMock.franjaHoraria.update.mockResolvedValue({ id: 1 });

      await expect(
        service.updateFranja(1, { hora_fin: "14:00" } as ActualizarFranjaHorariaDto),
      ).resolves.toBeDefined();
    });

    it("bloquea el cambio con ConflictException si hay turnos reservados", async () => {
      prismaMock.franjaHoraria.findUnique.mockResolvedValue(franjaExistente);
      prismaMock.$queryRaw.mockResolvedValue([{ id: 42 }]); // hay conflicto

      await expect(
        service.updateFranja(1, { hora_fin: "14:00" } as ActualizarFranjaHorariaDto),
      ).rejects.toThrow(ConflictException);

      expect(prismaMock.franjaHoraria.update).not.toHaveBeenCalled();
    });

    it("NO valida conflicto si no cambia día ni horario", async () => {
      prismaMock.franjaHoraria.findUnique.mockResolvedValue(franjaExistente);
      prismaMock.franjaHoraria.update.mockResolvedValue({ id: 1 });

      await service.updateFranja(1, {} as ActualizarFranjaHorariaDto);

      expect(prismaMock.$queryRaw).not.toHaveBeenCalled();
    });

    it("si la tabla Turno todavía no existe (turnos sin migrar), deja pasar en vez de romper", async () => {
      prismaMock.franjaHoraria.findUnique.mockResolvedValue(franjaExistente);
      prismaMock.franjaHoraria.update.mockResolvedValue({ id: 1 });
      prismaMock.$queryRaw.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError(
          "Raw query failed. Code: `42P01`.",
          {
            code: "P2010",
            clientVersion: "7.8.0",
            meta: {
              driverAdapterError: { cause: { kind: "TableDoesNotExist" } },
            },
          },
        ),
      );

      await expect(
        service.updateFranja(1, { hora_fin: "14:00" } as ActualizarFranjaHorariaDto),
      ).resolves.toBeDefined();
    });
  });

  describe("toggleEstadoFranja", () => {
    it("al desactivar, valida que no haya turnos en conflicto", async () => {
      prismaMock.franjaHoraria.findUnique.mockResolvedValue({
        id: 1,
        dia_semana: "lunes",
        hora_inicio: new Date("1970-01-01T09:00:00.000Z"),
        hora_fin: new Date("1970-01-01T13:00:00.000Z"),
        activo: true, // se va a desactivar
      });
      prismaMock.$queryRaw.mockResolvedValue([{ id: 42 }]);

      await expect(service.toggleEstadoFranja(1)).rejects.toThrow(
        ConflictException,
      );
    });

    it("al activar, nunca valida conflicto (activar siempre es seguro)", async () => {
      prismaMock.franjaHoraria.findUnique.mockResolvedValue({
        id: 1,
        dia_semana: "lunes",
        hora_inicio: new Date("1970-01-01T09:00:00.000Z"),
        hora_fin: new Date("1970-01-01T13:00:00.000Z"),
        activo: false, // se va a activar
      });
      prismaMock.franjaHoraria.update.mockResolvedValue({ id: 1, activo: true });

      await service.toggleEstadoFranja(1);

      expect(prismaMock.$queryRaw).not.toHaveBeenCalled();
      expect(prismaMock.franjaHoraria.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { activo: true } }),
      );
    });
  });

  describe("obtenerFranjasActivasPorDia / obtenerFranjasActivasPorFecha", () => {
    // Estos son los métodos que el módulo de turnos va a consumir para
    // calcular disponibilidad (RF04/RF06/CU-06) — se testean aparte porque
    // otro módulo va a depender de que su contrato no cambie.

    it("obtenerFranjasActivasPorDia solo trae activas de ese día", async () => {
      prismaMock.franjaHoraria.findMany.mockResolvedValue([{ id: 1 }]);

      const resultado = await service.obtenerFranjasActivasPorDia("martes");

      expect(prismaMock.franjaHoraria.findMany).toHaveBeenCalledWith({
        where: { dia_semana: "martes", activo: true },
        orderBy: { hora_inicio: "asc" },
      });
      expect(resultado).toEqual([{ id: 1 }]);
    });

    it("obtenerFranjasActivasPorFecha resuelve el día de la semana correcto", async () => {
      prismaMock.franjaHoraria.findMany.mockResolvedValue([]);

      // 2026-10-05 es lunes (UTC)
      await service.obtenerFranjasActivasPorFecha(new Date("2026-10-05T00:00:00.000Z"));

      expect(prismaMock.franjaHoraria.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { dia_semana: "lunes", activo: true } }),
      );
    });
  });

  // ============================================================
  // EXCEPCIONES DE HORARIO
  // ============================================================

  describe("createExcepcion — validaciones", () => {
    it("rechaza si fecha_desde es posterior a fecha_hasta", async () => {
      await expect(
        service.createExcepcion({
          fecha_desde: "2026-12-30",
          fecha_hasta: "2026-12-25",
          tipo: "bloqueo_total",
        } as CrearExcepcionHorarioDto),
      ).rejects.toThrow(BadRequestException);
    });

    it("rechaza horario_especial sin hora_inicio/hora_fin", async () => {
      await expect(
        service.createExcepcion({
          fecha_desde: "2026-12-25",
          fecha_hasta: "2026-12-25",
          tipo: "horario_especial",
        } as CrearExcepcionHorarioDto),
      ).rejects.toThrow(BadRequestException);
    });

    it("crea un bloqueo_total válido sin horas", async () => {
      prismaMock.excepcionHorario.create.mockResolvedValue({ id: 1 });

      await service.createExcepcion({
        fecha_desde: "2026-12-25",
        fecha_hasta: "2026-12-25",
        tipo: "bloqueo_total",
      } as CrearExcepcionHorarioDto);

      expect(prismaMock.excepcionHorario.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ hora_inicio: null, hora_fin: null }),
        }),
      );
    });
  });

  describe("createExcepcion — CU-21 (conflicto con turnos)", () => {
    it("bloquea con ConflictException si hay turnos reservados en el rango", async () => {
      prismaMock.$queryRaw.mockResolvedValue([{ id: 7 }]);

      await expect(
        service.createExcepcion({
          fecha_desde: "2026-12-25",
          fecha_hasta: "2026-12-25",
          tipo: "bloqueo_total",
        } as CrearExcepcionHorarioDto),
      ).rejects.toThrow(ConflictException);

      expect(prismaMock.excepcionHorario.create).not.toHaveBeenCalled();
    });
  });

  describe("removeExcepcion", () => {
    it("lanza NotFoundException si no existe", async () => {
      prismaMock.excepcionHorario.findUnique.mockResolvedValue(null);

      await expect(service.removeExcepcion(999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("elimina si no hay turnos en conflicto", async () => {
      prismaMock.excepcionHorario.findUnique.mockResolvedValue({
        id: 1,
        fecha_desde: new Date("2026-12-25"),
        fecha_hasta: new Date("2026-12-25"),
        tipo: "bloqueo_total",
        hora_inicio: null,
        hora_fin: null,
      });
      prismaMock.$queryRaw.mockResolvedValue([]);
      prismaMock.excepcionHorario.delete.mockResolvedValue({});

      await service.removeExcepcion(1);

      expect(prismaMock.excepcionHorario.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });
});