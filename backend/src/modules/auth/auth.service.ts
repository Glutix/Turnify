import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../../prisma/prisma.service";
import { NotificadorOtp } from "./notificadores/notificador-otp.abstract";
import { normalizarTelefono } from "./utils/normalizar-telefono";

const MAX_INTENTOS_CODIGO = 5;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificador: NotificadorOtp,
    private readonly jwtService: JwtService,
  ) {}

  async solicitarCodigo(telefonoCrudo: string): Promise<void> {
    const telefono = normalizarTelefono(telefonoCrudo);
    const codigo = this.generarCodigo();

    await this.prisma.otpVerificacion.create({
      data: {
        telefono,
        codigo,
        expira_en: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    try {
      await this.notificador.enviarCodigo(telefono, codigo);
    } catch (error) {
      const mensaje =
        error instanceof Error ? error.message : "No se pudo enviar el código";
      throw new BadRequestException(mensaje);
    }
  }

  async validarCodigo(telefonoCrudo: string, codigo: string) {
    const telefono = normalizarTelefono(telefonoCrudo);

    const registro = await this.prisma.otpVerificacion.findFirst({
      where: { telefono, verificado: false, expira_en: { gt: new Date() } },
      orderBy: { fecha_creacion: "desc" },
    });

    if (!registro) {
      throw new BadRequestException("Código inválido o expirado");
    }

    if (registro.intentos >= MAX_INTENTOS_CODIGO) {
      throw new BadRequestException({
        message: "Superaste el máximo de intentos, pedí un código nuevo",
        intentosRestantes: 0,
      });
    }

    if (registro.codigo !== codigo) {
      const actualizado = await this.prisma.otpVerificacion.update({
        where: { id: registro.id },
        data: { intentos: { increment: 1 } },
      });

      const intentosRestantes = Math.max(
        MAX_INTENTOS_CODIGO - actualizado.intentos,
        0,
      );

      throw new UnauthorizedException({
        message: "Código incorrecto",
        intentosRestantes,
      });
    }

    await this.prisma.otpVerificacion.update({
      where: { id: registro.id },
      data: { verificado: true },
    });

    const usuario = await this.prisma.usuario.findUnique({
      where: { telefono },
    });

    if (!usuario) {
      return { requiereRegistro: true, telefono: telefonoCrudo };
    }

    const token = this.firmarToken(usuario.id, usuario.rol);

    return { requiereRegistro: false, token, usuario };
  }

  async registrarUsuario(
    telefonoCrudo: string,
    nombre: string,
    apellido: string,
  ) {
    const telefono = normalizarTelefono(telefonoCrudo);

    const yaExiste = await this.prisma.usuario.findUnique({
      where: { telefono },
    });
    if (yaExiste) {
      throw new BadRequestException("Ya existe una cuenta con ese teléfono");
    }

    const verificacionReciente = await this.prisma.otpVerificacion.findFirst({
      where: {
        telefono,
        verificado: true,
        fecha_creacion: { gt: new Date(Date.now() - 10 * 60 * 1000) },
      },
      orderBy: { fecha_creacion: "desc" },
    });

    if (!verificacionReciente) {
      throw new UnauthorizedException(
        "El teléfono no fue verificado recientemente",
      );
    }

    const usuario = await this.prisma.usuario.create({
      data: { telefono, nombre, apellido, rol: "cliente" },
    });

    const token = this.firmarToken(usuario.id, usuario.rol);

    return { token, usuario };
  }

  private firmarToken(usuarioId: number, rol: string): string {
    return this.jwtService.sign({ sub: usuarioId, rol });
  }

  private generarCodigo(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
