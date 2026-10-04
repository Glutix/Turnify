//Turnify\frontend\src\pages\admin\TurnosAdminPage.tsx
import { useState, type FormEvent } from "react";
import { Table } from "../../components/common/Table";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { Select } from "../../components/common/Select";
import { Modal } from "../../components/common/Modal";
import { Toast } from "../../components/common/Toast";
import { ConfirmDialog } from "../../components/servicios/ConfirmDialog";
import {
  useTurnosAdmin,
  useCancelarTurnoAdmin,
  useMarcarAtendido,
} from "../../hooks/useTurnos";
import {
  ETIQUETA_ESTADO,
  formatearFechaHora,
  type EstadoTurno,
  type FiltrosTurnosAdmin,
  type Turno,
} from "../../types/turno";
import { extraerMensajeError } from "../../utils/extraerMensajeError";
import { formatearDuracion, formatearPrecio, precioANumero } from "../../utils/servicio";

type ToastState = { message: string; type: "success" | "error" } | null;

interface FormFiltros {
  busqueda: string;
  estado: EstadoTurno | "todos";
  desde: string;
  hasta: string;
}

const FILTROS_VACIOS: FormFiltros = { busqueda: "", estado: "todos", desde: "", hasta: "" };
const TURNOS_POR_PAGINA = 15;

const OPCIONES_ESTADO = [
  { value: "todos", label: "Todos" },
  ...(Object.keys(ETIQUETA_ESTADO) as EstadoTurno[]).map((e) => ({
    value: e,
    label: ETIQUETA_ESTADO[e],
  })),
];

const ESTILO_ESTADO: Record<EstadoTurno, string> = {
  confirmado: "bg-oro/20 text-espresso",
  atendido: "bg-espresso/10 text-espresso",
  cancelado: "bg-rosewood/10 text-rosewood",
  reprogramado: "bg-espresso/5 text-espresso/60",
};

function nombreCliente(turno: Turno): string {
  if (!turno.usuario) return "—";
  return `${turno.usuario.nombre} ${turno.usuario.apellido ?? ""}`.trim();
}

function nombreServicios(turno: Turno): string {
  if (!turno.turno_servicios || turno.turno_servicios.length === 0) return "—";
  return turno.turno_servicios.map((ts) => ts.servicio.nombre).join(", ");
}

function totalTurno(turno: Turno): string {
  const total = (turno.turno_servicios ?? []).reduce(
    (acc, ts) => acc + precioANumero(ts.precio_unitario),
    0,
  );
  return formatearPrecio(String(total));
}

function EstadoBadge({ estado }: { estado: EstadoTurno }) {
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${ESTILO_ESTADO[estado]}`}
    >
      {ETIQUETA_ESTADO[estado]}
    </span>
  );
}

export function TurnosAdminPage() {
  // "form" es lo que se está tipeando; "aplicados" es lo que realmente consulta
  // al backend (se actualiza al buscar, así no se dispara una request por tecla).
  const [form, setForm] = useState<FormFiltros>(FILTROS_VACIOS);
  const [aplicados, setAplicados] = useState<FormFiltros>(FILTROS_VACIOS);
  const [pagina, setPagina] = useState(1);

  const [toast, setToast] = useState<ToastState>(null);
  const [turnoDetalle, setTurnoDetalle] = useState<Turno | null>(null);
  const [turnoACancelar, setTurnoACancelar] = useState<Turno | null>(null);
  const [errorCancelar, setErrorCancelar] = useState("");

  const filtros: FiltrosTurnosAdmin = {
    busqueda: aplicados.busqueda.trim() || undefined,
    estado: aplicados.estado === "todos" ? undefined : aplicados.estado,
    desde: aplicados.desde || undefined,
    hasta: aplicados.hasta || undefined,
    pagina,
    limite: TURNOS_POR_PAGINA,
  };

  const { data, isLoading, isFetching, isError } = useTurnosAdmin(filtros);
  const cancelarTurno = useCancelarTurnoAdmin();
  const marcarAtendido = useMarcarAtendido();

  const turnos = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / TURNOS_POR_PAGINA));

  function handleBuscar(e: FormEvent) {
    e.preventDefault();
    if (form.desde && form.hasta && form.desde > form.hasta) {
      setToast({ message: "La fecha \"desde\" no puede ser posterior a \"hasta\"", type: "error" });
      return;
    }
    setAplicados(form);
    setPagina(1);
  }

  function handleLimpiar() {
    setForm(FILTROS_VACIOS);
    setAplicados(FILTROS_VACIOS);
    setPagina(1);
  }

  function handleMarcarAtendido(turno: Turno) {
    marcarAtendido.mutate(turno.id, {
      onSuccess: () => {
        setTurnoDetalle(null);
        setToast({ message: "Turno marcado como atendido", type: "success" });
      },
      onError: (error) =>
        setToast({
          message: extraerMensajeError(error, "No se pudo actualizar el turno"),
          type: "error",
        }),
    });
  }

  function handleConfirmarCancelar() {
    if (!turnoACancelar) return;
    cancelarTurno.mutate(turnoACancelar.id, {
      onSuccess: () => {
        setTurnoACancelar(null);
        setTurnoDetalle(null);
        setToast({ message: "Turno cancelado", type: "success" });
      },
      onError: (error) =>
        setErrorCancelar(extraerMensajeError(error, "No se pudo cancelar el turno")),
    });
  }

  function pedirCancelacion(turno: Turno) {
    setErrorCancelar("");
    setTurnoACancelar(turno);
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="mb-6 font-serif text-3xl text-espresso">Gestión de turnos</h1>

      <form onSubmit={handleBuscar} className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          label="Cliente"
          placeholder="Nombre o teléfono"
          value={form.busqueda}
          onChange={(e) => setForm({ ...form, busqueda: e.target.value })}
        />
        <Select
          label="Estado"
          options={OPCIONES_ESTADO}
          value={form.estado}
          onChange={(e) => setForm({ ...form, estado: e.target.value as FormFiltros["estado"] })}
        />
        <Input
          label="Desde"
          type="date"
          value={form.desde}
          onChange={(e) => setForm({ ...form, desde: e.target.value })}
        />
        <Input
          label="Hasta"
          type="date"
          value={form.hasta}
          onChange={(e) => setForm({ ...form, hasta: e.target.value })}
        />
        <div className="flex gap-3 sm:col-span-2 lg:col-span-4">
          <Button type="submit">Buscar</Button>
          <Button type="button" variant="subtle" onClick={handleLimpiar}>
            Limpiar
          </Button>
        </div>
      </form>

      {isLoading ? (
        <p className="py-10 text-center text-sm text-espresso/50">Cargando turnos...</p>
      ) : isError ? (
        <p className="py-10 text-center text-sm text-rosewood">No se pudieron cargar los turnos.</p>
      ) : (
        <>
          <p className="mb-3 text-sm text-espresso/60">
            {total} {total === 1 ? "turno" : "turnos"}
            {isFetching && " · actualizando..."}
          </p>

          <Table<Turno>
            data={turnos}
            keyExtractor={(t) => t.id}
            rowClassName={(t) =>
              t.estado === "cancelado" || t.estado === "reprogramado" ? "opacity-50" : ""
            }
            emptyMessage="No hay turnos que coincidan con la búsqueda."
            columns={[
              { header: "Fecha", render: (t) => formatearFechaHora(t.fecha_hora_inicio).fecha },
              { header: "Hora", render: (t) => formatearFechaHora(t.fecha_hora_inicio).hora },
              { header: "Cliente", render: (t) => nombreCliente(t) },
              { header: "Teléfono", render: (t) => t.usuario?.telefono ?? "—" },
              { header: "Servicios", render: (t) => nombreServicios(t) },
              { header: "Estado", render: (t) => <EstadoBadge estado={t.estado} /> },
              {
                header: "Acciones",
                render: (t) => (
                  <div className="flex gap-3">
                    <Button variant="link" onClick={() => setTurnoDetalle(t)}>
                      Ver
                    </Button>
                    {t.estado === "confirmado" && (
                      <>
                        <Button
                          variant="link"
                          onClick={() => handleMarcarAtendido(t)}
                          disabled={marcarAtendido.isPending}
                        >
                          Atendido
                        </Button>
                        <Button variant="link" onClick={() => pedirCancelacion(t)}>
                          Cancelar
                        </Button>
                      </>
                    )}
                  </div>
                ),
              },
            ]}
          />

          <div className="mt-4 flex items-center justify-between">
            <Button
              variant="subtle"
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
              disabled={pagina <= 1}
            >
              Anterior
            </Button>
            <span className="text-sm text-espresso/60">
              Página {pagina} de {totalPaginas}
            </span>
            <Button
              variant="subtle"
              onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
              disabled={pagina >= totalPaginas}
            >
              Siguiente
            </Button>
          </div>
        </>
      )}

      <Modal
        isOpen={turnoDetalle !== null}
        onClose={() => setTurnoDetalle(null)}
        title={turnoDetalle ? `Turno #${turnoDetalle.id}` : "Turno"}
      >
        {turnoDetalle && (
          <div className="flex flex-col gap-4 text-sm text-espresso">
            <div className="flex items-center justify-between">
              <span className="font-medium">
                {formatearFechaHora(turnoDetalle.fecha_hora_inicio).fecha} ·{" "}
                {formatearFechaHora(turnoDetalle.fecha_hora_inicio).hora} a{" "}
                {formatearFechaHora(turnoDetalle.fecha_hora_fin).hora}
              </span>
              <EstadoBadge estado={turnoDetalle.estado} />
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-espresso/60">
                Cliente
              </p>
              <p>{nombreCliente(turnoDetalle)}</p>
              <p className="text-espresso/70">{turnoDetalle.usuario?.telefono ?? "Sin teléfono"}</p>
            </div>

            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-widest text-espresso/60">
                Servicios
              </p>
              <ul className="flex flex-col gap-1">
                {(turnoDetalle.turno_servicios ?? []).map((ts) => (
                  <li key={ts.id} className="flex justify-between">
                    <span>
                      {ts.servicio.nombre}{" "}
                      <span className="text-espresso/50">
                        ({formatearDuracion(ts.servicio.duracion_minutos)})
                      </span>
                    </span>
                    <span>{formatearPrecio(ts.precio_unitario)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 flex justify-between border-t border-espresso/10 pt-2 font-medium">
                <span>Total</span>
                <span>{totalTurno(turnoDetalle)}</span>
              </p>
            </div>

            {turnoDetalle.turno_origen_id && (
              <p className="text-espresso/60">
                Reprogramación del turno #{turnoDetalle.turno_origen_id}
              </p>
            )}

            {turnoDetalle.estado === "confirmado" && (
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => handleMarcarAtendido(turnoDetalle)}
                  disabled={marcarAtendido.isPending}
                >
                  Marcar atendido
                </Button>
                <Button variant="subtle" onClick={() => pedirCancelacion(turnoDetalle)}>
                  Cancelar turno
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={turnoACancelar !== null}
        title="Cancelar turno"
        message={`¿Seguro que querés cancelar el turno de ${turnoACancelar ? nombreCliente(turnoACancelar) : "este cliente"}? Se le avisará a la clienta.`}
        onConfirm={handleConfirmarCancelar}
        onCancel={() => setTurnoACancelar(null)}
        isConfirming={cancelarTurno.isPending}
        errorMessage={errorCancelar}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
