import { useState, type FormEvent } from "react";
import { Input } from "../common/Input";
import { Button } from "../common/Button";
import type { Producto, AjustarStockPayload } from "../../types/producto";

const STOCK_MAXIMO = 1000000;

interface AjustarStockFormProps {
  producto: Producto;
  onSubmit: (payload: AjustarStockPayload) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  errorServidor?: string;
}

export function AjustarStockForm({
  producto,
  onSubmit,
  onCancel,
  isSubmitting,
  errorServidor,
}: AjustarStockFormProps) {
  const [stock, setStock] = useState(String(producto.stock));
  const [error, setError] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    // Vacío no se interpreta como 0: el valor reemplaza al stock actual.
    if (stock === "") {
      setError("Ingresá el stock");
      return;
    }

    const stockNumero = Number(stock);
    if (
      !Number.isInteger(stockNumero) ||
      stockNumero < 0 ||
      stockNumero > STOCK_MAXIMO
    ) {
      setError(
        `El stock debe ser un número entero entre 0 y ${STOCK_MAXIMO.toLocaleString("es-AR")}`,
      );
      return;
    }

    setError("");
    onSubmit({ stock: stockNumero });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="text-sm text-espresso/70">
        <p>
          Producto:{" "}
          <span className="font-medium text-espresso">{producto.nombre}</span>
        </p>
        <p>
          Stock actual:{" "}
          <span className="font-medium text-espresso">{producto.stock}</span>
        </p>
      </div>
      <Input
        label="Nuevo stock"
        type="number"
        min={0}
        max={STOCK_MAXIMO}
        step={1}
        value={stock}
        onChange={(e) => setStock(e.target.value)}
        error={error}
      />
      <p className="text-xs text-espresso/50">
        El valor que cargues reemplaza al stock actual, no se suma ni se resta.
      </p>
      {errorServidor && (
        <p className="text-xs text-rosewood">{errorServidor}</p>
      )}
      <div className="flex justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="subtle"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : "Guardar stock"}
        </Button>
      </div>
    </form>
  );
}
