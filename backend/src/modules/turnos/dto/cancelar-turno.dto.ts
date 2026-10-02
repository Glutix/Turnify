import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty } from "class-validator";

export class CancelarTurnoDto {
  @ApiProperty({
    example: "3644401020",
    description: "Teléfono del cliente, para confirmar que el turno es suyo",
  })
  @IsString()
  @IsNotEmpty()
  telefono: string;
}