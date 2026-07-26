//Turnify\frontend\src\hooks\useServicios.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getServicios,
  crearServicio,
  actualizarServicio,
  toggleEstadoServicio,
} from "../api/servicios";
import type { CrearServicioPayload, ActualizarServicioPayload } from "../types/servicio";

const QUERY_KEY = ["servicios"];

export function useServicios() {
  return useQuery({ queryKey: QUERY_KEY, queryFn: getServicios });
}

export function useCrearServicio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CrearServicioPayload) => crearServicio(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useActualizarServicio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ActualizarServicioPayload }) =>
      actualizarServicio(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useToggleEstadoServicio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => toggleEstadoServicio(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}