import { useId, type SelectHTMLAttributes } from "react";

interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  label: string;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
}

export function Select({
  label,
  options,
  placeholder = "Seleccionar...",
  error,
  id,
  className = "",
  ...rest
}: SelectProps) {
  const autoId = useId();
  const selectId = id ?? autoId;

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={selectId}
        className="text-xs font-medium uppercase tracking-widest text-espresso/60"
      >
        {label}
      </label>
      <div
        className={`flex items-center rounded-xl border bg-superficie px-4 py-3 transition focus-within:border-rosewood focus-within:ring-2 focus-within:ring-rosewood/20 ${
          error ? "border-rosewood" : "border-espresso/15"
        }`}
      >
        <select
          id={selectId}
          className={`w-full bg-transparent text-sm text-espresso focus:outline-none ${className}`}
          {...rest}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="text-xs text-rosewood">{error}</p>}
    </div>
  );
}