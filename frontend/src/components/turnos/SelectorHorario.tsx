// Grilla de horarios disponibles (slots). Es la única implementación: la usan
// la reserva pública, el alta manual de la admin y reprogramar.
import { IconClock } from "../common/Icons";
import type { SlotDisponible } from "../../types/turno";

interface Props {
  slots: SlotDisponible[];
  value: string | null; // "HH:mm" elegido
  onChange: (hora: string) => void;
  isLoading?: boolean;
  // Si se pasa, reemplaza a la grilla (p. ej. "Elegí un día para ver los horarios.").
  mensajeInactivo?: string;
}

const CLASE_MENSAJE = "py-4 text-center text-sm text-espresso/50";

export function SelectorHorario({ slots, value, onChange, isLoading = false, mensajeInactivo }: Props) {
  if (mensajeInactivo) return <p className={CLASE_MENSAJE}>{mensajeInactivo}</p>;
  if (isLoading) return <p className={CLASE_MENSAJE}>Buscando horarios...</p>;
  if (slots.length === 0) {
    return <p className={CLASE_MENSAJE}>No hay horarios disponibles ese día — probá con otra fecha.</p>;
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {slots.map((slot) => (
        <button
          key={slot.hora_inicio}
          type="button"
          onClick={() => onChange(slot.hora_inicio)}
          className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-sm transition ${
            value === slot.hora_inicio
              ? "border-rosewood bg-rosewood/5 text-rosewood"
              : "border-espresso/15 text-espresso hover:border-rosewood hover:text-rosewood"
          }`}
        >
          <IconClock size={14} />
          {slot.hora_inicio}
        </button>
      ))}
    </div>
  );
}
