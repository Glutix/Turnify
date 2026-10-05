// backend\src\modules\auth\dto\login.dto.ts
import { ApiProperty } from "@nestjs/swagger";
import { IsString, Matches, MaxLength, MinLength } from "class-validator";

export class LoginDto {
  @ApiProperty({ example: "3644-401020", description: "Teléfono con el que se registró" })
  @IsString()
  @Matches(/^\+?[\d\s()-]{8,20}$/, { message: "El teléfono no tiene un formato válido" })
  telefono: string;

  @ApiProperty({ example: "mi-contraseña-segura" })
  @IsString()
  @MinLength(1, { message: "Ingresá tu contraseña" })
  @MaxLength(128)
  password: string;
}
