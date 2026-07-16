import { NavLink } from "react-router-dom";
import { Button } from "../../components/common/Button";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-blush px-6 py-12 font-sans text-espresso">
      <div className="w-full max-w-md text-center">
        <NavLink
          to="/"
          className="rounded-sm font-serif text-2xl font-medium tracking-wide text-espresso"
        >
          Turni<span className="italic text-rosewood">fy</span>
        </NavLink>

        <p className="mt-10 bg-linear-to-r from-oro to-rosewood bg-clip-text font-serif text-8xl font-medium italic text-transparent">
          404
        </p>

        <h1 className="mt-4 font-serif text-2xl font-medium text-espresso">
          Página no encontrada
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-espresso/60">
          La página que buscás no existe o fue movida. Revisá el enlace o volvé
          al inicio.
        </p>

        <div className="mt-8">
          <NavLink to="/">
            <Button type="button" variant="primary">
              Volver al inicio
            </Button>
          </NavLink>
        </div>
      </div>
    </div>
  );
}
