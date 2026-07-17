import { useState } from "react";

interface DurationInputProps {
  label?: string;
  minutosTotal: number;
  onChange: (minutosTotal: number) => void;
  maxHoras?: number;
}

export function DurationInput({
  label = "Duración",
  minutosTotal,
  onChange,
  maxHoras = 4,
}: DurationInputProps) {
  const horas = Math.floor(minutosTotal / 60);
  const minutos = minutosTotal % 60;

  // Estado de texto local para permitir campo vacío mientras se edita,
  // sin forzar un "0" que rompa la escritura natural.
  const [textoHoras, setTextoHoras] = useState(String(horas));
  const [textoMinutos, setTextoMinutos] = useState(String(minutos));

  const [ultimoMinutosTotalSincronizado, setUltimoMinutosTotalSincronizado] =
    useState(minutosTotal);

  // Si el value externo cambia (ej: se carga otro servicio), resincronizamos
  // el texto visible durante el render, sin useEffect.
  if (minutosTotal !== ultimoMinutosTotalSincronizado) {
    setUltimoMinutosTotalSincronizado(minutosTotal);
    setTextoHoras(String(Math.floor(minutosTotal / 60)));
    setTextoMinutos(String(minutosTotal % 60));
  }

  function handleHorasChange(e: React.ChangeEvent<HTMLInputElement>) {
  const soloDigitos = e.target.value.replace(/\D/g, "");

  if (soloDigitos === "") {
    setTextoHoras("");
    return;
  }

  const numero = parseInt(soloDigitos, 10);

  // Si supera el máximo, ignoramos la tecla.
  if (numero > maxHoras) return;

  setTextoHoras(soloDigitos);

  const nuevoTotal = numero * 60 + minutos;
  setUltimoMinutosTotalSincronizado(nuevoTotal);
  onChange(nuevoTotal);
}

  function handleMinutosChange(e: React.ChangeEvent<HTMLInputElement>) {
  const soloDigitos = e.target.value.replace(/\D/g, "");

  if (soloDigitos === "") {
    setTextoMinutos("");
    return;
  }

  const numero = parseInt(soloDigitos, 10);

  if (numero > 59) return;

  setTextoMinutos(soloDigitos);

  const nuevoTotal = horas * 60 + numero;
  setUltimoMinutosTotalSincronizado(nuevoTotal);
  onChange(nuevoTotal);
}

  // Al perder el foco, si quedó vacío, normalizamos a "0" visualmente
  function handleHorasBlur() {
    if (textoHoras === "") setTextoHoras("0");
  }

  function handleMinutosBlur() {
    if (textoMinutos === "") setTextoMinutos("0");
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium uppercase tracking-widest text-espresso/60">
        {label}
      </label>
      <div className="flex items-end gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-espresso/50">Horas (0–{maxHoras})</span>
          <input
            type="text"
            inputMode="numeric"
            value={textoHoras}
            onChange={handleHorasChange}
            onBlur={handleHorasBlur}
            maxLength={1}
            max={4}
            className="w-20 rounded-xl border border-espresso/15 bg-superficie px-3 py-2.5 text-sm text-espresso focus:border-rosewood focus:outline-none focus:ring-2 focus:ring-rosewood/20"
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-espresso/50">Minutos (0–59)</span>
          <input
            type="text"
            inputMode="numeric"
            value={textoMinutos}
            onChange={handleMinutosChange}
            onBlur={handleMinutosBlur}
            maxLength={2}
            className="w-20 rounded-xl border border-espresso/15 bg-superficie px-3 py-2.5 text-sm text-espresso focus:border-rosewood focus:outline-none focus:ring-2 focus:ring-rosewood/20"
          />
        </div>
        <span className="pb-2.5 text-sm text-espresso/50">
          = {horas}h {minutos}min
        </span>
      </div>
    </div>
  );
}