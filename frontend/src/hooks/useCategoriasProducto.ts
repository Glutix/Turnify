import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCategoriasProducto,
  crearCategoriaProducto,
  actualizarCategoriaProducto,
  eliminarCategoriaProducto,
} from "../api/categoriasProducto";
import { PRODUCTOS_QUERY_KEY } from "./useProductos";
import type {
  CrearCategoriaProductoPayload,
  ActualizarCategoriaProductoPayload,
} from "../types/producto";

const QUERY_KEY = ["categorias-producto"];

export function useCategoriasProducto() {
  return useQuery({ queryKey: QUERY_KEY, queryFn: getCategoriasProducto });
}

export function useCrearCategoriaProducto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CrearCategoriaProductoPayload) =>
      crearCategoriaProducto(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useActualizarCategoriaProducto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: ActualizarCategoriaProductoPayload;
    }) => actualizarCategoriaProducto(id, payload),
    // Cada producto trae el nombre de su categoría anidado: si se renombra,
    // la lista de productos en caché quedaría con el nombre viejo.
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: PRODUCTOS_QUERY_KEY }),
      ]),
  });
}

export function useEliminarCategoriaProducto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => eliminarCategoriaProducto(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}
