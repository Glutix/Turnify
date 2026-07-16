import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "subtle" | "link";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  children: ReactNode;
}

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary:
    "rounded-full bg-linear-to-r from-oro to-rosewood px-7 py-3 text-sm font-semibold uppercase tracking-widest text-superficie shadow-sm transition hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-sm",
  subtle:
    "rounded-full bg-espresso/5 px-7 py-3 text-sm font-medium tracking-wide text-espresso/70 transition hover:bg-rosewood/10 hover:text-rosewood disabled:cursor-not-allowed disabled:opacity-50",
  link: "text-sm font-medium text-rosewood transition-colors hover:text-espresso disabled:cursor-not-allowed disabled:opacity-50",
};

export function Button({
  variant = "primary",
  fullWidth = false,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rosewood/50 focus-visible:ring-offset-2 focus-visible:ring-offset-superficie ${VARIANT_STYLES[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
