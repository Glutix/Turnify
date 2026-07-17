// DTO para actualizar un servicio.
// PartialType hace que todos los campos del DTO original sean opcionales,
// lo cual es perfecto para PATCH (actualización parcial).

import { PartialType } from "@nestjs/mapped-types";
import { CrearServicioDto } from "./crear-servicio.dto";

export class ActualizarServicioDto extends PartialType(CrearServicioDto) {}
