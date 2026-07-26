import { IconArrowLeft } from "../common/Icons";
import { OtpInput } from "../common/OtpInput";

type EstadoVerificacion = "idle" | "verificando" | "correcto" | "incorrecto";

interface CodeStepProps {
  telefono: string;
  codigo: string;
  onCodigoChange: (value: string) => void;
  onVolver: () => void;
  onReenviar: () => void;
  cooldownReenvio: number;
  intentosRestantes: number;
  codigoBloqueado: boolean;
  resetKey: number;
  estado: EstadoVerificacion;
  error?: string;
}

const LARGO_CODIGO = 6;

export function CodeStep({
  telefono,
  codigo,
  onCodigoChange,
  onVolver,
  onReenviar,
  cooldownReenvio,
  intentosRestantes,
  codigoBloqueado,
  resetKey,
  estado,
  error,
}: CodeStepProps) {
  const etiqueta =
    estado === "correcto"
      ? "¡Código verificado!"
      : estado === "incorrecto"
        ? "Código incorrecto"
        : "Código de verificación";

  const mostrarError =
    (estado === "idle" || estado === "incorrecto") && error && !codigoBloqueado;

  return (
    <div className="flex flex-col gap-6">
      <button
        type="button"
        onClick={onVolver}
        disabled={estado !== "idle"}
        className="flex w-fit items-center gap-1.5 rounded-sm text-xs uppercase tracking-widest text-espresso/50 transition-colors hover:text-rosewood focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rosewood/50 disabled:cursor-not-allowed disabled:opacity-50"
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
          {etiqueta}
        </label>

        <OtpInput
          key={resetKey}
          length={LARGO_CODIGO}
          value={codigo}
          onChange={onCodigoChange}
          autoFocus
          disabled={codigoBloqueado}
          estado={estado}
        />

        {mostrarError && (
          <p className="text-center text-xs text-rosewood">
            {error} — te quedan {intentosRestantes}{" "}
            {intentosRestantes === 1 ? "intento" : "intentos"}.
          </p>
        )}

        {codigoBloqueado && (
          <p className="text-center text-xs text-rosewood">
            Superaste el máximo de intentos. Solicitá un código nuevo para
            continuar.
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={onReenviar}
        disabled={cooldownReenvio > 0 || estado !== "idle"}
        className="text-center text-xs tabular-nums text-espresso/50 transition-colors hover:text-rosewood disabled:cursor-not-allowed disabled:opacity-50"
      >
        {cooldownReenvio > 0
          ? `Reenviar código en ${cooldownReenvio}s`
          : "¿No recibiste el código? Reenviar"}
      </button>
    </div>
  );
}
