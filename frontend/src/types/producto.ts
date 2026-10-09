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

export interface ImagenProducto {
  id: number;
  url_cloudinary: string;
  es_principal: boolean;
}

export interface Producto {
  id: number;
  categoria_id: number;
  nombre: string;
  descripcion: string | null;
  precio: string; // Prisma Decimal serializa como string en JSON
  stock: number;
  activo: boolean;
  categoria: Pick<CategoriaProducto, "id" | "nombre">;
  imagenes: ImagenProducto[];
}

export interface CrearProductoPayload {
  categoria_id: number;
  nombre: string;
  descripcion?: string | null;
  precio: number;
  stock?: number;
  activo?: boolean;
}

// El backend descarta `stock` en el PATCH general: se ajusta por su propio endpoint.
export type ActualizarProductoPayload = Partial<
  Omit<CrearProductoPayload, "stock">
>;

export interface AjustarStockPayload {
  stock: number;
}
