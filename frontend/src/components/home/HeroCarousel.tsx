import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { IconChevronLeft, IconChevronRight } from "../common/Icons";

interface Slide {
  badge: string;
  titulo: string;
  bajada: string;
  cta: { texto: string; to: string };
}

const SLIDES: Slide[] = [
  {
    badge: "Reservas online",
    titulo: "Tu momento de belleza, a un clic",
    bajada:
      "Elegí tus servicios, tu día y tu horario. Sin llamadas ni esperas.",
    cta: { texto: "Reservar turno", to: "/turnos" },
  },
  {
    badge: "Tratamientos",
    titulo: "Cuidado profesional para vos",
    bajada:
      "Depilación, cejas, uñas y más, con atención personalizada en cada visita.",
    cta: { texto: "Ver servicios", to: "/servicios" },
  },
  {
    badge: "Portafolio",
    titulo: "Resultados que hablan solos",
    bajada:
      "Mirá algunos de nuestros trabajos y encontrá tu próxima inspiración.",
    cta: { texto: "Ver portafolio", to: "/portafolio" },
  },
];

const INTERVALO_MS = 6000;

export function HeroCarousel() {
  const [actual, setActual] = useState(0);
  const [pausado, setPausado] = useState(false);

  // Avance automático. Se pausa al pasar el mouse / enfocar el carrusel y
  // se reinicia cuando el usuario cambia de slide a mano (dependencia `actual`).
  useEffect(() => {
    if (pausado) return;
    const id = window.setTimeout(
      () => setActual((i) => (i + 1) % SLIDES.length),
      INTERVALO_MS,
    );
    return () => window.clearTimeout(id);
  }, [actual, pausado]);

  const anterior = () =>
    setActual((i) => (i - 1 + SLIDES.length) % SLIDES.length);
  const siguiente = () => setActual((i) => (i + 1) % SLIDES.length);

  return (
    <section
      className="hero-parallax relative isolate overflow-hidden"
      aria-roledescription="carrusel"
      aria-label="Destacados"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={() => setPausado(false)}
    >
      <div className="relative mx-auto grid min-h-130 max-w-6xl items-center px-6 py-20 md:min-h-150">
        {SLIDES.map((slide, i) => (
          <div
            key={slide.titulo}
            className={`col-start-1 row-start-1 mx-auto max-w-2xl text-center transition-all duration-700 ${
              i === actual
                ? "translate-y-0 opacity-100"
                : "pointer-events-none translate-y-3 opacity-0"
            }`}
            aria-hidden={i !== actual}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} de ${SLIDES.length}`}
          >
            <span className="inline-block rounded-full border border-oro/40 bg-superficie/70 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-rosewood backdrop-blur-sm">
              {slide.badge}
            </span>
            <h1 className="mt-6 font-serif text-4xl leading-tight text-espresso md:text-6xl">
              {slide.titulo}
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-espresso/70 md:text-lg">
              {slide.bajada}
            </p>
            <Link
              to={slide.cta.to}
              tabIndex={i === actual ? 0 : -1}
              className="mt-8 inline-block rounded-full bg-linear-to-r from-oro to-rosewood px-8 py-3.5 text-sm font-semibold uppercase tracking-widest text-superficie shadow-sm transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rosewood/50 focus-visible:ring-offset-2 focus-visible:ring-offset-blush"
            >
              {slide.cta.texto}
            </Link>
          </div>
        ))}
      </div>

      {/* Flechas (solo escritorio) */}
      <button
        type="button"
        onClick={anterior}
        aria-label="Slide anterior"
        className="absolute left-4 top-1/2 hidden -translate-y-1/2 rounded-full bg-superficie/70 p-2 text-espresso/70 backdrop-blur-sm transition hover:bg-superficie hover:text-rosewood focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rosewood/50 md:block"
      >
        <IconChevronLeft size={22} />
      </button>
      <button
        type="button"
        onClick={siguiente}
        aria-label="Slide siguiente"
        className="absolute right-4 top-1/2 hidden -translate-y-1/2 rounded-full bg-superficie/70 p-2 text-espresso/70 backdrop-blur-sm transition hover:bg-superficie hover:text-rosewood focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rosewood/50 md:block"
      >
        <IconChevronRight size={22} />
      </button>

      {/* Indicador de puntos */}
      <div className="absolute inset-x-0 bottom-6 flex justify-center gap-2">
        {SLIDES.map((slide, i) => (
          <button
            key={slide.titulo}
            type="button"
            onClick={() => setActual(i)}
            aria-label={`Ir al slide ${i + 1}`}
            aria-current={i === actual}
            className={`h-2.5 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rosewood/50 ${
              i === actual
                ? "w-8 bg-rosewood"
                : "w-2.5 bg-rosewood/30 hover:bg-rosewood/50"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
