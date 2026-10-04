import { IsString, IsOptional, MaxLength, MinLength } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CrearCategoriaProductoDto {
  @ApiProperty({
    example: "Cuidado capilar",
    description: "Nombre de la categoría de producto",
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  nombre: string;

  @ApiPropertyOptional({
    example: "Shampoos, acondicionadores y tratamientos",
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  descripcion?: string;
}
