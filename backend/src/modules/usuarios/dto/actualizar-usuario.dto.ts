// DTO para actualizar un usuario.
// PartialType hace que todos los campos del DTO original sean opcionales,
// lo cual es perfecto para PATCH (actualización parcial).

import { PartialType } from "@nestjs/mapped-types";
import { CrearUsuarioDto } from "./crear-usuario.dto";

export class ActualizarUsuarioDto extends PartialType(CrearUsuarioDto) {}
// Hereda todos los campos de CrearUsuarioDto pero los hace opcionales.
// Evita duplicar validaciones entre crear y actualizar.
