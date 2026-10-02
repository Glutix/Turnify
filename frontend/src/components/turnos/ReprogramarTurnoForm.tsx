import { useState, type FormEvent } from "react";
import { Button } from "../common/Button";
import type { ReprogramarTurnoAdminPayload } from "../../types/turno";

const INPUT_CLASS =
  "w-full rounded-xl border border-espresso/15 bg-superficie px-4 py-2.5 text-sm text-espresso focus:border-rosewood focus:outline-none focus:ring-2 focus:ring-rosewood/20";

interface Props {
  onSubmit: (payload: ReprogramarTurnoAdminPayload) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function ReprogramarTurnoForm({ onSubmit, onCancel, isSubmitting = false }: Props) {
  const [fecha, setFecha] = useState("");
  const [horaInicio, setHoraInicio] = useState("09:00");
  const [error, setError] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!fecha) {
      setError("Elegí la nueva fecha");
      return;
    }
    setError("");
    onSubmit({ fecha, hora_inicio: horaInicio });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-espresso/70">Nueva fecha</label>
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className={INPUT_CLASS}
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-espresso/70">Nuevo horario</label>
        <input
          type="time"
          value={horaInicio}
          onChange={(e) => setHoraInicio(e.target.value)}
          className={INPUT_CLASS}
          required
        />
      </div>
      <p className="text-xs text-espresso/50">
        Se valida que el nuevo horario esté disponible antes de confirmar.
      </p>
      {error && <p className="text-sm text-rosewood">{error}</p>}
      <div className="mt-2 flex justify-end gap-3">
        <Button type="button" variant="subtle" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : "Reprogramar"}
        </Button>
      </div>
    </form>
  );
}