import type { FormEvent } from "react";
import { useState } from "react";
import { Button } from "../common/Button";
import { Input } from "../common/Input";

interface RegisterStepProps {
  telefono: string;
  onSubmit: (e: FormEvent, nombre: string, apellido: string) => void;
  error?: string;
  isLoading?: boolean;
}

export function RegisterStep({
  telefono,
  onSubmit,
  error,
  isLoading = false,
}: RegisterStepProps) {
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit(e, nombre, apellido);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-espresso">Crear cuenta</h2>
        <p className="mt-2 text-sm text-espresso/70">
          No encontramos una cuenta asociada al teléfono:
        </p>
        <p className="mt-1 font-semibold text-espresso">{telefono}</p>
      </div>

      <Input
        label="Nombre"
        type="text"
        placeholder="Ej: Juan"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        disabled={isLoading}
        required
      />

      <Input
        label="Apellido"
        type="text"
        placeholder="Ej: Pérez"
        value={apellido}
        onChange={(e) => setApellido(e.target.value)}
        error={error}
        disabled={isLoading}
        required
      />

      <Button
        type="submit"
        variant="primary"
        fullWidth
        disabled={!nombre.trim() || !apellido.trim() || isLoading}
      >
        {isLoading ? "Creando cuenta..." : "Crear cuenta"}
      </Button>
    </form>
  );
}