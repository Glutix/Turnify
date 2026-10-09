import { create } from "zustand";

// "error" se agregó para avisar fallos (antes solo había tipos de éxito).
export type TipoToast = "creacion" | "actualizacion" | "eliminacion" | "error";

export interface ToastItem {
  id: number;
  tipo: TipoToast;
  mensaje: string;
}

interface ToastState {
  toasts: ToastItem[];
  mostrarToast: (tipo: TipoToast, mensaje: string) => void;
  cerrarToast: (id: number) => void;
}

let siguienteId = 0;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  mostrarToast: (tipo, mensaje) =>
    set((state) => ({
      toasts: [...state.toasts, { id: ++siguienteId, tipo, mensaje }],
    })),
  cerrarToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
