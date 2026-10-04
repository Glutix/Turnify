import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
// Import de VALOR a propósito: Nest necesita la clase en runtime para inyectarla.
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { JwtService } from "@nestjs/jwt";
// Import de VALOR a propósito: Nest necesita la clase en runtime para inyectarla.
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { PrismaService } from "../../../prisma/prisma.service";
import { type RequestAutenticada } from "../types/usuario-autenticado";

interface PayloadToken {
  sub: number;
  rol: string;
}

/**
 * Exige un JWT válido (header "Authorization: Bearer <token>") y deja el
 * usuario en request.user. Responde 401 si falta el token, es inválido/expiró
 * o el usuario ya no existe (el frontend desloguea ante un 401).
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestAutenticada>();
    const token = this.extraerToken(request);

    if (!token) {
      throw new UnauthorizedException("Falta el token de autenticación");
    }

    let payload: PayloadToken;
    try {
      payload = await this.jwtService.verifyAsync<PayloadToken>(token);
    } catch {
      throw new UnauthorizedException("Token inválido o expirado");
    }

    const usuario = await this.prisma.usuario.findUnique({
      where: { id: payload.sub },
      select: { id: true, rol: true },
    });

    if (!usuario) {
      throw new UnauthorizedException("El usuario de la sesión ya no existe");
    }

    request.user = { id: usuario.id, rol: usuario.rol };
    return true;
  }

  private extraerToken(request: RequestAutenticada): string | undefined {
    const [tipo, token] = request.headers.authorization?.split(" ") ?? [];
    return tipo === "Bearer" ? token : undefined;
  }
}
