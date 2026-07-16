interface ComingSoonProps {
  titulo: string;
}

/**
 * Placeholder visual para páginas todavía sin desarrollar.
 * Se reemplaza progresivamente por el contenido real de cada página.
 */
export function ComingSoon({ titulo }: ComingSoonProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6 text-center">
      <h1 className="font-serif text-4xl text-espresso">{titulo}</h1>
    </div>
  );
}
