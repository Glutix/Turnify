import { useState, type FormEvent } from "react";
import { Input } from "../common/Input";
import { Select } from "../common/Select";
import { Button } from "../common/Button";
import { CurrencyInput } from "../common/CurrencyInput";
import { precioANumero } from "../../utils/servicio";
import type {
  CategoriaProducto,
  Producto,
  CrearProductoPayload,
} from "../../types/producto";

const PRECIO_MAXIMO = 99999999;
const STOCK_MAXIMO = 1000000;

type Errores = {
  categoria?: string;
  nombre?: string;
  precio?: string;
  stock?: string;
};

interface ProductoFormProps {
  productoInicial?: Producto;
  categorias: CategoriaProducto[];
  onSubmit: (payload: CrearProductoPayload) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  errorServidor?: string;
}

export function ProductoForm({
  productoInicial,
  categorias,
  onSubmit,
  onCancel,
  isSubmitting,
  errorServidor,
}: ProductoFormProps) {
  const [categoriaId, setCategoriaId] = useState(
    productoInicial ? String(productoInicial.categoria_id) : "",
  );
  const [nombre, setNombre] = useState(productoInicial?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(
    productoInicial?.descripcion ?? "",
  );
  const [precio, setPrecio] = useState(
    productoInicial ? precioANumero(productoInicial.precio) : 0,
  );
  const [stock, setStock] = useState("0");
  const [errores, setErrores] = useState<Errores>({});

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const nombreLimpio = nombre.trim();
    const stockNumero = stock === "" ? 0 : Number(stock);
    const nuevosErrores: Errores = {};

    if (!categoriaId) nuevosErrores.categoria = "Seleccioná una categoría";

    if (!nombreLimpio) {
      nuevosErrores.nombre = "El nombre es obligatorio";
    } else if (nombreLimpio.length < 2) {
      nuevosErrores.nombre = "El nombre debe tener al menos 2 caracteres";
    }

    if (precio <= 0) {
      nuevosErrores.precio = "El precio debe ser mayor a 0";
    } else if (precio > PRECIO_MAXIMO) {
      nuevosErrores.precio = `El precio no puede superar $${PRECIO_MAXIMO.toLocaleString("es-AR")}`;
    }

    if (
      !productoInicial &&
      (!Number.isInteger(stockNumero) ||
        stockNumero < 0 ||
        stockNumero > STOCK_MAXIMO)
    ) {
      nuevosErrores.stock = `El stock debe ser un número entero entre 0 y ${STOCK_MAXIMO.toLocaleString("es-AR")}`;
    }

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      return;
    }
    setErrores({});

    onSubmit({
      categoria_id: Number(categoriaId),
      nombre: nombreLimpio,
      descripcion: descripcion.trim() || null,
      precio,
      // El stock solo se manda al crear: el PATCH general lo descarta en silencio.
      ...(productoInicial ? {} : { stock: stockNumero }),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Select
          label="Categoría"
          value={categoriaId}
          onChange={(e) => setCategoriaId(e.target.value)}
          options={categorias.map((c) => ({ value: c.id, label: c.nombre }))}
          error={errores.categoria}
        />
        {categorias.length === 0 && (
          <p className="text-xs text-espresso/50">
            Todavía no hay categorías. Creá una desde la pestaña Categorías.
          </p>
        )}
      </div>
      <Input
        label="Nombre"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        error={errores.nombre}
        maxLength={150}
        placeholder="Ej: Shampoo reparador 500 ml"
      />
      <Input
        label="Descripción (opcional)"
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
        maxLength={1000}
        placeholder="Ej: Para cabello dañado, sin sulfatos"
      />
      <CurrencyInput
        value={precio}
        onChange={setPrecio}
        error={errores.precio}
      />
      {!productoInicial && (
        <Input
          label="Stock inicial"
          type="number"
          min={0}
          max={STOCK_MAXIMO}
          step={1}
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          error={errores.stock}
        />
      )}
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
          {isSubmitting
            ? "Guardando..."
            : productoInicial
              ? "Guardar cambios"
              : "Crear producto"}
        </Button>
      </div>
    </form>
  );
}
