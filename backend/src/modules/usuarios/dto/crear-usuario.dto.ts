import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  MaxLength,
  MinLength,
  Matches,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { RolUsuario } from "@prisma/client";

export class CrearUsuarioDto {
  @ApiProperty({ example: "María", description: "Nombre del usuario" })
  @IsString()
  @MinLength(1, { message: "El nombre es obligatorio" })
  @MaxLength(100)
  nombre: string;

  @ApiPropertyOptional({ example: "González" })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  apellido?: string;

  @ApiPropertyOptional({
    example: "3644123456",
    description: "Se normaliza a +549… igual que en el login por OTP",
  })
  @IsString()
  @IsOptional()
  @Matches(/^\+?[\d\s()-]{8,20}$/, { message: "El teléfono no tiene un formato válido" })
  telefono?: string;

  @ApiPropertyOptional({ example: "maria@gmail.com" })
  @IsEmail()
  @IsOptional()
  @MaxLength(150)
  email?: string;

  @ApiPropertyOptional({ example: "Av. Siempre Viva 123" })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  direccion?: string;

  @ApiPropertyOptional({
    enum: RolUsuario,
    default: RolUsuario.cliente,
    description: "Solo lo usa el panel admin al dar de alta. No se puede editar por PATCH /:id.",
  })
  @IsEnum(RolUsuario, { message: "rol no es válido" })
  @IsOptional()
  rol?: RolUsuario;
}
