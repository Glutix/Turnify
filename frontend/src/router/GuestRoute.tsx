//Turnify\frontend\src\router\GuestRoute.tsx

import { Navigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";

export function GuestRoute({ children }: { children: React.ReactNode }) {
  const { usuario, token } = useAuthStore();

  if (!token || !usuario) {
    return <>{children}</>;
  }

  return <Navigate to={usuario.rol === "admin" ? "/admin" : "/"} replace />;
}
