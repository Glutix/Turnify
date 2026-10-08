import { useState, type FormEvent } from "react";
import { Button } from "../common/Button";
import { useDisponibilidad } from "../../hooks/useTurnos";
import { SelectorFecha } from "./SelectorFecha";
import { useDiasHabilitados } from "../../hooks/useTurnos";
import { formatearFechaLarga, formatearHora, hoyISO, sumarDias } from "../../utils/fechas";
import type { ReprogramarTurnoAdminPayload } from "../../types/turno";

// Reprogramar un turno (cliente y admin): se elige una fecha y un horario de
// la grilla de disponibilidad calculada para los MISMOS servicios del turno
// (reprogramar no cambia los servicios). El backend valida igual al confirmar.

const DIAS_VISIBLES = 45;

interface Props {
  servicioIds: number[];
  fechaHoraActual?: string; // ISO del turno que se reprograma
  onSubmit: (payload: ReprogramarTurnoAdminPayload) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  errorMessage?: string;
}

export function ReprogramarTurnoForm({
  servicioIds,
  fechaHoraActual,
  onSubmit,
  onCancel,
  isSubmitting = false,
  errorMessage = "",
}: Props) {
  const hoy = hoyISO();
  const fechaActual = fechaHoraActual?.slice(0, 10);
  // Arranca en la fecha del turno actual (si todavía es futura); solo se puede
  // elegir entre los días con atención.
  const [fecha, setFecha] = useState<string | null>(
    fechaActual && fechaActual >= hoy ? fechaActual : null,
  );
  const [hora, setHora] = useState<string | null>(null);
  const [error, setError] = useState("");

  const { data: dias = [], isLoading: cargandoDias } = useDiasHabilitados(
    hoy,
    sumarDias(hoy, DIAS_VISIBLES),
  );
  const fechaValida = fecha !== null && dias.includes(fecha) ? fecha : null;
  const { data: slots = [], isLoading } = useDisponibilidad(servicioIds, fechaValida ?? "");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!hora) {
      setError("Elegí un horario disponible");
      return;
    }
    setError("");
    if (!fechaValida) {
      setError("Elegí un día con atención");
      return;
    }
    onSubmit({ fecha: fechaValida, hora_inicio: hora });
  }

  const mensaje = error || errorMessage;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {fechaHoraActual && (
        <p className="rounded-xl bg-espresso/5 px-4 py-2 text-sm text-espresso/70">
          Turno actual:{" "}
          <span className="capitalize">{formatearFechaLarga(fechaHoraActual)}</span>,{" "}
          {formatearHora(fechaHoraActual)} hs
        </p>
      )}

      <div>
        <p className="mb-2 text-sm font-medium text-espresso/70">Nueva fecha</p>
        <SelectorFecha
          diasHabilitados={dias}
          value={fechaValida}
          fechaActual={fechaActual}
          isLoading={cargandoDias}
          onChange={(f) => {
            setFecha(f);
            setHora(null);
            setError("");
          }}
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-espresso/70">Nuevo horario</p>
        {!fechaValida && <p className="text-xs text-espresso/50">Elegí un día para ver los horarios.</p>}
        {fechaValida && isLoading && <p className="text-xs text-espresso/50">Buscando horarios...</p>}
        {fechaValida && !isLoading && slots.length === 0 && (
          <p className="text-xs text-espresso/50">
            No hay horarios disponibles ese día — probá con otra fecha.
          </p>
        )}
        {slots.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {slots.map((slot) => (
              <button
                key={slot.hora_inicio}
                type="button"
                onClick={() => {
                  setHora(slot.hora_inicio);
                  setError("");
                }}
                className={`rounded-xl border py-2 text-sm transition ${
                  hora === slot.hora_inicio
                    ? "border-rosewood bg-rosewood/5 text-rosewood"
                    : "border-espresso/15 text-espresso hover:border-rosewood"
                }`}
              >
                {slot.hora_inicio}
              </button>
            ))}
          </div>
        )}
      </div>

      {mensaje && <p className="text-sm text-rosewood">{mensaje}</p>}

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
