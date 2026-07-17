import { type StringValue } from "ms";

interface EnvJwt {
  secret: string;
  expiresIn: StringValue;
}

/**
 * Valida que las variables de entorno de JWT existan antes de arrancar
 * la app. Si falta alguna, tira un error claro en vez de fallar en
 * runtime más adelante con un mensaje confuso de la librería `jsonwebtoken`.
 */
export function validarEnvJwt(): EnvJwt {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN;

  if (!secret) {
    throw new Error("Falta la variable de entorno JWT_SECRET");
  }

  if (!expiresIn) {
    throw new Error("Falta la variable de entorno JWT_EXPIRES_IN");
  }

  return { secret, expiresIn: expiresIn as StringValue };
}
