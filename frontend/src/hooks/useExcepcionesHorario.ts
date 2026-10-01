import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getExcepcionesHorario,
  crearExcepcionHorario,
  actualizarExcepcionHorario,
  eliminarExcepcionHorario,
} from "../api/horarios";
import type {
  CrearExcepcionHorarioPayload,
  ActualizarExcepcionHorarioPayload,
} from "../types/horarios";

const QUERY_KEY = ["excepciones-horario"];

export function useExcepcionesHorario() {
  return useQuery({ queryKey: QUERY_KEY, queryFn: getExcepcionesHorario });
}

export function useCrearExcepcionHorario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CrearExcepcionHorarioPayload) => crearExcepcionHorario(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useActualizarExcepcionHorario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: ActualizarExcepcionHorarioPayload;
    }) => actualizarExcepcionHorario(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useEliminarExcepcionHorario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => eliminarExcepcionHorario(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}