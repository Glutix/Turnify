import { useState, type FormEvent } from "react";
import { Input } from "../common/Input";
import { Button } from "../common/Button";
import type { CategoriaServicio, CrearCategoriaPayload } from "../../types/servicio";

interface CategoriaFormProps {
  categoriaInicial?: CategoriaServicio;
  onSubmit: (payload: CrearCategoriaPayload) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  errorServidor?: string;
}

export function CategoriaForm({
  categoriaInicial,
  onSubmit,
  onCancel,
  isSubmitting,
  errorServidor,
}: CategoriaFormProps) {
  const [nombre, setNombre] = useState(categoriaInicial?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(categoriaInicial?.descripcion ?? "");
  const [errorNombre, setErrorNombre] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!nombre.trim()) {
      setErrorNombre("El nombre es obligatorio");
      return;
    }
    setErrorNombre("");

    onSubmit({
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || undefined,
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
        placeholder="Ej: Pigmentación de cejas"
      />
      <Input
        label="Descripción (opcional)"
        value={descripcion}
        maxLength={255}
        onChange={(e) => setDescripcion(e.target.value)}
        placeholder="Ej: Servicios de micropigmentación y diseño de cejas"
      />
      {errorServidor && <p className="text-xs text-rosewood">{errorServidor}</p>}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="subtle" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : categoriaInicial ? "Guardar cambios" : "Crear categoría"}
        </Button>
      </div>
    </form>
  );
}