import api from "./axios";
import type {
  Turno,
  SlotDisponible,
  FiltrosTurnosAdmin,
  TurnosPaginados,
  ReservarTurnoPayload,
  ReservarTurnoAutenticadoPayload,
  ReservarTurnoAdminPayload,
  ReprogramarTurnoAdminPayload,
} from "../types/turno";

// --- Público / invitado ---

export async function consultarDisponibilidad(
  servicios: number[],
  fecha: string,
  excluirTurnoId?: number,
): Promise<SlotDisponible[]> {
  const { data } = await api.get("/turnos/disponibilidad", {
    params: {
      servicios: servicios.join(","),
      fecha,
      ...(excluirTurnoId !== undefined ? { excluir_turno: excluirTurnoId } : {}),
    },
  });
  return data;
}

export async function reservarTurno(payload: ReservarTurnoPayload): Promise<Turno> {
  const { data } = await api.post("/turnos/reservar", payload);
  return data;
}

export async function reservarTurnoAutenticado(
  payload: ReservarTurnoAutenticadoPayload,
): Promise<Turno> {
  const { data } = await api.post("/turnos/reservar-autenticado", payload);
  return data;
}

export async function obtenerDiasHabilitados(desde: string, hasta: string): Promise<string[]> {
  const { data } = await api.get("/turnos/dias-habilitados", { params: { desde, hasta } });
  return data;
}

// --- Cliente con sesión (CU-09 / CU-10 / CU-11) ---

export async function obtenerMisTurnos(): Promise<Turno[]> {
  const { data } = await api.get("/turnos/mis-turnos");
  return data;
}

export async function cancelarMiTurno(id: number): Promise<Turno> {
  const { data } = await api.patch(`/turnos/mis-turnos/${id}/cancelar`);
  return data;
}

export async function reprogramarMiTurno(
  id: number,
  payload: ReprogramarTurnoAdminPayload,
): Promise<Turno> {
  const { data } = await api.patch(`/turnos/mis-turnos/${id}/reprogramar`, payload);
  return data;
}

// --- Admin ---

export async function obtenerAgenda(fecha?: string): Promise<Turno[]> {
  const { data } = await api.get("/turnos/admin/agenda", { params: fecha ? { fecha } : {} });
  return data;
}

export async function obtenerProximosTurnos(): Promise<Turno[]> {
  const { data } = await api.get("/turnos/admin/proximos");
  return data;
}

export async function listarTurnosAdmin(filtros: FiltrosTurnosAdmin): Promise<TurnosPaginados> {
  // Se descartan los filtros vacíos para no mandar "estado=" al backend.
  const params = Object.fromEntries(
    Object.entries(filtros).filter(([, valor]) => valor !== undefined && valor !== ""),
  );
  const { data } = await api.get("/turnos/admin", { params });
  return data;
}

export async function reservarTurnoAdmin(payload: ReservarTurnoAdminPayload): Promise<Turno> {
  const { data } = await api.post("/turnos/admin/reservar", payload);
  return data;
}

export async function cancelarTurnoAdmin(id: number): Promise<Turno> {
  const { data } = await api.patch(`/turnos/${id}/cancelar-admin`);
  return data;
}

export async function reprogramarTurnoAdmin(
  id: number,
  payload: ReprogramarTurnoAdminPayload,
): Promise<Turno> {
  const { data } = await api.patch(`/turnos/${id}/reprogramar-admin`, payload);
  return data;
}

export async function marcarAtendido(id: number): Promise<Turno> {
  const { data } = await api.patch(`/turnos/${id}/atendido`);
  return data;
}

export async function obtenerHistorialPorUsuario(usuarioId: number): Promise<Turno[]> {
  const { data } = await api.get(`/turnos/admin/clientes/${usuarioId}/historial`);
  return data;
}