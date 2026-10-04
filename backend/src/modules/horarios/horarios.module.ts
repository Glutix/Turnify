import { Module } from "@nestjs/common";
import { HorariosController } from "./horarios.controller";
import { HorariosService } from "./horarios.service";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule], // JwtModule para los guards (JwtAuthGuard / RolesGuard)
  controllers: [HorariosController],
  providers: [HorariosService],
  exports: [HorariosService], // el módulo de turnos lo va a necesitar
})
export class HorariosModule {}