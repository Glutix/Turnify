import { IsString, IsEmail, IsOptional } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CrearUsuarioDto {
  @ApiProperty({ example: "María", description: "Nombre del usuario" })
  @IsString()
  nombre: string;

  @ApiPropertyOptional({ example: "González" })
  @IsString()
  @IsOptional()
  apellido?: string;

  @ApiPropertyOptional({ example: "3644123456" })
  @IsString()
  @IsOptional()
  telefono?: string;

  @ApiPropertyOptional({ example: "maria@gmail.com" })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: "Av. Siempre Viva 123" })
  @IsString()
  @IsOptional()
  direccion?: string;
}
