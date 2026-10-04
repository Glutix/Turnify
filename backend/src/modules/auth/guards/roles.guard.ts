import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
// Import de VALOR a propósito: Nest necesita la clase en runtime para inyectarla.
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { Reflector } from "@nestjs/core";
import { type RolUsuario } from "@prisma/client";
import { ROLES_KEY } from "../decorators/roles.decorator";
import { type RequestAutenticada } from "../types/usuario-autenticado";

/**
 * Verifica el rol del usuario contra @Roles(...). Siempre va DESPUÉS de
 * JwtAuthGuard (que es quien completa request.user). Responde 403 si el
 * usuario está logueado pero no tiene el rol requerido.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const rolesPermitidos = this.reflector.getAllAndOverride<RolUsuario[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!rolesPermitidos || rolesPermitidos.length === 0) return true;

    const { user } = context.switchToHttp().getRequest<RequestAutenticada>();

    if (!user || !rolesPermitidos.includes(user.rol)) {
      throw new ForbiddenException("No tenés permisos para realizar esta acción");
    }
    return true;
  }
}
