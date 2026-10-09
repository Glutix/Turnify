import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import type { Producto } from "../../types/producto";

interface CambiarEstadoProductoDialogProps {
  producto: Producto | null;
  onConfirm: () => void;
  onCancel: () => void;
  isConfirming?: boolean;
  errorMessage?: string;
}

export function CambiarEstadoProductoDialog({
  producto,
  onConfirm,
  onCancel,
  isConfirming = false,
  errorMessage,
}: CambiarEstadoProductoDialogProps) {
  // La acción sale del estado actual: un producto activo se desactiva y uno inactivo se activa.
  const activar = producto ? !producto.activo : false;

  const titulo = activar ? "Activar producto" : "Desactivar producto";
  const mensaje = activar
    ? `¿Querés activar "${producto?.nombre}"? Pasará a mostrarse en el catálogo para los clientes.`
    : `¿Querés desactivar "${producto?.nombre}"? Dejará de mostrarse a los clientes, pero no se borra: podés volver a activarlo cuando quieras.`;

  return (
    <Modal isOpen={producto !== null} onClose={onCancel} title={titulo}>
      <p className="text-sm text-espresso/70">{mensaje}</p>
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
          {isConfirming
            ? activar
              ? "Activando..."
              : "Desactivando..."
            : activar
              ? "Activar"
              : "Desactivar"}
        </Button>
      </div>
    </Modal>
  );
}
