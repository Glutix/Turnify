import { useState } from "react";

interface CurrencyInputProps {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  error?: string;
}

function formatearARS(valor: number): string {
  return valor.toLocaleString("es-AR");
}

export function CurrencyInput({
  label = "Precio",
  value,
  onChange,
  error,
}: CurrencyInputProps) {
  const [textoVisible, setTextoVisible] = useState(() => formatearARS(value));
  const [ultimoValueSincronizado, setUltimoValueSincronizado] = useState(value);

  // Ajuste de estado durante el render si el value externo cambia
  // (ej: se carga un servicio distinto para editar), sin useEffect.
  if (value !== ultimoValueSincronizado) {
    setUltimoValueSincronizado(value);
    setTextoVisible(formatearARS(value));
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Solo dígitos: se descarta cualquier otro carácter en el momento de tipear,
    // no al perder el foco. Esto bloquea letras, símbolos, comas y puntos.
    const soloDigitos = e.target.value.replace(/\D/g, "");
    const numero = soloDigitos === "" ? 0 : parseInt(soloDigitos, 10);

    setTextoVisible(soloDigitos === "" ? "" : formatearARS(numero));
    setUltimoValueSincronizado(numero);
    onChange(numero);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium uppercase tracking-widest text-espresso/60">
        {label}
      </label>
      <div
        className={`flex items-center gap-2 rounded-xl border bg-superficie px-4 py-3 transition focus-within:border-rosewood focus-within:ring-2 focus-within:ring-rosewood/20 ${
          error ? "border-rosewood" : "border-espresso/15"
        }`}
      >
        <span className="shrink-0 text-sm font-medium text-espresso/60">$</span>
        <input
          type="text"
          inputMode="numeric"
          value={textoVisible}
          onChange={handleChange}
          placeholder="0"
          className="w-full bg-transparent text-sm text-espresso focus:outline-none"
        />
      </div>
      {error && <p className="text-xs text-rosewood">{error}</p>}
    </div>
  );
}