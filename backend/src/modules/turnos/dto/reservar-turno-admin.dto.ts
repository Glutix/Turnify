import { ApiPropertyOptional, ApiProperty } from "@nestjs/swagger";
import {
  IsArray,
  ArrayNotEmpty,
  IsInt,
  IsString,
  Matches,
  ValidateIf,
} from "class-validator";

// La admin puede cargar el turno para un cliente ya existente (usuario_id)
// o para uno nuevo (nombre + telefono, igual que haría un invitado, pero
// sin pasar por OTP porque lo está cargando ella a mano — ej. reserva que
// le llegó por WhatsApp o en persona).
export class ReservarTurnoAdminDto {
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

  @ApiPropertyOptional({ example: 7, description: "Usar si el cliente ya existe" })
  @ValidateIf((dto: ReservarTurnoAdminDto) => !dto.nombre && !dto.telefono)
  @IsInt()
  usuario_id?: number;

  @ApiPropertyOptional({ example: "María", description: "Usar si el cliente es nuevo" })
  @ValidateIf((dto: ReservarTurnoAdminDto) => !dto.usuario_id)
  @IsString()
  nombre?: string;

  @ApiPropertyOptional({ example: "3644401020", description: "Usar si el cliente es nuevo" })
  @ValidateIf((dto: ReservarTurnoAdminDto) => !dto.usuario_id)
  @IsString()
  telefono?: string;
}