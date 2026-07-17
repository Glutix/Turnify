import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  MaxLength,
  MinLength,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CrearServicioDto {
  @ApiProperty({
    example: 1,
    description: "ID de la categoría a la que pertenece el servicio",
  })
  @IsInt()
  categoria_id: number;

  @ApiProperty({ example: "Microblading", description: "Nombre del servicio" })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  nombre: string;

  @ApiPropertyOptional({
    example: "Técnica de pigmentación de cejas pelo a pelo",
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  descripcion?: string;

  @ApiProperty({
    example: 100,
    description: "Duración estimada en minutos (máximo 4 horas = 240 min)",
  })
  @IsInt()
  @Min(1)
  @Max(240)
  duracion_minutos: number;

  @ApiProperty({
    example: 15000,
    description: "Precio del servicio en pesos enteros (sin centavos)",
  })
  @IsInt()
  @Min(0)
  precio: number;
}
