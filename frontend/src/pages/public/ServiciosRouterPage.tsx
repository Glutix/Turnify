import { useAuthStore } from "../../stores/authStore";
import { ServiciosPage } from "./ServiciosPage";
import { ServiciosAdminPage } from "../admin/ServiciosAdminPage";

export function ServiciosRouterPage() {
  const usuario = useAuthStore((state) => state.usuario);

  if (usuario?.rol === "admin") {
    return <ServiciosAdminPage />;
  }

  return <ServiciosPage />;
}