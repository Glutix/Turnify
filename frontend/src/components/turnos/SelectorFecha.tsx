// Selector de fecha que solo ofrece los días con atención (sin fines de semana
// cerrados ni feriados): un <input type="date"> no permite deshabilitar días.

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
    mes: f.toLocaleDateString("es-AR", { ...opciones, month: "short" }).replace(".", ""),
  };
}

export function SelectorFecha({ diasHabilitados, value, onChange, isLoading, fechaActual }: Props) {
  if (isLoading) return <p className="text-xs text-espresso/50">Buscando días con atención...</p>;
  if (diasHabilitados.length === 0) {
    return <p className="text-xs text-espresso/50">No hay días con atención en las próximas semanas.</p>;
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {diasHabilitados.map((fecha) => {
        const { dia, numero, mes } = partes(fecha);
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
            <span className="text-espresso/50">{mes}</span>
            {fecha === fechaActual && <span className="mt-0.5 text-[10px] text-oro">actual</span>}
          </button>
        );
      })}
    </div>
  );
}
