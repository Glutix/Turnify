export type DiaSemana =
  | "lunes"
  | "martes"
  | "miercoles"
  | "jueves"
  | "viernes"
  | "sabado"
  | "domingo";

export const DIAS_SEMANA: DiaSemana[] = [
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
  "domingo",
];

export const ETIQUETA_DIA: Record<DiaSemana, string> = {
  lunes: "Lunes",
  martes: "Martes",
  miercoles: "Miércoles",
  jueves: "Jueves",
  viernes: "Viernes",
  sabado: "Sábado",
  domingo: "Domingo",
};

export type TipoExcepcion = "bloqueo_total" | "horario_especial";

export interface FranjaHoraria {
  id: number;
  dia_semana: DiaSemana;
  hora_inicio: string; // Prisma Time serializa como ISO completo con fecha base
  hora_fin: string; // ej. "1970-01-01T09:00:00.000Z"
  activo: boolean;
}

export interface CrearFranjaHorariaPayload {
  dia_semana: DiaSemana;
  hora_inicio: string; // "HH:mm"
  hora_fin: string; // "HH:mm"
}

export type ActualizarFranjaHorariaPayload = Partial<CrearFranjaHorariaPayload>;

export interface ExcepcionHorario {
  id: number;
  fecha_desde: string; // "YYYY-MM-DD"
  fecha_hasta: string; // "YYYY-MM-DD"
  tipo: TipoExcepcion;
  descripcion: string | null;
  hora_inicio: string | null; // ISO completo o null
  hora_fin: string | null;
}

export interface CrearExcepcionHorarioPayload {
  fecha_desde: string;
  fecha_hasta: string;
  tipo: TipoExcepcion;
  descripcion?: string;
  hora_inicio?: string; // "HH:mm", solo si tipo = horario_especial
  hora_fin?: string;
}

export type ActualizarExcepcionHorarioPayload = Partial<CrearExcepcionHorarioPayload>;

// Convierte el ISO completo que manda el back ("1970-01-01T09:00:00.000Z")
// a "HH:mm" para mostrar en tablas/forms.
export function horaDesdeISO(iso: string): string {
  return iso.substring(11, 16);
}