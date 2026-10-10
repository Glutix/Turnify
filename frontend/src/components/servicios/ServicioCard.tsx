import { Link } from "react-router-dom";
import { IconClock } from "../common/Icons";
import { ServicioImagenPlaceholder } from "./ServicioImagenPlaceholder";
import { formatearDuracion, formatearPrecio } from "../../utils/servicio";
import type { Servicio } from "../../types/servicio";

interface ServicioCardProps {
  servicio: Servicio;
  /** Modo /turnos: el segundo botón agrega/quita del turno en vez de navegar. */
  modoTurno?: boolean;
  seleccionado?: boolean;
  deshabilitado?: boolean;
  onToggle?: () => void;
}

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rosewood/50 focus-visible:ring-offset-2 focus-visible:ring-offset-superficie";

/**
 * Card reutilizable de servicio (inicio, catálogo, relacionados, vistos).
 * "Ver detalles" → /servicios/:id · "Reservar ahora" → /turnos con el
 * servicio ya seleccionado.
 */
export function ServicioCard({
  servicio,
  modoTurno = false,
  seleccionado = false,
  deshabilitado = false,
  onToggle,
}: ServicioCardProps) {
  return (
    <article
      className={`group flex h-full flex-col overflow-hidden rounded-2xl border bg-superficie shadow-sm transition hover:shadow-md ${
        seleccionado
          ? "border-rosewood ring-2 ring-rosewood/20"
          : "border-rosewood/10"
      }`}
    >
      <Link
        to={`/servicios/${servicio.id}`}
        tabIndex={-1}
        aria-hidden="true"
        className="relative block aspect-4/3 overflow-hidden"
      >
        <ServicioImagenPlaceholder
          servicio={servicio}
          className="h-full w-full transition-transform duration-500 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 rounded-full bg-superficie/90 px-3 py-1 text-xs font-medium uppercase tracking-widest text-rosewood backdrop-blur-sm">
          {servicio.categoria.nombre}
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-1.5 text-xs text-espresso/50">
          <IconClock size={14} />
          {formatearDuracion(servicio.duracion_minutos)}
        </div>

        <h3 className="mt-2 font-serif text-xl text-espresso">
          {servicio.nombre}
        </h3>

        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-espresso/60">
          {servicio.descripcion ?? "Consultanos por este servicio."}
        </p>

        <p className="mt-4 text-lg font-semibold text-rosewood">
          {formatearPrecio(servicio.precio)}
        </p>

        <div className="mt-auto flex flex-col gap-2 pt-5">
          <Link
            to={`/servicios/${servicio.id}`}
            className={`flex-1 rounded-full bg-espresso/5 px-4 py-2.5 text-center text-sm font-medium tracking-wide text-espresso/70 transition hover:bg-rosewood/10 hover:text-rosewood ${FOCUS}`}
          >
            Ver detalles
          </Link>
          {modoTurno ? (
            <button
              type="button"
              onClick={onToggle}
              disabled={deshabilitado && !seleccionado}
              aria-pressed={seleccionado}
              className={`flex-1 rounded-full px-4 py-2.5 text-center text-sm font-semibold uppercase tracking-widest transition disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS} ${
                seleccionado
                  ? "border border-rosewood bg-rosewood/5 text-rosewood"
                  : "bg-linear-to-r from-oro to-rosewood text-superficie shadow-sm hover:shadow-md"
              }`}
            >
              {seleccionado ? "Quitar" : deshabilitado ? "No entra" : "Agregar"}
            </button>
          ) : (
            <Link
              to={`/turnos?servicio=${servicio.id}`}
              className={`flex-1 rounded-full bg-linear-to-r from-oro to-rosewood px-4 py-2.5 text-center text-sm font-semibold uppercase tracking-widest text-superficie shadow-sm transition hover:shadow-md ${FOCUS}`}
            >
              Reservar ahora
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
