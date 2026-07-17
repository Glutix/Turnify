import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCategorias,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria,
} from "../api/categoriasServicio";
import type { CrearCategoriaPayload, ActualizarCategoriaPayload } from "../types/servicio";

const QUERY_KEY = ["categorias-servicio"];

export function useCategoriasServicio() {
  return useQuery({ queryKey: QUERY_KEY, queryFn: getCategorias });
}

export function useCrearCategoria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CrearCategoriaPayload) => crearCategoria(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useActualizarCategoria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ActualizarCategoriaPayload }) =>
      actualizarCategoria(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useEliminarCategoria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => eliminarCategoria(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}