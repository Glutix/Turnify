import { useId, type InputHTMLAttributes, type ReactNode } from "react";

interface InputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "prefix"
> {
  label: string;
  icon?: ReactNode;
  prefix?: ReactNode;
  rightElement?: ReactNode;
  error?: string;
}

export function Input({
  label,
  icon,
  prefix,
  rightElement,
  error,
  id,
  className = "",
  ...rest
}: InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={inputId}
        className="text-xs font-medium uppercase tracking-widest text-espresso/60"
      >
        {label}
      </label>
      <div
        className={`flex items-center gap-3 rounded-xl border bg-superficie px-4 py-3 transition focus-within:border-rosewood focus-within:ring-2 focus-within:ring-rosewood/20 ${
          error ? "border-rosewood" : "border-espresso/15"
        }`}
      >
        {icon && <span className="shrink-0 text-espresso/40">{icon}</span>}
        {prefix && (
          <span className="shrink-0 border-r border-espresso/15 pr-3 text-sm font-medium text-espresso/60">
            {prefix}
          </span>
        )}
        <input
          id={inputId}
          className={`w-full bg-transparent text-sm text-espresso placeholder:text-espresso/35 focus:outline-none ${className}`}
          {...rest}
        />
        {rightElement && <span className="shrink-0">{rightElement}</span>}
      </div>
      {error && <p className="text-xs text-rosewood">{error}</p>}
    </div>
  );
}
