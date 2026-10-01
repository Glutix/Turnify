// DTO para actualizar una franja horaria.
// PartialType hace que todos los campos del DTO original sean opcionales,
// lo cual es perfecto para PATCH (actualización parcial).

import { PartialType } from "@nestjs/mapped-types";
import { CrearFranjaHorariaDto } from "./crear-franja-horaria.dto";

export class ActualizarFranjaHorariaDto extends PartialType(
  CrearFranjaHorariaDto,
) {}