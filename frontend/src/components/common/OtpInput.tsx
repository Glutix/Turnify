import {
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";

type EstadoOtp = "idle" | "verificando" | "correcto" | "incorrecto";

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
  disabled?: boolean;
  estado?: EstadoOtp;
}

const BOX_SIZE = 44;
const GAP = 8;
const STEP = BOX_SIZE + GAP;

export function OtpInput({
  length = 6,
  value,
  onChange,
  autoFocus = false,
  disabled = false,
  estado = "idle",
}: OtpInputProps) {
  const filtroId = `otp-goo-${useId().replace(/:/g, "")}`;
  const [digitos, setDigitos] = useState<string[]>(() =>
    Array.from({ length }, (_, i) => value[i] ?? ""),
  );
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  function actualizar(nuevosDigitos: string[]) {
    setDigitos(nuevosDigitos);
    onChange(nuevosDigitos.join(""));
  }

  function handleChange(index: number, e: ChangeEvent<HTMLInputElement>) {
    const soloNumeros = e.target.value.replace(/\D/g, "");

    if (soloNumeros.length > 1) {
      const combinado = (digitos.slice(0, index).join("") + soloNumeros).slice(
        0,
        length,
      );
      const nuevosDigitos = Array.from(
        { length },
        (_, i) => combinado[i] ?? "",
      );
      actualizar(nuevosDigitos);
      const siguienteIndex = Math.min(combinado.length, length - 1);
      inputsRef.current[siguienteIndex]?.focus();
      return;
    }

    const nuevosDigitos = [...digitos];
    nuevosDigitos[index] = soloNumeros;
    actualizar(nuevosDigitos);

    if (soloNumeros && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digitos[index] && index > 0) {
      const nuevosDigitos = [...digitos];
      nuevosDigitos[index - 1] = "";
      actualizar(nuevosDigitos);
      inputsRef.current[index - 1]?.focus();
    }

    if (e.key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }

    if (e.key === "ArrowRight" && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pegado = e.clipboardData.getData("text").replace(/\D/g, "");
    const nuevosDigitos = Array.from({ length }, (_, i) => pegado[i] ?? "");
    actualizar(nuevosDigitos);
    const siguienteIndex = Math.min(pegado.length, length - 1);
    inputsRef.current[siguienteIndex]?.focus();
  }

  const fusionando = estado === "correcto" || estado === "incorrecto";
  const soloLectura = disabled || estado !== "idle";
  const centro = (length - 1) / 2;
  const colorFusion =
    estado === "incorrecto" ? "var(--color-rosewood)" : "var(--color-oro)";

  return (
    <div className="relative flex justify-center">
      {/* Filtro "goo": blur fuerte + contraste extremo hace que las formas
          superpuestas se vean fusionadas (como líquido) en vez de apiladas. */}
      <svg className="absolute h-0 w-0" aria-hidden="true">
        <defs>
          <filter id={filtroId}>
            <feGaussianBlur
              in="SourceGraphic"
              stdDeviation="10"
              result="blur"
            />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 28 -14"
            />
          </filter>
        </defs>
      </svg>

      <div
        className={`rounded-2xl p-1 ${
          estado === "verificando" ? "otp-ring-verificando" : ""
        }`}
      >
        <div
          className="flex gap-2 py-3"
          style={fusionando ? { filter: `url(#${filtroId})` } : undefined}
        >
          {digitos.map((digito, index) => (
            <input
              key={index}
              ref={(el) => {
                inputsRef.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              maxLength={1}
              disabled={soloLectura}
              value={digito}
              onChange={(e) => handleChange(index, e)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              onFocus={(e) => e.target.select()}
              autoFocus={autoFocus && index === 0}
              aria-label={`Dígito ${index + 1} de ${length}`}
              style={
                fusionando
                  ? {
                      transform: `translateX(${(centro - index) * STEP}px) scale(1.15)`,
                      backgroundColor: colorFusion,
                      borderColor: colorFusion,
                      borderRadius: "9999px",
                      borderWidth: 0,
                      opacity: 0,
                      transition:
                        "transform 600ms cubic-bezier(0.34, 1.56, 0.64, 1), border-radius 600ms ease, background-color 300ms ease, opacity 250ms ease 500ms",
                    }
                  : undefined
              }
              className={`h-14 w-11 rounded-xl border bg-superficie text-center text-xl font-semibold text-espresso transition focus:outline-none focus:ring-2 focus:ring-rosewood/20 disabled:cursor-not-allowed sm:w-12 ${
                estado === "incorrecto" && !fusionando
                  ? "border-rosewood"
                  : "border-espresso/15 focus:border-rosewood"
              }`}
            />
          ))}
        </div>
      </div>

      {estado === "correcto" && (
        <div
          className="otp-icon-pop absolute inset-0 flex items-center justify-center"
          style={{ animationDelay: "520" }} //520ms
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-linear-to-r from-oro to-rosewood text-superficie shadow-md">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
        </div>
      )}

      {estado === "incorrecto" && (
        <div
          className="otp-icon-pop absolute inset-0 flex items-center justify-center"
          style={{ animationDelay: "520ms" }}
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rosewood text-superficie shadow-md">
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
