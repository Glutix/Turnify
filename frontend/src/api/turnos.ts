import api from "./axios";
import type {
  Turno,
  SlotDisponible,
  FiltrosTurnosAdmin,
  TurnosPaginados,
  ReservarTurnoPayload,
  ReservarTurnoAdminPayload,
  ReprogramarTurnoAdminPayload,
} from "../types/turno";

// --- Público / invitado ---

export async function consultarDisponibilidad(
  servicios: number[],
  fecha: string,
): Promise<SlotDisponible[]> {
  const { data } = await api.get("/turnos/disponibilidad", {
    params: { servicios: servicios.join(","), fecha },
  });
  return data;
}

export async function reservarTurno(payload: ReservarTurnoPayload): Promise<Turno> {
  const { data } = await api.post("/turnos/reservar", payload);
  return data;
}

export async function obtenerHistorialPorTelefono(telefono: string): Promise<Turno[]> {
  const { data } = await api.get("/turnos/historial", { params: { telefono } });
  return data;
}

export async function cancelarTurno(id: number, telefono: string): Promise<Turno> {
  const { data } = await api.patch(`/turnos/${id}/cancelar`, { telefono });
  return data;
}

export async function reprogramarTurno(
  id: number,
  payload: { telefono: string; fecha: string; hora_inicio: string },
): Promise<Turno> {
  const { data } = await api.patch(`/turnos/${id}/reprogramar`, payload);
  return data;
}

// --- Admin ---

export async function obtenerAgenda(fecha?: string): Promise<Turno[]> {
  const { data } = await api.get("/turnos/admin/agenda", { params: fecha ? { fecha } : {} });
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