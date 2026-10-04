//Turnify\frontend\src\hooks\useUsuarios.ts
import { keepPreviousData, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getUsuarios,
  crearUsuario,
  actualizarUsuario,
  cambiarRolUsuario,
  eliminarUsuario,
} from "../api/usuarios";
import type {
  FiltrosUsuarios,
  CrearUsuarioPayload,
  ActualizarUsuarioPayload,
  RolUsuario,
} from "../types/usuario";

const QUERY_KEY = ["usuarios"];

export function useUsuarios(filtros: FiltrosUsuarios = {}) {
  return useQuery({
    queryKey: [...QUERY_KEY, filtros],
    queryFn: () => getUsuarios(filtros),
    placeholderData: keepPreviousData,
  });
}

export function useCrearUsuario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CrearUsuarioPayload) => crearUsuario(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useActualizarUsuario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ActualizarUsuarioPayload }) =>
      actualizarUsuario(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useCambiarRolUsuario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, rol }: { id: number; rol: RolUsuario }) => cambiarRolUsuario(id, rol),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useEliminarUsuario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => eliminarUsuario(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}
