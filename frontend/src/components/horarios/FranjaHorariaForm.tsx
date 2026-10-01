import { useState, type FormEvent } from "react";
import { Button } from "../common/Button";
import {
  DIAS_SEMANA,
  ETIQUETA_DIA,
  horaDesdeISO,
  type DiaSemana,
  type FranjaHoraria,
  type CrearFranjaHorariaPayload,
} from "../../types/horarios";

const INPUT_CLASS =
  "w-full rounded-xl border border-espresso/15 bg-superficie px-4 py-2.5 text-sm text-espresso focus:border-rosewood focus:outline-none focus:ring-2 focus:ring-rosewood/20";

interface FranjaHorariaFormProps {
  franjaInicial?: FranjaHoraria;
  onSubmit: (payload: CrearFranjaHorariaPayload) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function FranjaHorariaForm({
  franjaInicial,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: FranjaHorariaFormProps) {
  const [diaSemana, setDiaSemana] = useState<DiaSemana>(franjaInicial?.dia_semana ?? "lunes");
  const [horaInicio, setHoraInicio] = useState(
    franjaInicial ? horaDesdeISO(franjaInicial.hora_inicio) : "09:00",
  );
  const [horaFin, setHoraFin] = useState(
    franjaInicial ? horaDesdeISO(franjaInicial.hora_fin) : "13:00",
  );
  const [error, setError] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (horaInicio >= horaFin) {
      setError("El horario de inicio debe ser anterior al de fin");
      return;
    }
    setError("");
    onSubmit({ dia_semana: diaSemana, hora_inicio: horaInicio, hora_fin: horaFin });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-espresso/70">
          Día de la semana
        </label>
        <select
          value={diaSemana}
          onChange={(e) => setDiaSemana(e.target.value as DiaSemana)}
          className={INPUT_CLASS}
        >
          {DIAS_SEMANA.map((dia) => (
            <option key={dia} value={dia}>
              {ETIQUETA_DIA[dia]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium text-espresso/70">
            Hora de inicio
          </label>
          <input
            type="time"
            value={horaInicio}
            onChange={(e) => setHoraInicio(e.target.value)}
            className={INPUT_CLASS}
            required
          />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium text-espresso/70">
            Hora de fin
          </label>
          <input
            type="time"
            value={horaFin}
            onChange={(e) => setHoraFin(e.target.value)}
            className={INPUT_CLASS}
            required
          />
        </div>
      </div>

      {error && <p className="text-sm text-rosewood">{error}</p>}

      <div className="mt-2 flex justify-end gap-3">
        <Button type="button" variant="subtle" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </form>
  );
}