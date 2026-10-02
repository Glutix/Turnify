// Helpers de fecha/hora para el cálculo de disponibilidad (CU-06/RF04/RF06)
// y para combinar una fecha de calendario con una hora de franja/turno.
//
// Convención: igual que en horarios, las horas "sueltas" de Prisma (Time)
// llegan como Date con fecha base 1970-01-01 — acá trabajamos en minutos
// desde medianoche para no tener que lidiar con esa fecha base en ningún
// lado de la lógica de turnos.

export function minutosDesdeMedianoche(fecha: Date): number {
  return fecha.getUTCHours() * 60 + fecha.getUTCMinutes();
}

export function hhmmAMinutos(hhmm: string): number {
  const [horas, minutos] = hhmm.split(":").map(Number);
  return horas * 60 + minutos;
}

export function minutosAHhmm(totalMinutos: number): string {
  const horas = Math.floor(totalMinutos / 60)
    .toString()
    .padStart(2, "0");
  const minutos = (totalMinutos % 60).toString().padStart(2, "0");
  return `${horas}:${minutos}`;
}

// Combina una fecha de calendario (solo se usa año/mes/día, en UTC) con
// minutos desde medianoche, para obtener el Date completo de un turno.
export function combinarFechaYMinutos(fechaBase: Date, minutos: number): Date {
  const resultado = new Date(
    Date.UTC(
      fechaBase.getUTCFullYear(),
      fechaBase.getUTCMonth(),
      fechaBase.getUTCDate(),
      0,
      0,
      0,
      0,
    ),
  );
  resultado.setUTCMinutes(minutos);
  return resultado;
}

// true si [aInicio, aFin) se superpone con [bInicio, bFin)
export function seSuperponen(
  aInicio: Date,
  aFin: Date,
  bInicio: Date,
  bFin: Date,
): boolean {
  return aInicio < bFin && bInicio < aFin;
}

export function soloFecha(fechaStr: string): Date {
  // fechaStr esperado "YYYY-MM-DD". Se interpreta en UTC a propósito, mismo
  // criterio que usa horarios.service.ts para franjas/excepciones.
  return new Date(`${fechaStr}T00:00:00.000Z`);
}