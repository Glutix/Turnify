import type { Servicio } from "../types/servicio";

export interface ContenidoServicio {
  beneficios: string[];
  recomendaciones: string[];
  cuidados: string[];
}

// TODO: el modelo `Servicio` solo tiene nombre / descripción / duración /
// precio. Mientras no existan campos propios (beneficios, recomendaciones,
// cuidados) en la base, se muestra este contenido GENÉRICO para todos los
// servicios. Cuando el backend los provea, devolverlos desde acá según
// `servicio` y dejar este texto como fallback.
export function obtenerContenidoServicio(
  _servicio: Servicio,
): ContenidoServicio {
  return {
    beneficios: [
      "Atención profesional y personalizada.",
      "Productos e instrumental de calidad.",
      "Turno reservado a tu medida, sin esperas.",
    ],
    recomendaciones: [
      "Llegá unos minutos antes de tu turno.",
      "Avisanos si tenés alergias, sensibilidad en la piel o algún tratamiento reciente.",
      "Ante cualquier duda, consultanos antes de reservar.",
    ],
    cuidados: [
      "Seguí las indicaciones que te dé la profesional al finalizar.",
      "Si notás alguna molestia inusual, comunicate con nosotras.",
    ],
  };
}
