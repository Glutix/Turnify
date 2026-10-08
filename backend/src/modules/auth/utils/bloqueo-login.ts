// CU-19: 5 intentos fallidos bloquean temporalmente el acceso.
//
// Se guarda en memoria del proceso (no en la base) para no tocar el schema
// compartido. Consecuencias conocidas: el contador se reinicia si se reinicia el
// backend y no se comparte entre varias instancias. Para un único backend como
// el del salón alcanza; si se escala, mover a una tabla o a Redis.

interface Registro {
  fallos: number;
  ultimoFallo: number;
  bloqueadoHasta: number;
}

export interface ResultadoFallo {
  bloqueado: boolean;
  intentosRestantes: number;
  segundosRestantes: number;
}

export class BloqueoLogin {
  private readonly registros = new Map<string, Registro>();

  constructor(
    private readonly maxIntentos = 5,
    private readonly bloqueoMs = 15 * 60 * 1000,
    private readonly ahora: () => number = () => Date.now(),
  ) {}

  /** Segundos que faltan para que se libere la clave (0 si no está bloqueada). */
  segundosRestantes(clave: string): number {
    const registro = this.registros.get(clave);
    if (!registro || registro.bloqueadoHasta <= this.ahora()) return 0;
    return Math.ceil((registro.bloqueadoHasta - this.ahora()) / 1000);
  }

  registrarFallo(clave: string): ResultadoFallo {
    this.purgarVencidos();

    const ahora = this.ahora();
    const registro = this.registros.get(clave) ?? { fallos: 0, ultimoFallo: ahora, bloqueadoHasta: 0 };

    registro.fallos += 1;
    registro.ultimoFallo = ahora;
    if (registro.fallos >= this.maxIntentos) {
      registro.bloqueadoHasta = ahora + this.bloqueoMs;
    }
    this.registros.set(clave, registro);

    return {
      bloqueado: registro.bloqueadoHasta > ahora,
      intentosRestantes: Math.max(this.maxIntentos - registro.fallos, 0),
      segundosRestantes: this.segundosRestantes(clave),
    };
  }

  limpiar(clave: string): void {
    this.registros.delete(clave);
  }

  // Descarta bloqueos ya vencidos y fallos viejos, para que el mapa no crezca sin límite.
  private purgarVencidos(): void {
    const ahora = this.ahora();
    for (const [clave, registro] of this.registros) {
      const bloqueoVencido = registro.bloqueadoHasta > 0 && registro.bloqueadoHasta <= ahora;
      const ventanaVencida = registro.bloqueadoHasta === 0 && registro.ultimoFallo + this.bloqueoMs <= ahora;
      if (bloqueoVencido || ventanaVencida) this.registros.delete(clave);
    }
  }
}
