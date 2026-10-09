import { useState } from "react";
import {
  useCancelarTurnoAdmin,
  useMarcarAtendido,
  useReprogramarTurnoAdmin,
} from "./useTurnos";
import { useToastStore } from "../stores/toastStore";
import { extraerMensajeError } from "../utils/extraerMensajeError";
import type { ReprogramarTurnoAdminPayload, Turno } from "../types/turno";

// Gestión de un turno desde el panel admin (CU-20 / CU-40 / CU-42): ver
// detalle, marcar atendido, cancelar (con confirmación) y reprogramar. Única
// implementación, compartida por la agenda y el listado de turnos: cada página
// solo renderiza <AccionesTurnoAdmin /> y <ModalesGestionTurno />. Los avisos
// salen por el toastStore global (único punto donde se muestran).
export function useGestionTurnoAdmin() {
  const mostrarToast = useToastStore((s) => s.mostrarToast);
  const cancelar = useCancelarTurnoAdmin();
  const reprogramar = useReprogramarTurnoAdmin();
  const atender = useMarcarAtendido();

  const [turnoDetalle, setTurnoDetalle] = useState<Turno | null>(null);
  const [turnoACancelar, setTurnoACancelar] = useState<Turno | null>(null);
  const [errorCancelar, setErrorCancelar] = useState("");
  const [turnoAReprogramar, setTurnoAReprogramar] = useState<Turno | null>(null);
  const [errorReprogramar, setErrorReprogramar] = useState("");

  function ver(turno: Turno) {
    setTurnoDetalle(turno);
  }

  function cerrarDetalle() {
    setTurnoDetalle(null);
  }

  // Las acciones que salen del detalle lo cierran primero (evita modal sobre modal).
  function marcarAtendido(turno: Turno) {
    setTurnoDetalle(null);
    atender.mutate(turno.id, {
      onSuccess: () => mostrarToast("actualizacion", "Turno marcado como atendido"),
      onError: (error) =>
        mostrarToast("error", extraerMensajeError(error, "No se pudo actualizar el turno")),
    });
  }

  function pedirCancelacion(turno: Turno) {
    setTurnoDetalle(null);
    setErrorCancelar("");
    setTurnoACancelar(turno);
  }

  function cerrarCancelacion() {
    setTurnoACancelar(null);
  }

  function confirmarCancelacion() {
    if (!turnoACancelar) return;
    cancelar.mutate(turnoACancelar.id, {
      onSuccess: () => {
        setTurnoACancelar(null);
        mostrarToast("eliminacion", "Turno cancelado");
      },
      onError: (error) =>
        setErrorCancelar(extraerMensajeError(error, "No se pudo cancelar el turno")),
    });
  }

  function pedirReprogramacion(turno: Turno) {
    setTurnoDetalle(null);
    setErrorReprogramar("");
    setTurnoAReprogramar(turno);
  }

  function cerrarReprogramacion() {
    setTurnoAReprogramar(null);
  }

  function confirmarReprogramacion(payload: ReprogramarTurnoAdminPayload) {
    if (!turnoAReprogramar) return;
    setErrorReprogramar("");
    reprogramar.mutate(
      { id: turnoAReprogramar.id, payload },
      {
        onSuccess: () => {
          setTurnoAReprogramar(null);
          mostrarToast("actualizacion", "Turno reprogramado correctamente");
        },
        onError: (error) =>
          setErrorReprogramar(extraerMensajeError(error, "No se pudo reprogramar el turno")),
      },
    );
  }

  return {
    turnoDetalle,
    turnoACancelar,
    turnoAReprogramar,
    errorCancelar,
    errorReprogramar,
    atendiendo: atender.isPending,
    cancelando: cancelar.isPending,
    reprogramando: reprogramar.isPending,
    ver,
    cerrarDetalle,
    marcarAtendido,
    pedirCancelacion,
    cerrarCancelacion,
    confirmarCancelacion,
    pedirReprogramacion,
    cerrarReprogramacion,
    confirmarReprogramacion,
  };
}

export type GestionTurnoAdmin = ReturnType<typeof useGestionTurnoAdmin>;
