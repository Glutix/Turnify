import api from "./axios";
import type {
  FranjaHoraria,
  CrearFranjaHorariaPayload,
  ActualizarFranjaHorariaPayload,
  ExcepcionHorario,
  CrearExcepcionHorarioPayload,
  ActualizarExcepcionHorarioPayload,
} from "../types/horarios";

// --- Franjas horarias ---

export async function getFranjasHorarias(): Promise<FranjaHoraria[]> {
  const { data } = await api.get("/horarios/franjas");
  return data;
}

export async function crearFranjaHoraria(
  payload: CrearFranjaHorariaPayload,
): Promise<FranjaHoraria> {
  const { data } = await api.post("/horarios/franjas", payload);
  return data;
}

export async function actualizarFranjaHoraria(
  id: number,
  payload: ActualizarFranjaHorariaPayload,
): Promise<FranjaHoraria> {
  const { data } = await api.patch(`/horarios/franjas/${id}`, payload);
  return data;
}

export async function toggleEstadoFranjaHoraria(id: number): Promise<FranjaHoraria> {
  const { data } = await api.patch(`/horarios/franjas/${id}/estado`);
  return data;
}

// --- Excepciones de horario ---

export async function getExcepcionesHorario(): Promise<ExcepcionHorario[]> {
  const { data } = await api.get("/horarios/excepciones");
  return data;
}

export async function crearExcepcionHorario(
  payload: CrearExcepcionHorarioPayload,
): Promise<ExcepcionHorario> {
  const { data } = await api.post("/horarios/excepciones", payload);
  return data;
}

export async function actualizarExcepcionHorario(
  id: number,
  payload: ActualizarExcepcionHorarioPayload,
): Promise<ExcepcionHorario> {
  const { data } = await api.patch(`/horarios/excepciones/${id}`, payload);
  return data;
}

export async function eliminarExcepcionHorario(id: number): Promise<void> {
  await api.delete(`/horarios/excepciones/${id}`);
}