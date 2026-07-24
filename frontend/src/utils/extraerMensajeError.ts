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
