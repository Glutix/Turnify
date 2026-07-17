// src/modules/auth/notificadores/notificador-otp.abstract.ts
export abstract class NotificadorOtp {
  abstract enviarCodigo(telefono: string, codigo: string): Promise<void>;
}
