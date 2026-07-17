/**
 * Normaliza el teléfono que envía el frontend (formato "3644-401020")
 * al formato con código de país que se guarda en base de datos y que
 * usa Baileys para armar el JID de WhatsApp ("+543644401020").
 */
export function normalizarTelefono(telefonoCrudo: string): string {
  const soloDigitos = telefonoCrudo.replace(/\D/g, "");

  return `+549${soloDigitos}`;
}
