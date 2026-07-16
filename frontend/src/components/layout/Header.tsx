import { useState } from "react";
import { NavLink } from "react-router-dom";
import { IconMenu, IconClose } from "../common/Icons";

const NAV_LINKS = [
  { to: "/", label: "Inicio" },
  { to: "/servicios", label: "Servicios" },
  { to: "/portafolio", label: "Portafolio" },
  { to: "/turnos", label: "Turnos" },
];

export function Header() {
  const [menuAbierto, setMenuAbierto] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-espresso/10 bg-superficie/90 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6">
        {/* Logo */}
        <NavLink
          to="/"
          className="rounded-sm font-serif text-2xl font-medium tracking-wide text-espresso focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rosewood/50"
        >
          Turni<span className="italic text-rosewood">fy</span>
        </NavLink>

        {/* Navegación de escritorio */}
        <nav
          className="hidden items-center gap-10 md:flex"
          aria-label="Navegación principal"
        >
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                `rounded-sm text-sm uppercase tracking-widest transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rosewood/50 ${
                  isActive
                    ? "text-rosewood"
                    : "text-espresso/70 hover:text-rosewood"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* CTA de escritorio */}
        <div className="hidden md:block">
          <NavLink
            to="/login"
            className="rounded-full bg-linear-to-r from-oro to-rosewood px-7 py-3 text-sm font-semibold uppercase tracking-widest text-superficie shadow-sm transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rosewood/50 focus-visible:ring-offset-2 focus-visible:ring-offset-superficie"
          >
            Iniciar sesión
          </NavLink>
        </div>

        {/* Botón menú mobile */}
        <button
          type="button"
          className="rounded-sm text-espresso focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rosewood/50 md:hidden"
          onClick={() => setMenuAbierto((prev) => !prev)}
          aria-expanded={menuAbierto}
          aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
        >
          {menuAbierto ? <IconClose size={26} /> : <IconMenu size={26} />}
        </button>
      </div>

      {/* Menú mobile desplegable */}
      {menuAbierto && (
        <nav
          className="flex flex-col gap-1 border-t border-espresso/10 bg-superficie px-6 pb-6 pt-4 md:hidden"
          aria-label="Navegación móvil"
        >
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              onClick={() => setMenuAbierto(false)}
              className={({ isActive }) =>
                `rounded-lg px-3 py-3 text-sm uppercase tracking-widest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rosewood/50 ${
                  isActive ? "bg-rosewood/10 text-rosewood" : "text-espresso/70"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
          <NavLink
            to="/login"
            onClick={() => setMenuAbierto(false)}
            className="mt-3 rounded-full bg-linear-to-r from-oro to-rosewood px-5 py-3 text-center text-sm font-semibold uppercase tracking-widest text-superficie focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rosewood/50"
          >
            Iniciar sesión
          </NavLink>
        </nav>
      )}
    </header>
  );
}
