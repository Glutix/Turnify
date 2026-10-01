import { Test, type TestingModule } from "@nestjs/testing";
import { type DiaSemana } from "@prisma/client";
import { HorariosController } from "./horarios.controller";
import { HorariosService } from "./horarios.service";
import { type CrearFranjaHorariaDto } from "./dto/crear-franja-horaria.dto";
import { type ActualizarFranjaHorariaDto } from "./dto/actualizar-franja-horaria.dto";
import { type CrearExcepcionHorarioDto } from "./dto/crear-excepcion-horario.dto";
import { type ActualizarExcepcionHorarioDto } from "./dto/actualizar-excepcion-horario.dto";

// Mock del service: el controller no tiene lógica propia, así que estos
// tests solo verifican que cada método delega correctamente (mismos
// argumentos, mismo valor de retorno) — la lógica de negocio ya está
// cubierta en horarios.service.spec.ts.
const horariosServiceMock = {
  findAllFranjas: jest.fn(),
  findOneFranja: jest.fn(),
  createFranja: jest.fn(),
  updateFranja: jest.fn(),
  toggleEstadoFranja: jest.fn(),
  removeFranja: jest.fn(),
  findAllExcepciones: jest.fn(),
  findOneExcepcion: jest.fn(),
  createExcepcion: jest.fn(),
  updateExcepcion: jest.fn(),
  removeExcepcion: jest.fn(),
};

describe("HorariosController", () => {
  let controller: HorariosController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HorariosController],
      providers: [
        { provide: HorariosService, useValue: horariosServiceMock },
      ],
    }).compile();

    controller = module.get<HorariosController>(HorariosController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  // ============================================================
  // FRANJAS HORARIAS
  // ============================================================

  describe("GET /horarios/franjas", () => {
    it("sin filtros, pasa dia_semana y solo_activas como undefined", async () => {
      horariosServiceMock.findAllFranjas.mockResolvedValue([{ id: 1 }]);

      const resultado = await controller.findAllFranjas();

      expect(horariosServiceMock.findAllFranjas).toHaveBeenCalledWith(
        undefined,
        undefined,
      );
      expect(resultado).toEqual([{ id: 1 }]);
    });

    it("convierte solo_activas='true' (string de query) a boolean true", async () => {
      await controller.findAllFranjas(undefined, "true");

      expect(horariosServiceMock.findAllFranjas).toHaveBeenCalledWith(
        undefined,
        true,
      );
    });

    it("convierte solo_activas='false' a boolean false", async () => {
      await controller.findAllFranjas(undefined, "false");

      expect(horariosServiceMock.findAllFranjas).toHaveBeenCalledWith(
        undefined,
        false,
      );
    });

    it("pasa dia_semana tal cual viene en la query", async () => {
      await controller.findAllFranjas("lunes" as DiaSemana);

      expect(horariosServiceMock.findAllFranjas).toHaveBeenCalledWith(
        "lunes",
        undefined,
      );
    });
  });

  describe("GET /horarios/franjas/:id", () => {
    it("delega en findOneFranja con el id numérico", async () => {
      horariosServiceMock.findOneFranja.mockResolvedValue({ id: 5 });

      const resultado = await controller.findOneFranja(5);

      expect(horariosServiceMock.findOneFranja).toHaveBeenCalledWith(5);
      expect(resultado).toEqual({ id: 5 });
    });
  });

  describe("POST /horarios/franjas", () => {
    it("delega en createFranja con el dto", async () => {
      const dto: CrearFranjaHorariaDto = {
        dia_semana: "lunes" as DiaSemana,
        hora_inicio: "09:00",
        hora_fin: "13:00",
      };
      horariosServiceMock.createFranja.mockResolvedValue({ id: 1, ...dto });

      await controller.createFranja(dto);

      expect(horariosServiceMock.createFranja).toHaveBeenCalledWith(dto);
    });
  });

  describe("PATCH /horarios/franjas/:id", () => {
    it("delega en updateFranja con id y dto", async () => {
      const dto: ActualizarFranjaHorariaDto = { hora_fin: "14:00" };

      await controller.updateFranja(1, dto);

      expect(horariosServiceMock.updateFranja).toHaveBeenCalledWith(1, dto);
    });
  });

  describe("PATCH /horarios/franjas/:id/estado", () => {
    it("delega en toggleEstadoFranja con el id", async () => {
      await controller.toggleEstadoFranja(1);

      expect(horariosServiceMock.toggleEstadoFranja).toHaveBeenCalledWith(1);
    });
  });

  describe("DELETE /horarios/franjas/:id", () => {
    it("delega en removeFranja con el id", async () => {
      await controller.removeFranja(1);

      expect(horariosServiceMock.removeFranja).toHaveBeenCalledWith(1);
    });
  });

  // ============================================================
  // EXCEPCIONES DE HORARIO
  // ============================================================

  describe("GET /horarios/excepciones", () => {
    it("sin filtros, pasa desde y hasta como undefined", async () => {
      horariosServiceMock.findAllExcepciones.mockResolvedValue([]);

      await controller.findAllExcepciones();

      expect(horariosServiceMock.findAllExcepciones).toHaveBeenCalledWith(
        undefined,
        undefined,
      );
    });

    it("pasa desde y hasta tal cual vienen en la query", async () => {
      await controller.findAllExcepciones("2026-10-01", "2026-12-31");

      expect(horariosServiceMock.findAllExcepciones).toHaveBeenCalledWith(
        "2026-10-01",
        "2026-12-31",
      );
    });
  });

  describe("GET /horarios/excepciones/:id", () => {
    it("delega en findOneExcepcion con el id", async () => {
      horariosServiceMock.findOneExcepcion.mockResolvedValue({ id: 3 });

      const resultado = await controller.findOneExcepcion(3);

      expect(horariosServiceMock.findOneExcepcion).toHaveBeenCalledWith(3);
      expect(resultado).toEqual({ id: 3 });
    });
  });

  describe("POST /horarios/excepciones", () => {
    it("delega en createExcepcion con el dto", async () => {
      const dto: CrearExcepcionHorarioDto = {
        fecha_desde: "2026-12-25",
        fecha_hasta: "2026-12-25",
        tipo: "bloqueo_total" as CrearExcepcionHorarioDto["tipo"],
      };

      await controller.createExcepcion(dto);

      expect(horariosServiceMock.createExcepcion).toHaveBeenCalledWith(dto);
    });
  });

  describe("PATCH /horarios/excepciones/:id", () => {
    it("delega en updateExcepcion con id y dto", async () => {
      const dto: ActualizarExcepcionHorarioDto = {
        descripcion: "Feriado actualizado",
      };

      await controller.updateExcepcion(2, dto);

      expect(horariosServiceMock.updateExcepcion).toHaveBeenCalledWith(2, dto);
    });
  });

  describe("DELETE /horarios/excepciones/:id", () => {
    it("delega en removeExcepcion con el id", async () => {
      await controller.removeExcepcion(2);

      expect(horariosServiceMock.removeExcepcion).toHaveBeenCalledWith(2);
    });
  });
});