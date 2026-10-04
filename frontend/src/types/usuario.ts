export type RolUsuario = "cliente" | "admin";

export interface Usuario {
  id: number;
  nombre: string;
  apellido: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  rol: RolUsuario;
  perfil_completo: boolean;
  fecha_alta: string;
}

export interface CrearUsuarioPayload {
  nombre: string;
  apellido?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  rol?: RolUsuario;
}

// El rol NO se edita por acá: tiene su propia acción (cambiarRolUsuario).
export type ActualizarUsuarioPayload = Partial<Omit<CrearUsuarioPayload, "rol">>;

export interface FiltrosUsuarios {
  busqueda?: string;
  rol?: RolUsuario;
}

export const ETIQUETA_ROL: Record<RolUsuario, string> = {
  cliente: "Cliente",
  admin: "Administrador",
};

export function nombreCompleto(usuario: Pick<Usuario, "nombre" | "apellido">): string {
  return `${usuario.nombre} ${usuario.apellido ?? ""}`.trim();
}
