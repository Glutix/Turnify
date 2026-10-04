import { SetMetadata } from "@nestjs/common";
import { type RolUsuario } from "@prisma/client";

export const ROLES_KEY = "roles";

// Roles permitidos para una ruta. Se evalúa en RolesGuard.
export const Roles = (...roles: RolUsuario[]) => SetMetadata(ROLES_KEY, roles);
