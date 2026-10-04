// DTO para actualizar un usuario.
// PartialType hace que todos los campos sean opcionales (PATCH parcial).
// OmitType saca "rol": el rol NO se puede cambiar por este endpoint (lo puede
// usar un cliente editando sus propios datos); tiene su propio endpoint admin.

import { OmitType, PartialType } from "@nestjs/mapped-types";
import { CrearUsuarioDto } from "./crear-usuario.dto";

export class ActualizarUsuarioDto extends PartialType(
  OmitType(CrearUsuarioDto, ["rol"] as const),
) {}
