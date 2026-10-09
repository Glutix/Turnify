// Helpers de presentación y reglas de un turno. Única implementación: la usan
// la agenda y el listado de turnos del panel admin.
import { hoyISO } from "./fechas";
import { formatearPrecio, precioANumero } from "./servicio";
import type { Turno } from "../types/turno";

export function nombreCliente(turno: Turno): string {
  if (!turno.usuario) return "—";
  return `${turno.usuario.nombre} ${turno.usuario.apellido ?? ""}`.trim();
}

export function nombreServicios(turno: Turno): string {
  if (!turno.turno_servicios || turno.turno_servicios.length === 0) return "—";
  return turno.turno_servicios.map((ts) => ts.servicio.nombre).join(", ");
}

export function totalTurno(turno: Turno): string {
  const total = (turno.turno_servicios ?? []).reduce(
    (acc, ts) => acc + precioANumero(ts.precio_unitario),
    0,
  );
  return formatearPrecio(String(total));
}

// "Atendido" solo desde el día del turno en adelante (el backend también lo
// exige: 400 si el turno es futuro).
export function puedeMarcarAtendido(turno: Turno): boolean {
  return turno.fecha_hora_inicio.slice(0, 10) <= hoyISO();
}

// Atenúa las filas de turnos que ya no están activos.
export function claseFilaTurno(turno: Turno): string {
  if (turno.estado === "cancelado" || turno.estado === "reprogramado") return "opacity-50";
  if (turno.estado === "atendido") return "opacity-60";
  return "";
}
