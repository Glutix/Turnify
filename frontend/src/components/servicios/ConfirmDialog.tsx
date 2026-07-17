import { Modal } from "../common/Modal";
import { Button } from "../common/Button";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isConfirming?: boolean;
  errorMessage?: string;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  isConfirming = false,
  errorMessage,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title}>
      <p className="text-sm text-espresso/70">{message}</p>
      {errorMessage && (
        <p className="mt-3 rounded-lg bg-rosewood/10 px-3 py-2 text-sm text-rosewood">
          {errorMessage}
        </p>
      )}
      <div className="mt-5 flex justify-end gap-3">
        <Button variant="subtle" onClick={onCancel} disabled={isConfirming}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={onConfirm} disabled={isConfirming}>
          {isConfirming ? "Eliminando..." : "Eliminar"}
        </Button>
      </div>
    </Modal>
  );
}