import { Link } from "react-router-dom";
import { useServicios } from "../../hooks/useServicios";
import { ServicioCard } from "../servicios/ServicioCard";
import { IconArrowRight } from "../common/Icons";
import type { Servicio } from "../../types/servicio";

const CANTIDAD_DESTACADOS = 4;

// Un servicio por categoría primero (más variedad) y después se completa
// con el resto. TODO: si se agrega un campo `destacado` al modelo, usarlo acá.
function elegirDestacados(servicios: Servicio[]): Servicio[] {
  const vistas = new Set<number>();
  const primeros: Servicio[] = [];
  const resto: Servicio[] = [];
  for (const s of servicios) {
    if (vistas.has(s.categoria_id)) {
      resto.push(s);
    } else {
      vistas.add(s.categoria_id);
      primeros.push(s);
    }
  }
  return [...primeros, ...resto].slice(0, CANTIDAD_DESTACADOS);
}

export function ServiciosDestacados() {
  const { data: servicios = [], isLoading, isError } = useServicios();
  const destacados = elegirDestacados(servicios.filter((s) => s.activo));

  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="mb-10 flex flex-col items-center justify-between gap-4 text-center md:flex-row md:text-left">
        <div>
          <p className="text-xs uppercase tracking-widest text-oro">
            Tratamientos destacados
          </p>
          <h2 className="mt-2 font-serif text-3xl text-espresso md:text-4xl">
            Elegí tu próximo cuidado
          </h2>
        </div>
        <Link
          to="/servicios"
          className="inline-flex items-center gap-2 text-sm font-medium text-rosewood transition-colors hover:text-espresso"
        >
          Ver catálogo completo <IconArrowRight size={16} />
        </Link>
      </div>

      {isLoading && (
        <p className="py-10 text-center text-sm text-espresso/50">
          Cargando servicios...
        </p>
      )}
      {isError && (
        <p className="py-10 text-center text-sm text-rosewood">
          No pudimos cargar los servicios. Intentá nuevamente más tarde.
        </p>
      )}
      {!isLoading && !isError && destacados.length === 0 && (
        <p className="py-10 text-center text-sm text-espresso/50">
          Todavía no hay servicios disponibles.
        </p>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {destacados.map((servicio) => (
          <ServicioCard key={servicio.id} servicio={servicio} />
        ))}
      </div>
    </section>
  );
}
