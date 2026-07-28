import {
  IconInstagram,
  IconPhone,
  IconMapPin,
  IconClock,
} from "../common/Icons";
import { Logo } from "../common/Logo";

export function Footer() {
  return (
    <footer className="bg-espresso text-blush/80">
      <div className="mx-auto max-w-6xl px-6 py-16">
        {/* Contenido del footer, sobre el mismo bg-espresso — sin card separada */}
        <div className="relative px-8 py-12 md:px-12">
          <div className="grid gap-12 md:grid-cols-2">
            {/* Marca — siempre centrada, en mobile y en desktop */}
            <div className="flex flex-col items-center text-center">
              <Logo size={84} variant="light" />
              <p className="mt-4 max-w-xs font-serif text-base italic leading-relaxed text-blush/70">
                Belleza y bienestar en un solo lugar.
              </p>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-blush/50">
                Reservá tu turno online y descubrí nuestros servicios sin salir
                de casa.
              </p>
            </div>

            {/* Contacto — centrado en mobile, a la izquierda en desktop */}
            <div className="flex flex-col items-center text-center md:items-start md:text-left">
              <p className="mb-4 text-xs uppercase tracking-widest text-oro">
                Contacto
              </p>
              <ul className="w-full space-y-3 text-sm text-blush/70">
                <li className="flex items-center justify-center gap-2 md:justify-start">
                  <IconMapPin size={16} className="shrink-0 text-oro" />
                  Presidencia Roque Sáenz Peña, Chaco
                </li>
                <li className="flex items-center justify-center gap-2 md:justify-start">
                  <IconClock size={16} className="shrink-0 text-oro" />
                  Lun a Sáb · 9 a 12 y 16:30 a 20:30
                </li>
                <li className="flex items-center justify-center gap-2 md:justify-start">
                  <IconPhone size={16} className="shrink-0 text-oro" />
                  +54 9 3644 000-000
                </li>
              </ul>
            </div>
          </div>

          {/* Línea inferior — equivalente a la franja de copyright + redes del footer anterior */}
          <div className="mt-12 flex flex-col items-center gap-4 border-t border-blush/10 pt-6 text-center md:flex-row md:justify-between md:text-left">
            <p className="text-xs text-blush/50">
              © {new Date().getFullYear()} Gisela Toloza. Todos los derechos
              reservados.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://instagram.com/turnify.salon"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="text-blush/50 transition-colors hover:text-oro"
              >
                <IconInstagram size={18} />
              </a>
              {/* Espacio reservado para futuras redes sociales */}
              <a
                href="#"
                aria-label="Red social"
                className="text-blush/50 transition-colors hover:text-oro"
              >
                <IconInstagram size={18} />
              </a>
              <a
                href="#"
                aria-label="Red social"
                className="text-blush/50 transition-colors hover:text-oro"
              >
                <IconInstagram size={18} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
