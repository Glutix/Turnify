import { useState, type FormEvent } from "react";
import { Button } from "../common/Button";
import {
  horaDesdeISO,
  type ExcepcionHorario,
  type CrearExcepcionHorarioPayload,
} from "../../types/horarios";

const INPUT_CLASS =
  "w-full rounded-xl border border-espresso/15 bg-superficie px-4 py-2.5 text-sm text-espresso focus:border-rosewood focus:outline-none focus:ring-2 focus:ring-rosewood/20";

// Son 3 formas de cargar lo mismo (una excepción de horario), pero con
// campos bien distintos para que un cliente sin conocimientos técnicos no
// tenga que lidiar con "fecha_desde"/"fecha_hasta" para cargar un feriado
// de un solo día, ni le aparezca un campo de horario sin sentido al cerrar
// por vacaciones.
//
// Mapeo a lo que espera el backend (CrearExcepcionHorarioPayload):
//   - "feriado"     → fecha_desde = fecha_hasta = la fecha elegida, tipo: "bloqueo_total"
//   - "vacaciones"  → fecha_desde/fecha_hasta = el rango elegido,   tipo: "bloqueo_total"
//   - "especial"    → fecha_desde/fecha_hasta = el rango elegido,   tipo: "horario_especial", + horas
type ModoExcepcion = "feriado" | "vacaciones" | "especial";

const MODOS: { value: ModoExcepcion; label: string }[] = [
  { value: "feriado", label: "Feriado" },
  { value: "vacaciones", label: "Vacaciones / cierre" },
  { value: "especial", label: "Horario especial" },
];

// Al editar una excepción existente, inferimos en qué modo mostrarla:
// si tiene horas es "especial"; si no tiene horas y desde === hasta es un
// "feriado" de un solo día; si no, es un cierre de varios días ("vacaciones").
function inferirModo(excepcion?: ExcepcionHorario): ModoExcepcion {
  if (!excepcion) return "feriado";
  if (excepcion.tipo === "horario_especial") return "especial";
  return excepcion.fecha_desde === excepcion.fecha_hasta ? "feriado" : "vacaciones";
}

interface ExcepcionHorarioFormProps {
  excepcionInicial?: ExcepcionHorario;
  onSubmit: (payload: CrearExcepcionHorarioPayload) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function ExcepcionHorarioForm({
  excepcionInicial,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: ExcepcionHorarioFormProps) {
  const [modo, setModo] = useState<ModoExcepcion>(inferirModo(excepcionInicial));

  // Campo único para "feriado" (un solo día)
  const [fecha, setFecha] = useState(excepcionInicial?.fecha_desde ?? "");

  // Rango para "vacaciones" y "especial"
  const [fechaDesde, setFechaDesde] = useState(excepcionInicial?.fecha_desde ?? "");
  const [fechaHasta, setFechaHasta] = useState(excepcionInicial?.fecha_hasta ?? "");

  // Horas, solo para "especial"
  const [horaInicio, setHoraInicio] = useState(
    excepcionInicial?.hora_inicio ? horaDesdeISO(excepcionInicial.hora_inicio) : "09:00",
  );
  const [horaFin, setHoraFin] = useState(
    excepcionInicial?.hora_fin ? horaDesdeISO(excepcionInicial.hora_fin) : "13:00",
  );

  const [descripcion, setDescripcion] = useState(excepcionInicial?.descripcion ?? "");
  const [error, setError] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (modo === "feriado") {
      if (!fecha) {
        setError("Elegí la fecha del feriado");
        return;
      }
      setError("");
      onSubmit({
        fecha_desde: fecha,
        fecha_hasta: fecha,
        tipo: "bloqueo_total",
        descripcion: descripcion || undefined,
      });
      return;
    }

    if (modo === "vacaciones") {
      if (!fechaDesde || !fechaHasta) {
        setError("Completá el rango de fechas");
        return;
      }
      if (fechaDesde > fechaHasta) {
        setError("La fecha de inicio no puede ser posterior a la de fin");
        return;
      }
      setError("");
      onSubmit({
        fecha_desde: fechaDesde,
        fecha_hasta: fechaHasta,
        tipo: "bloqueo_total",
        descripcion: descripcion || undefined,
      });
      return;
    }

    // modo === "especial"
    if (!fechaDesde || !fechaHasta) {
      setError("Completá el rango de fechas");
      return;
    }
    if (fechaDesde > fechaHasta) {
      setError("La fecha de inicio no puede ser posterior a la de fin");
      return;
    }
    if (horaInicio >= horaFin) {
      setError("El horario de inicio debe ser anterior al de fin");
      return;
    }
    setError("");
    onSubmit({
      fecha_desde: fechaDesde,
      fecha_hasta: fechaHasta,
      tipo: "horario_especial",
      hora_inicio: horaInicio,
      hora_fin: horaFin,
      descripcion: descripcion || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Selector de modo: 3 pestañas bien separadas */}
      <div className="flex gap-2 rounded-xl bg-espresso/5 p-1">
        {MODOS.map((m) => (
          <button
            key={m.value}
            type="button"
            onClick={() => setModo(m.value)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
              modo === m.value
                ? "bg-superficie text-rosewood shadow-sm"
                : "text-espresso/50 hover:text-espresso"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {modo === "feriado" && (
        <div>
          <label className="mb-1 block text-sm font-medium text-espresso/70">
            Fecha del feriado
          </label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className={INPUT_CLASS}
            required
          />
          <p className="mt-1 text-xs text-espresso/50">
            Se bloquea el día completo, sin turnos disponibles.
          </p>
        </div>
      )}

      {modo === "vacaciones" && (
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-espresso/70">Desde</label>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              className={INPUT_CLASS}
              required
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-espresso/70">Hasta</label>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              className={INPUT_CLASS}
              required
            />
          </div>
        </div>
      )}

      {modo === "especial" && (
        <>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-espresso/70">Desde</label>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className={INPUT_CLASS}
                required
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-espresso/70">Hasta</label>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className={INPUT_CLASS}
                required
              />
            </div>
          </div>
          <p className="-mt-2 text-xs text-espresso/50">
            Para un solo día, poné la misma fecha en Desde y Hasta.
          </p>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-espresso/70">
                No disponible desde
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
                No disponible hasta
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
          <p className="-mt-2 text-xs text-espresso/50">
            Ese horario queda bloqueado todos los días del rango de arriba
            (ej. "a la mañana no trabajo esta semana").
          </p>
        </>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-espresso/70">
          Descripción (opcional)
        </label>
        <input
          type="text"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          maxLength={200}
          placeholder={
            modo === "feriado"
              ? "Ej. Día de la independencia"
              : modo === "vacaciones"
                ? "Ej. Vacaciones de verano"
                : "Ej. Solo turnos de tarde esta semana"
          }
          className={INPUT_CLASS}
        />
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