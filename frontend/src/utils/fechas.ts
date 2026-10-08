// "Hoy" según el reloj del navegador (zona local), en formato YYYY-MM-DD.
// No usar new Date().toISOString().slice(0, 10): eso da la fecha en UTC y, de
// noche en Argentina (UTC-3), devuelve el día siguiente.
export function hoyISO(): string {
  const ahora = new Date();
  const mes = String(ahora.getMonth() + 1).padStart(2, "0");
  const dia = String(ahora.getDate()).padStart(2, "0");
  return `${ahora.getFullYear()}-${mes}-${dia}`;
}

// Los turnos se guardan como "hora de pared" del salón dentro de un Date en UTC
// (las 15:00 del salón = 15:00Z). Para compararlos contra "ahora" hay que
// expresar el "ahora" del navegador de la misma manera.
export function ahoraComoHoraDePared(): Date {
  const a = new Date();
  return new Date(Date.UTC(a.getFullYear(), a.getMonth(), a.getDate(), a.getHours(), a.getMinutes()));
}

// "martes 14 de octubre" a partir del ISO del turno (sin corrimiento de zona).
export function formatearFechaLarga(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

// "15:30" a partir del ISO del turno.
export function formatearHora(iso: string): string {
  return iso.slice(11, 16);
}

// Suma días a una fecha "YYYY-MM-DD" (en calendario local, sin saltos por horario de verano).
export function sumarDias(fechaISO: string, dias: number): string {
  const [a, m, d] = fechaISO.split("-").map(Number);
  const f = new Date(a, m - 1, d + dias);
  return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}-${String(f.getDate()).padStart(2, "0")}`;
}
