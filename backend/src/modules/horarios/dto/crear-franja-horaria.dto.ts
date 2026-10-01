import { IsEnum } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { DiaSemana } from "@prisma/client";
import { EsHoraValida } from "../utils/es-hora-valida.decorator";

export class CrearFranjaHorariaDto {
  @ApiProperty({ enum: DiaSemana, example: DiaSemana.lunes })
  @IsEnum(DiaSemana, { message: "dia_semana inválido" })
  dia_semana: DiaSemana;

  @ApiProperty({ example: "09:00", description: "Formato HH:mm" })
  @EsHoraValida()
  hora_inicio: string;

  @ApiProperty({ example: "13:00", description: "Formato HH:mm" })
  @EsHoraValida()
  hora_fin: string;

  // activo NO se expone acá: es un campo controlado por el sistema.
  // Toda franja nace activa; se fuerza en el service.
}

// Nota: el chequeo de que hora_fin > hora_inicio se hace en el service,
// no acá, porque class-validator no compara fácil dos props sin acoplar
// el DTO a lógica de negocio.