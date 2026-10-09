//Turnify\frontend\src\pages\admin\AgendaPage.tsx
import { useState } from "react";
import { Table } from "../../components/common/Table";
import { Button } from "../../components/common/Button";
import { Modal } from "../../components/common/Modal";
import { useToastStore } from "../../stores/toastStore";
import { EstadoBadge } from "../../components/turnos/EstadoBadge";
import {
  AccionesTurnoAdmin,
  ModalesGestionTurno,
} from "../../components/turnos/GestionTurnoAdmin";
import { NuevoTurnoForm } from "../../components/turnos/NuevoTurnoForm";
import { extraerMensajeError } from "../../utils/extraerMensajeError";
import { useAgenda, useReservarTurnoAdmin } from "../../hooks/useTurnos";
import { useGestionTurnoAdmin } from "../../hooks/useGestionTurnoAdmin";
import { formatearFechaHora, type ReservarTurnoAdminPayload, type Turno } from "../../types/turno";
import { hoyISO } from "../../utils/fechas";
import { claseFilaTurno, nombreCliente, nombreServicios } from "../../utils/turno";

export function AgendaPage() {
  const [fecha, setFecha] = useState(hoyISO());
  const mostrarToast = useToastStore((s) => s.mostrarToast);

  const gestion = useGestionTurnoAdmin();

  const [nuevoTurnoAbierto, setNuevoTurnoAbierto] = useState(false);
  const [errorNuevoTurno, setErrorNuevoTurno] = useState("");

  const { data: turnos = [], isLoading } = useAgenda(fecha);
  const reservarTurnoAdmin = useReservarTurnoAdmin();

  function handleSubmitNuevoTurno(payload: ReservarTurnoAdminPayload) {
    setErrorNuevoTurno("");
    reservarTurnoAdmin.mutate(payload, {
      onSuccess: (turno) => {
        setNuevoTurnoAbierto(false);
        // La agenda salta al día del turno nuevo para que se vea enseguida.
        setFecha(turno.fecha_hora_inicio.slice(0, 10));
        mostrarToast("creacion", "Turno creado correctamente");
      },
      // 409 (horario ocupado) y demás errores del backend se muestran en el form.
      onError: (error) =>
        setErrorNuevoTurno(extraerMensajeError(error, "No se pudo crear el turno")),
    });
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="mb-6 font-serif text-3xl text-espresso">Agenda</h1>

      <div className="mb-6 flex items-end gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-espresso/70">Día</label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="rounded-xl border border-espresso/15 bg-superficie px-4 py-2.5 text-sm text-espresso focus:border-rosewood focus:outline-none focus:ring-2 focus:ring-rosewood/20"
          />
        </div>
        <Button variant="subtle" onClick={() => setFecha(hoyISO())}>
          Hoy
        </Button>
        <div className="ml-auto">
          <Button
            onClick={() => {
              setErrorNuevoTurno("");
              setNuevoTurnoAbierto(true);
            }}
          >
            Nuevo turno
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="py-10 text-center text-sm text-espresso/50">Cargando agenda...</p>
      ) : (
        <Table<Turno>
          data={turnos}
          keyExtractor={(t) => t.id}
          rowClassName={claseFilaTurno}
          emptyMessage="No hay turnos para este día."
          columns={[
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
      )}

      <Modal
        isOpen={nuevoTurnoAbierto}
        onClose={() => setNuevoTurnoAbierto(false)}
        title="Nuevo turno"
        size="lg"
      >
        <NuevoTurnoForm
          fechaInicial={fecha}
          onSubmit={handleSubmitNuevoTurno}
          onCancel={() => setNuevoTurnoAbierto(false)}
          isSubmitting={reservarTurnoAdmin.isPending}
          errorMessage={errorNuevoTurno}
        />
      </Modal>

      <ModalesGestionTurno gestion={gestion} />
    </div>
  );
}
