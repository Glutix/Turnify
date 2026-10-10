// Selector de fecha que solo ofrece los días con atención (sin fines de semana
// cerrados ni feriados): un <input type="date"> no permite deshabilitar días.
// Con una ventana larga (60 días) los días se agrupan por mes: arriba las pestañas
// de mes y abajo los días de ese mes, en varias filas (sin scroll horizontal).

import { useState } from "react";

interface Props {
  diasHabilitados: string[];
  value: string | null;
  onChange: (fecha: string) => void;
  isLoading?: boolean;
  fechaActual?: string; // se marca como "actual" (p. ej. la fecha del turno a reprogramar)
}

function partes(fechaISO: string) {
  const f = new Date(`${fechaISO}T00:00:00Z`);
  const opciones = { timeZone: "UTC" } as const;
  return {
    dia: f.toLocaleDateString("es-AR", { ...opciones, weekday: "short" }).replace(".", ""),
    numero: f.toLocaleDateString("es-AR", { ...opciones, day: "numeric" }),
  };
}

function etiquetaMes(mesISO: string): string {
  const f = new Date(`${mesISO}-01T00:00:00Z`);
  return f.toLocaleDateString("es-AR", { timeZone: "UTC", month: "long", year: "numeric" });
}

export function SelectorFecha({ diasHabilitados, value, onChange, isLoading, fechaActual }: Props) {
  // Mes elegido a mano en las pestañas; si no hay (o ya no existe), se muestra el
  // mes de la fecha elegida y, si tampoco, el primero con atención.
  const [mesElegido, setMesElegido] = useState<string | null>(null);

  if (isLoading) return <p className="text-xs text-espresso/50">Buscando días con atención...</p>;
  if (diasHabilitados.length === 0) {
    return <p className="text-xs text-espresso/50">No hay días con atención en las próximas semanas.</p>;
  }

  const meses = Array.from(new Set(diasHabilitados.map((f) => f.slice(0, 7))));
  const mesDelValor = value ? value.slice(0, 7) : null;
  const mesActivo =
    mesElegido && meses.includes(mesElegido)
      ? mesElegido
      : mesDelValor && meses.includes(mesDelValor)
        ? mesDelValor
        : meses[0];
  const diasDelMes = diasHabilitados.filter((f) => f.startsWith(mesActivo));

  return (
    <div className="flex flex-col gap-3">
      {meses.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {meses.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMesElegido(m)}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-xs capitalize transition ${
                m === mesActivo
                  ? "border-rosewood bg-rosewood/5 text-rosewood"
                  : "border-espresso/15 text-espresso/60 hover:border-rosewood/30"
              }`}
            >
              {etiquetaMes(m)}
            </button>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {diasDelMes.map((fecha) => {
          const { dia, numero } = partes(fecha);
          const elegido = value === fecha;
          return (
            <button
              key={fecha}
              type="button"
              onClick={() => onChange(fecha)}
              className={`flex min-w-16 shrink-0 flex-col items-center rounded-xl border px-3 py-2 text-xs capitalize transition ${
                elegido
                  ? "border-rosewood bg-rosewood/5 text-rosewood"
                  : "border-espresso/15 text-espresso hover:border-rosewood"
              }`}
            >
              <span>{dia}</span>
              <span className="font-serif text-lg leading-tight">{numero}</span>
              {fecha === fechaActual && <span className="mt-0.5 text-[10px] text-oro">actual</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
