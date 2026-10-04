import { PartialType } from "@nestjs/mapped-types";
import { CrearCategoriaProductoDto } from "./crear-categoria-producto.dto";

export class ActualizarCategoriaProductoDto extends PartialType(
  CrearCategoriaProductoDto,
) {}
