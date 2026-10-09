import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getProductos,
  crearProducto,
  actualizarProducto,
  ajustarStockProducto,
} from "../api/productos";
import type {
  CrearProductoPayload,
  ActualizarProductoPayload,
  AjustarStockPayload,
} from "../types/producto";

export const PRODUCTOS_QUERY_KEY = ["productos"];

export function useProductos() {
  return useQuery({ queryKey: PRODUCTOS_QUERY_KEY, queryFn: getProductos });
}

export function useCrearProducto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CrearProductoPayload) => crearProducto(payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: PRODUCTOS_QUERY_KEY }),
  });
}

export function useActualizarProducto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: ActualizarProductoPayload;
    }) => actualizarProducto(id, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: PRODUCTOS_QUERY_KEY }),
  });
}

export function useAjustarStockProducto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: AjustarStockPayload;
    }) => ajustarStockProducto(id, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: PRODUCTOS_QUERY_KEY }),
  });
}
