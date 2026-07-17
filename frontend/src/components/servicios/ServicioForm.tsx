import { useState, type FormEvent } from "react";
import { Input } from "../common/Input";
import { Select } from "../common/Select";
import { Button } from "../common/Button";
import { DurationInput } from "../common/DurationInput";
import { CurrencyInput } from "../common/CurrencyInput";
import { precioANumero } from "../../utils/servicio";
import type { CategoriaServicio, Servicio, CrearServicioPayload } from "../../types/servicio";

interface ServicioFormProps {
  servicioInicial?: Servicio;
  categorias: CategoriaServicio[];
  onSubmit: (payload: CrearServicioPayload) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  errorServidor?: string;
}

export function ServicioForm({
  servicioInicial,
  categorias,
  onSubmit,
  onCancel,
  isSubmitting,
  errorServidor,
}: ServicioFormProps) {
  const [categoriaId, setCategoriaId] = useState<string>(
    servicioInicial ? String(servicioInicial.categoria_id) : "",
  );
  const [nombre, setNombre] = useState(servicioInicial?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(servicioInicial?.descripcion ?? "");
  const [duracionMinutos, setDuracionMinutos] = useState(servicioInicial?.duracion_minutos ?? 30);
  const [precio, setPrecio] = useState(
    servicioInicial ? precioANumero(servicioInicial.precio) : 0,
  );
  const [errores, setErrores] = useState<{ categoria?: string; nombre?: string }>({});

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const nuevosErrores: typeof errores = {};
    if (!categoriaId) nuevosErrores.categoria = "Seleccioná una categoría";
    if (!nombre.trim()) nuevosErrores.nombre = "El nombre es obligatorio";
    if(nombre.trim().length > 150){
      nuevosErrores.nombre ="El nombre no puede superar los 150 caracteres";
    }
    if(precio <= 0){
      nuevosErrores.nombre ="El precio debe ser mayor a 0";
    }


    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      return;
    }
    setErrores({});

    onSubmit({
      categoria_id: Number(categoriaId),
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || undefined,
      duracion_minutos: duracionMinutos,
      precio,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Select
        label="Categoría"
        value={categoriaId}
        onChange={(e) => setCategoriaId(e.target.value)}
        options={categorias.map((c) => ({ value: c.id, label: c.nombre }))}
        error={errores.categoria}
      />
      <Input
        label="Nombre"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        error={errores.nombre}
        maxLength={150}
        placeholder="Ej: Microblading"
      />
      <Input
        label="Descripción (opcional)"
        value={descripcion}
        maxLength={255}
        onChange={(e) => setDescripcion(e.target.value)}
        placeholder="Ej: Técnica de pigmentación pelo a pelo"
      />
      <DurationInput minutosTotal={duracionMinutos} onChange={setDuracionMinutos} />
      <CurrencyInput value={precio} onChange={setPrecio} />
      {errorServidor && <p className="text-xs text-rosewood">{errorServidor}</p>}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="subtle" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : servicioInicial ? "Guardar cambios" : "Crear servicio"}
        </Button>
      </div>
    </form>
  );
}