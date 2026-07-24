import { Body, Controller, HttpCode, Post, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { ThrottlerGuard, Throttle } from "@nestjs/throttler";

import { AuthService } from "./auth.service";

import { SolicitarCodigoDto } from "./dto/solicitar-codigo.dto";
import { ValidarCodigoDto } from "./dto/validar-codigo.dto";
import { RegistroDto } from "./dto/registro.dto";

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
