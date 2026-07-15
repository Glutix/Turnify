import { useState } from "react";
import { NavLink } from "react-router-dom";

const links = [
  { label: "Inicio", to: "/" },
  { label: "Servicios", to: "/servicios" },
  { label: "Portafolio", to: "/portafolio" },
  { label: "Turnos", to: "/turnos" },
];

export function Header() {
  const [menuAbierto, setMenuAbierto] = useState(false);

  return (
    <header className="bg-primary text-white shadow-md">
      {/* ─── BARRA PRINCIPAL ─────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3">
        {/* Logo */}
        <NavLink to="/" className="text-xl font-bold tracking-wide">
          ✂ Turnify
        </NavLink>

        {/* Links desktop */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                isActive
                  ? "text-warm-light underline underline-offset-4"
                  : "hover:text-warm-light transition-colors"
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Botón login desktop */}
        <NavLink
          to="/login"
          className="hidden lg:block bg-warm text-white text-sm font-semibold px-4 py-2 rounded-full hover:opacity-90 transition-opacity"
        >
          Iniciar sesión
        </NavLink>

        {/* Botón hamburguesa mobile */}
        <button
          className="lg:hidden flex flex-col gap-1.5 p-1"
          onClick={() => setMenuAbierto(!menuAbierto)}
          aria-label="Abrir menú"
        >
          <span
            className={`block w-6 h-0.5 bg-white transition-all duration-300 ${menuAbierto ? "rotate-45 translate-y-2" : ""}`}
          />
          <span
            className={`block w-6 h-0.5 bg-white transition-all duration-300 ${menuAbierto ? "opacity-0" : ""}`}
          />
          <span
            className={`block w-6 h-0.5 bg-white transition-all duration-300 ${menuAbierto ? "-rotate-45 -translate-y-2" : ""}`}
          />
        </button>
      </div>

      {/* ─── MENÚ MOBILE DESPLEGABLE ─────────────────────────── */}
      {menuAbierto && (
        <nav className="lg:hidden flex flex-col border-t border-white/20">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setMenuAbierto(false)}
              className={({ isActive }) =>
                `px-4 py-3 text-sm font-medium border-b border-white/10 ${
                  isActive ? "text-warm-light" : "hover:bg-white/10"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}

          {/* Botón login mobile */}
          <NavLink
            to="/login"
            onClick={() => setMenuAbierto(false)}
            className="mx-4 my-3 bg-warm text-white text-sm font-semibold px-4 py-2 rounded-full text-center hover:opacity-90 transition-opacity"
          >
            Iniciar sesión
          </NavLink>
        </nav>
      )}
    </header>
  );
}
