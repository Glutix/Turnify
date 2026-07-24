import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ThrottlerModule } from "@nestjs/throttler";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { NotificadorOtp } from "./notificadores/notificador-otp.abstract";
import { ConsoleNotificadorOtp } from "./notificadores/console-notificador-otp";
import { BaileysNotificadorOtp } from "./notificadores/baileys-notificador-otp";
import { PrismaModule } from "../../prisma/prisma.module";
import { validarEnvJwt } from "./utils/validar-env-jwt";

const envJwt = validarEnvJwt();

@Module({
  imports: [
    PrismaModule,
    ThrottlerModule.forRoot([{ name: "default", ttl: 10000, limit: 1 }]),
    JwtModule.register({
      secret: envJwt.secret,
      signOptions: { expiresIn: envJwt.expiresIn },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    {
      provide: NotificadorOtp,
      useClass:
        process.env.OTP_CANAL === "baileys"
          ? BaileysNotificadorOtp
          : ConsoleNotificadorOtp,
    },
  ],
})
export class AuthModule {}
