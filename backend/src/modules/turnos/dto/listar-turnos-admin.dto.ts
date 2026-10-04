import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, IsString, Matches, Max, Min } from "class-validator";
import { EstadoTurno } from "@prisma/client";

export class ListarTurnosAdminDto {
  @ApiPropertyOptional({ enum: EstadoTurno })
  @IsOptional()
  @IsEnum(EstadoTurno, { message: "estado no es válido" })
  estado?: EstadoTurno;

  @ApiPropertyOptional({ example: "2026-10-01", description: "Desde (inclusive), YYYY-MM-DD" })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: "desde debe tener formato YYYY-MM-DD" })
  desde?: string;

  @ApiPropertyOptional({ example: "2026-10-31", description: "Hasta (inclusive), YYYY-MM-DD" })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: "hasta debe tener formato YYYY-MM-DD" })
  hasta?: string;

  @ApiPropertyOptional({ description: "Nombre, apellido o teléfono del cliente" })
  @IsOptional()
  @IsString()
  busqueda?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pagina?: number;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limite?: number;
}
