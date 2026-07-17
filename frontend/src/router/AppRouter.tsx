import { Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { PublicLayout } from "../components/layout/PublicLayout";

import { LandingPage } from "../pages/public/LandingPage";
import { ServiciosRouterPage } from "../pages/public/ServiciosRouterPage";
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

export function AppRouter() {
  return (
    <Routes>
      {/* PUBLICAS */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />

        <Route path="/servicios" element={<ServiciosRouterPage />} />

        <Route path="/portafolio" element={<PortafolioPage />} />

        <Route path="/turnos" element={<TurnosPage />} />
      </Route>

      {/* LOGIN */}
      <Route path="/login" element={<LoginPage />} />

      {/* ADMIN */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="admin">
            <AgendaPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/turnos"
        element={
          <ProtectedRoute requiredRole="admin">
            <TurnosAdminPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/servicios"
        element={
          <ProtectedRoute requiredRole="admin">
            <ServiciosAdminPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/horarios"
        element={
          <ProtectedRoute requiredRole="admin">
            <HorariosAdminPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/portafolio"
        element={
          <ProtectedRoute requiredRole="admin">
            <PortafolioAdminPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/productos"
        element={
          <ProtectedRoute requiredRole="admin">
            <ProductosAdminPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/pedidos"
        element={
          <ProtectedRoute requiredRole="admin">
            <PedidosAdminPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/clientes"
        element={
          <ProtectedRoute requiredRole="admin">
            <ClientesAdminPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
