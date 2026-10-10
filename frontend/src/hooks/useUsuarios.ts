//Turnify\frontend\src\hooks\useUsuarios.ts
import { keepPreviousData, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getUsuarios,
  crearUsuario,
  actualizarUsuario,
  getMiPerfil,
  actualizarMiPerfil,
  cambiarRolUsuario,
  eliminarUsuario,
} from "../api/usuarios";
import type {
  FiltrosUsuarios,
  CrearUsuarioPayload,
  ActualizarUsuarioPayload,
  RolUsuario,
} from "../types/usuario";

import { establecerPassword } from "../api/auth";
import { useAuthStore } from "../stores/authStore";

const QUERY_KEY = ["usuarios"];

export function useMiPerfil() {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: [...QUERY_KEY, "me"],
    queryFn: getMiPerfil,
    enabled: !!token,
  });
}

export function useEstablecerPassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { passwordActual?: string; passwordNueva: string }) =>
      establecerPassword(payload),
    // Refresca "tiene_password" en Mi perfil
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useActualizarMiPerfil() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ActualizarUsuarioPayload) => actualizarMiPerfil(payload),
    onSuccess: (perfil) => {
      // Mantiene sincronizado el usuario de la sesión (header, perfil_completo, etc.)
      const { usuario, token, setAuth } = useAuthStore.getState();
      if (usuario && token) {
        setAuth(
          {
            ...usuario,
            nombre: perfil.nombre,
            apellido: perfil.apellido ?? undefined,
            perfil_completo: perfil.perfil_completo,
          },
          token,
        );
      }
      return queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

// `enabled: false` permite no consultar hasta que haga falta (ej. buscador que
// espera a que se escriba algo).
export function useUsuarios(
  filtros: FiltrosUsuarios = {},
  opciones: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: [...QUERY_KEY, filtros],
    queryFn: () => getUsuarios(filtros),
    placeholderData: keepPreviousData,
    enabled: opciones.enabled ?? true,
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
