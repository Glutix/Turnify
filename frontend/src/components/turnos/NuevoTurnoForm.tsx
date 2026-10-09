import { useMemo, useState, type FormEvent } from "react";
import { Button } from "../common/Button";
import { Input } from "../common/Input";
import { useServicios } from "../../hooks/useServicios";
import { useUsuarios } from "../../hooks/useUsuarios";
import { useDiasReservables, useDisponibilidad } from "../../hooks/useTurnos";
import { SelectorFecha } from "./SelectorFecha";
import { SelectorHorario } from "./SelectorHorario";
import {
  MAX_DURACION_TURNO_MINUTOS,
  MENSAJE_DURACION_MAXIMA,
  formatearDuracion,
  formatearPrecio,
  precioANumero,
} from "../../utils/servicio";
import type { ReservarTurnoAdminPayload } from "../../types/turno";

// CU-41 / RF33: la admin carga un turno a mano (reserva por WhatsApp o en
// persona). No pasa por OTP: lo carga ella. La disponibilidad se valida igual
// en el backend al confirmar.

const INPUT_CLASS =
  "w-full rounded-xl border border-espresso/15 bg-superficie px-4 py-2.5 text-sm text-espresso focus:border-rosewood focus:outline-none focus:ring-2 focus:ring-rosewood/20";
const MAX_DIGITOS_TELEFONO = 10;
const MAX_CLIENTES_VISIBLES = 6;

type Modo = "existente" | "nueva";

interface Props {
  onSubmit: (payload: ReservarTurnoAdminPayload) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  errorMessage?: string;
  fechaInicial?: string;
}

export function NuevoTurnoForm({
  onSubmit,
  onCancel,
  isSubmitting = false,
  errorMessage = "",
  fechaInicial,
}: Props) {
  const [modo, setModo] = useState<Modo>("existente");
  const [busqueda, setBusqueda] = useState("");
  const [usuarioId, setUsuarioId] = useState<number | null>(null);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [serviciosSel, setServiciosSel] = useState<number[]>([]);
  // Arranca en fechaInicial (el día que la admin está mirando en la agenda) solo
  // si tiene atención; si no, queda sin elegir y se elige entre los días con atención.
  const [fecha, setFecha] = useState<string | null>(fechaInicial ?? null);
  const [hora, setHora] = useState<string | null>(null);
  const [error, setError] = useState("");

  const { data: servicios = [], isLoading: cargandoServicios } = useServicios();
  const { data: clientes = [] } = useUsuarios({ rol: "cliente" });
  const { data: dias = [], isLoading: cargandoDias } = useDiasReservables();
  const fechaValida = fecha !== null && dias.includes(fecha) ? fecha : null;
  const { data: slots = [], isLoading: cargandoSlots } = useDisponibilidad(
    serviciosSel,
    fechaValida ?? "",
  );

  const serviciosActivos = servicios.filter((s) => s.activo);
  const elegidos = serviciosActivos.filter((s) => serviciosSel.includes(s.id));
  const duracionTotal = elegidos.reduce((acc, s) => acc + s.duracion_minutos, 0);
  const precioTotal = elegidos.reduce((acc, s) => acc + precioANumero(s.precio), 0);

  const clientesFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    const lista = texto
      ? clientes.filter((c) =>
          `${c.nombre} ${c.apellido ?? ""} ${c.telefono ?? ""} ${c.email ?? ""}`
            .toLowerCase()
            .includes(texto),
        )
      : clientes;
    return lista.slice(0, MAX_CLIENTES_VISIBLES);
  }, [clientes, busqueda]);

  function toggleServicio(id: number) {
    setServiciosSel((actual) =>
      actual.includes(id) ? actual.filter((s) => s !== id) : [...actual, id],
    );
    setHora(null); // la duración cambió: el horario elegido puede dejar de valer
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (modo === "existente" && usuarioId === null) {
      setError("Elegí una clienta de la lista");
      return;
    }
    if (modo === "nueva") {
      if (!nombre.trim()) {
        setError("Ingresá el nombre de la clienta");
        return;
      }
      if (telefono.length !== MAX_DIGITOS_TELEFONO) {
        setError("Ingresá un teléfono de 10 dígitos (característica + número)");
        return;
      }
    }
    if (serviciosSel.length === 0) {
      setError("Elegí al menos un servicio");
      return;
    }
    if (duracionTotal > MAX_DURACION_TURNO_MINUTOS) {
      setError(MENSAJE_DURACION_MAXIMA);
      return;
    }
    if (!fechaValida) {
      setError("Elegí un día con atención");
      return;
    }
    if (!hora) {
      setError("Elegí un horario disponible");
      return;
    }

    setError("");
    const base = { servicios: serviciosSel, fecha: fechaValida, hora_inicio: hora };
    onSubmit(
      modo === "existente"
        ? { ...base, usuario_id: usuarioId as number }
        : { ...base, nombre: nombre.trim(), telefono },
    );
  }

  const mensaje = error || errorMessage;
  const mensajeHorario =
    serviciosSel.length === 0
      ? "Elegí servicios para ver los horarios."
      : !fechaValida
        ? "Elegí un día para ver los horarios."
        : undefined;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Clienta */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-2 text-sm">
          {(["existente", "nueva"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setModo(m);
                setError("");
              }}
              className={`rounded-full border px-4 py-1.5 transition ${
                modo === m
                  ? "border-rosewood bg-rosewood/5 text-rosewood"
                  : "border-espresso/15 text-espresso/60 hover:border-rosewood/30"
              }`}
            >
              {m === "existente" ? "Clienta existente" : "Clienta nueva"}
            </button>
          ))}
        </div>

        {modo === "existente" ? (
          <div className="flex flex-col gap-2">
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre, teléfono o email"
              className={INPUT_CLASS}
            />
            <div className="flex flex-col gap-1.5">
              {clientesFiltrados.length === 0 && (
                <p className="py-2 text-center text-xs text-espresso/50">
                  No hay clientas que coincidan.
                </p>
              )}
              {clientesFiltrados.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setUsuarioId(c.id)}
                  className={`flex items-center justify-between rounded-xl border px-4 py-2 text-left text-sm transition ${
                    usuarioId === c.id
                      ? "border-rosewood bg-rosewood/5"
                      : "border-espresso/10 hover:border-rosewood/30"
                  }`}
                >
                  <span className="text-espresso">
                    {c.nombre} {c.apellido ?? ""}
                  </span>
                  <span className="text-xs text-espresso/50">{c.telefono ?? "sin teléfono"}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <Input
              label="Nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="María"
            />
            <Input
              label="Teléfono"
              type="tel"
              inputMode="numeric"
              prefix="+54"
              placeholder="3644401020"
              value={telefono}
              onChange={(e) =>
                setTelefono(e.target.value.replace(/\D/g, "").slice(0, MAX_DIGITOS_TELEFONO))
              }
            />
            <p className="-mt-2 text-xs text-espresso/50">
              Si ya existe una clienta con ese teléfono, se usa su perfil.
            </p>
          </div>
        )}
      </div>

      {/* Servicios */}
      <div>
        <p className="mb-2 text-sm font-medium text-espresso/70">Servicios</p>
        {cargandoServicios && <p className="text-xs text-espresso/50">Cargando servicios...</p>}
        <div className="flex max-h-44 flex-col gap-1.5 overflow-y-auto">
          {serviciosActivos.map((s) => {
            const elegido = serviciosSel.includes(s.id);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleServicio(s.id)}
                className={`flex items-center justify-between rounded-xl border px-4 py-2 text-left text-sm transition ${
                  elegido
                    ? "border-rosewood bg-rosewood/5"
                    : "border-espresso/10 hover:border-rosewood/30"
                }`}
              >
                <span className="text-espresso">
                  {s.nombre}{" "}
                  <span className="text-xs text-espresso/50">
                    · {formatearDuracion(s.duracion_minutos)}
                  </span>
                </span>
                <span className="font-semibold text-rosewood">{formatearPrecio(s.precio)}</span>
              </button>
            );
          })}
        </div>
        {duracionTotal > MAX_DURACION_TURNO_MINUTOS && (
          <p className="mt-2 text-xs text-rosewood">{MENSAJE_DURACION_MAXIMA}</p>
        )}
        {elegidos.length > 0 && (
          <p className="mt-2 text-xs text-espresso/60">
            {formatearDuracion(duracionTotal)} —{" "}
            {precioTotal.toLocaleString("es-AR", { style: "currency", currency: "ARS" })}
          </p>
        )}
      </div>

      {/* Fecha y horario */}
      <div>
        <p className="mb-2 text-sm font-medium text-espresso/70">Fecha</p>
        <SelectorFecha
          diasHabilitados={dias}
          value={fechaValida}
          isLoading={cargandoDias}
          onChange={(f) => {
            setFecha(f);
            setHora(null);
            setError("");
          }}
        />
        <div className="mt-3">
          <SelectorHorario
            slots={slots}
            value={hora}
            isLoading={cargandoSlots}
            mensajeInactivo={mensajeHorario}
            onChange={(h) => {
              setHora(h);
              setError("");
            }}
          />
        </div>
      </div>

      {mensaje && <p className="text-sm text-rosewood">{mensaje}</p>}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="subtle" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : "Crear turno"}
        </Button>
      </div>
    </form>
  );
}
