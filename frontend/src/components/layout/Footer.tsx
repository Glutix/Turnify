import { NavLink } from "react-router-dom";

const links = [
  { label: "Inicio", to: "/" },
  { label: "Servicios", to: "/servicios" },
  { label: "Portafolio", to: "/portafolio" },
  { label: "Turnos", to: "/turnos" },
];

const redes = [
  { label: "Instagram", href: "https://instagram.com" },
  { label: "Facebook", href: "https://facebook.com" },
];

export function Footer() {
  return (
    <footer className="bg-primary text-white mt-auto">
      {/* ─── CONTENIDO PRINCIPAL ─────────────────────────────── */}
      <div className="px-4 py-8 flex flex-col gap-6 lg:flex-row lg:justify-between lg:items-start">
        {/* Marca */}
        <div className="flex flex-col gap-1">
          <span className="text-xl font-bold">✂ Turnify</span>
          <span className="text-sm text-white/70">
            Salón de belleza integral
          </span>
          <span className="text-sm text-white/70 mt-1">
            📍 Dirección del salón
          </span>
        </div>

        {/* Links — solo desktop */}
        <div className="hidden lg:flex flex-col gap-2">
          <span className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-1">
            Navegación
          </span>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className="text-sm text-white/80 hover:text-warm-light transition-colors"
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        {/* Redes sociales */}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-1">
            Redes sociales
          </span>
          {redes.map((red) => (
            <a
              key={red.label}
              href={red.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm
              text-white/80 hover:text-warm-light transition-colors"
            >
              {red.label}
            </a>
          ))}
        </div>
      </div>

      {/* ─── COPYRIGHT ───────────────────────────────────────── */}
      <div className="border-t border-white/10 px-4 py-3 text-center">
        <span className="text-xs text-white/50">
          © 2026 Turnify. Todos los derechos reservados.
        </span>
      </div>
    </footer>
  );
}
