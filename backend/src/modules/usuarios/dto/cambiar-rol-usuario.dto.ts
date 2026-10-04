import { IsEnum } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { RolUsuario } from "@prisma/client";

export class CambiarRolUsuarioDto {
  @ApiProperty({ enum: RolUsuario, example: RolUsuario.admin })
  @IsEnum(RolUsuario, { message: "rol no es válido" })
  rol: RolUsuario;
}
