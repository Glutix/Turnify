import { useId, useMemo, type CSSProperties } from "react";
import logoRaw from "../../assets/logo-gisela.svg?raw";

type LogoVariant = "gradient" | "light";

interface LogoProps {
  /**
   * Alto en píxeles. El ancho se calcula solo, respetando la proporción real.
   * Si se omite, el logo ocupa el 100% del ancho del contenedor padre.
   */
  size?: number;
  variant?: LogoVariant;
  className?: string;
}

// Proporción real (ancho / alto) del contenido dentro del viewBox recortado
const RELACION_ASPECTO = 830.4 / 654.5;

const COLORES_POR_VARIANTE: Record<LogoVariant, { inicio: string; fin: string }> = {
  gradient: { inicio: "#c9a15a", fin: "#9c4a43" },
  light: { inicio: "#fbf1ec", fin: "#c9a15a" },
};

export function Logo({ size, variant = "gradient", className = "" }: LogoProps) {
  const idUnico = useId().replace(/:/g, "");

  const svgConIdUnico = useMemo(
    () => logoRaw.replaceAll("logoGradient", `logoGradient-${idUnico}`),
    [idUnico],
  );

  const colores = COLORES_POR_VARIANTE[variant];

  const estiloTamano: CSSProperties = size
    ? { height: size, width: size * RELACION_ASPECTO }
    : { width: "100%", aspectRatio: `${RELACION_ASPECTO}` };

  return (
    <span
      role="img"
      aria-label="Gisela Toloza — Micropigmentación y Estética"
      className={`inline-block shrink-0 align-top ${className}`}
      style={
        {
          ...estiloTamano,
          "--logo-stop-start": colores.inicio,
          "--logo-stop-end": colores.fin,
        } as CSSProperties
      }
      dangerouslySetInnerHTML={{ __html: svgConIdUnico }}
    />
  );
}