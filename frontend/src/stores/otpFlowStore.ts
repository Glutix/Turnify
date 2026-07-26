import { create } from "zustand";
import { persist } from "zustand/middleware";

export type LoginStep = "telefono" | "codigo" | "registro" | "credenciales";

interface OtpFlowState {
  telefono: string;
  intentos: number;
  cooldownHasta: number;
  step: LoginStep;
  setTelefono: (telefono: string) => void;
  registrarIntento: () => void;
  setStep: (step: LoginStep) => void;
}

const COOLDOWN_BASE_SEGUNDOS = 10;
const UMBRAL_INTENTOS = 3;
const COOLDOWN_EXTENDIDO_SEGUNDOS = 60;
const VENTANA_REINICIO_MS = 5 * 60 * 1000;

export const useOtpFlowStore = create<OtpFlowState>()(
  persist(
    (set, get) => ({
      telefono: "",
      intentos: 0,
      cooldownHasta: 0,
      step: "telefono",
      setTelefono: (telefono) => set({ telefono }),
      setStep: (step) => set({ step }),
      registrarIntento: () => {
        const { intentos, cooldownHasta } = get();
        const esNuevaSerie =
          cooldownHasta === 0 ||
          Date.now() - cooldownHasta > VENTANA_REINICIO_MS;
        const nuevosIntentos = esNuevaSerie ? 1 : intentos + 1;
        const segundos =
          nuevosIntentos > UMBRAL_INTENTOS
            ? COOLDOWN_EXTENDIDO_SEGUNDOS
            : COOLDOWN_BASE_SEGUNDOS;

        set({
          intentos: nuevosIntentos,
          cooldownHasta: Date.now() + segundos * 1000,
        });
      },
    }),
    { name: "turnify-otp-flow" },
  ),
);
