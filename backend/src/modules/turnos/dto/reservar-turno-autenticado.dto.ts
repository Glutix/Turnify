import { ApiProperty } from "@nestjs/swagger";
import { IsArray, ArrayNotEmpty, IsInt, IsString, IsNotEmpty, Matches } from "class-validator";

// Reserva con sesión iniciada: nombre y teléfono NO se piden (salen del token).
// El código OTP se sigue pidiendo como verificación anti-bot.
export class ReservarTurnoAutenticadoDto {
  @ApiProperty({ example: [1, 2], description: "IDs de los servicios elegidos" })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  servicios: number[];

  @ApiProperty({ example: "2026-10-15" })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: "fecha debe tener formato YYYY-MM-DD" })
  fecha: string;

  @ApiProperty({ example: "09:00", description: "Formato HH:mm" })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "hora_inicio debe tener formato HH:mm" })
  hora_inicio: string;

  @ApiProperty({
    example: "123456",
    description: "Código OTP enviado por WhatsApp al teléfono del usuario logueado",
  })
  @IsString()
  @IsNotEmpty()
  codigo: string;
}
