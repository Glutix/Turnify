import type { Servicio } from "../../types/servicio";

// Fondos con la paleta Rosewood. Clases completas (no armadas con template
// strings) para que Tailwind las detecte al compilar.
const FONDOS = [
  "bg-linear-to-br from-rosa/45 via-blush to-oro/35",
  "bg-linear-to-br from-oro/40 via-blush to-rosa/40",
  "bg-linear-to-br from-rosewood/25 via-blush to-oro/30",
];

interface ServicioImagenPlaceholderProps {
  servicio: Pick<Servicio, "categoria_id" | "nombre">;
  className?: string;
  /** Tamaño de la inicial: "md" para cards, "lg" para el detalle. */
  tamano?: "md" | "lg";
}

/**
 * Imagen provisoria de un servicio.
 * TODO: el modelo `Servicio` todavía no tiene imagen. Cuando exista
 * (ej. `imagen_url`), reemplazar este componente por un <img> y dejar este
 * como fallback.
 */
export function ServicioImagenPlaceholder({
  servicio,
  className = "",
  tamano = "md",
}: ServicioImagenPlaceholderProps) {
  const fondo = FONDOS[servicio.categoria_id % FONDOS.length];
  return (
    <div
      className={`flex items-center justify-center ${fondo} ${className}`}
      role="img"
      aria-label={`Imagen de ${servicio.nombre}`}
    >
      <span
        className={`font-serif italic text-rosewood/60 ${tamano === "lg" ? "text-9xl" : "text-6xl"}`}
      >
        {servicio.nombre.charAt(0).toUpperCase()}
      </span>
    </div>
  );
}
