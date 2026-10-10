import { Link } from "react-router-dom";
import { IconBag } from "../common/Icons";

// ─────────────────────────────────────────────────────────────
// TODO (compañero del módulo e-commerce): esta sección es ESTÁTICA.
//  1. Reemplazar PRODUCTOS_DEMO por datos reales (hook `useProductos` o
//     el endpoint público GET /catalogo) tomando 4 productos activos.
//  2. Usar la imagen principal (`imagenes.find(i => i.es_principal)`).
//  3. Definir RUTA_TIENDA cuando exista la página de la tienda.
// ─────────────────────────────────────────────────────────────
const RUTA_TIENDA: string | null = null;

const PRODUCTOS_DEMO = [
  {
    id: 1,
    nombre: "Producto de ejemplo 1",
    categoria: "Cuidado facial",
    precio: "$ 0",
  },
  {
    id: 2,
    nombre: "Producto de ejemplo 2",
    categoria: "Cuidado corporal",
    precio: "$ 0",
  },
  { id: 3, nombre: "Producto de ejemplo 3", categoria: "Cejas", precio: "$ 0" },
  { id: 4, nombre: "Producto de ejemplo 4", categoria: "Uñas", precio: "$ 0" },
];

export function ProductosPreview() {
  return (
    <section id="tienda" className="bg-superficie py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-10 text-center">
          <p className="text-xs uppercase tracking-widest text-oro">Tienda</p>
          <h2 className="mt-2 font-serif text-3xl text-espresso md:text-4xl">
            Cosmética para cuidarte en casa
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {PRODUCTOS_DEMO.map((p) => (
            <article
              key={p.id}
              className="group overflow-hidden rounded-2xl border border-rosewood/10 bg-superficie shadow-sm transition hover:shadow-md"
            >
              <div className="flex aspect-square items-center justify-center overflow-hidden bg-linear-to-br from-blush to-rosa/30">
                <IconBag
                  size={40}
                  className="text-rosewood/40 transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <div className="p-4">
                <p className="text-xs uppercase tracking-widest text-espresso/40">
                  {p.categoria}
                </p>
                <h3 className="mt-1 font-serif text-base text-espresso">
                  {p.nombre}
                </h3>
                <p className="mt-2 font-semibold text-rosewood">{p.precio}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-10 text-center">
          {RUTA_TIENDA ? (
            <Link
              to={RUTA_TIENDA}
              className="inline-block rounded-full bg-linear-to-r from-oro to-rosewood px-8 py-3 text-sm font-semibold uppercase tracking-widest text-superficie shadow-sm transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rosewood/50 focus-visible:ring-offset-2 focus-visible:ring-offset-superficie"
            >
              Ir a la tienda
            </Link>
          ) : (
            <button
              type="button"
              disabled
              className="cursor-not-allowed rounded-full bg-espresso/5 px-8 py-3 text-sm font-medium tracking-wide text-espresso/50"
            >
              Tienda próximamente
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
