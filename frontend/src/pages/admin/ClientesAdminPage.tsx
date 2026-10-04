//Turnify\frontend\src\pages\admin\ClientesAdminPage.tsx
import { useState, type FormEvent } from "react";
import { Table } from "../../components/common/Table";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { Modal } from "../../components/common/Modal";
import { useUsuarios } from "../../hooks/useUsuarios";
import { useHistorialPorUsuario } from "../../hooks/useTurnos";
import { nombreCompleto, type Usuario } from "../../types/usuario";
import { ETIQUETA_ESTADO, formatearFechaHora, type Turno } from "../../types/turno";
import { formatearPrecio, precioANumero } from "../../utils/servicio";

function nombreServicios(turno: Turno): string {
  if (!turno.turno_servicios || turno.turno_servicios.length === 0) return "—";
  return turno.turno_servicios.map((ts) => ts.servicio.nombre).join(", ");
}

function totalTurno(turno: Turno): string {
  const total = (turno.turno_servicios ?? []).reduce(
    (acc, ts) => acc + precioANumero(ts.precio_unitario),
    0,
  );
  return formatearPrecio(String(total));
}

export function ClientesAdminPage() {
  const [busquedaInput, setBusquedaInput] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Usuario | null>(null);

  const { data: clientes = [], isLoading, isError } = useUsuarios({
    rol: "cliente",
    busqueda: busqueda.trim() || undefined,
  });
  const { data: historial = [], isLoading: cargandoHistorial, isError: errorHistorial } =
    useHistorialPorUsuario(clienteSeleccionado?.id ?? null);

  function handleBuscar(e: FormEvent) {
    e.preventDefault();
    setBusqueda(busquedaInput);
  }

  function handleLimpiar() {
    setBusquedaInput("");
    setBusqueda("");
  }

  const atendidos = historial.filter((t) => t.estado === "atendido").length;
  const cancelados = historial.filter((t) => t.estado === "cancelado").length;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="mb-6 font-serif text-3xl text-espresso">Clientes</h1>

      <form onSubmit={handleBuscar} className="mb-6 flex flex-wrap items-end gap-3">
        <div className="min-w-64 flex-1">
          <Input
            label="Buscar clienta"
            placeholder="Nombre o teléfono"
            value={busquedaInput}
            onChange={(e) => setBusquedaInput(e.target.value)}
          />
        </div>
        <Button type="submit">Buscar</Button>
        <Button type="button" variant="subtle" onClick={handleLimpiar}>
          Limpiar
        </Button>
      </form>

      {isLoading ? (
        <p className="py-10 text-center text-sm text-espresso/50">Cargando clientes...</p>
      ) : isError ? (
        <p className="py-10 text-center text-sm text-rosewood">
          No se pudieron cargar los clientes.
        </p>
      ) : (
        <Table<Usuario>
          data={clientes}
          keyExtractor={(c) => c.id}
          emptyMessage="No hay clientes que coincidan con la búsqueda."
          columns={[
            { header: "Nombre", render: (c) => nombreCompleto(c) },
            { header: "Teléfono", render: (c) => c.telefono ?? "—" },
            { header: "Email", render: (c) => c.email ?? "—" },
            {
              header: "Alta",
              render: (c) => new Date(c.fecha_alta).toLocaleDateString("es-AR"),
            },
            {
              header: "Acciones",
              render: (c) => (
                <Button variant="link" onClick={() => setClienteSeleccionado(c)}>
                  Ver historial
                </Button>
              ),
            },
          ]}
        />
      )}

      <Modal
        isOpen={clienteSeleccionado !== null}
        onClose={() => setClienteSeleccionado(null)}
        title={clienteSeleccionado ? `Historial de ${nombreCompleto(clienteSeleccionado)}` : "Historial"}
      >
        {cargandoHistorial ? (
          <p className="py-6 text-center text-sm text-espresso/50">Cargando historial...</p>
        ) : errorHistorial ? (
          <p className="py-6 text-center text-sm text-rosewood">
            No se pudo cargar el historial.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-espresso/70">
              {historial.length} {historial.length === 1 ? "turno" : "turnos"} · {atendidos}{" "}
              {atendidos === 1 ? "atendido" : "atendidos"} · {cancelados}{" "}
              {cancelados === 1 ? "cancelado" : "cancelados"}
            </p>
            <Table<Turno>
              data={historial}
              keyExtractor={(t) => t.id}
              rowClassName={(t) =>
                t.estado === "cancelado" || t.estado === "reprogramado" ? "opacity-50" : ""
              }
              emptyMessage="Esta clienta todavía no tiene turnos."
              columns={[
                { header: "Fecha", render: (t) => formatearFechaHora(t.fecha_hora_inicio).fecha },
                { header: "Hora", render: (t) => formatearFechaHora(t.fecha_hora_inicio).hora },
                { header: "Servicios", render: (t) => nombreServicios(t) },
                { header: "Total", render: (t) => totalTurno(t) },
                { header: "Estado", render: (t) => ETIQUETA_ESTADO[t.estado] },
              ]}
            />
            <p className="text-xs text-espresso/50">
              El historial de compras se suma cuando esté listo el módulo de pedidos.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
