// backend\src\modules\auth\dto\registro.dto.ts
import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, Matches, MaxLength } from "class-validator";

export class RegistroDto {
  @ApiProperty({ example: "3644-401020" })
  @IsString()
  @Matches(/^\d{4}-?\d{6}$/, {
    message: "El teléfono debe tener el formato 3644-401020",
  })
  telefono: string;

  @ApiProperty({ example: "Gisela" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;

  @ApiProperty({ example: "Toloza" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  apellido: string;
}
