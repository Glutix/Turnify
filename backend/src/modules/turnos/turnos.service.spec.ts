import { BadRequestException, ConflictException, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import { EstadoTurno } from "@prisma/client";
import { TurnosService } from "./turnos.service";
import { PrismaService } from "../../prisma/prisma.service";
import { HorariosService } from "../horarios/horarios.service";
import { ahoraDelSalon } from "./utils/franja-horaria.util";

const prismaMock = {
  turno: { findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn() },
  servicio: { findMany: jest.fn() },
};
const horariosMock = {
  obtenerExcepcionesParaFecha: jest.fn(),
  obtenerFranjasActivasPorFecha: jest.fn(),
};

const HORA = 60 * 60 * 1000;
const TELEFONO = "+5493644401020";

// Las franjas llegan como Date en 1970-01-01 (Time de Prisma) — ver franja-horaria.util.ts
const hora = (hhmm: string) => new Date(`1970-01-01T${hhmm}:00.000Z`);

describe("TurnosService", () => {
  let service: TurnosService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TurnosService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: HorariosService, useValue: horariosMock },
      ],
    }).compile();
    service = module.get(TurnosService);
  });

  function turno(extra: Record<string, unknown> = {}) {
    return {
      id: 1,
      estado: EstadoTurno.confirmado,
      fecha_hora_inicio: new Date(ahoraDelSalon().getTime() + 48 * HORA),
      usuario: { id: 1, nombre: "Ana", telefono: TELEFONO },
      ...extra,
    };
  }

  describe("consultarDisponibilidad (CU-06)", () => {
    // Fecha futura lejana para que el filtro de "horarios pasados" no interfiera
    const FECHA = "2099-01-05";

    beforeEach(() => {
      prismaMock.servicio.findMany.mockResolvedValue([{ id: 1, duracion_minutos: 60 }]);
      horariosMock.obtenerExcepcionesParaFecha.mockResolvedValue([]);
      horariosMock.obtenerFranjasActivasPorFecha.mockResolvedValue([
        { hora_inicio: hora("08:00"), hora_fin: hora("10:00") },
      ]);
      prismaMock.turno.findMany.mockResolvedValue([]);
    });

    it("servicio inexistente o inactivo → 400", async () => {
      prismaMock.servicio.findMany.mockResolvedValue([]);
      await expect(service.consultarDisponibilidad([1], FECHA)).rejects.toThrow(BadRequestException);
    });

    it("genera slots cada 15 min que entren completos en la franja", async () => {
      const slots = await service.consultarDisponibilidad([1], FECHA);
      expect(slots.map((s) => s.hora_inicio)).toEqual(["08:00", "08:15", "08:30", "08:45", "09:00"]);
      expect(slots[0]).toEqual({ hora_inicio: "08:00", hora_fin: "09:00" });
    });

    it("excluye los slots que se superponen con un turno ya reservado", async () => {
      prismaMock.turno.findMany.mockResolvedValue([
        { fecha_hora_inicio: new Date(`${FECHA}T08:00:00.000Z`), fecha_hora_fin: new Date(`${FECHA}T09:00:00.000Z`) },
      ]);
      const slots = await service.consultarDisponibilidad([1], FECHA);
      expect(slots.map((s) => s.hora_inicio)).toEqual(["09:00"]);
    });

    it("bloqueo_total ese día → sin horarios", async () => {
      horariosMock.obtenerExcepcionesParaFecha.mockResolvedValue([{ tipo: "bloqueo_total" }]);
      await expect(service.consultarDisponibilidad([1], FECHA)).resolves.toEqual([]);
    });

    it("horario_especial bloquea solo el rango indicado", async () => {
      horariosMock.obtenerExcepcionesParaFecha.mockResolvedValue([
        { tipo: "horario_especial", hora_inicio: hora("08:00"), hora_fin: hora("09:00") },
      ]);
      const slots = await service.consultarDisponibilidad([1], FECHA);
      expect(slots.map((s) => s.hora_inicio)).toEqual(["09:00"]);
    });

    it("día sin franjas → sin horarios", async () => {
      horariosMock.obtenerFranjasActivasPorFecha.mockResolvedValue([]);
      await expect(service.consultarDisponibilidad([1], FECHA)).resolves.toEqual([]);
    });

    it("servicios más largos que la franja → sin horarios", async () => {
      prismaMock.servicio.findMany.mockResolvedValue([{ id: 1, duracion_minutos: 180 }]);
      await expect(service.consultarDisponibilidad([1], FECHA)).resolves.toEqual([]);
    });

    it("no ofrece horarios del pasado (comparando en hora del salón)", async () => {
      const hoy = ahoraDelSalon().toISOString().slice(0, 10);
      horariosMock.obtenerFranjasActivasPorFecha.mockResolvedValue([
        { hora_inicio: hora("00:00"), hora_fin: hora("00:30") },
      ]);
      prismaMock.servicio.findMany.mockResolvedValue([{ id: 1, duracion_minutos: 15 }]);
      const slots = await service.consultarDisponibilidad([1], hoy);
      // 00:00-00:30 de hoy ya pasó salvo que el test corra justo a medianoche
      expect(slots.length).toBeLessThanOrEqual(1);
    });
  });

  describe("cancelarComoCliente (CU-09 / RF11-13)", () => {
    it("turno inexistente → 404", async () => {
      prismaMock.turno.findUnique.mockResolvedValue(null);
      await expect(service.cancelarComoCliente(1, "3644-401020")).rejects.toThrow(NotFoundException);
    });

    it("turno de otro teléfono → 401", async () => {
      prismaMock.turno.findUnique.mockResolvedValue(turno());
      await expect(service.cancelarComoCliente(1, "3644-999999")).rejects.toThrow(UnauthorizedException);
    });

    it("con menos de 12hs de anticipación → 400", async () => {
      prismaMock.turno.findUnique.mockResolvedValue(
        turno({ fecha_hora_inicio: new Date(ahoraDelSalon().getTime() + 11 * HORA) }),
      );
      await expect(service.cancelarComoCliente(1, "3644-401020")).rejects.toThrow(BadRequestException);
      expect(prismaMock.turno.update).not.toHaveBeenCalled();
    });

    it("turno ya cancelado o atendido → 409 (no se puede cancelar dos veces)", async () => {
      prismaMock.turno.findUnique.mockResolvedValue(turno({ estado: EstadoTurno.cancelado }));
      await expect(service.cancelarComoCliente(1, "3644-401020")).rejects.toThrow(ConflictException);
      prismaMock.turno.findUnique.mockResolvedValue(turno({ estado: EstadoTurno.atendido }));
      await expect(service.cancelarComoCliente(1, "3644-401020")).rejects.toThrow(ConflictException);
    });

    it("con más de 12hs cancela (el teléfono se normaliza al comparar)", async () => {
      prismaMock.turno.findUnique.mockResolvedValue(turno());
      prismaMock.turno.update.mockResolvedValue({ id: 1, estado: EstadoTurno.cancelado });
      await service.cancelarComoCliente(1, "3644-401020");
      expect(prismaMock.turno.update.mock.calls[0][0].data).toEqual({ estado: EstadoTurno.cancelado });
    });
  });

  describe("acciones de la admin", () => {
    it("cancelarComoAdmin sobre un turno atendido → 409", async () => {
      prismaMock.turno.findUnique.mockResolvedValue(turno({ estado: EstadoTurno.atendido }));
      await expect(service.cancelarComoAdmin(1)).rejects.toThrow(ConflictException);
    });

    it("cancelarComoAdmin cancela un turno confirmado (sin regla de 12hs)", async () => {
      prismaMock.turno.findUnique.mockResolvedValue(
        turno({ fecha_hora_inicio: new Date(ahoraDelSalon().getTime() + 1 * HORA) }),
      );
      prismaMock.turno.update.mockResolvedValue({ id: 1 });
      await service.cancelarComoAdmin(1);
      expect(prismaMock.turno.update.mock.calls[0][0].data).toEqual({ estado: EstadoTurno.cancelado });
    });

    it("marcarAtendido: inexistente → 404; cancelado → 409; confirmado → atendido", async () => {
      prismaMock.turno.findUnique.mockResolvedValueOnce(null);
      await expect(service.marcarAtendido(1)).rejects.toThrow(NotFoundException);

      prismaMock.turno.findUnique.mockResolvedValueOnce(turno({ estado: EstadoTurno.cancelado }));
      await expect(service.marcarAtendido(1)).rejects.toThrow(ConflictException);

      prismaMock.turno.findUnique.mockResolvedValueOnce(turno());
      prismaMock.turno.update.mockResolvedValue({ id: 1 });
      await service.marcarAtendido(1);
      expect(prismaMock.turno.update.mock.calls[0][0].data).toEqual({ estado: EstadoTurno.atendido });
    });

    it("reprogramarComoAdmin sobre un turno cancelado → 409, sin crear uno nuevo", async () => {
      prismaMock.turno.findUnique.mockResolvedValue(
        turno({ estado: EstadoTurno.cancelado, turno_servicios: [] }),
      );
      await expect(service.reprogramarComoAdmin(1, "2099-01-05", "09:00")).rejects.toThrow(ConflictException);
    });
  });
});
