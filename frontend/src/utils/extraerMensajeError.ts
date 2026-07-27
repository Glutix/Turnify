import { AxiosError } from "axios";

export function extraerMensajeError(
  error: unknown,
  mensajePorDefecto = "Ocurrió un error. Intentá de nuevo.",
): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as
      { message?: string | string[] } | undefined;

    if (Array.isArray(data?.message)) {
      return data.message[0] ?? mensajePorDefecto;
    }

    if (typeof data?.message === "string") {
      return data.message;
    }
  }

  return mensajePorDefecto;
}

/**
 * Lee `intentosRestantes` de la respuesta del backend, si viene incluido
 * (solo lo manda /auth/validar-codigo cuando el error es por código
 * incorrecto). Devuelve `undefined` para cualquier otro tipo de error
 * (red caída, código expirado, etc.), donde no corresponde tocar el
 * contador de intentos.
 */
export function extraerIntentosRestantes(error: unknown): number | undefined {
  if (error instanceof AxiosError) {
    const data = error.response?.data as
      { intentosRestantes?: number } | undefined;

    if (typeof data?.intentosRestantes === "number") {
      return data.intentosRestantes;
    }
  }

  return undefined;
}
