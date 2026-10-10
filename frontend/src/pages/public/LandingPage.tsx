import { Link } from "react-router-dom";
import { HeroCarousel } from "../../components/home/HeroCarousel";
import { ServiciosDestacados } from "../../components/home/ServiciosDestacados";
import { ProductosPreview } from "../../components/home/ProductosPreview";
import { PortafolioPreview } from "../../components/home/PortafolioPreview";

export function LandingPage() {
  return (
    <>
      <HeroCarousel />
      <ServiciosDestacados />
      <ProductosPreview />
      <PortafolioPreview />

      <section className="bg-espresso py-16 text-center">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="font-serif text-3xl text-blush">
            ¿Lista para tu turno?
          </h2>
          <p className="mt-3 text-sm text-blush/60">
            Reservá online en pocos pasos.
          </p>
          <Link
            to="/turnos"
            className="mt-8 inline-block rounded-full bg-linear-to-r from-oro to-rosewood px-8 py-3.5 text-sm font-semibold uppercase tracking-widest text-superficie shadow-sm transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oro/60 focus-visible:ring-offset-2 focus-visible:ring-offset-espresso"
          >
            Reservar turno
          </Link>
        </div>
      </section>
    </>
  );
}
