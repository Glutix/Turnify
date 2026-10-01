//Turnify\frontend\src\pages\admin\HorariosAdminPage.tsx
import { useState } from "react";
import { isAxiosError } from "axios";
import { Table } from "../../components/common/Table";
import { Button } from "../../components/common/Button";
import { Modal } from "../../components/common/Modal";
import { Toast } from "../../components/common/Toast";
import { ConfirmDialog } from "../../components/servicios/ConfirmDialog";
import { FranjaHorariaForm } from "../../components/horarios/FranjaHorariaForm";
import { ExcepcionHorarioForm } from "../../components/horarios/ExcepcionHorarioForm";
import {
  useFranjasHorarias,
  useCrearFranjaHoraria,
  useActualizarFranjaHoraria,
  useToggleEstadoFranjaHoraria,
} from "../../hooks/useFranjasHorarias";
import {
  useExcepcionesHorario,
  useCrearExcepcionHorario,
  useActualizarExcepcionHorario,
  useEliminarExcepcionHorario,
} from "../../hooks/useExcepcionesHorario";
import { ETIQUETA_DIA, horaDesdeISO } from "../../types/horarios";
import type { FranjaHoraria, ExcepcionHorario, DiaSemana } from "../../types/horarios";

type Tab = "franjas" | "excepciones";
type ToastState = { message: string; type: "success" | "error" } | null;

export function HorariosAdminPage() {
  const [tab, setTab] = useState<Tab>("franjas");
  const [toast, setToast] = useState<ToastState>(null);
  const [filtroDia, setFiltroDia] = useState<DiaSemana | "">("");

  // Modal de franja
  const [modalFranjaAbierto, setModalFranjaAbierto] = useState(false);
  const [franjaEnEdicion, setFranjaEnEdicion] = useState<FranjaHoraria | undefined>();

  // Modal de excepción
  const [modalExcepcionAbierto, setModalExcepcionAbierto] = useState(false);
  const [excepcionEnEdicion, setExcepcionEnEdicion] = useState<ExcepcionHorario | undefined>();
  const [excepcionAEliminar, setExcepcionAEliminar] = useState<ExcepcionHorario | null>(null);
  const [errorEliminarExcepcion, setErrorEliminarExcepcion] = useState("");

  const { data: franjas = [], isLoading: cargandoFranjas } = useFranjasHorarias();
  const { data: excepciones = [], isLoading: cargandoExcepciones } = useExcepcionesHorario();

  const crearFranja = useCrearFranjaHoraria();
  const actualizarFranja = useActualizarFranjaHoraria();
  const toggleEstadoFranja = useToggleEstadoFranjaHoraria();

  const crearExcepcion = useCrearExcepcionHorario();
  const actualizarExcepcion = useActualizarExcepcionHorario();
  const eliminarExcepcion = useEliminarExcepcionHorario();

  // ─── Filtrado de franjas ───────────────────────────────
  const franjasFiltradas = franjas.filter((f) => {
    if (filtroDia && f.dia_semana !== filtroDia) return false;
    return true;
  });

  // ─── Handlers de Franja ───────────────────────────────
  function abrirCrearFranja() {
    setFranjaEnEdicion(undefined);
    setModalFranjaAbierto(true);
  }

  function abrirEditarFranja(franja: FranjaHoraria) {
    setFranjaEnEdicion(franja);
    setModalFranjaAbierto(true);
  }

  function handleSubmitFranja(payload: Parameters<typeof crearFranja.mutate>[0]) {
    if (franjaEnEdicion) {
      actualizarFranja.mutate(
        { id: franjaEnEdicion.id, payload },
        {
          onSuccess: () => {
            setModalFranjaAbierto(false);
            setToast({ message: "Franja horaria actualizada correctamente", type: "success" });
          },
          onError: (error) => {
            setToast({
              message: extraerMensajeConflicto(error, "No se pudo actualizar la franja horaria"),
              type: "error",
            });
          },
        },
      );
    } else {
      crearFranja.mutate(payload, {
        onSuccess: () => {
          setModalFranjaAbierto(false);
          setToast({ message: "Franja horaria creada correctamente", type: "success" });
        },
        onError: (error) => {
          setToast({
            message: extraerMensajeConflicto(error, "No se pudo crear la franja horaria"),
            type: "error",
          });
        },
      });
    }
  }

  function handleToggleEstadoFranja(franja: FranjaHoraria) {
    toggleEstadoFranja.mutate(franja.id, {
      onSuccess: () => {
        setToast({
          message: franja.activo ? "Franja desactivada" : "Franja activada",
          type: "success",
        });
      },
      onError: (error) => {
        setToast({
          message: extraerMensajeConflicto(error, "No se pudo cambiar el estado de la franja"),
          type: "error",
        });
      },
    });
  }

  // ─── Handlers de Excepción ───────────────────────────────
  function abrirCrearExcepcion() {
    setExcepcionEnEdicion(undefined);
    setModalExcepcionAbierto(true);
  }

  function abrirEditarExcepcion(excepcion: ExcepcionHorario) {
    setExcepcionEnEdicion(excepcion);
    setModalExcepcionAbierto(true);
  }

  function handleSubmitExcepcion(payload: Parameters<typeof crearExcepcion.mutate>[0]) {
    if (excepcionEnEdicion) {
      actualizarExcepcion.mutate(
        { id: excepcionEnEdicion.id, payload },
        {
          onSuccess: () => {
            setModalExcepcionAbierto(false);
            setToast({ message: "Excepción actualizada correctamente", type: "success" });
          },
          onError: (error) => {
            setToast({
              message: extraerMensajeConflicto(error, "No se pudo actualizar la excepción"),
              type: "error",
            });
          },
        },
      );
    } else {
      crearExcepcion.mutate(payload, {
        onSuccess: () => {
          setModalExcepcionAbierto(false);
          setToast({ message: "Excepción creada correctamente", type: "success" });
        },
        onError: (error) => {
          setToast({
            message: extraerMensajeConflicto(error, "No se pudo crear la excepción"),
            type: "error",
          });
        },
      });
    }
  }

  function abrirConfirmarEliminarExcepcion(excepcion: ExcepcionHorario) {
    setErrorEliminarExcepcion("");
    setExcepcionAEliminar(excepcion);
  }

  function handleConfirmarEliminarExcepcion() {
    if (!excepcionAEliminar) return;

    eliminarExcepcion.mutate(excepcionAEliminar.id, {
      onSuccess: () => {
        setExcepcionAEliminar(null);
        setToast({ message: "Excepción eliminada correctamente", type: "success" });
      },
      onError: (error) => {
        // El backend responde 409 con un mensaje claro cuando hay turnos
        // reservados en conflicto con el rango de la excepción.
        setErrorEliminarExcepcion(
          extraerMensajeConflicto(error, "No se pudo eliminar la excepción."),
        );
      },
    });
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="mb-6 font-serif text-3xl text-espresso">Horarios</h1>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b border-espresso/10">
        <button
          onClick={() => setTab("franjas")}
          className={`px-4 py-2 text-sm font-medium transition ${
            tab === "franjas"
              ? "border-b-2 border-rosewood text-rosewood"
              : "text-espresso/50 hover:text-espresso"
          }`}
        >
          Franjas horarias
        </button>
        <button
          onClick={() => setTab("excepciones")}
          className={`px-4 py-2 text-sm font-medium transition ${
            tab === "excepciones"
              ? "border-b-2 border-rosewood text-rosewood"
              : "text-espresso/50 hover:text-espresso"
          }`}
        >
          Excepciones / feriados
        </button>
      </div>

      {tab === "franjas" && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <select
              value={filtroDia}
              onChange={(e) => setFiltroDia(e.target.value as DiaSemana | "")}
              className="rounded-xl border border-espresso/15 bg-superficie px-4 py-2.5 text-sm text-espresso focus:border-rosewood focus:outline-none focus:ring-2 focus:ring-rosewood/20"
            >
              <option value="">Todos los días</option>
              {Object.entries(ETIQUETA_DIA).map(([dia, etiqueta]) => (
                <option key={dia} value={dia}>
                  {etiqueta}
                </option>
              ))}
            </select>
            <Button onClick={abrirCrearFranja}>Nueva franja</Button>
          </div>

          {cargandoFranjas ? (
            <p className="py-10 text-center text-sm text-espresso/50">Cargando franjas...</p>
          ) : (
            <Table<FranjaHoraria>
              data={franjasFiltradas}
              keyExtractor={(f) => f.id}
              rowClassName={(f) => (f.activo ? "" : "opacity-40")}
              emptyMessage="No se encontraron franjas horarias con esos filtros."
              columns={[
                { header: "Día", render: (f) => ETIQUETA_DIA[f.dia_semana] },
                { header: "Desde", render: (f) => horaDesdeISO(f.hora_inicio) },
                { header: "Hasta", render: (f) => horaDesdeISO(f.hora_fin) },
                {
                  header: "Estado",
                  render: (f) => (
                    <span className={f.activo ? "text-oro" : "text-espresso/40"}>
                      {f.activo ? "Activa" : "Inactiva"}
                    </span>
                  ),
                },
                {
                  header: "Acciones",
                  render: (f) => (
                    <div className="flex gap-3">
                      <Button variant="link" onClick={() => abrirEditarFranja(f)}>
                        Editar
                      </Button>
                      <Button variant="link" onClick={() => handleToggleEstadoFranja(f)}>
                        {f.activo ? "Desactivar" : "Activar"}
                      </Button>
                    </div>
                  ),
                },
              ]}
            />
          )}
        </div>
      )}

      {tab === "excepciones" && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-end">
            <Button onClick={abrirCrearExcepcion}>Nueva excepción</Button>
          </div>

          {cargandoExcepciones ? (
            <p className="py-10 text-center text-sm text-espresso/50">Cargando excepciones...</p>
          ) : (
            <Table<ExcepcionHorario>
              data={excepciones}
              keyExtractor={(e) => e.id}
              emptyMessage="Todavía no hay excepciones creadas."
              columns={[
                { header: "Desde", render: (e) => e.fecha_desde },
                { header: "Hasta", render: (e) => e.fecha_hasta },
                {
                  header: "Tipo",
                  render: (e) => etiquetaTipoExcepcion(e),
                },
                { header: "Descripción", render: (e) => e.descripcion ?? "—" },
                {
                  header: "Acciones",
                  render: (e) => (
                    <div className="flex gap-3">
                      <Button variant="link" onClick={() => abrirEditarExcepcion(e)}>
                        Editar
                      </Button>
                      <Button
                        variant="link"
                        onClick={() => abrirConfirmarEliminarExcepcion(e)}
                      >
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

      {/* Modal: crear/editar franja */}
      <Modal
        isOpen={modalFranjaAbierto}
        onClose={() => setModalFranjaAbierto(false)}
        title={franjaEnEdicion ? "Editar franja horaria" : "Nueva franja horaria"}
      >
        <FranjaHorariaForm
          franjaInicial={franjaEnEdicion}
          onSubmit={handleSubmitFranja}
          onCancel={() => setModalFranjaAbierto(false)}
          isSubmitting={crearFranja.isPending || actualizarFranja.isPending}
        />
      </Modal>

      {/* Modal: crear/editar excepción */}
      <Modal
        isOpen={modalExcepcionAbierto}
        onClose={() => setModalExcepcionAbierto(false)}
        title={excepcionEnEdicion ? "Editar excepción" : "Nueva excepción"}
      >
        <ExcepcionHorarioForm
          excepcionInicial={excepcionEnEdicion}
          onSubmit={handleSubmitExcepcion}
          onCancel={() => setModalExcepcionAbierto(false)}
          isSubmitting={crearExcepcion.isPending || actualizarExcepcion.isPending}
        />
      </Modal>

      {/* Confirmación: eliminar excepción */}
      <ConfirmDialog
        isOpen={excepcionAEliminar !== null}
        title="Eliminar excepción"
        message={`¿Seguro que querés eliminar la excepción del ${excepcionAEliminar?.fecha_desde} al ${excepcionAEliminar?.fecha_hasta}? Esta acción no se puede deshacer.`}
        onConfirm={handleConfirmarEliminarExcepcion}
        onCancel={() => setExcepcionAEliminar(null)}
        isConfirming={eliminarExcepcion.isPending}
        errorMessage={errorEliminarExcepcion}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

// El backend solo distingue 2 tipos (bloqueo_total / horario_especial),
// pero en la UI mostramos 3 categorías (ver ExcepcionHorarioForm): un
// bloqueo_total de un solo día se muestra como "Feriado", y de varios
// días como "Vacaciones / cierre".
function etiquetaTipoExcepcion(excepcion: ExcepcionHorario): string {
  if (excepcion.tipo === "horario_especial") return "Horario especial";
  return excepcion.fecha_desde === excepcion.fecha_hasta
    ? "Feriado"
    : "Vacaciones / cierre";
}

// El backend responde 409 con un mensaje claro cuando hay turnos en
// conflicto (RF41/CU-21). Lo mostramos tal cual si viene; si no, un
// mensaje genérico.
function extraerMensajeConflicto(error: unknown, mensajePorDefecto: string): string {
  if (isAxiosError(error) && error.response?.status === 409) {
    return error.response.data.message ?? mensajePorDefecto;
  }
  return mensajePorDefecto;
}