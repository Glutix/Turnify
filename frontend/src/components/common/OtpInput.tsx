import {
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
  error?: boolean;
  disabled?: boolean;
}

export function OtpInput({
  length = 6,
  value,
  onChange,
  autoFocus = false,
  error = false,
  disabled = false,
}: OtpInputProps) {
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

  return (
    <div className="flex justify-center gap-2">
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
          disabled={disabled}
          value={digito}
          onChange={(e) => handleChange(index, e)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          autoFocus={autoFocus && index === 0}
          aria-label={`Dígito ${index + 1} de ${length}`}
          className={`h-14 w-11 rounded-xl border bg-superficie text-center text-xl font-semibold text-espresso transition focus:outline-none focus:ring-2 focus:ring-rosewood/20 disabled:cursor-not-allowed disabled:opacity-50 sm:w-12 ${
            error
              ? "border-rosewood"
              : "border-espresso/15 focus:border-rosewood"
          }`}
        />
      ))}
    </div>
  );
}
