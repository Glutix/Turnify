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
import { QUERY_KEY_TURNOS } from "./useTurnos";

const QUERY_KEY = ["excepciones-horario"];

export function useExcepcionesHorario() {
  return useQuery({ queryKey: QUERY_KEY, queryFn: getExcepcionesHorario });
}

export function useCrearExcepcionHorario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CrearExcepcionHorarioPayload) => crearExcepcionHorario(payload),
    // También refresca los datos de turnos (días habilitados, disponibilidad):
    // un horario o feriado nuevo cambia lo que se puede reservar.
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEY_TURNOS }),
      ]),
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
    // También refresca los datos de turnos (días habilitados, disponibilidad):
    // un horario o feriado nuevo cambia lo que se puede reservar.
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEY_TURNOS }),
      ]),
  });
}

export function useEliminarExcepcionHorario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => eliminarExcepcionHorario(id),
    // También refresca los datos de turnos (días habilitados, disponibilidad):
    // un horario o feriado nuevo cambia lo que se puede reservar.
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEY_TURNOS }),
      ]),
  });
}