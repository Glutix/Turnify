import { useEffect, useState } from "react";

const STORAGE_KEY = "turnify:servicios-vistos";
const MAX_VISTOS = 8;

function leer(): number[] {
  try {
    const crudo = sessionStorage.getItem(STORAGE_KEY);
    const datos: unknown = crudo ? JSON.parse(crudo) : [];
    return Array.isArray(datos)
      ? datos.filter((n): n is number => typeof n === "number")
      : [];
  } catch {
    return [];
  }
}

/**
 * Historial de servicios vistos en la sesión actual (sessionStorage).
 * Devuelve los vistos ANTES de este (sin incluirlo) y registra el actual.
 * Usar con `key={servicioId}` en el componente que lo llama para que se
 * reinicie al cambiar de servicio.
 */
export function useServiciosVistos(servicioId: number): number[] {
  const [anteriores] = useState(() => leer().filter((id) => id !== servicioId));

  useEffect(() => {
    try {
      const actualizado = [
        servicioId,
        ...leer().filter((id) => id !== servicioId),
      ].slice(0, MAX_VISTOS);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(actualizado));
    } catch {
      // sessionStorage no disponible (modo privado, etc.): se ignora.
    }
  }, [servicioId]);

  return anteriores;
}
