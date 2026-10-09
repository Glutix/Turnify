import { ETIQUETA_ESTADO, type EstadoTurno } from "../../types/turno";

const ESTILO_ESTADO: Record<EstadoTurno, string> = {
  confirmado: "bg-oro/20 text-espresso",
  atendido: "bg-espresso/10 text-espresso",
  cancelado: "bg-rosewood/10 text-rosewood",
  reprogramado: "bg-espresso/5 text-espresso/60",
};

export function EstadoBadge({ estado }: { estado: EstadoTurno }) {
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${ESTILO_ESTADO[estado]}`}
    >
      {ETIQUETA_ESTADO[estado]}
    </span>
  );
}
