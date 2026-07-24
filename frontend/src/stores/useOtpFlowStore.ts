import { create } from "zustand";
import { persist } from "zustand/middleware";

interface OtpFlowState {
  /** Último teléfono tipeado/enviado. Persiste para no perderlo al refrescar. */
  telefono: string;
  intentos: number;
  /** Timestamp (epoch ms) hasta cuándo dura el cooldown. 0 = sin cooldown activo. */
  cooldownHasta: number;
  setTelefono: (telefono: string) => void;
  registrarIntento: () => void;
}

const TOPE_SEGUNDOS = 60;
// Si pasó más de esto desde que terminó el último cooldown, se considera
// una serie nueva de intentos (evita que el backoff quede pegado en 60s
// para siempre después de un uso normal hace rato).
const VENTANA_REINICIO_MS = 2 * 60 * 1000;

export const useOtpFlowStore = create<OtpFlowState>()(
  persist(
    (set, get) => ({
      telefono: "",
      intentos: 0,
      cooldownHasta: 0,
      setTelefono: (telefono) => set({ telefono }),
      registrarIntento: () => {
        const { intentos, cooldownHasta } = get();
        const esNuevaSerie =
          cooldownHasta === 0 ||
          Date.now() - cooldownHasta > VENTANA_REINICIO_MS;
        const nuevosIntentos = esNuevaSerie ? 1 : intentos + 1;
        const segundos = Math.min(nuevosIntentos * 10, TOPE_SEGUNDOS);

        set({
          intentos: nuevosIntentos,
          cooldownHasta: Date.now() + segundos * 1000,
        });
      },
    }),
    { name: "turnify-otp-flow" },
  ),
);
