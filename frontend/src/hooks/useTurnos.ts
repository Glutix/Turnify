import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  obtenerAgenda,
  cancelarTurnoAdmin,
  reprogramarTurnoAdmin,
  marcarAtendido,
  reservarTurnoAdmin,
  obtenerHistorialPorUsuario,
  consultarDisponibilidad,
  reservarTurno,
} from "../api/turnos";
import type {
  ReprogramarTurnoAdminPayload,
  ReservarTurnoAdminPayload,
  ReservarTurnoPayload,
} from "../types/turno";

const QUERY_KEY_AGENDA = ["turnos", "agenda"];

// --- Público / invitado (CU-06 / CU-07) ---

export function useDisponibilidad(servicios: number[], fecha: string) {
  return useQuery({
    queryKey: ["turnos", "disponibilidad", servicios, fecha],
    queryFn: () => consultarDisponibilidad(servicios, fecha),
    enabled: servicios.length > 0 && !!fecha,
  });
}

export function useReservarTurno() {
  return useMutation({
    mutationFn: (payload: ReservarTurnoPayload) => reservarTurno(payload),
  });
}

export function useAgenda(fecha?: string) {
  return useQuery({
    queryKey: [...QUERY_KEY_AGENDA, fecha ?? "hoy"],
    queryFn: () => obtenerAgenda(fecha),
  });
}

export function useCancelarTurnoAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => cancelarTurnoAdmin(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY_AGENDA }),
  });
}

export function useReprogramarTurnoAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ReprogramarTurnoAdminPayload }) =>
      reprogramarTurnoAdmin(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY_AGENDA }),
  });
}

export function useMarcarAtendido() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => marcarAtendido(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY_AGENDA }),
  });
}

export function useReservarTurnoAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ReservarTurnoAdminPayload) => reservarTurnoAdmin(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY_AGENDA }),
  });
}

export function useHistorialPorUsuario(usuarioId: number | null) {
  return useQuery({
    queryKey: ["turnos", "historial-usuario", usuarioId],
    queryFn: () => obtenerHistorialPorUsuario(usuarioId as number),
    enabled: usuarioId !== null,
  });
}