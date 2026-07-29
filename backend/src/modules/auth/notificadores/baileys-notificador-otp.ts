import { Injectable, Logger, type OnModuleInit } from "@nestjs/common";
import { rm } from "node:fs/promises";
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  type WASocket,
} from "@whiskeysockets/baileys";
import { type Boom } from "@hapi/boom";
import { NotificadorOtp } from "./notificador-otp.abstract";
import qrcode from "qrcode-terminal";
import P from "pino";

const CARPETA_SESION = "baileys-auth";

@Injectable()
export class BaileysNotificadorOtp
  extends NotificadorOtp
  implements OnModuleInit
{
  private readonly logger = new Logger(BaileysNotificadorOtp.name);
  private socket?: WASocket;

  async onModuleInit(): Promise<void> {
    await this.conectar();
  }

  private async conectar(): Promise<void> {
    const { state, saveCreds } = await useMultiFileAuthState(CARPETA_SESION);

    this.socket = makeWASocket({
      auth: state,
      logger: P({ level: "error" }),
    });

    this.socket.ev.on("creds.update", saveCreds);

    this.socket.ev.on("connection.update", (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        this.logger.log(
          "Escaneá este QR con tu WhatsApp para conectar la sesión de prueba",
        );
        qrcode.generate(qr, { small: true });
      }

      if (connection === "open") {
        this.logger.log("Sesión de WhatsApp (Baileys) conectada");
      }

      if (connection === "close") {
        const motivo = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const sesionInvalida = motivo === DisconnectReason.loggedOut;

        this.logger.warn(
          `Conexión cerrada (código: ${motivo}). Reconectando: ${!sesionInvalida}`,
        );

        if (sesionInvalida) {
          this.reiniciarSesion();
          return;
        }

        this.conectar();
      }
    });
  }

  private async reiniciarSesion(): Promise<void> {
    try {
      await rm(CARPETA_SESION, { recursive: true, force: true });
      this.logger.warn(
        "Sesión de WhatsApp inválida — carpeta de credenciales eliminada. Generando QR nuevo...",
      );
    } catch (error) {
      this.logger.error("No se pudo borrar la carpeta de sesión", error);
    }

    await this.conectar();
  }

  async enviarCodigo(telefono: string, codigo: string): Promise<void> {
    if (!this.socket) {
      throw new Error("WhatsApp no está conectado todavía");
    }

    const jid = `${telefono.replace(/\D/g, "")}@s.whatsapp.net`;

    this.logger.log(`Enviando OTP a ${jid}`);

    const resultado = await this.socket.onWhatsApp(jid);

    if (!resultado?.[0]?.exists) {
      throw new Error("El número no está registrado en WhatsApp");
    }

    await this.socket.sendMessage(jid, {
      text: `Tu código de verificación para Turnify es: ${codigo}. Vence en 5 minutos.`,
    });

    this.logger.log("OTP enviado correctamente");
  }
}
