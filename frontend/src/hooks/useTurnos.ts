import { keepPreviousData, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  obtenerAgenda,
  listarTurnosAdmin,
  cancelarTurnoAdmin,
  reprogramarTurnoAdmin,
  marcarAtendido,
  reservarTurnoAdmin,
  obtenerHistorialPorUsuario,
  consultarDisponibilidad,
  reservarTurno,
  reservarTurnoAutenticado,
  obtenerMisTurnos,
  obtenerDiasHabilitados,
  cancelarMiTurno,
  reprogramarMiTurno,
} from "../api/turnos";
import type {
  FiltrosTurnosAdmin,
  ReprogramarTurnoAdminPayload,
  ReservarTurnoAdminPayload,
  ReservarTurnoPayload,
  ReservarTurnoAutenticadoPayload,
} from "../types/turno";

const QUERY_KEY_AGENDA = ["turnos", "agenda"];
// Raíz común: las mutations invalidan TODO lo de turnos (agenda, listado admin,
// disponibilidad), así las dos páginas admin quedan siempre sincronizadas.
const QUERY_KEY_TURNOS = ["turnos"];

// --- Público / invitado (CU-06 / CU-07) ---

export function useDisponibilidad(servicios: number[], fecha: string) {
  return useQuery({
    queryKey: ["turnos", "disponibilidad", servicios, fecha],
    queryFn: () => consultarDisponibilidad(servicios, fecha),
    enabled: servicios.length > 0 && !!fecha,
  });
}

export function useReservarTurno() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ReservarTurnoPayload) => reservarTurno(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY_TURNOS }),
  });
}

export function useReservarTurnoAutenticado() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ReservarTurnoAutenticadoPayload) => reservarTurnoAutenticado(payload),
    // Sin esto, "Mis turnos" mostraba la lista cacheada y la reserva nueva
    // recién aparecía después de recargar la página.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY_TURNOS }),
  });
}

export function useDiasHabilitados(desde: string, hasta: string) {
  return useQuery({
    queryKey: [...QUERY_KEY_TURNOS, "dias-habilitados", desde, hasta],
    queryFn: () => obtenerDiasHabilitados(desde, hasta),
    staleTime: 5 * 60 * 1000,
  });
}

export function useMisTurnos() {
  return useQuery({
    queryKey: ["turnos", "mis-turnos"],
    queryFn: obtenerMisTurnos,
  });
}

export function useCancelarMiTurno() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => cancelarMiTurno(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY_TURNOS }),
  });
}

export function useReprogramarMiTurno() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ReprogramarTurnoAdminPayload }) =>
      reprogramarMiTurno(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY_TURNOS }),
  });
}

export function useAgenda(fecha?: string) {
  return useQuery({
    queryKey: [...QUERY_KEY_AGENDA, fecha ?? "hoy"],
    queryFn: () => obtenerAgenda(fecha),
  });
}

export function useTurnosAdmin(filtros: FiltrosTurnosAdmin) {
  return useQuery({
    queryKey: ["turnos", "admin", filtros],
    queryFn: () => listarTurnosAdmin(filtros),
    placeholderData: keepPreviousData,
  });
}

export function useCancelarTurnoAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => cancelarTurnoAdmin(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY_TURNOS }),
  });
}

export function useReprogramarTurnoAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ReprogramarTurnoAdminPayload }) =>
      reprogramarTurnoAdmin(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY_TURNOS }),
  });
}

export function useMarcarAtendido() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => marcarAtendido(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY_TURNOS }),
  });
}

export function useReservarTurnoAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ReservarTurnoAdminPayload) => reservarTurnoAdmin(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY_TURNOS }),
  });
}

export function useHistorialPorUsuario(usuarioId: number | null) {
  return useQuery({
    queryKey: ["turnos", "historial-usuario", usuarioId],
    queryFn: () => obtenerHistorialPorUsuario(usuarioId as number),
    enabled: usuarioId !== null,
  });
}