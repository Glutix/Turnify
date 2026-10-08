import { type ReactNode, useEffect } from "react";
import { IconClose } from "./Icons";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: "md" | "lg";
}

export function Modal({ isOpen, onClose, title, children, size = "md" }: ModalProps) {
  // Cierra con la tecla Escape
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-espresso/40 px-4"
      onClick={onClose}
    >
      <div
        className={`max-h-[90vh] w-full overflow-y-auto rounded-2xl bg-superficie p-6 shadow-lg ${
          size === "lg" ? "max-w-xl" : "max-w-md"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-xl text-espresso">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="text-espresso/40 transition hover:text-espresso"
          >
            <IconClose size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}