//Turnify\frontend\src\pages\admin\AgendaPage.tsx
import { useState } from "react";
import { isAxiosError } from "axios";
import { Table } from "../../components/common/Table";
import { Button } from "../../components/common/Button";
import { Modal } from "../../components/common/Modal";
import { Toast } from "../../components/common/Toast";
import { ConfirmDialog } from "../../components/servicios/ConfirmDialog";
import { ReprogramarTurnoForm } from "../../components/turnos/ReprogramarTurnoForm";
import { NuevoTurnoForm } from "../../components/turnos/NuevoTurnoForm";
import {
  useAgenda,
  useCancelarTurnoAdmin,
  useReprogramarTurnoAdmin,
  useMarcarAtendido,
  useReservarTurnoAdmin,
} from "../../hooks/useTurnos";
import {
  ETIQUETA_ESTADO,
  formatearFechaHora,
  type ReservarTurnoAdminPayload,
  type Turno,
} from "../../types/turno";
import { hoyISO } from "../../utils/fechas";

type ToastState = { message: string; type: "success" | "error" } | null;

export function AgendaPage() {
  const [fecha, setFecha] = useState(hoyISO());
  const [toast, setToast] = useState<ToastState>(null);

  const [turnoAReprogramar, setTurnoAReprogramar] = useState<Turno | null>(null);
  const [turnoACancelar, setTurnoACancelar] = useState<Turno | null>(null);
  const [errorCancelar, setErrorCancelar] = useState("");

  const [nuevoTurnoAbierto, setNuevoTurnoAbierto] = useState(false);
  const [errorNuevoTurno, setErrorNuevoTurno] = useState("");

  const { data: turnos = [], isLoading } = useAgenda(fecha);
  const cancelarTurno = useCancelarTurnoAdmin();
  const reprogramarTurno = useReprogramarTurnoAdmin();
  const marcarAtendido = useMarcarAtendido();
  const reservarTurnoAdmin = useReservarTurnoAdmin();

  function nombreServicios(turno: Turno): string {
    if (!turno.turno_servicios || turno.turno_servicios.length === 0) return "—";
    return turno.turno_servicios.map((ts) => ts.servicio.nombre).join(", ");
  }

  function handleMarcarAtendido(turno: Turno) {
    marcarAtendido.mutate(turno.id, {
      onSuccess: () => setToast({ message: "Turno marcado como atendido", type: "success" }),
      onError: (error) =>
        setToast({ message: extraerMensaje(error, "No se pudo actualizar el turno"), type: "error" }),
    });
  }

  function handleSubmitReprogramar(payload: { fecha: string; hora_inicio: string }) {
    if (!turnoAReprogramar) return;
    reprogramarTurno.mutate(
      { id: turnoAReprogramar.id, payload },
      {
        onSuccess: () => {
          setTurnoAReprogramar(null);
          setToast({ message: "Turno reprogramado correctamente", type: "success" });
        },
        onError: (error) =>
          setToast({
            message: extraerMensaje(error, "No se pudo reprogramar el turno"),
            type: "error",
          }),
      },
    );
  }

  function handleSubmitNuevoTurno(payload: ReservarTurnoAdminPayload) {
    setErrorNuevoTurno("");
    reservarTurnoAdmin.mutate(payload, {
      onSuccess: (turno) => {
        setNuevoTurnoAbierto(false);
        // La agenda salta al día del turno nuevo para que se vea enseguida.
        setFecha(turno.fecha_hora_inicio.slice(0, 10));
        setToast({ message: "Turno creado correctamente", type: "success" });
      },
      // 409 (horario ocupado) y demás errores del backend se muestran en el form.
      onError: (error) =>
        setErrorNuevoTurno(extraerMensaje(error, "No se pudo crear el turno")),
    });
  }

  function handleConfirmarCancelar() {
    if (!turnoACancelar) return;
    cancelarTurno.mutate(turnoACancelar.id, {
      onSuccess: () => {
        setTurnoACancelar(null);
        setToast({ message: "Turno cancelado", type: "success" });
      },
      onError: (error) => setErrorCancelar(extraerMensaje(error, "No se pudo cancelar el turno")),
    });
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="mb-6 font-serif text-3xl text-espresso">Agenda</h1>

      <div className="mb-6 flex items-end gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-espresso/70">Día</label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="rounded-xl border border-espresso/15 bg-superficie px-4 py-2.5 text-sm text-espresso focus:border-rosewood focus:outline-none focus:ring-2 focus:ring-rosewood/20"
          />
        </div>
        <Button variant="subtle" onClick={() => setFecha(hoyISO())}>
          Hoy
        </Button>
        <div className="ml-auto">
          <Button
            onClick={() => {
              setErrorNuevoTurno("");
              setNuevoTurnoAbierto(true);
            }}
          >
            Nuevo turno
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="py-10 text-center text-sm text-espresso/50">Cargando agenda...</p>
      ) : (
        <Table<Turno>
          data={turnos}
          keyExtractor={(t) => t.id}
          rowClassName={(t) =>
            t.estado === "cancelado" ? "opacity-40" : t.estado === "atendido" ? "opacity-60" : ""
          }
          emptyMessage="No hay turnos para este día."
          columns={[
            { header: "Hora", render: (t) => formatearFechaHora(t.fecha_hora_inicio).hora },
            {
              header: "Cliente",
              render: (t) =>
                t.usuario ? `${t.usuario.nombre} ${t.usuario.apellido ?? ""}`.trim() : "—",
            },
            { header: "Teléfono", render: (t) => t.usuario?.telefono ?? "—" },
            { header: "Servicios", render: (t) => nombreServicios(t) },
            { header: "Estado", render: (t) => ETIQUETA_ESTADO[t.estado] },
            {
              header: "Acciones",
              render: (t) =>
                t.estado === "confirmado" ? (
                  <div className="flex gap-3">
                    <Button
                      variant="link"
                      onClick={() => handleMarcarAtendido(t)}
                      // Solo desde el día del turno (el backend también lo exige).
                      disabled={t.fecha_hora_inicio.slice(0, 10) > hoyISO()}
                      title={
                        t.fecha_hora_inicio.slice(0, 10) > hoyISO()
                          ? "Se habilita el día del turno"
                          : undefined
                      }
                    >
                      Atendido
                    </Button>
                    <Button variant="link" onClick={() => setTurnoAReprogramar(t)}>
                      Reprogramar
                    </Button>
                    <Button
                      variant="link"
                      onClick={() => {
                        setErrorCancelar("");
                        setTurnoACancelar(t);
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                ) : (
                  <span className="text-espresso/30">—</span>
                ),
            },
          ]}
        />
      )}

      <Modal
        isOpen={turnoAReprogramar !== null}
        onClose={() => setTurnoAReprogramar(null)}
        title="Reprogramar turno"
      >
        <ReprogramarTurnoForm
          servicioIds={turnoAReprogramar?.turno_servicios?.map((ts) => ts.servicio_id) ?? []}
          fechaHoraActual={turnoAReprogramar?.fecha_hora_inicio}
          onSubmit={handleSubmitReprogramar}
          onCancel={() => setTurnoAReprogramar(null)}
          isSubmitting={reprogramarTurno.isPending}
        />
      </Modal>

      <Modal
        isOpen={nuevoTurnoAbierto}
        onClose={() => setNuevoTurnoAbierto(false)}
        title="Nuevo turno"
        size="lg"
      >
        <NuevoTurnoForm
          fechaInicial={fecha}
          onSubmit={handleSubmitNuevoTurno}
          onCancel={() => setNuevoTurnoAbierto(false)}
          isSubmitting={reservarTurnoAdmin.isPending}
          errorMessage={errorNuevoTurno}
        />
      </Modal>

      <ConfirmDialog
        isOpen={turnoACancelar !== null}
        title="Cancelar turno"
        message={`¿Seguro que querés cancelar el turno de ${turnoACancelar?.usuario?.nombre ?? "este cliente"}?`}
        onConfirm={handleConfirmarCancelar}
        onCancel={() => setTurnoACancelar(null)}
        isConfirming={cancelarTurno.isPending}
        errorMessage={errorCancelar}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

function extraerMensaje(error: unknown, mensajePorDefecto: string): string {
  if (isAxiosError(error) && error.response?.data?.message) {
    const msg = error.response.data.message;
    return Array.isArray(msg) ? msg.join(", ") : msg;
  }
  return mensajePorDefecto;
}