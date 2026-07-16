import { NavLink } from "react-router-dom";
import {
  IconInstagram,
  IconPhone,
  IconMapPin,
  IconClock,
} from "../common/Icons";

export function Footer() {
  return (
    <footer className="bg-espresso text-blush/80">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 md:grid-cols-3">
        {/* Marca */}
        <div>
          <p className="font-serif text-2xl text-blush">
            Turni<span className="italic text-oro">fy</span>
          </p>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-blush/60">
            Belleza y bienestar en un solo lugar. Reservá tu turno online y
            descubrí nuestros servicios sin salir de casa.
          </p>
        </div>

        {/* Navegación */}
        <div>
          <p className="mb-4 text-xs uppercase tracking-widest text-oro">
            Navegación
          </p>
          <ul className="space-y-3 text-sm">
            <li>
              <NavLink to="/" className="transition-colors hover:text-oro">
                Inicio
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/servicios"
                className="transition-colors hover:text-oro"
              >
                Servicios
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/portafolio"
                className="transition-colors hover:text-oro"
              >
                Portafolio
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/turnos"
                className="transition-colors hover:text-oro"
              >
                Reservar turno
              </NavLink>
            </li>
          </ul>
        </div>

        {/* Contacto */}
        <div>
          <p className="mb-4 text-xs uppercase tracking-widest text-oro">
            Contacto
          </p>
          <ul className="space-y-3 text-sm text-blush/70">
            <li className="flex items-center gap-2">
              <IconMapPin size={16} className="shrink-0 text-oro" />
              Presidencia Roque Sáenz Peña, Chaco
            </li>
            <li className="flex items-center gap-2">
              <IconClock size={16} className="shrink-0 text-oro" />
              Lun a Sáb · 9 a 12 y 16:30 a 20:30
            </li>
            <li className="flex items-center gap-2">
              <IconPhone size={16} className="shrink-0 text-oro" />
              +54 9 3644 000-000
            </li>
            <li className="flex items-center gap-2">
              <IconInstagram size={16} className="shrink-0 text-oro" />
              @turnify.salon
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-blush/10 px-6 py-6 text-center text-xs text-blush/50">
        © {new Date().getFullYear()} Turnify. Todos los derechos reservados.
      </div>
    </footer>
  );
}
