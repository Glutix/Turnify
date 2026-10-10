import { IconClose } from "../common/Icons";
import { Button } from "../common/Button";
import { MAX_DURACION_TURNO_MINUTOS } from "../../utils/servicio";
import { formatearDuracion, formatearPrecio } from "../../utils/servicio";
import type { Servicio } from "../../types/servicio";

interface ResumenTurnoProps {
  elegidos: Servicio[];
  duracionTotal: number;
  precioTotal: number;
  onQuitar: (servicio: Servicio) => void;
  onContinuar: () => void;
}

/** Panel "Tu turno" (carrito): lista, tiempo usado del máximo y total. */
export function ResumenTurno({
  elegidos,
  duracionTotal,
  precioTotal,
  onQuitar,
  onContinuar,
}: ResumenTurnoProps) {
  const porcentaje = Math.min(
    100,
    (duracionTotal / MAX_DURACION_TURNO_MINUTOS) * 100,
  );
  const excede = duracionTotal > MAX_DURACION_TURNO_MINUTOS;
  return (
    <aside className="rounded-2xl border border-rosewood/10 bg-superficie p-6 shadow-sm">
      <h2 className="font-serif text-xl text-espresso">Tu turno</h2>

      {elegidos.length === 0 ? (
        <p className="mt-4 text-sm text-espresso/50">
          Todavía no agregaste servicios. Elegí uno o más del catálogo.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-espresso/10">
          {elegidos.map((s) => (
            <li
              key={s.id}
              className="flex items-start justify-between gap-3 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-espresso">
                  {s.nombre}
                </p>
                <p className="text-xs text-espresso/50">
                  {formatearDuracion(s.duracion_minutos)} ·{" "}
                  {formatearPrecio(s.precio)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onQuitar(s)}
                aria-label={`Quitar ${s.nombre}`}
                className="mt-0.5 rounded-full p-1 text-espresso/40 transition hover:bg-rosewood/10 hover:text-rosewood"
              >
                <IconClose size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-5">
        <div className="flex justify-between text-xs text-espresso/60">
          <span>Tiempo del turno</span>
          <span className={excede ? "font-semibold text-rosewood" : ""}>
            {formatearDuracion(duracionTotal)} /{" "}
            {formatearDuracion(MAX_DURACION_TURNO_MINUTOS)}
          </span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-espresso/10">
          <div
            className={`h-full rounded-full transition-all ${excede ? "bg-rosewood" : "bg-linear-to-r from-oro to-rosewood"}`}
            style={{ width: `${porcentaje}%` }}
          />
        </div>
      </div>

      <div className="mt-5 flex items-baseline justify-between border-t border-espresso/10 pt-4">
        <span className="text-sm text-espresso/60">Total</span>
        <span className="text-xl font-semibold text-rosewood">
          {precioTotal.toLocaleString("es-AR", {
            style: "currency",
            currency: "ARS",
          })}
        </span>
      </div>

      <Button
        fullWidth
        className="mt-5"
        disabled={elegidos.length === 0 || excede}
        onClick={onContinuar}
      >
        Elegir horario
      </Button>
    </aside>
  );
}
