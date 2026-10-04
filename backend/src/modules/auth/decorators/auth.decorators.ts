import {
  applyDecorators,
  createParamDecorator,
  type ExecutionContext,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { RolUsuario } from "@prisma/client";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { RolesGuard } from "../guards/roles.guard";
import { Roles } from "./roles.decorator";
import {
  type RequestAutenticada,
  type UsuarioAutenticado,
} from "../types/usuario-autenticado";

/** Ruta solo para administradores (401 sin token, 403 si no es admin). */
export const SoloAdmin = () =>
  applyDecorators(
    UseGuards(JwtAuthGuard, RolesGuard),
    Roles(RolUsuario.admin),
    ApiBearerAuth(),
  );

/** Ruta para cualquier usuario logueado (la regla de "dueño" va en el service). */
export const Autenticado = () => applyDecorators(UseGuards(JwtAuthGuard), ApiBearerAuth());

/** Inyecta el usuario autenticado (request.user) como parámetro del handler. */
export const UsuarioActual = createParamDecorator(
  (_data: unknown, context: ExecutionContext): UsuarioAutenticado => {
    const request = context.switchToHttp().getRequest<RequestAutenticada>();
    return request.user as UsuarioAutenticado;
  },
);
