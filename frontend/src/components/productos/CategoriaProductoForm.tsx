import { useState, type FormEvent } from "react";
import { Input } from "../common/Input";
import { Button } from "../common/Button";
import type {
  CategoriaProducto,
  CrearCategoriaProductoPayload,
} from "../../types/producto";

interface CategoriaProductoFormProps {
  categoriaInicial?: CategoriaProducto;
  onSubmit: (payload: CrearCategoriaProductoPayload) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  errorServidor?: string;
}

export function CategoriaProductoForm({
  categoriaInicial,
  onSubmit,
  onCancel,
  isSubmitting,
  errorServidor,
}: CategoriaProductoFormProps) {
  const [nombre, setNombre] = useState(categoriaInicial?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(
    categoriaInicial?.descripcion ?? "",
  );
  const [errorNombre, setErrorNombre] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const nombreLimpio = nombre.trim();
    if (!nombreLimpio) {
      setErrorNombre("El nombre es obligatorio");
      return;
    }
    // El backend exige mínimo 2 caracteres
    if (nombreLimpio.length < 2) {
      setErrorNombre("El nombre debe tener al menos 2 caracteres");
      return;
    }
    setErrorNombre("");

    onSubmit({
      nombre: nombreLimpio,
      descripcion: descripcion.trim() || null,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Nombre"
        value={nombre}
        maxLength={100}
        onChange={(e) => setNombre(e.target.value)}
        error={errorNombre}
        placeholder="Ej: Maquillaje"
      />
      <Input
        label="Descripción (opcional)"
        value={descripcion}
        maxLength={255}
        onChange={(e) => setDescripcion(e.target.value)}
        placeholder="Ej: Bases, labiales y sombras"
      />
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
            : categoriaInicial
              ? "Guardar cambios"
              : "Crear categoría"}
        </Button>
      </div>
    </form>
  );
}
