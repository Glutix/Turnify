/**
 * Normaliza teléfonos al formato internacional argentino utilizado
 * por la base de datos y WhatsApp (Baileys):
 *
 * Entrada:
 *  - 3644-401020
 *  - 3644401020
 *  - +54 9 3644 401020
 *  - 5493644401020
 *  - +5493644401020
 *
 * Salida:
 *  - +5493644401020
 */
export function normalizarTelefono(telefonoCrudo: string): string {
  let telefono = telefonoCrudo.replace(/\D/g, "");

  // Si viene con código de país incluido, lo removemos
  // para evitar duplicar el prefijo +549.
  if (telefono.startsWith("549")) {
    telefono = telefono.slice(3);
  }

  // Si viene con 0 inicial (formato local), lo removemos.
  if (telefono.startsWith("0")) {
    telefono = telefono.slice(1);
  }

  return `+549${telefono}`;
}
