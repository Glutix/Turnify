import api from "./axios";
import type { Servicio, CrearServicioPayload, ActualizarServicioPayload } from "../types/servicio";

export async function getServicios(): Promise<Servicio[]> {
  const { data } = await api.get("/servicios");
  return data;
}

export async function crearServicio(payload: CrearServicioPayload): Promise<Servicio> {
  const { data } = await api.post("/servicios", payload);
  return data;
}

export async function actualizarServicio(
  id: number,
  payload: ActualizarServicioPayload,
): Promise<Servicio> {
  const { data } = await api.patch(`/servicios/${id}`, payload);
  return data;
}

export async function toggleEstadoServicio(id: number): Promise<Servicio> {
  const { data } = await api.patch(`/servicios/${id}/estado`);
  return data;
}