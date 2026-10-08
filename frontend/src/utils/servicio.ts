// Prisma serializa los campos Decimal como string en el JSON de la API.
// Esta función centraliza la conversión a number para no repetirla
// en cada componente que consuma el campo `precio`.
export function precioANumero(precio: string): number {
  return Number(precio);
}

export function formatearDuracion(minutos: number): string {
  const horas = Math.floor(minutos / 60);
  const mins = minutos % 60;
  if (horas === 0) return `${mins}min`;
  if (mins === 0) return `${horas}h`;
  return `${horas}h ${mins}min`;
}

export function formatearPrecio(precio: string): string {
  return Number(precio).toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
  });
}
// Duración máxima de un turno: 3 h 45 min. Duplicada en el backend
// (turnos.service.ts → MAX_DURACION_TURNO_MINUTOS), que es quien la hace cumplir.
export const MAX_DURACION_TURNO_MINUTOS = 225;
export const MENSAJE_DURACION_MAXIMA =
  "La duración máxima de un turno es de 3 h 45 min. Elegí menos servicios o sacá dos turnos para realizarte todos.";
