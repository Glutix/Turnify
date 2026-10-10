// frontend\src\pages\public\ServiciosPage.tsx
import { Link } from "react-router-dom";
import { useServicios } from "../../hooks/useServicios";
import { formatearDuracion, formatearPrecio } from "../../utils/servicio";
import type { Servicio } from "../../types/servicio";

export function ServiciosPage() {
  const { data: servicios = [], isLoading, isError } = useServicios();

  const serviciosActivos = servicios.filter((s) => s.activo);

  // Agrupamos por categoría para la exploración visual
  // ("quiero algo para cejas", "quiero uñas", etc.)
  const gruposPorCategoria = serviciosActivos.reduce<Record<string, Servicio[]>>((acc, s) => {
    const nombreCategoria = s.categoria.nombre;
    if (!acc[nombreCategoria]) acc[nombreCategoria] = [];
    acc[nombreCategoria].push(s);
    return acc;
  }, {});

  const categoriasOrdenadas = Object.keys(gruposPorCategoria).sort();

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <div className="mb-12 text-center">
        <h1 className="font-serif text-4xl text-espresso">Servicios</h1>
        <p className="mt-3 text-sm text-espresso/60">
          Conocé todos nuestros servicios organizados por categoría.
        </p>
      </div>

      {isLoading && (
        <p className="py-10 text-center text-sm text-espresso/50">Cargando servicios...</p>
      )}

      {isError && (
        <p className="py-10 text-center text-sm text-rosewood">
          No pudimos cargar los servicios. Intentá nuevamente más tarde.
        </p>
      )}

      {!isLoading && !isError && serviciosActivos.length === 0 && (
        <p className="py-10 text-center text-sm text-espresso/50">
          Todavía no hay servicios disponibles.
        </p>
      )}

      <div className="flex flex-col gap-12">
        {categoriasOrdenadas.map((nombreCategoria) => (
          <section key={nombreCategoria}>
            <h2 className="mb-5 font-serif text-2xl text-espresso">{nombreCategoria}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {gruposPorCategoria[nombreCategoria].map((servicio) => (
                <article
                  key={servicio.id}
                  className="rounded-xl border border-espresso/10 bg-superficie p-5 transition hover:border-rosewood/30"
                >
                  <h3 className="font-serif text-lg text-espresso">{servicio.nombre}</h3>
                  {servicio.descripcion && (
                    <p className="mt-1 text-sm text-espresso/60">{servicio.descripcion}</p>
                  )}
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-espresso/50">
                      {formatearDuracion(servicio.duracion_minutos)}
                    </span>
                    <span className="font-semibold text-rosewood">
                      {formatearPrecio(servicio.precio)}
                    </span>
                  </div>
                  <Link
                    to={`/servicios/${servicio.id}`}
                    className="mt-4 inline-block text-sm font-medium text-rosewood transition-colors hover:text-espresso"
                  >
                    Ver detalles
                  </Link>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}