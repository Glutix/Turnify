import type { FormEvent } from "react";
import { IconArrowLeft } from "../common/Icons";
import { Button } from "../common/Button";
import { OtpInput } from "../common/OtpInput";

interface CodeStepProps {
  telefono: string;
  codigo: string;
  onCodigoChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  onVolver: () => void;
}

const LARGO_CODIGO = 6;

export function CodeStep({
  telefono,
  codigo,
  onCodigoChange,
  onSubmit,
  onVolver,
}: CodeStepProps) {
  const codigoCompleto = codigo.length === LARGO_CODIGO;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <button
        type="button"
        onClick={onVolver}
        className="flex w-fit items-center gap-1.5 rounded-sm text-xs uppercase tracking-widest text-espresso/50 transition-colors hover:text-rosewood focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rosewood/50"
      >
        <IconArrowLeft size={16} />
        Volver
      </button>

      <p className="text-sm leading-relaxed text-espresso/70">
        Te enviamos un código de verificación por WhatsApp al{" "}
        <span className="font-semibold text-espresso">{telefono}</span>. Revisá
        tus mensajes.
      </p>

      <div className="flex flex-col gap-1.5">
        <label className="text-center text-xs font-medium uppercase tracking-widest text-espresso/60">
          Código de verificación
        </label>
        <OtpInput
          length={LARGO_CODIGO}
          value={codigo}
          onChange={onCodigoChange}
          autoFocus
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        fullWidth
        disabled={!codigoCompleto}
      >
        Verificar código
      </Button>
    </form>
  );
}
