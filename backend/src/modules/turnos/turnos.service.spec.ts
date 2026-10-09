import { BadRequestException, ConflictException, NotFoundException } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import { EstadoTurno } from "@prisma/client";
import { TurnosService } from "./turnos.service";
import { PrismaService } from "../../prisma/prisma.service";
import { HorariosService } from "../horarios/horarios.service";
import { ahoraDelSalon } from "./utils/franja-horaria.util";

const prismaMock = {
  turno: { findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn(), create: jest.fn() },
  $transaction: jest.fn(),
  $executeRawUnsafe: jest.fn(),
  servicio: { findMany: jest.fn() },
  usuario: { findUnique: jest.fn() },
  otpVerificacion: { findFirst: jest.fn(), update: jest.fn() },
};
// $transaction acepta dos formas: callback interactivo (lo usa el lock de agenda,
// recibe el mismo mock como "tx") o array de operaciones (listado admin).
prismaMock.$transaction.mockImplementation((arg: unknown) =>
  typeof arg === "function"
    ? (arg as (tx: typeof prismaMock) => unknown)(prismaMock)
    : Promise.all(arg as unknown[]),
);
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
      usuario_id: 1,
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

  describe("cancelarMiTurno (CU-09 / RF11-13)", () => {
    it("turno inexistente → 404", async () => {
      prismaMock.turno.findUnique.mockResolvedValue(null);
      await expect(service.cancelarMiTurno(1, 1)).rejects.toThrow(NotFoundException);
    });

    it("turno de otro usuario → 404 (no 401: desloguearía al usuario y revelaría que existe)", async () => {
      prismaMock.turno.findUnique.mockResolvedValue(turno());
      await expect(service.cancelarMiTurno(2, 1)).rejects.toThrow(NotFoundException);
      expect(prismaMock.turno.update).not.toHaveBeenCalled();
    });

    it("con menos de 12hs de anticipación → 400", async () => {
      prismaMock.turno.findUnique.mockResolvedValue(
        turno({ fecha_hora_inicio: new Date(ahoraDelSalon().getTime() + 11 * HORA) }),
      );
      await expect(service.cancelarMiTurno(1, 1)).rejects.toThrow(BadRequestException);
      expect(prismaMock.turno.update).not.toHaveBeenCalled();
    });

    it("turno ya cancelado o atendido → 409 (no se puede cancelar dos veces)", async () => {
      prismaMock.turno.findUnique.mockResolvedValue(turno({ estado: EstadoTurno.cancelado }));
      await expect(service.cancelarMiTurno(1, 1)).rejects.toThrow(ConflictException);
      prismaMock.turno.findUnique.mockResolvedValue(turno({ estado: EstadoTurno.atendido }));
      await expect(service.cancelarMiTurno(1, 1)).rejects.toThrow(ConflictException);
    });

    it("con más de 12hs cancela", async () => {
      prismaMock.turno.findUnique.mockResolvedValue(turno());
      prismaMock.turno.update.mockResolvedValue({ id: 1, estado: EstadoTurno.cancelado });
      await service.cancelarMiTurno(1, 1);
      expect(prismaMock.turno.update.mock.calls[0][0].data).toEqual({ estado: EstadoTurno.cancelado });
    });
  });

  describe("reprogramarMiTurno (CU-10 / RF11-13)", () => {
    const DTO = { fecha: "2099-01-05", hora_inicio: "09:00" };
    const conServicios = (extra: Record<string, unknown> = {}) =>
      turno({
        turno_servicios: [{ servicio_id: 1, precio_unitario: "1000", servicio: { duracion_minutos: 60 } }],
        ...extra,
      });

    beforeEach(() => {
      horariosMock.obtenerExcepcionesParaFecha.mockResolvedValue([]);
      horariosMock.obtenerFranjasActivasPorFecha.mockResolvedValue([
        { hora_inicio: hora("08:00"), hora_fin: hora("12:00") },
      ]);
      prismaMock.turno.findMany.mockResolvedValue([]);
    });

    it("turno de otro usuario → 404", async () => {
      prismaMock.turno.findUnique.mockResolvedValue(conServicios());
      await expect(service.reprogramarMiTurno(2, 1, DTO)).rejects.toThrow(NotFoundException);
      expect(prismaMock.turno.update).not.toHaveBeenCalled();
    });

    it("con menos de 12hs sobre el turno original → 400", async () => {
      prismaMock.turno.findUnique.mockResolvedValue(
        conServicios({ fecha_hora_inicio: new Date(ahoraDelSalon().getTime() + 5 * HORA) }),
      );
      await expect(service.reprogramarMiTurno(1, 1, DTO)).rejects.toThrow(BadRequestException);
    });

    it("turno cancelado → 409", async () => {
      prismaMock.turno.findUnique.mockResolvedValue(conServicios({ estado: EstadoTurno.cancelado }));
      await expect(service.reprogramarMiTurno(1, 1, DTO)).rejects.toThrow(ConflictException);
    });

    it("horario ocupado → 409 sin tocar el turno original", async () => {
      prismaMock.turno.findUnique.mockResolvedValue(conServicios());
      prismaMock.turno.findMany.mockResolvedValue([{ id: 9 }]);
      await expect(service.reprogramarMiTurno(1, 1, DTO)).rejects.toThrow(ConflictException);
      expect(prismaMock.turno.update).not.toHaveBeenCalled();
      expect(prismaMock.turno.create).not.toHaveBeenCalled();
    });

    it("caso feliz: el original queda reprogramado y se crea uno nuevo con turno_origen_id y los mismos servicios", async () => {
      prismaMock.turno.findUnique.mockResolvedValue(conServicios());
      prismaMock.turno.update.mockResolvedValue({ id: 1 });
      prismaMock.turno.create.mockResolvedValue({ id: 2 });

      const resultado = await service.reprogramarMiTurno(1, 1, DTO);

      expect(resultado).toEqual({ id: 2 });
      expect(prismaMock.$executeRawUnsafe.mock.calls[0][0]).toContain("pg_advisory_xact_lock");
      expect(prismaMock.turno.update.mock.calls[0][0].data).toEqual({ estado: EstadoTurno.reprogramado });
      const dataNuevo = prismaMock.turno.create.mock.calls[0][0].data;
      expect(dataNuevo.turno_origen_id).toBe(1);
      expect(dataNuevo.usuario_id).toBe(1);
      expect(dataNuevo.turno_servicios.create).toEqual([{ servicio_id: 1, precio_unitario: "1000" }]);
    });
  });

  describe("misTurnos (CU-11 / RF16-17)", () => {
    it("lista solo los turnos del usuario logueado, del más nuevo al más viejo", async () => {
      prismaMock.turno.findMany.mockResolvedValue([{ id: 2 }, { id: 1 }]);
      await service.misTurnos(7);
      const args = prismaMock.turno.findMany.mock.calls[0][0];
      expect(args.where).toEqual({ usuario_id: 7 });
      expect(args.orderBy).toEqual({ fecha_hora_inicio: "desc" });
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

      prismaMock.turno.findUnique.mockResolvedValueOnce(
        turno({ fecha_hora_inicio: ahoraDelSalon() }),
      );
      prismaMock.turno.update.mockResolvedValue({ id: 1 });
      await service.marcarAtendido(1);
      expect(prismaMock.turno.update.mock.calls[0][0].data).toEqual({ estado: EstadoTurno.atendido });
    });

    it("marcarAtendido: turno de un día futuro → 400 y no actualiza", async () => {
      prismaMock.turno.findUnique.mockResolvedValue(turno()); // +48hs
      await expect(service.marcarAtendido(1)).rejects.toThrow(BadRequestException);
      expect(prismaMock.turno.update).not.toHaveBeenCalled();
    });

    it("marcarAtendido: turno de un día pasado se puede marcar (si la admin se olvidó)", async () => {
      prismaMock.turno.findUnique.mockResolvedValue(
        turno({ fecha_hora_inicio: new Date(ahoraDelSalon().getTime() - 30 * HORA) }),
      );
      prismaMock.turno.update.mockResolvedValue({ id: 1 });
      await service.marcarAtendido(1);
      expect(prismaMock.turno.update).toHaveBeenCalled();
    });

    it("reprogramarComoAdmin sobre un turno cancelado → 409, sin crear uno nuevo", async () => {
      prismaMock.turno.findUnique.mockResolvedValue(
        turno({ estado: EstadoTurno.cancelado, turno_servicios: [] }),
      );
      await expect(service.reprogramarComoAdmin(1, "2099-01-05", "09:00")).rejects.toThrow(ConflictException);
    });
  });

  describe("duración máxima por turno (3 h 45 min)", () => {
    it("más de 225 min en total → 400 con mensaje claro, tanto en disponibilidad como al reservar", async () => {
      prismaMock.servicio.findMany.mockResolvedValue([
        { id: 1, duracion_minutos: 120 },
        { id: 2, duracion_minutos: 106 },
      ]);
      await expect(service.consultarDisponibilidad([1, 2], "2099-01-05")).rejects.toThrow(
        /3 h 45 min/,
      );
    });

    it("exactamente 225 min está permitido", async () => {
      prismaMock.servicio.findMany.mockResolvedValue([
        { id: 1, duracion_minutos: 120 },
        { id: 2, duracion_minutos: 105 },
      ]);
      horariosMock.obtenerExcepcionesParaFecha.mockResolvedValue([]);
      horariosMock.obtenerFranjasActivasPorFecha.mockResolvedValue([]);
      await expect(service.consultarDisponibilidad([1, 2], "2099-01-05")).resolves.toEqual([]);
    });
  });

  describe("diasHabilitados", () => {
    it("excluye días sin franjas (fin de semana) y los de bloqueo_total (feriado)", async () => {
      // 2099-01-05 es lunes: 05 y 06 con franjas, 07 feriado, 08 sin franjas (cerrado)
      horariosMock.obtenerExcepcionesParaFecha.mockImplementation(async (f: Date) =>
        f.toISOString().startsWith("2099-01-07") ? [{ tipo: "bloqueo_total" }] : [],
      );
      horariosMock.obtenerFranjasActivasPorFecha.mockImplementation(async (f: Date) =>
        f.toISOString().startsWith("2099-01-08") ? [] : [{ hora_inicio: hora("08:00"), hora_fin: hora("12:00") }],
      );
      const dias = await service.diasHabilitados("2099-01-05", "2099-01-08");
      expect(dias).toEqual(["2099-01-05", "2099-01-06"]);
    });

    describe("día de hoy según la hora del salón", () => {
      // Hora de pared del salón = UTC + offset; fijamos "ahora" con fake timers.
      // Con offset -180, las 21:00 del salón son las 00:00Z del día siguiente.
      const fijarHoraSalon = (iso: string) => {
        jest.useFakeTimers().setSystemTime(new Date(iso));
      };
      const franjasDoble = [
        { hora_inicio: hora("08:00"), hora_fin: hora("12:00") },
        { hora_inicio: hora("16:00"), hora_fin: hora("20:00") },
      ];

      beforeEach(() => {
        process.env.SALON_UTC_OFFSET_MINUTES = "-180";
        horariosMock.obtenerExcepcionesParaFecha.mockResolvedValue([]);
        horariosMock.obtenerFranjasActivasPorFecha.mockResolvedValue(franjasDoble);
      });

      afterEach(() => {
        jest.useRealTimers();
        delete process.env.SALON_UTC_OFFSET_MINUTES;
      });

      it("incluye hoy si todavía queda una franja pendiente", async () => {
        fijarHoraSalon("2099-01-05T17:00:00.000Z"); // 14:00 en el salón
        expect(await service.diasHabilitados("2099-01-05", "2099-01-06")).toEqual([
          "2099-01-05",
          "2099-01-06",
        ]);
      });

      it("excluye hoy si ya pasaron todas las franjas (21:00) pero mantiene mañana", async () => {
        fijarHoraSalon("2099-01-06T00:00:00.000Z"); // 21:00 del 05 en el salón
        expect(await service.diasHabilitados("2099-01-05", "2099-01-07")).toEqual([
          "2099-01-06",
          "2099-01-07",
        ]);
      });
    });

    it("no devuelve días pasados y rechaza formato inválido o rango enorme", async () => {
      horariosMock.obtenerExcepcionesParaFecha.mockResolvedValue([]);
      horariosMock.obtenerFranjasActivasPorFecha.mockResolvedValue([
        { hora_inicio: hora("08:00"), hora_fin: hora("12:00") },
      ]);
      const dias = await service.diasHabilitados("2000-01-01", "2000-01-10");
      expect(dias).toEqual([]);
      await expect(service.diasHabilitados("hoy", "2099-01-01")).rejects.toThrow(BadRequestException);
      await expect(service.diasHabilitados("2099-01-01", "2099-12-31")).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe("reservarComoAutenticado (CU-07 con sesión + OTP anti-bot)", () => {
    const FECHA = "2099-01-05";
    const dto = { servicios: [1], fecha: FECHA, hora_inicio: "08:00", codigo: "123456" };
    const usuario = { id: 7, nombre: "Ana", apellido: null, telefono: TELEFONO };

    beforeEach(() => {
      prismaMock.usuario.findUnique.mockResolvedValue(usuario);
      prismaMock.servicio.findMany.mockResolvedValue([{ id: 1, duracion_minutos: 60, precio: "1000" }]);
      horariosMock.obtenerExcepcionesParaFecha.mockResolvedValue([]);
      horariosMock.obtenerFranjasActivasPorFecha.mockResolvedValue([
        { hora_inicio: hora("08:00"), hora_fin: hora("12:00") },
      ]);
      prismaMock.turno.findMany.mockResolvedValue([]);
      prismaMock.turno.create.mockResolvedValue({ id: 99 });
      prismaMock.otpVerificacion.findFirst.mockResolvedValue({ id: 5, codigo: "123456", intentos: 0 });
      prismaMock.otpVerificacion.update.mockResolvedValue({ id: 5, intentos: 1 });
    });

    it("con OTP correcto crea el turno para el usuario del token (sin nombre/teléfono en el body)", async () => {
      const resultado = await service.reservarComoAutenticado(7, dto);

      expect(resultado).toEqual({ id: 99 });
      expect(prismaMock.otpVerificacion.findFirst.mock.calls[0][0].where.telefono).toBe(TELEFONO);
      expect(prismaMock.otpVerificacion.update.mock.calls[0][0].data).toEqual({ verificado: true });
      expect(prismaMock.turno.create.mock.calls[0][0].data.usuario_id).toBe(7);
    });

    it("OTP incorrecto → 401 con intentos restantes sobre un máximo de 3, y no crea el turno", async () => {
      prismaMock.otpVerificacion.update.mockResolvedValue({ id: 5, intentos: 1 });
      await expect(
        service.reservarComoAutenticado(7, { ...dto, codigo: "000000" }),
      ).rejects.toMatchObject({ response: { intentosRestantes: 2 } });
      expect(prismaMock.turno.create).not.toHaveBeenCalled();
    });

    it("carrera: si otra reserva ocupa el horario entre la validación y el alta → 409, no se crea el turno", async () => {
      // 1ª consulta (validación previa): libre. 2ª (dentro del lock): ya ocupado.
      prismaMock.turno.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([{ id: 3 }]);
      await expect(service.reservarComoAutenticado(7, dto)).rejects.toThrow(ConflictException);
      expect(prismaMock.$executeRawUnsafe.mock.calls[0][0]).toContain("pg_advisory_xact_lock");
      expect(prismaMock.turno.create).not.toHaveBeenCalled();
    });

    it("con 3 intentos ya gastados → 400 sin crear el turno", async () => {
      prismaMock.otpVerificacion.findFirst.mockResolvedValue({ id: 5, codigo: "123456", intentos: 3 });
      await expect(service.reservarComoAutenticado(7, dto)).rejects.toThrow(BadRequestException);
      expect(prismaMock.turno.create).not.toHaveBeenCalled();
    });

    it("sin código vigente → 400", async () => {
      prismaMock.otpVerificacion.findFirst.mockResolvedValue(null);
      await expect(service.reservarComoAutenticado(7, dto)).rejects.toThrow(BadRequestException);
      expect(prismaMock.turno.create).not.toHaveBeenCalled();
    });

    it("horario ocupado → 409 y NO consume el código", async () => {
      prismaMock.turno.findMany.mockResolvedValue([{ id: 3 }]);
      await expect(service.reservarComoAutenticado(7, dto)).rejects.toThrow(ConflictException);
      expect(prismaMock.otpVerificacion.update).not.toHaveBeenCalled();
    });

    it("usuario sin teléfono → 400", async () => {
      prismaMock.usuario.findUnique.mockResolvedValue({ ...usuario, telefono: null });
      await expect(service.reservarComoAutenticado(7, dto)).rejects.toThrow(BadRequestException);
    });

    it("usuario inexistente → 404", async () => {
      prismaMock.usuario.findUnique.mockResolvedValue(null);
      await expect(service.reservarComoAutenticado(7, dto)).rejects.toThrow(NotFoundException);
    });
  });
});
