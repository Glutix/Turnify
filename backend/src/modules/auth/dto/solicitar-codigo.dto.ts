//backend\src\modules\auth\dto\solicitar-codigo.dto.ts
import { ApiProperty } from "@nestjs/swagger";
import { IsString, Matches } from "class-validator";

export class SolicitarCodigoDto {
  @ApiProperty({
    example: "3644-401020",
    description: "Teléfono en formato característica-número, sin +54",
  })
  @IsString()
  @Matches(/^\d{4}-?\d{6}$/, {
    message: "El teléfono debe tener el formato 3644-401020",
  })
  telefono: string;
}
