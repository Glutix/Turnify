import { prisma } from "./prisma";
import { DiaSemana } from "@prisma/client";

// Horario de atención: lunes a viernes, 8 a 12 y 16 a 20 (corte de mediodía).
// Sábado y domingo quedan sin franjas cargadas (cerrado), tal como se
// configuró en el panel admin. Si en algún momento se abre sábado, agregar
// acá y correr el seed de nuevo (es idempotente, no duplica).
const DIAS_HABILES: DiaSemana[] = [
  DiaSemana.lunes,
  DiaSemana.martes,
  DiaSemana.miercoles,
  DiaSemana.jueves,
  DiaSemana.viernes,
];

const FRANJAS_POR_DIA: { hora_inicio: string; hora_fin: string }[] = [
  { hora_inicio: "08:00", hora_fin: "12:00" },
  { hora_inicio: "16:00", hora_fin: "20:00" },
];

// Prisma mapea columnas Time a Date con fecha base 1970-01-01 — mismo
// criterio que usa horarios.service.ts (aFechaHora), para que las franjas
// que crea este seed sean indistinguibles de las que crea el panel admin.
function aFechaHora(horaHHmm: string): Date {
  return new Date(`1970-01-01T${horaHHmm}:00.000Z`);
}

export async function seedFranjasHorarias() {
  console.log("Iniciando seed de franjas horarias...");

  for (const dia of DIAS_HABILES) {
    for (const franja of FRANJAS_POR_DIA) {
      const hora_inicio = aFechaHora(franja.hora_inicio);
      const hora_fin = aFechaHora(franja.hora_fin);

      await prisma.franjaHoraria.upsert({
        where: {
          dia_semana_hora_inicio_hora_fin: { dia_semana: dia, hora_inicio, hora_fin },
        },
        update: {},
        create: { dia_semana: dia, hora_inicio, hora_fin, activo: true },
      });

      console.log(`  - ${dia} ${franja.hora_inicio}-${franja.hora_fin}`);
    }
  }

  console.log("✓ Franjas horarias procesadas correctamente.");
}