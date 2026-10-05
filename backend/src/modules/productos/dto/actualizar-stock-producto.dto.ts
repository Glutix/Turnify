import { IsInt, Max, Min } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class ActualizarStockProductoDto {
  @ApiProperty({
    example: 25,
    description:
      "Nueva cantidad disponible (valor absoluto, no una diferencia)",
  })
  @IsInt({ message: "El stock debe ser un número entero" })
  @Min(0, { message: "El stock no puede ser negativo" })
  @Max(1000000, { message: "El stock no puede superar 1.000.000" })
  stock: number;
}
