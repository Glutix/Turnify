import { IsString, IsOptional, MaxLength, MinLength } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CrearCategoriaDto {
  @ApiProperty({
    example: "Pigmentación de cejas",
    description: "Nombre de la categoría",
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  nombre: string;

  @ApiPropertyOptional({
    example: "Servicios de micropigmentación y diseño de cejas",
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  descripcion?: string;
}
