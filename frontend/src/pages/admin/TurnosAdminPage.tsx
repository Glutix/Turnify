//Turnify\frontend\src\pages\admin\TurnosAdminPage.tsx
import { useState, type FormEvent } from "react";
import { Table } from "../../components/common/Table";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { Select } from "../../components/common/Select";
import { useToastStore } from "../../stores/toastStore";
import { EstadoBadge } from "../../components/turnos/EstadoBadge";
import {
  AccionesTurnoAdmin,
  ModalesGestionTurno,
} from "../../components/turnos/GestionTurnoAdmin";
import { useTurnosAdmin } from "../../hooks/useTurnos";
import { useGestionTurnoAdmin } from "../../hooks/useGestionTurnoAdmin";
import {
  ETIQUETA_ESTADO,
  formatearFechaHora,
  type EstadoTurno,
  type FiltrosTurnosAdmin,
  type Turno,
} from "../../types/turno";
import { claseFilaTurno, nombreCliente, nombreServicios } from "../../utils/turno";

interface FormFiltros {
  busqueda: string;
  estado: EstadoTurno | "todos";
  desde: string;
  hasta: string;
}

const FILTROS_VACIOS: FormFiltros = { busqueda: "", estado: "todos", desde: "", hasta: "" };
const TURNOS_POR_PAGINA = 15;

const OPCIONES_ESTADO = [
  { value: "todos", label: "Todos" },
  ...(Object.keys(ETIQUETA_ESTADO) as EstadoTurno[]).map((e) => ({
    value: e,
    label: ETIQUETA_ESTADO[e],
  })),
];

export function TurnosAdminPage() {
  // "form" es lo que se está tipeando; "aplicados" es lo que realmente consulta
  // al backend (se actualiza al buscar, así no se dispara una request por tecla).
  const [form, setForm] = useState<FormFiltros>(FILTROS_VACIOS);
  const [aplicados, setAplicados] = useState<FormFiltros>(FILTROS_VACIOS);
  const [pagina, setPagina] = useState(1);

  const mostrarToast = useToastStore((s) => s.mostrarToast);
  const gestion = useGestionTurnoAdmin();

  const filtros: FiltrosTurnosAdmin = {
    busqueda: aplicados.busqueda.trim() || undefined,
    estado: aplicados.estado === "todos" ? undefined : aplicados.estado,
    desde: aplicados.desde || undefined,
    hasta: aplicados.hasta || undefined,
    pagina,
    limite: TURNOS_POR_PAGINA,
  };

  const { data, isLoading, isFetching, isError } = useTurnosAdmin(filtros);

  const turnos = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / TURNOS_POR_PAGINA));

  function handleBuscar(e: FormEvent) {
    e.preventDefault();
    if (form.desde && form.hasta && form.desde > form.hasta) {
      mostrarToast("error", "La fecha \"desde\" no puede ser posterior a \"hasta\"");
      return;
    }
    setAplicados(form);
    setPagina(1);
  }

  function handleLimpiar() {
    setForm(FILTROS_VACIOS);
    setAplicados(FILTROS_VACIOS);
    setPagina(1);
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="mb-6 font-serif text-3xl text-espresso">Gestión de turnos</h1>

      <form onSubmit={handleBuscar} className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          label="Cliente"
          placeholder="Nombre o teléfono"
          value={form.busqueda}
          onChange={(e) => setForm({ ...form, busqueda: e.target.value })}
        />
        <Select
          label="Estado"
          options={OPCIONES_ESTADO}
          value={form.estado}
          onChange={(e) => setForm({ ...form, estado: e.target.value as FormFiltros["estado"] })}
        />
        <Input
          label="Desde"
          type="date"
          value={form.desde}
          onChange={(e) => setForm({ ...form, desde: e.target.value })}
        />
        <Input
          label="Hasta"
          type="date"
          value={form.hasta}
          onChange={(e) => setForm({ ...form, hasta: e.target.value })}
        />
        <div className="flex gap-3 sm:col-span-2 lg:col-span-4">
          <Button type="submit">Buscar</Button>
          <Button type="button" variant="subtle" onClick={handleLimpiar}>
            Limpiar
          </Button>
        </div>
      </form>

      {isLoading ? (
        <p className="py-10 text-center text-sm text-espresso/50">Cargando turnos...</p>
      ) : isError ? (
        <p className="py-10 text-center text-sm text-rosewood">No se pudieron cargar los turnos.</p>
      ) : (
        <>
          <p className="mb-3 text-sm text-espresso/60">
            {total} {total === 1 ? "turno" : "turnos"}
            {isFetching && " · actualizando..."}
          </p>

          <Table<Turno>
            data={turnos}
            keyExtractor={(t) => t.id}
            rowClassName={claseFilaTurno}
            emptyMessage="No hay turnos que coincidan con la búsqueda."
            columns={[
              { header: "Fecha", render: (t) => formatearFechaHora(t.fecha_hora_inicio).fecha },
              { header: "Hora", render: (t) => formatearFechaHora(t.fecha_hora_inicio).hora },
              { header: "Cliente", render: (t) => nombreCliente(t) },
              { header: "Teléfono", render: (t) => t.usuario?.telefono ?? "—" },
              { header: "Servicios", render: (t) => nombreServicios(t) },
              { header: "Estado", render: (t) => <EstadoBadge estado={t.estado} /> },
              {
                header: "Acciones",
                render: (t) => <AccionesTurnoAdmin turno={t} gestion={gestion} />,
              },
            ]}
          />

          <div className="mt-4 flex items-center justify-between">
            <Button
              variant="subtle"
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
              disabled={pagina <= 1}
            >
              Anterior
            </Button>
            <span className="text-sm text-espresso/60">
              Página {pagina} de {totalPaginas}
            </span>
            <Button
              variant="subtle"
              onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
              disabled={pagina >= totalPaginas}
            >
              Siguiente
            </Button>
          </div>
        </>
      )}

      <ModalesGestionTurno gestion={gestion} />
    </div>
  );
}
