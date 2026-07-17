// src/modules/auth/notificadores/console-notificador-otp.ts
import { Injectable, Logger } from "@nestjs/common";
import { NotificadorOtp } from "./notificador-otp.abstract";

@Injectable()
export class ConsoleNotificadorOtp extends NotificadorOtp {
  private readonly logger = new Logger(ConsoleNotificadorOtp.name);

  async enviarCodigo(telefono: string, codigo: string): Promise<void> {
    this.logger.log(`[OTP SIMULADO] → ${telefono}: ${codigo}`);
  }
}
