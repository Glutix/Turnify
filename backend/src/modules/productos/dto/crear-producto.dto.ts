import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CrearProductoDto {
  @ApiProperty({ example: 1, description: "Id de la categoría de producto" })
  @IsInt({ message: "categoria_id debe ser un número entero" })
  @Min(1, { message: "categoria_id debe ser mayor o igual a 1" })
  categoria_id: number;

  @ApiProperty({ example: "Shampoo reparador 500 ml" })
  @IsString({ message: "El nombre debe ser un texto" })
  @MinLength(2, { message: "El nombre debe tener al menos 2 caracteres" })
  @MaxLength(150, { message: "El nombre no puede superar los 150 caracteres" })
  nombre: string;

  @ApiPropertyOptional({
    example: "Shampoo para cabello dañado",
    type: String,
    nullable: true,
  })
  // El ValidationPipe global tiene transform: true, por eso un "" llega acá como null
  @Transform(({ value }) =>
    typeof value === "string" && value.trim() === "" ? null : value,
  )
  @IsOptional()
  @IsString({ message: "La descripción debe ser un texto" })
  @MaxLength(1000, {
    message: "La descripción no puede superar los 1000 caracteres",
  })
  descripcion?: string | null;

  @ApiProperty({ example: 8500.5, description: "Precio con hasta 2 decimales" })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: "El precio debe ser un número con hasta 2 decimales" },
  )
  @Min(0.01, { message: "El precio debe ser mayor o igual a 0,01" })
  @Max(99999999.99, { message: "El precio no puede superar 99.999.999,99" })
  precio: number;

  @ApiPropertyOptional({
    example: 10,
    default: 0,
    description: "Stock inicial",
  })
  @IsInt({ message: "El stock debe ser un número entero" })
  @Min(0, { message: "El stock no puede ser negativo" })
  @Max(1000000, { message: "El stock no puede superar 1.000.000" })
  @IsOptional()
  stock?: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsBoolean({ message: "activo debe ser verdadero o falso" })
  @IsOptional()
  activo?: boolean;
}
