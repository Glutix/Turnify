// frontend\src\pages\public\ServiciosPage.tsx
import { useServicios } from "../../hooks/useServicios";
import { CatalogoServicios } from "../../components/servicios/CatalogoServicios";

export function ServiciosPage() {
  const { data: servicios = [], isLoading, isError } = useServicios();

  const serviciosActivos = servicios.filter((s) => s.activo);

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="mb-10 text-center">
        <h1 className="font-serif text-4xl text-espresso">Servicios</h1>
        <p className="mt-3 text-sm text-espresso/60">
          Conocé todos nuestros servicios y encontrá el que buscás.
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

      {serviciosActivos.length > 0 && (
        <CatalogoServicios servicios={serviciosActivos} sincronizarUrl />
      )}
    </div>
  );
}