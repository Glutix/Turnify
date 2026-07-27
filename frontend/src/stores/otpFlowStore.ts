import { create } from "zustand";
import { persist } from "zustand/middleware";

interface OtpFlowState {
  telefono: string;
  cooldownHasta: number;
  setTelefono: (telefono: string) => void;
  registrarIntento: () => void;
}

// Debe coincidir exactamente con el ttl del ThrottlerGuard en el backend
// (auth.controller.ts, endpoint /auth/solicitar-codigo).
const COOLDOWN_SEGUNDOS = 10;

export const useOtpFlowStore = create<OtpFlowState>()(
  persist(
    (set) => ({
      telefono: "",
      cooldownHasta: 0,
      setTelefono: (telefono) => set({ telefono }),
      registrarIntento: () =>
        set({ cooldownHasta: Date.now() + COOLDOWN_SEGUNDOS * 1000 }),
    }),
    { name: "turnify-otp-flow" },
  ),
);
