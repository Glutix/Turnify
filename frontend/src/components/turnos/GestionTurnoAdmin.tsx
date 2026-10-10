import { Button } from "../common/Button";
import { Modal } from "../common/Modal";
import { ConfirmDialog } from "../servicios/ConfirmDialog";
import { EstadoBadge } from "./EstadoBadge";
import { ReprogramarTurnoForm } from "./ReprogramarTurnoForm";
import type { GestionTurnoAdmin } from "../../hooks/useGestionTurnoAdmin";
import { formatearFechaHora, type Turno } from "../../types/turno";
import { formatearDuracion, formatearPrecio } from "../../utils/servicio";
import { nombreCliente, puedeMarcarAtendido, totalTurno } from "../../utils/turno";

// Piezas de UI de la gestión de un turno en el panel admin. Se usan siempre
// junto con useGestionTurnoAdmin (ver ese hook).

const TITULO_ATENDIDO_FUTURO = "Se habilita el día del turno";

// Botones de una fila de tabla.
export function AccionesTurnoAdmin({
  turno,
  gestion,
}: {
  turno: Turno;
  gestion: GestionTurnoAdmin;
}) {
  const puedeAtender = puedeMarcarAtendido(turno);
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1">
      <Button variant="link" onClick={() => gestion.ver(turno)}>
        Ver
      </Button>
      {turno.estado === "confirmado" && (
        <>
          <Button
            variant="link"
            onClick={() => gestion.marcarAtendido(turno)}
            disabled={!puedeAtender || gestion.atendiendo}
            title={!puedeAtender ? TITULO_ATENDIDO_FUTURO : undefined}
          >
            Atendido
          </Button>
          <Button variant="link" onClick={() => gestion.pedirReprogramacion(turno)}>
            Reprogramar
          </Button>
          <Button variant="link" onClick={() => gestion.pedirCancelacion(turno)}>
            Cancelar
          </Button>
        </>
      )}
    </div>
  );
}

function DetalleTurno({ turno, gestion }: { turno: Turno; gestion: GestionTurnoAdmin }) {
  const puedeAtender = puedeMarcarAtendido(turno);
  return (
    <div className="flex flex-col gap-4 text-sm text-espresso">
      <div className="flex items-center justify-between">
        <span className="font-medium">
          {formatearFechaHora(turno.fecha_hora_inicio).fecha} ·{" "}
          {formatearFechaHora(turno.fecha_hora_inicio).hora} a{" "}
          {formatearFechaHora(turno.fecha_hora_fin).hora}
        </span>
        <EstadoBadge estado={turno.estado} />
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-espresso/60">Cliente</p>
        <p>{nombreCliente(turno)}</p>
        <p className="text-espresso/70">{turno.usuario?.telefono ?? "Sin teléfono"}</p>
      </div>

      <div>
        <p className="mb-1 text-xs font-medium uppercase tracking-widest text-espresso/60">
          Servicios
        </p>
        <ul className="flex flex-col gap-1">
          {(turno.turno_servicios ?? []).map((ts) => (
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
          <span>{totalTurno(turno)}</span>
        </p>
      </div>

      {turno.turno_origen_id && (
        <p className="text-espresso/60">Reprogramación del turno #{turno.turno_origen_id}</p>
      )}

      {turno.estado === "confirmado" && (
        <div className="flex flex-wrap gap-3 pt-2">
          <Button
            onClick={() => gestion.marcarAtendido(turno)}
            disabled={!puedeAtender || gestion.atendiendo}
            title={!puedeAtender ? TITULO_ATENDIDO_FUTURO : undefined}
          >
            Marcar atendido
          </Button>
          <Button variant="subtle" onClick={() => gestion.pedirReprogramacion(turno)}>
            Reprogramar
          </Button>
          <Button variant="subtle" onClick={() => gestion.pedirCancelacion(turno)}>
            Cancelar turno
          </Button>
        </div>
      )}
    </div>
  );
}

// Modales: detalle, reprogramar y confirmación de cancelación.
export function ModalesGestionTurno({ gestion }: { gestion: GestionTurnoAdmin }) {
  const { turnoDetalle, turnoAReprogramar, turnoACancelar } = gestion;
  return (
    <>
      <Modal
        isOpen={turnoDetalle !== null}
        onClose={gestion.cerrarDetalle}
        title={turnoDetalle ? `Turno #${turnoDetalle.id}` : "Turno"}
      >
        {turnoDetalle && <DetalleTurno turno={turnoDetalle} gestion={gestion} />}
      </Modal>

      <Modal
        isOpen={turnoAReprogramar !== null}
        onClose={gestion.cerrarReprogramacion}
        title="Reprogramar turno"
      >
        <ReprogramarTurnoForm
          servicioIds={turnoAReprogramar?.turno_servicios?.map((ts) => ts.servicio_id) ?? []}
          turnoId={turnoAReprogramar?.id}
          fechaHoraActual={turnoAReprogramar?.fecha_hora_inicio}
          onSubmit={gestion.confirmarReprogramacion}
          onCancel={gestion.cerrarReprogramacion}
          isSubmitting={gestion.reprogramando}
          errorMessage={gestion.errorReprogramar}
        />
      </Modal>

      <ConfirmDialog
        isOpen={turnoACancelar !== null}
        title="Cancelar turno"
        message={`¿Seguro que querés cancelar el turno de ${turnoACancelar ? nombreCliente(turnoACancelar) : "esta clienta"}? Se le avisará a la clienta.`}
        onConfirm={gestion.confirmarCancelacion}
        onCancel={gestion.cerrarCancelacion}
        isConfirming={gestion.cancelando}
        errorMessage={gestion.errorCancelar}
      />
    </>
  );
}
