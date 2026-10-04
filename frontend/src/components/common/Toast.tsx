import { useEffect, useRef } from "react";

type ToastType = "success" | "error";

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

const TYPE_STYLES: Record<ToastType, string> = {
  success: "border-l-4 border-oro bg-superficie",
  error: "border-l-4 border-rosewood bg-superficie",
};

export function Toast({ message, type, onClose, duration = 4000 }: ToastProps) {
  // onClose va en un ref para que el temporizador no se reinicie cada vez que
  // la página se re-renderiza y le pasa una función nueva.
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // message y type van en las dependencias para que un toast nuevo, que
  // reemplaza a otro todavía visible, arranque su propio conteo.
  useEffect(() => {
    const timer = setTimeout(() => onCloseRef.current(), duration);
    return () => clearTimeout(timer);
  }, [message, type, duration]);

  return (
    <div className="fixed bottom-6 left-4 right-4 z-[60] sm:left-auto sm:right-6 sm:max-w-sm">
      <div
        role="status"
        className={`rounded-lg px-5 py-3 text-sm text-espresso shadow-md ${TYPE_STYLES[type]}`}
      >
        {message}
      </div>
    </div>
  );
}
