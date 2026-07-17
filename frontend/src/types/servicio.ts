export interface CategoriaServicio {
  id: number;
  nombre: string;
  descripcion: string | null;
}

export interface Servicio {
  id: number;
  categoria_id: number;
  nombre: string;
  descripcion: string | null;
  duracion_minutos: number;
  precio: string; // Prisma Decimal serializa como string en JSON
  activo: boolean;
  categoria: CategoriaServicio;
}

export interface CrearCategoriaPayload {
  nombre: string;
  descripcion?: string;
}

export type ActualizarCategoriaPayload = Partial<CrearCategoriaPayload>;

export interface CrearServicioPayload {
  categoria_id: number;
  nombre: string;
  descripcion?: string;
  duracion_minutos: number;
  precio: number;
}

export type ActualizarServicioPayload = Partial<CrearServicioPayload>;