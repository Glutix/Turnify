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
import { QUERY_KEY_TURNOS } from "./useTurnos";

const QUERY_KEY = ["franjas-horarias"];

export function useFranjasHorarias() {
  return useQuery({ queryKey: QUERY_KEY, queryFn: getFranjasHorarias });
}

export function useCrearFranjaHoraria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CrearFranjaHorariaPayload) => crearFranjaHoraria(payload),
    // También refresca los datos de turnos (días habilitados, disponibilidad):
    // un horario o feriado nuevo cambia lo que se puede reservar.
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEY_TURNOS }),
      ]),
  });
}

export function useActualizarFranjaHoraria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ActualizarFranjaHorariaPayload }) =>
      actualizarFranjaHoraria(id, payload),
    // También refresca los datos de turnos (días habilitados, disponibilidad):
    // un horario o feriado nuevo cambia lo que se puede reservar.
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEY_TURNOS }),
      ]),
  });
}

export function useToggleEstadoFranjaHoraria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => toggleEstadoFranjaHoraria(id),
    // También refresca los datos de turnos (días habilitados, disponibilidad):
    // un horario o feriado nuevo cambia lo que se puede reservar.
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEY_TURNOS }),
      ]),
  });
}