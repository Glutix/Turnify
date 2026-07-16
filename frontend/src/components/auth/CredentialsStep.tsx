import { useState, type FormEvent } from "react";
import { IconUser, IconLock, IconEye, IconEyeOff } from "../common/Icons";
import { Button } from "../common/Button";
import { Input } from "../common/Input";

interface CredentialsStepProps {
  identificador: string;
  onIdentificadorChange: (value: string) => void;
  contrasena: string;
  onContrasenaChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  onIrATelefono: () => void;
}

export function CredentialsStep({
  identificador,
  onIdentificadorChange,
  contrasena,
  onContrasenaChange,
  onSubmit,
  onIrATelefono,
}: CredentialsStepProps) {
  const [mostrarContrasena, setMostrarContrasena] = useState(false);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <Input
        label="Correo o teléfono"
        type="text"
        autoComplete="username"
        placeholder="tu@correo.com"
        icon={<IconUser size={18} />}
        value={identificador}
        onChange={(e) => onIdentificadorChange(e.target.value)}
        required
      />

      <Input
        label="Contraseña"
        type={mostrarContrasena ? "text" : "password"}
        autoComplete="current-password"
        placeholder="••••••••"
        icon={<IconLock size={18} />}
        value={contrasena}
        onChange={(e) => onContrasenaChange(e.target.value)}
        rightElement={
          <button
            type="button"
            onClick={() => setMostrarContrasena((prev) => !prev)}
            className="rounded-sm text-espresso/40 transition-colors hover:text-rosewood focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rosewood/50"
            aria-label={
              mostrarContrasena ? "Ocultar contraseña" : "Mostrar contraseña"
            }
          >
            {mostrarContrasena ? (
              <IconEyeOff size={18} />
            ) : (
              <IconEye size={18} />
            )}
          </button>
        }
        required
      />

      <Button type="submit" variant="primary" fullWidth>
        Iniciar sesión
      </Button>

      <Button
        type="button"
        variant="link"
        fullWidth
        onClick={onIrATelefono}
        className="text-center"
      >
        Iniciar sesión solo con teléfono
      </Button>
    </form>
  );
}
