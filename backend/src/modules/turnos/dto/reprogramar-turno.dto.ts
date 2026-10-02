import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, Matches } from "class-validator";

export class ReprogramarTurnoDto {
  @ApiProperty({
    example: "3644401020",
    description: "Teléfono del cliente, para confirmar que el turno es suyo",
  })
  @IsString()
  @IsNotEmpty()
  telefono: string;

  @ApiProperty({ example: "2026-10-18" })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: "fecha debe tener formato YYYY-MM-DD" })
  fecha: string;

  @ApiProperty({ example: "10:00", description: "Formato HH:mm" })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "hora_inicio debe tener formato HH:mm" })
  hora_inicio: string;
}