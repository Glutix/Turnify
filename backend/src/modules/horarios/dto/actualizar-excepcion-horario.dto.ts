import { PartialType } from "@nestjs/mapped-types";
import { CrearExcepcionHorarioDto } from "./crear-excepcion-horario.dto";

export class ActualizarExcepcionHorarioDto extends PartialType(
  CrearExcepcionHorarioDto,
) {}