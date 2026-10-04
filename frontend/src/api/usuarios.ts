import api from "./axios";
import type {
  Usuario,
  RolUsuario,
  FiltrosUsuarios,
  CrearUsuarioPayload,
  ActualizarUsuarioPayload,
} from "../types/usuario";

export async function getUsuarios(filtros: FiltrosUsuarios = {}): Promise<Usuario[]> {
  // Se descartan los filtros vacíos para no mandar "busqueda=" al backend.
  const params = Object.fromEntries(
    Object.entries(filtros).filter(([, valor]) => valor !== undefined && valor !== ""),
  );
  const { data } = await api.get("/usuarios", { params });
  return data;
}

export async function crearUsuario(payload: CrearUsuarioPayload): Promise<Usuario> {
  const { data } = await api.post("/usuarios", payload);
  return data;
}

export async function actualizarUsuario(
  id: number,
  payload: ActualizarUsuarioPayload,
): Promise<Usuario> {
  const { data } = await api.patch(`/usuarios/${id}`, payload);
  return data;
}

export async function cambiarRolUsuario(id: number, rol: RolUsuario): Promise<Usuario> {
  const { data } = await api.patch(`/usuarios/${id}/rol`, { rol });
  return data;
}

export async function eliminarUsuario(id: number): Promise<{ mensaje: string }> {
  const { data } = await api.delete(`/usuarios/${id}`);
  return data;
}
