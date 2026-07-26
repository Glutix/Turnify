//Turnify\frontend\src\stores\authStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Usuario {
  id: number;
  nombre: string;
  apellido?: string;
  telefono: string;
  rol: "cliente" | "admin";
  perfil_completo: boolean;
}

interface AuthStore {
  usuario: Usuario | null;
  token: string | null;

  setAuth: (usuario: Usuario, token: string) => void;

  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      usuario: null,
      token: null,

      setAuth: (usuario, token) =>
        set({
          usuario,
          token,
        }),

      logout: () =>
        set({
          usuario: null,
          token: null,
        }),
    }),
    {
      name: "auth-storage",
    },
  ),
);
