//Turnify\frontend\src\router\AppRouter.tsx
import { Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { GuestRoute } from "./GuestRoute";
import { PublicLayout } from "../components/layout/PublicLayout";

import { LandingPage } from "../pages/public/LandingPage";
import { PortafolioPage } from "../pages/public/PortafolioPage";
import { TurnosPage } from "../pages/public/TurnosPage";
import { LoginPage } from "../pages/public/LoginPage";
import { NotFoundPage } from "../pages/public/NotFoundPage";

import { AgendaPage } from "../pages/admin/AgendaPage";
import { TurnosAdminPage } from "../pages/admin/TurnosAdminPage";
import { ServiciosAdminPage } from "../pages/admin/ServiciosAdminPage";
import { HorariosAdminPage } from "../pages/admin/HorariosAdminPage";
import { PortafolioAdminPage } from "../pages/admin/PortafolioAdminPage";
import { ProductosAdminPage } from "../pages/admin/ProductosAdminPage";
import { PedidosAdminPage } from "../pages/admin/PedidosAdminPage";
import { ClientesAdminPage } from "../pages/admin/ClientesAdminPage";
import { AdminLayout } from "../components/layout/AdminLayout";
import { UsuariosAdminPage } from "../pages/admin/UsuariosAdminPage";
import { ServiciosPage } from "../pages/public/ServiciosPage";
import { PerfilPage } from "../pages/public/PerfilPage";

export function AppRouter() {
  return (
    <Routes>
      {/* PUBLICAS */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/servicios" element={<ServiciosPage />} />
        <Route path="/portafolio" element={<PortafolioPage />} />
        <Route path="/turnos" element={<TurnosPage />} />
        {/* Cualquier usuario logueado (cliente o admin) */}
        <Route
          path="/perfil"
          element={
            <ProtectedRoute>
              <PerfilPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* LOGIN */}
      <Route
        path="/login"
        element={
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        }
      />

      {/* ADMIN */}

      <Route
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/admin" element={<AgendaPage />} />
        <Route path="/admin/turnos" element={<TurnosAdminPage />} />
        <Route path="/admin/servicios" element={<ServiciosAdminPage />} />
        <Route path="/admin/horarios" element={<HorariosAdminPage />} />
        <Route path="/admin/portafolio" element={<PortafolioAdminPage />} />
        <Route path="/admin/productos" element={<ProductosAdminPage />} />
        <Route path="/admin/pedidos" element={<PedidosAdminPage />} />
        <Route path="/admin/clientes" element={<ClientesAdminPage />} />
        <Route path="/admin/usuarios" element={<UsuariosAdminPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
