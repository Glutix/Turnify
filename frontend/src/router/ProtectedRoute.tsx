import { Navigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "cliente";
}

export function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps) {
  const { usuario, token } = useAuthStore();

  // Si no hay token, redirige al login
  if (!token || !usuario) {
    return <Navigate to="/login" replace />;
  }

  // Si se requiere un rol específico y el usuario no lo tiene, redirige al inicio
  if (requiredRole && usuario.rol !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
