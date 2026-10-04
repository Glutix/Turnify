import { type RolUsuario } from "@prisma/client";

// Usuario que JwtAuthGuard deja adjunto en la request. El rol sale de la base
// de datos (no del token), así un cambio de rol se aplica de inmediato.
export interface UsuarioAutenticado {
  id: number;
  rol: RolUsuario;
}

// Forma mínima de la request que necesitan los guards (evita depender de express).
export interface RequestAutenticada {
  headers: { authorization?: string };
  user?: UsuarioAutenticado;
}
