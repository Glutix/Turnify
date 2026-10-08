// backend\src\modules\auth\dto\establecer-password.dto.ts
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class EstablecerPasswordDto {
  @ApiPropertyOptional({ description: "Obligatoria solo si ya tenés una contraseña guardada" })
  @IsString()
  @IsOptional()
  @MaxLength(128)
  passwordActual?: string;

  @ApiProperty({ description: "Mínimo 8 caracteres" })
  @IsString()
  @MinLength(8, { message: "La contraseña debe tener al menos 8 caracteres" })
  @MaxLength(128)
  passwordNueva: string;
}
