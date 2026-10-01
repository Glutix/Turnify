import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getFranjasHorarias,
  crearFranjaHoraria,
  actualizarFranjaHoraria,
  toggleEstadoFranjaHoraria,
} from "../api/horarios";
import type {
  CrearFranjaHorariaPayload,
  ActualizarFranjaHorariaPayload,
} from "../types/horarios";

const QUERY_KEY = ["franjas-horarias"];

export function useFranjasHorarias() {
  return useQuery({ queryKey: QUERY_KEY, queryFn: getFranjasHorarias });
}

export function useCrearFranjaHoraria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CrearFranjaHorariaPayload) => crearFranjaHoraria(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useActualizarFranjaHoraria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ActualizarFranjaHorariaPayload }) =>
      actualizarFranjaHoraria(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useToggleEstadoFranjaHoraria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => toggleEstadoFranjaHoraria(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}