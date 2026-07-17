import api from "./axios";
import type {
  CategoriaServicio,
  CrearCategoriaPayload,
  ActualizarCategoriaPayload,
} from "../types/servicio";

export async function getCategorias(): Promise<CategoriaServicio[]> {
  const { data } = await api.get("/categorias-servicio");
  return data;
}

export async function crearCategoria(payload: CrearCategoriaPayload): Promise<CategoriaServicio> {
  const { data } = await api.post("/categorias-servicio", payload);
  return data;
}

export async function actualizarCategoria(
  id: number,
  payload: ActualizarCategoriaPayload,
): Promise<CategoriaServicio> {
  const { data } = await api.patch(`/categorias-servicio/${id}`, payload);
  return data;
}

export async function eliminarCategoria(id: number): Promise<void> {
  await api.delete(`/categorias-servicio/${id}`);
}