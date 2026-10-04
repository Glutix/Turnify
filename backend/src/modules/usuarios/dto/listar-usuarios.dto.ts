import { IsEnum, IsOptional, IsString } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { RolUsuario } from "@prisma/client";

export class ListarUsuariosDto {
  @ApiPropertyOptional({ description: "Nombre, apellido, email o teléfono" })
  @IsOptional()
  @IsString()
  busqueda?: string;

  @ApiPropertyOptional({ enum: RolUsuario })
  @IsOptional()
  @IsEnum(RolUsuario, { message: "rol no es válido" })
  rol?: RolUsuario;
}
