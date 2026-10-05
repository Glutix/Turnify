export interface CategoriaProducto {
  id: number;
  nombre: string;
  descripcion: string | null;
}

export interface CrearCategoriaProductoPayload {
  nombre: string;
  descripcion?: string | null;
}

export type ActualizarCategoriaProductoPayload =
  Partial<CrearCategoriaProductoPayload>;
