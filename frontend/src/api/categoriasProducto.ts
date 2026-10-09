import api from "./axios";
import type {
  CategoriaProducto,
  CrearCategoriaProductoPayload,
  ActualizarCategoriaProductoPayload,
} from "../types/producto";

export async function getCategoriasProducto(): Promise<CategoriaProducto[]> {
  const { data } = await api.get("/categorias-producto");
  return data;
}

export async function crearCategoriaProducto(
  payload: CrearCategoriaProductoPayload,
): Promise<CategoriaProducto> {
  const { data } = await api.post("/categorias-producto", payload);
  return data;
}

export async function actualizarCategoriaProducto(
  id: number,
  payload: ActualizarCategoriaProductoPayload,
): Promise<CategoriaProducto> {
  const { data } = await api.patch(`/categorias-producto/${id}`, payload);
  return data;
}

export async function eliminarCategoriaProducto(id: number): Promise<void> {
  await api.delete(`/categorias-producto/${id}`);
}
