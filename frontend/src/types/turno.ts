export type EstadoTurno = "confirmado" | "cancelado" | "reprogramado" | "atendido";

export interface ServicioEnTurno {
  id: number;
  nombre: string;
  duracion_minutos: number;
}

export interface TurnoServicio {
  id: number;
  servicio_id: number;
  precio_unitario: string; // Prisma Decimal serializa como string
  servicio: ServicioEnTurno;
}

export interface UsuarioEnTurno {
  id: number;
  nombre: string;
  apellido: string | null;
  telefono: string | null;
}

export interface Turno {
  id: number;
  usuario_id: number;
  turno_origen_id: number | null;
  fecha_hora_inicio: string; // ISO
  fecha_hora_fin: string; // ISO
  estado: EstadoTurno;
  recordatorio_enviado: boolean;
  fecha_creacion: string;
  usuario?: UsuarioEnTurno;
  turno_servicios?: TurnoServicio[];
}

export interface SlotDisponible {
  hora_inicio: string; // "HH:mm"
  hora_fin: string; // "HH:mm"
}

export interface ReservarTurnoPayload {
  servicios: number[];
  fecha: string; // "YYYY-MM-DD"
  hora_inicio: string; // "HH:mm"
  nombre: string;
  telefono: string;
  codigo: string;
}

// Reserva con sesión iniciada: nombre y teléfono salen del token en el backend.
export interface ReservarTurnoAutenticadoPayload {
  servicios: number[];
  fecha: string; // "YYYY-MM-DD"
  hora_inicio: string; // "HH:mm"
  codigo: string; // OTP enviado al teléfono del usuario logueado
}

export interface ReservarTurnoAdminPayload {
  servicios: number[];
  fecha: string;
  hora_inicio: string;
  usuario_id?: number;
  nombre?: string;
  telefono?: string;
}

export interface ReprogramarTurnoAdminPayload {
  fecha: string;
  hora_inicio: string;
}

// Filtros del listado administrativo (GET /turnos/admin). Los vacíos no se envían.
export interface FiltrosTurnosAdmin {
  estado?: EstadoTurno;
  desde?: string; // "YYYY-MM-DD"
  hasta?: string; // "YYYY-MM-DD"
  busqueda?: string;
  pagina?: number;
  limite?: number;
}

export interface TurnosPaginados {
  data: Turno[];
  total: number;
  pagina: number;
  limite: number;
}

// Convierte el ISO completo del backend a algo legible en la tabla.
export function formatearFechaHora(iso: string): { fecha: string; hora: string } {
  const d = new Date(iso);
  const fecha = d.toISOString().slice(0, 10);
  const hora = d.toISOString().slice(11, 16);
  return { fecha, hora };
}

export const ETIQUETA_ESTADO: Record<EstadoTurno, string> = {
  confirmado: "Confirmado",
  cancelado: "Cancelado",
  reprogramado: "Reprogramado",
  atendido: "Atendido",
};