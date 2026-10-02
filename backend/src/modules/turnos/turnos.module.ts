import { Module } from "@nestjs/common";
import { TurnosController } from "./turnos.controller";
import { TurnosService } from "./turnos.service";
import { HorariosModule } from "../horarios/horarios.module";

@Module({
  imports: [HorariosModule], // para obtenerFranjasActivasPorFecha / obtenerExcepcionesParaFecha
  controllers: [TurnosController],
  providers: [TurnosService],
  exports: [TurnosService], // usuarios lo va a necesitar para CU-28/RF43
})
export class TurnosModule {}