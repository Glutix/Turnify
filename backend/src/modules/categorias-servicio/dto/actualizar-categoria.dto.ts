// DTO para actualizar una categoría.
// PartialType hace que todos los campos del DTO original sean opcionales,
// lo cual es perfecto para PATCH (actualización parcial).

import { PartialType } from "@nestjs/mapped-types";
import { CrearCategoriaDto } from "./crear-categoria.dto";

export class ActualizarCategoriaDto extends PartialType(CrearCategoriaDto) {}
