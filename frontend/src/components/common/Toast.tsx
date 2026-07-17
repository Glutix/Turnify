import { useEffect } from "react";

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
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div
      role="status"
      className={`rounded-lg px-5 py-3 text-sm text-espresso shadow-md ${TYPE_STYLES[type]}`}
    >
      {message}
    </div>
  );
}