// backend\src\modules\auth\dto\validar-codigo.dto.ts
import { ApiProperty } from "@nestjs/swagger";
import { IsString, Matches } from "class-validator";

export class ValidarCodigoDto {
  @ApiProperty({ example: "3644-401020" })
  @IsString()
  @Matches(/^\d{4}-?\d{6}$/, {
    message: "El teléfono debe tener el formato 3644-401020",
  })
  telefono: string;

  @ApiProperty({ example: "123456" })
  @IsString()
  @Matches(/^\d{6}$/, { message: "El código debe tener 6 dígitos" })
  codigo: string;
}
