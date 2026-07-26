import { NavLink } from "react-router-dom";
import { Logo } from "../common/Logo";
import { useAuthStore } from "../../stores/authStore";

const ADMIN_LINKS = [
  {
    to: "/admin",
    label: "Dashboard",
    end: true,
  },
  {
    to: "/admin/servicios",
    label: "Servicios",
  },
  {
    to: "/admin/turnos",
    label: "Turnos",
  },
  {
    to: "/admin/clientes",
    label: "Clientes",
  },
  {
    to: "/admin/horarios",
    label: "Horarios",
  },
  {
    to: "/admin/productos",
    label: "Productos",
  },
  {
    to: "/admin/portafolio",
    label: "Portafolio",
  },
  {
    to: "/admin/pedidos",
    label: "Pedidos",
  },
  {
    to: "/admin/usuarios",
    label: "Usuarios",
  },
];

export function AdminSidebar() {
  const { usuario, logout } = useAuthStore();

  return (
    <aside
      className="
        flex
        w-72
        flex-col
        border-r
        border-espresso/10
        bg-superficie
        px-6
        py-8
      "
    >
      {/* Logo */}
      <div className="mb-10 flex justify-center">
        <NavLink
          to="/admin"
          className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rosewood/50"
        >
          <Logo size={128} variant="gradient" />
        </NavLink>
      </div>

      {/* Navegación */}
      <nav className="flex flex-1 flex-col gap-2">
        {ADMIN_LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              `
              rounded-lg
              px-4
              py-3
              text-sm
              uppercase
              tracking-widest
              transition-colors

              ${
                isActive
                  ? "bg-rosewood/10 text-rosewood"
                  : "text-espresso/70 hover:bg-espresso/5 hover:text-rosewood"
              }
              `
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      {/* Usuario */}
      <div className="border-t border-espresso/10 pt-5">
        <div className="mb-4">
          <p className="text-sm font-semibold">{usuario?.nombre}</p>

          <p className="text-xs text-espresso/50">Administrador</p>
        </div>

        <button
          type="button"
          onClick={logout}
          className="
            w-full
            rounded-full
            bg-linear-to-r
            from-oro
            to-rosewood
            px-5
            py-3
            text-sm
            font-semibold
            uppercase
            tracking-widest
            text-superficie
            transition
            hover:shadow-md
          "
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
