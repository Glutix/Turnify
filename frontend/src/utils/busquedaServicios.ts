import type { Servicio } from "../types/servicio";

export const MIN_CARACTERES_BUSQUEDA = 3;

// Minúsculas y sin tildes ("Depilación" == "depilacion").
export function normalizarTexto(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

/**
 * Filtra por categoría ("todas" o id) y por nombre. Con menos de
 * MIN_CARACTERES_BUSQUEDA letras no se filtra por texto.
 */
export function filtrarServicios(
  servicios: Servicio[],
  categoriaId: number | "todas",
  texto: string,
): Servicio[] {
  const q = normalizarTexto(texto);
  const buscar = q.length >= MIN_CARACTERES_BUSQUEDA;
  return servicios.filter(
    (s) =>
      (categoriaId === "todas" || s.categoria_id === categoriaId) &&
      (!buscar || normalizarTexto(s.nombre).includes(q)),
  );
}
