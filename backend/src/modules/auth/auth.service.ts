import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { RolUsuario } from "@prisma/client";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../../prisma/prisma.service";
import { NotificadorOtp } from "./notificadores/notificador-otp.abstract";
import { normalizarTelefono } from "./utils/normalizar-telefono";
import { hashearPassword, verificarPassword } from "./utils/password";
import { BloqueoLogin } from "./utils/bloqueo-login";
import { type EstablecerPasswordDto } from "./dto/establecer-password.dto";

const MAX_INTENTOS_CODIGO = 5;

// Lo que se le devuelve al frontend. NUNCA incluye password_hash.
const SELECT_USUARIO_PUBLICO = {
  id: true,
  nombre: true,
  apellido: true,
  telefono: true,
  email: true,
  rol: true,
  perfil_completo: true,
  direccion: true,
  fecha_alta: true,
} as const;

const MENSAJE_CREDENCIALES_INVALIDAS = "Teléfono o contraseña incorrectos";

@Injectable()
export class AuthService {
  // CU-19: 5 intentos fallidos bloquean el acceso 15 minutos (por teléfono).
  private readonly bloqueoLogin = new BloqueoLogin(5, 15 * 60 * 1000);
  // Para que el tiempo de respuesta no delate si el teléfono existe.
  private hashFalso?: Promise<string>;

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
      select: SELECT_USUARIO_PUBLICO,
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
      select: SELECT_USUARIO_PUBLICO,
    });

    const token = this.firmarToken(usuario.id, usuario.rol);

    return { token, usuario };
  }

  // RF20 / RF30: login con teléfono + contraseña (admin, o cliente con perfil completo).
  async loginConPassword(telefonoCrudo: string, password: string) {
    const telefono = normalizarTelefono(telefonoCrudo);

    const segundos = this.bloqueoLogin.segundosRestantes(telefono);
    if (segundos > 0) throw this.errorBloqueado(segundos);

    const usuario = await this.prisma.usuario.findUnique({
      where: { telefono },
      select: { ...SELECT_USUARIO_PUBLICO, password_hash: true },
    });

    const hash = usuario?.password_hash ?? (await this.obtenerHashFalso());
    const coincide = await verificarPassword(password, hash);
    // RF18: un perfil incompleto solo entra por OTP.
    const habilitado =
      !!usuario?.password_hash &&
      (usuario.rol === RolUsuario.admin || usuario.perfil_completo);

    if (!usuario || !coincide || !habilitado) {
      const fallo = this.bloqueoLogin.registrarFallo(telefono);
      if (fallo.bloqueado) throw this.errorBloqueado(fallo.segundosRestantes);
      // Mismo mensaje exista o no el teléfono: no se revela qué cuentas hay.
      throw new UnauthorizedException({
        message: MENSAJE_CREDENCIALES_INVALIDAS,
        intentosRestantes: fallo.intentosRestantes,
      });
    }

    this.bloqueoLogin.limpiar(telefono);

    const { password_hash, ...usuarioPublico } = usuario;
    void password_hash;
    const token = this.firmarToken(usuario.id, usuario.rol);

    return { requiereRegistro: false, token, usuario: usuarioPublico };
  }

  // Crear o cambiar la contraseña propia. Si ya hay una, exige la actual.
  // Errores con 400/403 (no 401): el interceptor del frontend desloguea ante un 401.
  async establecerPassword(usuarioId: number, dto: EstablecerPasswordDto) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { id: true, rol: true, perfil_completo: true, password_hash: true },
    });
    if (!usuario) throw new NotFoundException("Usuario no encontrado");

    if (usuario.rol !== RolUsuario.admin && !usuario.perfil_completo) {
      throw new ForbiddenException(
        "Completá tu perfil (apellido, email y dirección) para poder crear una contraseña",
      );
    }

    if (usuario.password_hash) {
      const clave = `password:${usuarioId}`;
      const segundos = this.bloqueoLogin.segundosRestantes(clave);
      if (segundos > 0) throw this.errorBloqueado(segundos);

      if (!dto.passwordActual) {
        throw new BadRequestException("Ingresá tu contraseña actual");
      }
      if (!(await verificarPassword(dto.passwordActual, usuario.password_hash))) {
        const fallo = this.bloqueoLogin.registrarFallo(clave);
        if (fallo.bloqueado) throw this.errorBloqueado(fallo.segundosRestantes);
        throw new BadRequestException("La contraseña actual es incorrecta");
      }
      this.bloqueoLogin.limpiar(clave);
    }

    await this.prisma.usuario.update({
      where: { id: usuarioId },
      data: { password_hash: await hashearPassword(dto.passwordNueva) },
    });

    return { mensaje: "Contraseña guardada correctamente" };
  }

  private obtenerHashFalso(): Promise<string> {
    this.hashFalso ??= hashearPassword("contraseña-falsa-para-igualar-tiempos");
    return this.hashFalso;
  }

  private errorBloqueado(segundos: number): HttpException {
    const minutos = Math.max(Math.ceil(segundos / 60), 1);
    return new HttpException(
      {
        message: `Demasiados intentos fallidos. Probá de nuevo en ${minutos} minuto${minutos === 1 ? "" : "s"}.`,
        segundosRestantes: segundos,
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }

  private firmarToken(usuarioId: number, rol: string): string {
    return this.jwtService.sign({ sub: usuarioId, rol });
  }

  private generarCodigo(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
