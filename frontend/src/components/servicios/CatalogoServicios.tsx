import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { ServicioCard } from "./ServicioCard";
import { IconClose } from "../common/Icons";
import {
  MIN_CARACTERES_BUSQUEDA,
  filtrarServicios,
} from "../../utils/busquedaServicios";
import type { Servicio } from "../../types/servicio";

interface CatalogoServiciosProps {
  servicios: Servicio[];
  /** Si se pasa, las cards pasan a modo "turno" (Agregar / Quitar). */
  seleccionados?: number[];
  onToggle?: (servicio: Servicio) => void;
  /** Devuelve true si el servicio no entra en el turno (se deshabilita). */
  noEntra?: (servicio: Servicio) => boolean;
  columnas?: "3" | "2";
  /**
   * Guarda categoría y búsqueda en la URL (?categoria=2&q=cej) para poder
   * compartir el link y no perder los filtros al volver desde un detalle.
   * Desactivado en /turnos, que ya usa ?servicio=.
   */
  sincronizarUrl?: boolean;
}

export function CatalogoServicios({
  servicios,
  seleccionados,
  onToggle,
  noEntra,
  columnas = "3",
  sincronizarUrl = false,
}: CatalogoServiciosProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  const [categoriaElegida, setCategoriaElegida] = useState<number | "todas">(
    () => {
      if (!sincronizarUrl) return "todas";
      const n = Number(searchParams.get("categoria"));
      return Number.isInteger(n) && n > 0 ? n : "todas";
    },
  );
  const [texto, setTexto] = useState(() =>
    sincronizarUrl ? (searchParams.get("q") ?? "") : "",
  );
  const textoDebounced = useDebouncedValue(texto, 250);

  // Categorías que realmente tienen servicios activos.
  const categorias = Array.from(
    new Map(servicios.map((s) => [s.categoria_id, s.categoria])).values(),
  ).sort((a, b) => a.nombre.localeCompare(b.nombre));

  // Si la URL trae una categoría que no existe, se trata como "Todas".
  const categoria =
    categoriaElegida !== "todas" &&
    !categorias.some((c) => c.id === categoriaElegida)
      ? "todas"
      : categoriaElegida;

  function guardarEnUrl(clave: "categoria" | "q", valor: string) {
    if (!sincronizarUrl) return;
    setSearchParams(
      (previos) => {
        const nuevos = new URLSearchParams(previos);
        if (valor) nuevos.set(clave, valor);
        else nuevos.delete(clave);
        return nuevos;
      },
      { replace: true },
    );
  }

  function elegirCategoria(valor: number | "todas") {
    setCategoriaElegida(valor);
    guardarEnUrl("categoria", valor === "todas" ? "" : String(valor));
  }

  function cambiarTexto(valor: string) {
    setTexto(valor);
    guardarEnUrl("q", valor.trim());
  }

  const visibles = filtrarServicios(servicios, categoria, textoDebounced);
  const hayFiltros = categoria !== "todas" || texto.length > 0;

  const chip = (activo: boolean) =>
    `rounded-full px-4 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rosewood/50 ${
      activo
        ? "bg-rosewood text-superficie shadow-sm"
        : "border border-espresso/10 bg-superficie text-espresso/70 hover:border-rosewood/30 hover:text-rosewood"
    }`;

  return (
    <div>
      <div className="relative">
        <input
          type="search"
          value={texto}
          onChange={(e) => cambiarTexto(e.target.value)}
          placeholder="Buscar servicio por nombre..."
          aria-label="Buscar servicio por nombre"
          className="w-full rounded-full border border-espresso/10 bg-superficie py-3 pl-5 pr-12 text-sm text-espresso placeholder:text-espresso/40 focus:border-rosewood/40 focus:outline-none focus:ring-2 focus:ring-rosewood/20 [&::-webkit-search-cancel-button]:appearance-none"
        />
        {texto.length > 0 && (
          <button
            type="button"
            onClick={() => cambiarTexto("")}
            aria-label="Borrar búsqueda"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-espresso/40 transition hover:bg-rosewood/10 hover:text-rosewood focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rosewood/50"
          >
            <IconClose size={16} />
          </button>
        )}
      </div>
      {texto.length > 0 && texto.trim().length < MIN_CARACTERES_BUSQUEDA && (
        <p className="mt-2 pl-2 text-xs text-espresso/50">
          Escribí al menos {MIN_CARACTERES_BUSQUEDA} letras para buscar.
        </p>
      )}

      <div
        className="mt-4 flex flex-wrap gap-2"
        role="group"
        aria-label="Filtrar por categoría"
      >
        <button
          type="button"
          onClick={() => elegirCategoria("todas")}
          aria-pressed={categoria === "todas"}
          className={chip(categoria === "todas")}
        >
          Todas
        </button>
        {categorias.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => elegirCategoria(c.id)}
            aria-pressed={categoria === c.id}
            className={chip(categoria === c.id)}
          >
            {c.nombre}
          </button>
        ))}
      </div>

      <p className="mt-5 text-xs text-espresso/50" aria-live="polite">
        {visibles.length} {visibles.length === 1 ? "servicio" : "servicios"}
      </p>

      {visibles.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm text-espresso/60">
            No encontramos servicios con esos filtros.
          </p>
          {hayFiltros && (
            <button
              type="button"
              onClick={() => {
                cambiarTexto("");
                elegirCategoria("todas");
              }}
              className="mt-3 text-sm font-medium text-rosewood hover:text-espresso"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      ) : (
        <div
          className={`mt-3 grid gap-6 sm:grid-cols-2 ${columnas === "3" ? "lg:grid-cols-3" : ""}`}
        >
          {visibles.map((s) => (
            <ServicioCard
              key={s.id}
              servicio={s}
              modoTurno={seleccionados !== undefined}
              seleccionado={seleccionados?.includes(s.id)}
              deshabilitado={noEntra?.(s)}
              onToggle={onToggle ? () => onToggle(s) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
