import {
  IsEnum,
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { TipoExcepcion } from "@prisma/client";
import { EsHoraValida } from "../utils/es-hora-valida.decorator";

export class CrearExcepcionHorarioDto {
  @ApiProperty({ example: "2026-12-25" })
  @IsDateString()
  fecha_desde: string;

  @ApiProperty({ example: "2026-12-25" })
  @IsDateString()
  fecha_hasta: string;

  @ApiProperty({ enum: TipoExcepcion, example: TipoExcepcion.bloqueo_total })
  @IsEnum(TipoExcepcion)
  tipo: TipoExcepcion;

  @ApiPropertyOptional({ example: "Feriado nacional" })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  descripcion?: string;

  // Solo tienen sentido (y son obligatorios) cuando tipo = horario_especial.
  // Con bloqueo_total no deben mandarse.
  @ApiPropertyOptional({
    example: "09:00",
    description: "Requerido solo si tipo = horario_especial",
  })
  @ValidateIf(
    (dto: CrearExcepcionHorarioDto) => dto.tipo === TipoExcepcion.horario_especial,
  )
  @EsHoraValida()
  hora_inicio?: string;

  @ApiPropertyOptional({
    example: "14:00",
    description: "Requerido solo si tipo = horario_especial",
  })
  @ValidateIf(
    (dto: CrearExcepcionHorarioDto) => dto.tipo === TipoExcepcion.horario_especial,
  )
  @EsHoraValida()
  hora_fin?: string;
}