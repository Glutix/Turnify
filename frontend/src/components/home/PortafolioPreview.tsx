import { Link } from "react-router-dom";
import { IconArrowRight } from "../common/Icons";

// ─────────────────────────────────────────────────────────────
// TODO (compañero del módulo portafolio): esta sección es ESTÁTICA.
// Reemplazar TRABAJOS_DEMO por imágenes reales (`PortafolioImagen` con
// `destacada: true`, campo `url_cloudinary`) y mostrar una <img> en cada tile.
// ─────────────────────────────────────────────────────────────
const TRABAJOS_DEMO = [
  { id: 1, titulo: "Trabajo de ejemplo 1", fondo: "from-rosa/45 to-blush" },
  { id: 2, titulo: "Trabajo de ejemplo 2", fondo: "from-oro/40 to-blush" },
  { id: 3, titulo: "Trabajo de ejemplo 3", fondo: "from-rosewood/25 to-blush" },
  { id: 4, titulo: "Trabajo de ejemplo 4", fondo: "from-blush to-rosa/45" },
  { id: 5, titulo: "Trabajo de ejemplo 5", fondo: "from-blush to-oro/40" },
  { id: 6, titulo: "Trabajo de ejemplo 6", fondo: "from-blush to-rosewood/25" },
];

export function PortafolioPreview() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="mb-10 flex flex-col items-center justify-between gap-4 text-center md:flex-row md:text-left">
        <div>
          <p className="text-xs uppercase tracking-widest text-oro">
            Portafolio
          </p>
          <h2 className="mt-2 font-serif text-3xl text-espresso md:text-4xl">
            Nuestros trabajos
          </h2>
        </div>
        <Link
          to="/portafolio"
          className="inline-flex items-center gap-2 text-sm font-medium text-rosewood transition-colors hover:text-espresso"
        >
          Ver portafolio completo <IconArrowRight size={16} />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
        {TRABAJOS_DEMO.map((t) => (
          <div
            key={t.id}
            role="img"
            aria-label={t.titulo}
            className={`aspect-square rounded-2xl border border-rosewood/10 bg-linear-to-br ${t.fondo}`}
          />
        ))}
      </div>
    </section>
  );
}
