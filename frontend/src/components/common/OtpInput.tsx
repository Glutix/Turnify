import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";

type EstadoOtp = "idle" | "verificando" | "correcto" | "incorrecto";
type SubFase =
  "ninguna" | "vaciando" | "colapsando" | "fusionado" | "brillo" | "asentado";

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

// Dimensiones reales de cada casilla (coinciden con h-14 w-11 de Tailwind:
// 56px alto x 44px ancho), usadas para que la "víbora" de SVG siga el
// contorno exacto en vez de una elipse simulada con conic-gradient.
const BOX_W = 44;
const BOX_H = 56;
const RADIO_ESQUINA = 12; // coincide con rounded-xl (0.75rem)

export function OtpInput({
  length = 6,
  value,
  onChange,
  autoFocus = false,
  disabled = false,
  estado = "idle",
}: OtpInputProps) {
  const [digitos, setDigitos] = useState<string[]>(() =>
    Array.from({ length }, (_, i) => value[i] ?? ""),
  );
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const finalizando = estado === "correcto" || estado === "incorrecto";
  const [subFaseTimed, setSubFaseTimed] = useState<SubFase | null>(null);

  useEffect(() => {
    if (!finalizando) return;

    const t1 = window.setTimeout(() => setSubFaseTimed("colapsando"), 150);
    const t2 = window.setTimeout(() => setSubFaseTimed("fusionado"), 650);
    const t3 = window.setTimeout(() => setSubFaseTimed("brillo"), 1100);
    const t4 = window.setTimeout(() => setSubFaseTimed("asentado"), 1650);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [finalizando]);

  const subFase: SubFase =
    subFaseTimed ?? (finalizando ? "vaciando" : "ninguna");

  function actualizar(nuevosDigitos: string[]) {
    setDigitos(nuevosDigitos);
    onChange(nuevosDigitos.join(""));
  }

  const soloLectura = disabled || estado !== "idle";

  function handleChange(index: number, e: ChangeEvent<HTMLInputElement>) {
    if (soloLectura) return;
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
    if (soloLectura) return;

    // Dígito nuevo: reemplaza directo el valor de la casilla actual, sin
    // importar si ya tenía algo escrito ni dónde está posicionado el
    // cursor — evita depender de la selección nativa del input, que es
    // justo lo que causaba que hubiera que borrar antes de poder tipear.
    if (/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      const nuevosDigitos = [...digitos];
      nuevosDigitos[index] = e.key;
      actualizar(nuevosDigitos);
      if (index < length - 1) {
        inputsRef.current[index + 1]?.focus();
      }
      return;
    }

    if (e.key === "Backspace") {
      e.preventDefault();
      if (digitos[index]) {
        // Si la casilla actual tiene contenido, lo borra y se queda ahí.
        const nuevosDigitos = [...digitos];
        nuevosDigitos[index] = "";
        actualizar(nuevosDigitos);
        return;
      }
      // Si ya estaba vacía, borra la anterior y mueve el foco hacia atrás
      // (comportamiento típico de "backspace en cascada" de un OTP).
      if (index > 0) {
        const nuevosDigitos = [...digitos];
        nuevosDigitos[index - 1] = "";
        actualizar(nuevosDigitos);
        inputsRef.current[index - 1]?.focus();
      }
      return;
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
    if (soloLectura) return;
    const pegado = e.clipboardData.getData("text").replace(/\D/g, "");
    const nuevosDigitos = Array.from({ length }, (_, i) => pegado[i] ?? "");
    actualizar(nuevosDigitos);
    const siguienteIndex = Math.min(pegado.length, length - 1);
    inputsRef.current[siguienteIndex]?.focus();
  }

  const centro = (length - 1) / 2;
  const colorTema =
    estado === "incorrecto" ? "var(--color-rosewood)" : "var(--color-oro)";
  const mostrarOverlay =
    subFase === "fusionado" || subFase === "brillo" || subFase === "asentado";

  return (
    <div
      className="relative flex justify-center py-3"
      style={{ "--ring-color": colorTema } as React.CSSProperties}
    >
      <div className="flex gap-2">
        {digitos.map((digito, index) => {
          const colapsada = subFase === "colapsando" || mostrarOverlay;

          return (
            <div
              key={index}
              className="relative"
              style={{
                transform: colapsada
                  ? `translateX(${(centro - index) * STEP}px) scale(0.55)`
                  : undefined,
                opacity: colapsada ? 0 : 1,
                transition: colapsada
                  ? "transform 480ms cubic-bezier(0.34, 1.2, 0.64, 1), opacity 200ms ease 260ms"
                  : undefined,
              }}
            >
              {estado === "verificando" && (
                <svg
                  className="pointer-events-none absolute inset-0"
                  width="100%"
                  height="100%"
                  viewBox={`0 0 ${BOX_W} ${BOX_H}`}
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <rect
                    x="1"
                    y="1"
                    width={BOX_W - 2}
                    height={BOX_H - 2}
                    rx={RADIO_ESQUINA}
                    fill="none"
                    stroke={colorTema}
                    strokeWidth="2"
                    strokeLinecap="round"
                    pathLength={1}
                    style={{
                      strokeDasharray: "0.16 0.84",
                      animation: "otp-snake 1.1s linear infinite",
                    }}
                  />
                </svg>
              )}

              <input
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
                  finalizando
                    ? { color: "transparent", borderColor: colorTema }
                    : undefined
                }
                className="h-14 w-11 rounded-xl border border-espresso/15 bg-superficie text-center text-xl font-semibold text-espresso transition-colors focus:border-rosewood focus:outline-none focus:ring-2 focus:ring-rosewood/20 disabled:cursor-not-allowed sm:w-12"
              />
            </div>
          );
        })}
      </div>

      {mostrarOverlay && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={`relative flex h-14 w-14 items-center justify-center rounded-full text-superficie shadow-md ${
              subFase === "brillo" || subFase === "asentado" ? "otp-halo" : ""
            }`}
            style={{ backgroundColor: colorTema }}
          >
            {estado === "correcto" ? (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <path
                  d="M20 6 9 17l-5-5"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  pathLength="1"
                  style={{
                    strokeDasharray: 1,
                    strokeDashoffset: subFase === "fusionado" ? 1 : 0,
                    transition: "stroke-dashoffset 380ms ease",
                  }}
                />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M6 6l12 12"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  pathLength="1"
                  style={{
                    strokeDasharray: 1,
                    strokeDashoffset: subFase === "fusionado" ? 1 : 0,
                    transition: "stroke-dashoffset 280ms ease",
                  }}
                />
                <path
                  d="M18 6 6 18"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  pathLength="1"
                  style={{
                    strokeDasharray: 1,
                    strokeDashoffset: subFase === "fusionado" ? 1 : 0,
                    transition: "stroke-dashoffset 280ms ease 150ms",
                  }}
                />
              </svg>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
