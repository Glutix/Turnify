import { useState, type FormEvent } from "react";
import { Button } from "../common/Button";
import { useDiasReservables, useDisponibilidad } from "../../hooks/useTurnos";
import { SelectorFecha } from "./SelectorFecha";
import { SelectorHorario } from "./SelectorHorario";
import { formatearFechaLarga, formatearHora, hoyISO } from "../../utils/fechas";
import type { ReprogramarTurnoAdminPayload } from "../../types/turno";

// Reprogramar un turno (cliente y admin): se elige una fecha y un horario de
// la grilla de disponibilidad calculada para los MISMOS servicios del turno
// (reprogramar no cambia los servicios). El backend valida igual al confirmar.

interface Props {
  servicioIds: number[];
  turnoId?: number; // el turno que se reprograma: no debe bloquear su propio horario
  fechaHoraActual?: string; // ISO del turno que se reprograma
  onSubmit: (payload: ReprogramarTurnoAdminPayload) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  errorMessage?: string;
}

export function ReprogramarTurnoForm({
  servicioIds,
  turnoId,
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

  const { data: dias = [], isLoading: cargandoDias } = useDiasReservables();
  const fechaValida = fecha !== null && dias.includes(fecha) ? fecha : null;
  const { data: slots = [], isLoading: cargandoSlots } = useDisponibilidad(
    servicioIds,
    fechaValida ?? "",
    turnoId,
  );

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
        <SelectorHorario
          slots={slots}
          value={hora}
          isLoading={cargandoSlots}
          mensajeInactivo={!fechaValida ? "Elegí un día para ver los horarios." : undefined}
          onChange={(h) => {
            setHora(h);
            setError("");
          }}
        />
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
