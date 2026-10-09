import api from "./axios";
import type {
  Producto,
  CrearProductoPayload,
  ActualizarProductoPayload,
  AjustarStockPayload,
} from "../types/producto";

export async function getProductos(): Promise<Producto[]> {
  const { data } = await api.get("/productos");
  return data;
}

export async function crearProducto(
  payload: CrearProductoPayload,
): Promise<Producto> {
  const { data } = await api.post("/productos", payload);
  return data;
}

export async function actualizarProducto(
  id: number,
  payload: ActualizarProductoPayload,
): Promise<Producto> {
  const { data } = await api.patch(`/productos/${id}`, payload);
  return data;
}

export async function ajustarStockProducto(
  id: number,
  payload: AjustarStockPayload,
): Promise<Producto> {
  const { data } = await api.patch(`/productos/${id}/stock`, payload);
  return data;
}
