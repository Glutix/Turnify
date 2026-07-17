import { useState } from "react";
import { isAxiosError } from "axios";
import { Table } from "../../components/common/Table";
import { Button } from "../../components/common/Button";
import { Modal } from "../../components/common/Modal";
import { Toast } from "../../components/common/Toast";
import { ServicioForm } from "../../components/servicios/ServicioForm";
import { CategoriaForm } from "../../components/servicios/CategoriaForm";
import { ConfirmDialog } from "../../components/servicios/ConfirmDialog";
import { formatearDuracion, formatearPrecio } from "../../utils/servicio";
import {
  useServicios,
  useCrearServicio,
  useActualizarServicio,
  useToggleEstadoServicio,
} from "../../hooks/useServicios";
import {
  useCategoriasServicio,
  useCrearCategoria,
  useActualizarCategoria,
  useEliminarCategoria,
} from "../../hooks/useCategoriasServicio";
import type { Servicio, CategoriaServicio } from "../../types/servicio";

type Tab = "servicios" | "categorias";
type ToastState = { message: string; type: "success" | "error" } | null;

export function ServiciosAdminPage() {
  const [tab, setTab] = useState<Tab>("servicios");
  const [toast, setToast] = useState<ToastState>(null);
  const [mostrarInactivos, setMostrarInactivos] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState<string>("");

  // Modales de servicio
  const [modalServicioAbierto, setModalServicioAbierto] = useState(false);
  const [servicioEnEdicion, setServicioEnEdicion] = useState<Servicio | undefined>();

  // Modales de categoría
  const [modalCategoriaAbierto, setModalCategoriaAbierto] = useState(false);
  const [categoriaEnEdicion, setCategoriaEnEdicion] = useState<CategoriaServicio | undefined>();
  const [categoriaAEliminar, setCategoriaAEliminar] = useState<CategoriaServicio | null>(null);
  const [errorEliminarCategoria, setErrorEliminarCategoria] = useState("");

  const { data: servicios = [], isLoading: cargandoServicios } = useServicios();
  const { data: categorias = [], isLoading: cargandoCategorias } = useCategoriasServicio();

  const crearServicio = useCrearServicio();
  const actualizarServicio = useActualizarServicio();
  const toggleEstadoServicio = useToggleEstadoServicio();

  const crearCategoria = useCrearCategoria();
  const actualizarCategoria = useActualizarCategoria();
  const eliminarCategoria = useEliminarCategoria();

  // ─── Filtrado de servicios ───────────────────────────────
  const serviciosFiltrados = servicios.filter((s) => {
    if (!mostrarInactivos && !s.activo) return false;
    if (filtroCategoria && String(s.categoria_id) !== filtroCategoria) return false;
    if (busqueda && !s.nombre.toLowerCase().includes(busqueda.toLowerCase())) return false;
    return true;
  });

  // ─── Handlers de Servicio ───────────────────────────────
  function abrirCrearServicio() {
    setServicioEnEdicion(undefined);
    setModalServicioAbierto(true);
  }

  function abrirEditarServicio(servicio: Servicio) {
    setServicioEnEdicion(servicio);
    setModalServicioAbierto(true);
  }

  function handleSubmitServicio(payload: Parameters<typeof crearServicio.mutate>[0]) {
    if (servicioEnEdicion) {
      actualizarServicio.mutate(
        { id: servicioEnEdicion.id, payload },
        {
          onSuccess: () => {
            setModalServicioAbierto(false);
            setToast({ message: "Servicio actualizado correctamente", type: "success" });
          },
          onError: () => {
            setToast({ message: "No se pudo actualizar el servicio", type: "error" });
          },
        },
      );
    } else {
      crearServicio.mutate(payload, {
        onSuccess: () => {
          setModalServicioAbierto(false);
          setToast({ message: "Servicio creado correctamente", type: "success" });
        },
        onError: () => {
          setToast({ message: "No se pudo crear el servicio", type: "error" });
        },
      });
    }
  }

  function handleToggleEstado(servicio: Servicio) {
    toggleEstadoServicio.mutate(servicio.id, {
      onSuccess: () => {
        setToast({
          message: servicio.activo ? "Servicio desactivado" : "Servicio activado",
          type: "success",
        });
      },
      onError: () => {
        setToast({ message: "No se pudo cambiar el estado del servicio", type: "error" });
      },
    });
  }

  // ─── Handlers de Categoría ───────────────────────────────
  function abrirCrearCategoria() {
    setCategoriaEnEdicion(undefined);
    setModalCategoriaAbierto(true);
  }

  function abrirEditarCategoria(categoria: CategoriaServicio) {
    setCategoriaEnEdicion(categoria);
    setModalCategoriaAbierto(true);
  }

  function handleSubmitCategoria(payload: Parameters<typeof crearCategoria.mutate>[0]) {
    if (categoriaEnEdicion) {
      actualizarCategoria.mutate(
        { id: categoriaEnEdicion.id, payload },
        {
          onSuccess: () => {
            setModalCategoriaAbierto(false);
            setToast({ message: "Categoría actualizada correctamente", type: "success" });
          },
          onError: () => {
            setToast({ message: "No se pudo actualizar la categoría", type: "error" });
          },
        },
      );
    } else {
      crearCategoria.mutate(payload, {
        onSuccess: () => {
          setModalCategoriaAbierto(false);
          setToast({ message: "Categoría creada correctamente", type: "success" });
        },
        onError: () => {
          setToast({ message: "No se pudo crear la categoría", type: "error" });
        },
      });
    }
  }

  function abrirConfirmarEliminarCategoria(categoria: CategoriaServicio) {
    setErrorEliminarCategoria("");
    setCategoriaAEliminar(categoria);
  }

  function handleConfirmarEliminarCategoria() {
    if (!categoriaAEliminar) return;

    eliminarCategoria.mutate(categoriaAEliminar.id, {
      onSuccess: () => {
        setCategoriaAEliminar(null);
        setToast({ message: "Categoría eliminada correctamente", type: "success" });
      },
      onError: (error) => {
        // El backend responde 409 con un mensaje claro cuando la categoría
        // tiene servicios asociados (constraint Restrict de Prisma).
        if (isAxiosError(error) && error.response?.status === 409) {
          setErrorEliminarCategoria(error.response.data.message);
        } else {
          setErrorEliminarCategoria("No se pudo eliminar la categoría. La categoría tiene servicios asociados.");
        }
      },
    });
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="mb-6 font-serif text-3xl text-espresso">Servicios</h1>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b border-espresso/10">
        <button
          onClick={() => setTab("servicios")}
          className={`px-4 py-2 text-sm font-medium transition ${
            tab === "servicios"
              ? "border-b-2 border-rosewood text-rosewood"
              : "text-espresso/50 hover:text-espresso"
          }`}
        >
          Servicios
        </button>
        <button
          onClick={() => setTab("categorias")}
          className={`px-4 py-2 text-sm font-medium transition ${
            tab === "categorias"
              ? "border-b-2 border-rosewood text-rosewood"
              : "text-espresso/50 hover:text-espresso"
          }`}
        >
          Categorías
        </button>
      </div>

      {tab === "servicios" && (
        <div className="flex flex-col gap-4">
          {/* Filtros */}
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex flex-wrap gap-3">
              <input
                type="text"
                placeholder="Buscar por nombre..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="rounded-xl border border-espresso/15 bg-superficie px-4 py-2.5 text-sm text-espresso placeholder:text-espresso/35 focus:border-rosewood focus:outline-none focus:ring-2 focus:ring-rosewood/20"
              />
              <select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                className="rounded-xl border border-espresso/15 bg-superficie px-4 py-2.5 text-sm text-espresso focus:border-rosewood focus:outline-none focus:ring-2 focus:ring-rosewood/20"
              >
                <option value="">Todas las categorías</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-sm text-espresso/70">
                <input
                  type="checkbox"
                  checked={mostrarInactivos}
                  onChange={(e) => setMostrarInactivos(e.target.checked)}
                />
                Mostrar inactivos
              </label>
            </div>
            <Button onClick={abrirCrearServicio}>Nuevo servicio</Button>
          </div>

          {cargandoServicios ? (
            <p className="py-10 text-center text-sm text-espresso/50">Cargando servicios...</p>
          ) : (
            <Table<Servicio>
              data={serviciosFiltrados}
              keyExtractor={(s) => s.id}
              rowClassName={(s) => (s.activo ? "" : "opacity-40")}
              emptyMessage="No se encontraron servicios con esos filtros."
              columns={[
                { header: "Nombre", render: (s) => s.nombre },
                { header: "Categoría", render: (s) => s.categoria.nombre },
                { header: "Duración", render: (s) => formatearDuracion(s.duracion_minutos) },
                { header: "Precio", render: (s) => formatearPrecio(s.precio) },
                {
                  header: "Estado",
                  render: (s) => (
                    <span className={s.activo ? "text-oro" : "text-espresso/40"}>
                      {s.activo ? "Activo" : "Inactivo"}
                    </span>
                  ),
                },
                {
                  header: "Acciones",
                  render: (s) => (
                    <div className="flex gap-3">
                      <Button variant="link" onClick={() => abrirEditarServicio(s)}>
                        Editar
                      </Button>
                      <Button variant="link" onClick={() => handleToggleEstado(s)}>
                        {s.activo ? "Desactivar" : "Activar"}
                      </Button>
                    </div>
                  ),
                },
              ]}
            />
          )}
        </div>
      )}

      {tab === "categorias" && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-end">
            <Button onClick={abrirCrearCategoria}>Nueva categoría</Button>
          </div>

          {cargandoCategorias ? (
            <p className="py-10 text-center text-sm text-espresso/50">Cargando categorías...</p>
          ) : (
            <Table<CategoriaServicio>
              data={categorias}
              keyExtractor={(c) => c.id}
              emptyMessage="Todavía no hay categorías creadas."
              columns={[
                { header: "Nombre", render: (c) => c.nombre },
                { header: "Descripción", render: (c) => c.descripcion ?? "—" },
                {
                  header: "Acciones",
                  render: (c) => (
                    <div className="flex gap-3">
                      <Button variant="link" onClick={() => abrirEditarCategoria(c)}>
                        Editar
                      </Button>
                      <Button variant="link" onClick={() => abrirConfirmarEliminarCategoria(c)}>
                        Eliminar
                      </Button>
                    </div>
                  ),
                },
              ]}
            />
          )}
        </div>
      )}

      {/* Modal: crear/editar servicio */}
      <Modal
        isOpen={modalServicioAbierto}
        onClose={() => setModalServicioAbierto(false)}
        title={servicioEnEdicion ? "Editar servicio" : "Nuevo servicio"}
      >
        <ServicioForm
          servicioInicial={servicioEnEdicion}
          categorias={categorias}
          onSubmit={handleSubmitServicio}
          onCancel={() => setModalServicioAbierto(false)}
          isSubmitting={crearServicio.isPending || actualizarServicio.isPending}
        />
      </Modal>

      {/* Modal: crear/editar categoría */}
      <Modal
        isOpen={modalCategoriaAbierto}
        onClose={() => setModalCategoriaAbierto(false)}
        title={categoriaEnEdicion ? "Editar categoría" : "Nueva categoría"}
      >
        <CategoriaForm
          categoriaInicial={categoriaEnEdicion}
          onSubmit={handleSubmitCategoria}
          onCancel={() => setModalCategoriaAbierto(false)}
          isSubmitting={crearCategoria.isPending || actualizarCategoria.isPending}
        />
      </Modal>

      {/* Confirmación: eliminar categoría */}
      <ConfirmDialog
        isOpen={categoriaAEliminar !== null}
        title="Eliminar categoría"
        message={`¿Seguro que querés eliminar "${categoriaAEliminar?.nombre}"? Esta acción no se puede deshacer.`}
        onConfirm={handleConfirmarEliminarCategoria}
        onCancel={() => setCategoriaAEliminar(null)}
        isConfirming={eliminarCategoria.isPending}
        errorMessage={errorEliminarCategoria}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}