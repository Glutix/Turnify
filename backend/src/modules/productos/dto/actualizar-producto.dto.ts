import { OmitType, PartialType } from "@nestjs/mapped-types";
import { CrearProductoDto } from "./crear-producto.dto";

// El stock se ajusta solo por PATCH :id/stock, para que editar el producto
// no pise un descuento de stock hecho por una compra en el medio.
export class ActualizarProductoDto extends PartialType(
  OmitType(CrearProductoDto, ["stock"] as const),
) {}
