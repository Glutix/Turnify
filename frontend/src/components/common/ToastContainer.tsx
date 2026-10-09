import { useEffect, useRef } from "react";
import {
  useToastStore,
  type TipoToast,
  type ToastItem,
} from "../../stores/toastStore";

const DURACION_MS = 5000;

const ESTILOS: Record<TipoToast, { tarjeta: string; barra: string }> = {
  creacion: {
    tarjeta: "border-emerald-200 bg-emerald-50 text-emerald-900",
    barra: "bg-emerald-500",
  },
  actualizacion: {
    tarjeta: "border-blue-200 bg-blue-50 text-blue-900",
    barra: "bg-blue-500",
  },
  eliminacion: {
    tarjeta: "border-red-200 bg-red-50 text-red-900",
    barra: "bg-red-500",
  },
  activacion: {
    tarjeta: "border-emerald-200 bg-emerald-50 text-emerald-900",
    barra: "bg-emerald-500",
  },
  desactivacion: {
    tarjeta: "border-red-200 bg-red-50 text-red-900",
    barra: "bg-red-500",
  },
};

function ToastCard({ toast }: { toast: ToastItem }) {
  const cerrarToast = useToastStore((state) => state.cerrarToast);
  const barraRef = useRef<HTMLDivElement>(null);
  const animacionRef = useRef<Animation | null>(null);
  const estilos = ESTILOS[toast.tipo];

  // La barra y el cierre salen de la misma animación: al pausarla con el
  // mouse se frenan las dos a la vez y no se desfasan.
  useEffect(() => {
    const animacion = barraRef.current?.animate(
      [{ width: "100%" }, { width: "0%" }],
      { duration: DURACION_MS, easing: "linear", fill: "forwards" },
    );
    if (!animacion) return;

    animacionRef.current = animacion;
    animacion.onfinish = () => cerrarToast(toast.id);

    return () => animacion.cancel();
  }, [toast.id, cerrarToast]);

  return (
    <div
      role="status"
      onMouseEnter={() => animacionRef.current?.pause()}
      onMouseLeave={() => animacionRef.current?.play()}
      className={`pointer-events-auto overflow-hidden rounded-lg border shadow-md ${estilos.tarjeta}`}
    >
      <p className="px-4 py-3 text-sm">{toast.mensaje}</p>
      <div className="h-1 w-full bg-black/5">
        <div ref={barraRef} className={`h-full w-full ${estilos.barra}`} />
      </div>
    </div>
  );
}

export function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-6 left-4 right-4 z-60 flex flex-col gap-3 sm:left-auto sm:right-6 sm:w-full sm:max-w-sm"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
