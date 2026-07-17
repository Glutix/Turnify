import { Navigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";

interface RoleRouteProps {
  children: React.ReactNode;
  role: "admin" | "cliente";
}

export function RoleRoute({ children, role }: RoleRouteProps) {
  const usuario = useAuthStore((state) => state.usuario);

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (usuario.rol !== role) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
