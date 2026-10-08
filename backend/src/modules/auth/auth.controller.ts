import { Body, Controller, HttpCode, Post, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { ThrottlerGuard, Throttle } from "@nestjs/throttler";

import { AuthService } from "./auth.service";

import { SolicitarCodigoDto } from "./dto/solicitar-codigo.dto";
import { ValidarCodigoDto } from "./dto/validar-codigo.dto";
import { RegistroDto } from "./dto/registro.dto";
// Sin "type" a propósito: son @Body() y ValidationPipe necesita la clase real.
import { LoginDto } from "./dto/login.dto";
import { EstablecerPasswordDto } from "./dto/establecer-password.dto";
import { Autenticado, UsuarioActual } from "./decorators/auth.decorators";
import { type UsuarioAutenticado } from "./types/usuario-autenticado";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("solicitar-codigo")
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 1, ttl: 10000 } })
  @HttpCode(200)
  @ApiOperation({
    summary: "Envía un código OTP de 6 dígitos al teléfono indicado",
  })
  async solicitarCodigo(@Body() dto: SolicitarCodigoDto) {
    await this.authService.solicitarCodigo(dto.telefono);
    return { mensaje: "Código enviado" };
  }

  @Post("validar-codigo")
  @HttpCode(200)
  @ApiOperation({
    summary:
      "Valida el código OTP. Si el teléfono es nuevo, indica que falta registro",
  })
  async validarCodigo(@Body() dto: ValidarCodigoDto) {
    return this.authService.validarCodigo(dto.telefono, dto.codigo);
  }

  @Post("login")
  @HttpCode(200)
  @ApiOperation({
    summary: "Login con teléfono y contraseña. 5 fallos bloquean 15 minutos (429)",
  })
  async login(@Body() dto: LoginDto) {
    return this.authService.loginConPassword(dto.telefono, dto.password);
  }

  @Autenticado()
  @Post("password")
  @HttpCode(200)
  @ApiOperation({ summary: "Crea o cambia la contraseña del usuario logueado" })
  async establecerPassword(
    @Body() dto: EstablecerPasswordDto,
    @UsuarioActual() actual: UsuarioAutenticado,
  ) {
    return this.authService.establecerPassword(actual.id, dto);
  }

  @Post("registro")
  @HttpCode(201)
  @ApiOperation({
    summary: "Crea la cuenta mínima (nombre, apellido, teléfono verificado)",
  })
  async registro(@Body() dto: RegistroDto) {
    return this.authService.registrarUsuario(
      dto.telefono,
      dto.nombre,
      dto.apellido,
    );
  }
}
