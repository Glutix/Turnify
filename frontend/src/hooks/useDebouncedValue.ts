import { useEffect, useState } from "react";

// Devuelve `value` recién después de que dejó de cambiar durante `delayMs`.
// El setState ocurre dentro del timeout (no de forma síncrona en el efecto),
// así que respeta la regla 5.5 (react-hooks/set-state-in-effect).
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}
