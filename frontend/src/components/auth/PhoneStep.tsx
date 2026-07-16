import type { ChangeEvent, FormEvent } from "react";
import { IconPhone } from "../common/Icons";
import { Button } from "../common/Button";
import { Input } from "../common/Input";

interface PhoneStepProps {
  telefono: string;
  onTelefonoChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  onIrACredenciales: () => void;
}

const MAX_DIGITS = 10; // 4 (característica) + 6 (número)

/** Formatea dígitos crudos al patrón xxxx-xxxxxx usado en Argentina/Chaco. */
function formatearTelefono(valorCrudo: string): string {
  const soloDigitos = valorCrudo.replace(/\D/g, "").slice(0, MAX_DIGITS);

  if (soloDigitos.length <= 4) {
    return soloDigitos;
  }

  return `${soloDigitos.slice(0, 4)}-${soloDigitos.slice(4)}`;
}

export function PhoneStep({
  telefono,
  onTelefonoChange,
  onSubmit,
  onIrACredenciales,
}: PhoneStepProps) {
  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    onTelefonoChange(formatearTelefono(e.target.value));
  }

  const telefonoCompleto = telefono.replace(/\D/g, "").length === MAX_DIGITS;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <Input
        label="Teléfono"
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        placeholder="3644-401020"
        prefix="+54"
        icon={<IconPhone size={18} />}
        value={telefono}
        onChange={handleChange}
        maxLength={11} // 10 dígitos + guión
        required
      />

      <Button
        type="submit"
        variant="primary"
        fullWidth
        disabled={!telefonoCompleto}
      >
        Iniciar sesión
      </Button>

      <Button
        type="button"
        variant="subtle"
        fullWidth
        onClick={onIrACredenciales}
        className="text-center"
      >
        Iniciar sesión con usuario y contraseña
      </Button>
    </form>
  );
}
