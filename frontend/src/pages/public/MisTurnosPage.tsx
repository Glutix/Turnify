import { useState } from "react";
import { Link } from "react-router-dom";
import { isAxiosError } from "axios";
import { Button } from "../../components/common/Button";
import { Modal } from "../../components/common/Modal";
import { Toast } from "../../components/common/Toast";
import { ConfirmDialog } from "../../components/servicios/ConfirmDialog";
import { ReprogramarTurnoForm } from "../../components/turnos/ReprogramarTurnoForm";
import {
  useCancelarMiTurno,
  useMisTurnos,
  useReprogramarMiTurno,
} from "../../hooks/useTurnos";
import { ETIQUETA_ESTADO, type Turno } from "../../types/turno";
import {
  ahoraComoHoraDePared,
  formatearFechaLarga,
  formatearHora,
} from "../../utils/fechas";
import { formatearDuracion, precioANumero } from "../../utils/servicio";

// CU-09 / CU-10 / CU-11: el cliente con sesión ve sus turnos y puede cancelar o
// reprogramar los próximos (mínimo 12hs de anticipación, RF11-13).

const HORAS_MINIMAS = 12;
const MS_HORA = 60 * 60 * 1000;

type ToastState = { message: string; type: "success" | "error" } | null;

function extraerMensaje(error: unknown, porDefecto: string): string {
  if (isAxiosError(error) && error.response?.data?.message) {
    const msg = error.response.data.message;
    return Array.isArray(msg) ? msg.join(", ") : msg;
  }
  return porDefecto;
}

function resumen(turno: Turno) {
  const servicios = turno.turno_servicios ?? [];
  return {
    nombres: servicios.map((ts) => ts.servicio.nombre).join(", ") || "—",
    duracion: servicios.reduce((acc, ts) => acc + ts.servicio.duracion_minutos, 0),
    precio: servicios.reduce((acc, ts) => acc + precioANumero(ts.precio_unitario), 0),
    ids: servicios.map((ts) => ts.servicio_id),
  };
}

export function MisTurnosPage() {
  const { data: turnos = [], isLoading, isError } = useMisTurnos();
  const cancelarTurno = useCancelarMiTurno();
  const reprogramarTurno = useReprogramarMiTurno();

  const [toast, setToast] = useState<ToastState>(null);
  const [turnoACancelar, setTurnoACancelar] = useState<Turno | null>(null);
  const [errorCancelar, setErrorCancelar] = useState("");
  const [turnoAReprogramar, setTurnoAReprogramar] = useState<Turno | null>(null);
  const [errorReprogramar, setErrorReprogramar] = useState("");

  const ahora = ahoraComoHoraDePared().getTime();
  const inicioMs = (t: Turno) => new Date(t.fecha_hora_inicio).getTime();

  const proximos = turnos
    .filter((t) => t.estado === "confirmado" && inicioMs(t) >= ahora)
    .sort((a, b) => inicioMs(a) - inicioMs(b));
  const historial = turnos.filter((t) => !proximos.includes(t));

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

  function handleReprogramar(payload: { fecha: string; hora_inicio: string }) {
    if (!turnoAReprogramar) return;
    setErrorReprogramar("");
    reprogramarTurno.mutate(
      { id: turnoAReprogramar.id, payload },
      {
        onSuccess: () => {
          setTurnoAReprogramar(null);
          setToast({ message: "Turno reprogramado correctamente", type: "success" });
        },
        onError: (error) =>
          setErrorReprogramar(extraerMensaje(error, "No se pudo reprogramar el turno")),
      },
    );
  }

  function tarjetaTurno(turno: Turno, gestionable: boolean) {
    const { nombres, duracion, precio } = resumen(turno);
    const faltanMs = inicioMs(turno) - ahora;
    const puedeGestionar = gestionable && faltanMs >= HORAS_MINIMAS * MS_HORA;

    return (
      <div className="rounded-xl border border-espresso/10 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-serif text-lg capitalize text-espresso">
              {formatearFechaLarga(turno.fecha_hora_inicio)}
            </p>
            <p className="text-sm text-espresso/70">{formatearHora(turno.fecha_hora_inicio)} hs</p>
          </div>
          <span className="rounded-full bg-espresso/5 px-3 py-1 text-xs text-espresso/70">
            {ETIQUETA_ESTADO[turno.estado]}
          </span>
        </div>
        <p className="mt-3 text-sm text-espresso/80">{nombres}</p>
        <p className="mt-1 flex justify-between text-xs text-espresso/60">
          <span>{formatearDuracion(duracion)}</span>
          <span className="font-semibold text-rosewood">
            {precio.toLocaleString("es-AR", { style: "currency", currency: "ARS" })}
          </span>
        </p>

        {gestionable && puedeGestionar && (
          <div className="mt-4 flex gap-4">
            <Button
              variant="link"
              onClick={() => {
                setErrorReprogramar("");
                setTurnoAReprogramar(turno);
              }}
            >
              Reprogramar
            </Button>
            <Button
              variant="link"
              onClick={() => {
                setErrorCancelar("");
                setTurnoACancelar(turno);
              }}
            >
              Cancelar
            </Button>
          </div>
        )}
        {gestionable && !puedeGestionar && (
          <p className="mt-4 text-xs text-espresso/60">
            Falta menos de {HORAS_MINIMAS} hs para tu turno: para cancelarlo o reprogramarlo
            contactá directamente a la profesional.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <div className="mb-10 text-center">
        <h1 className="font-serif text-4xl text-espresso">Mis turnos</h1>
        <p className="mt-3 text-sm text-espresso/60">
          Consultá, reprogramá o cancelá tus turnos. Podés hacerlo hasta {HORAS_MINIMAS} horas
          antes.
        </p>
      </div>

      {isLoading && <p className="py-10 text-center text-sm text-espresso/50">Cargando tus turnos...</p>}
      {isError && (
        <p className="py-10 text-center text-sm text-rosewood">
          No se pudieron cargar tus turnos. Probá de nuevo en unos segundos.
        </p>
      )}

      {!isLoading && !isError && turnos.length === 0 && (
        <div className="py-10 text-center">
          <p className="text-sm text-espresso/60">Todavía no tenés turnos.</p>
          <Link to="/turnos" className="mt-4 inline-block text-sm text-rosewood underline">
            Reservar un turno
          </Link>
        </div>
      )}

      {proximos.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-xs uppercase tracking-widest text-espresso/50">Próximos</h2>
          <div className="flex flex-col gap-4">
            {proximos.map((t) => (
              <div key={t.id}>{tarjetaTurno(t, true)}</div>
            ))}
          </div>
        </section>
      )}

      {historial.length > 0 && (
        <section>
          <h2 className="mb-4 text-xs uppercase tracking-widest text-espresso/50">Historial</h2>
          <div className="flex flex-col gap-4 opacity-80">
            {historial.map((t) => (
              <div key={t.id}>{tarjetaTurno(t, false)}</div>
            ))}
          </div>
        </section>
      )}

      <Modal
        isOpen={turnoAReprogramar !== null}
        onClose={() => setTurnoAReprogramar(null)}
        title="Reprogramar turno"
      >
        <ReprogramarTurnoForm
          servicioIds={turnoAReprogramar ? resumen(turnoAReprogramar).ids : []}
          fechaHoraActual={turnoAReprogramar?.fecha_hora_inicio}
          onSubmit={handleReprogramar}
          onCancel={() => setTurnoAReprogramar(null)}
          isSubmitting={reprogramarTurno.isPending}
          errorMessage={errorReprogramar}
        />
      </Modal>

      <ConfirmDialog
        isOpen={turnoACancelar !== null}
        title="Cancelar turno"
        message="¿Seguro que querés cancelar este turno? El horario quedará libre para otra clienta."
        onConfirm={handleConfirmarCancelar}
        onCancel={() => setTurnoACancelar(null)}
        isConfirming={cancelarTurno.isPending}
        errorMessage={errorCancelar}
      />

      {toast && (
        <div className="fixed bottom-6 right-6 z-50">
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        </div>
      )}
    </div>
  );
}
