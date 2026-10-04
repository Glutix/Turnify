// frontend\src\pages\public\TurnosPage.tsx
import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { isAxiosError } from "axios";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { IconPhone, IconUser, IconClock, IconArrowLeft } from "../../components/common/Icons";
import { CodeStep } from "../../components/auth/CodeStep";
import { solicitarCodigo } from "../../api/auth";
import { useServicios } from "../../hooks/useServicios";
import { useDisponibilidad, useReservarTurno } from "../../hooks/useTurnos";
import { formatearDuracion, formatearPrecio, precioANumero } from "../../utils/servicio";
import type { Servicio } from "../../types/servicio";
import type { SlotDisponible, Turno } from "../../types/turno";

type Paso = "servicios" | "horario" | "datos" | "otp" | "exito";
type EstadoOtp = "idle" | "verificando" | "correcto" | "incorrecto";

const LARGO_CODIGO = 6;
const COOLDOWN_SEGUNDOS = 10; // mismo ttl que el ThrottlerGuard de /auth/solicitar-codigo
const MAX_DIGITS_TELEFONO = 10;

function hoyISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatearTelefono(valorCrudo: string): string {
  const soloDigitos = valorCrudo.replace(/\D/g, "").slice(0, MAX_DIGITS_TELEFONO);
  if (soloDigitos.length <= 4) return soloDigitos;
  return `${soloDigitos.slice(0, 4)}-${soloDigitos.slice(4)}`;
}

export function TurnosPage() {
  const [paso, setPaso] = useState<Paso>("servicios");

  // Paso 1: servicios
  const { data: servicios = [], isLoading: cargandoServicios } = useServicios();
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState<number[]>([]);

  // Paso 2: fecha y horario
  const [fecha, setFecha] = useState(hoyISO());
  const [horaSeleccionada, setHoraSeleccionada] = useState<string | null>(null);
  const [mensajeHorario, setMensajeHorario] = useState("");
  const { data: slots = [], isLoading: cargandoSlots } = useDisponibilidad(
    serviciosSeleccionados,
    paso === "horario" ? fecha : "",
  );

  // Paso 3: datos de contacto
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [enviandoCodigo, setEnviandoCodigo] = useState(false);
  const [errorDatos, setErrorDatos] = useState("");

  // Paso 4: OTP
  const [codigo, setCodigo] = useState("");
  const [estadoOtp, setEstadoOtp] = useState<EstadoOtp>("idle");
  const [errorOtp, setErrorOtp] = useState("");
  const [intentosRestantes, setIntentosRestantes] = useState<number | null>(null);
  const [codigoBloqueado, setCodigoBloqueado] = useState(false);
  const [resetKeyOtp, setResetKeyOtp] = useState(0);
  const [cooldownReenvio, setCooldownReenvio] = useState(0);

  const [turnoConfirmado, setTurnoConfirmado] = useState<Turno | null>(null);

  const reservarTurno = useReservarTurno();

  // Recibe el código como parámetro explícito (no lo lee de estado) a
  // propósito: se llama inmediatamente después de setCodigo(valor) en
  // manejarCambioCodigo, más abajo, y el estado todavía no se actualizó en
  // ese mismo tick — leer `codigo` del closure ahí daría el valor viejo.
  const confirmarReserva = useCallback(
    (codigoIngresado: string) => {
      if (!horaSeleccionada) return;
      setEstadoOtp("verificando");
      reservarTurno.mutate(
        {
          servicios: serviciosSeleccionados,
          fecha,
          hora_inicio: horaSeleccionada,
          nombre,
          telefono,
          codigo: codigoIngresado,
        },
        {
          onSuccess: (turno) => {
            setEstadoOtp("correcto");
            window.setTimeout(() => {
              setTurnoConfirmado(turno);
              setPaso("exito");
            }, 1400);
          },
          onError: (error) => {
            // 409: el horario se ocupó justo en este momento (carrera entre
            // consultar disponibilidad y confirmar) — no es un error de OTP.
            if (isAxiosError(error) && error.response?.status === 409) {
              setEstadoOtp("idle");
              setCodigo("");
              setMensajeHorario(
                error.response.data?.message ?? "Ese horario ya no está disponible, elegí otro.",
              );
              setPaso("horario");
              return;
            }

            const data = isAxiosError(error) ? error.response?.data : undefined;
            const intentos =
              typeof data?.intentosRestantes === "number" ? data.intentosRestantes : null;
            setIntentosRestantes(intentos);
            setCodigoBloqueado(intentos === 0);
            setErrorOtp(data?.message ?? "No se pudo validar el código");
            setEstadoOtp("incorrecto");
            window.setTimeout(() => {
              setEstadoOtp("idle");
              setCodigo("");
              setResetKeyOtp((k) => k + 1);
            }, 900);
          },
        },
      );
    },
    [horaSeleccionada, serviciosSeleccionados, fecha, nombre, telefono, reservarTurno],
  );

  // Dispara el envío automático al completar los 6 dígitos. Vive en el
  // handler de onChange (un evento real del usuario) en vez de en un
  // useEffect reaccionando a que `codigo` cambió — evita el lint
  // react-hooks/set-state-in-effect (llamar algo que hace setState de forma
  // síncrona dentro de un efecto) y de paso evita el problema del closure
  // desactualizado que tendría un efecto leyendo `codigo` del estado.
  function manejarCambioCodigo(valor: string) {
    setCodigo(valor);
    if (valor.length === LARGO_CODIGO && estadoOtp === "idle" && !codigoBloqueado) {
      confirmarReserva(valor);
    }
  }

  // Countdown del cooldown de reenvío de OTP. Este sí es un caso legítimo de
  // useEffect (sincroniza con el timer del navegador, un sistema externo).
  useEffect(() => {
    if (cooldownReenvio <= 0) return;
    const id = window.setInterval(() => setCooldownReenvio((c) => Math.max(c - 1, 0)), 1000);
    return () => clearInterval(id);
  }, [cooldownReenvio]);

  const serviciosElegidos = servicios.filter((s) => serviciosSeleccionados.includes(s.id));
  const duracionTotal = serviciosElegidos.reduce((acc, s) => acc + s.duracion_minutos, 0);
  const precioTotal = serviciosElegidos.reduce((acc, s) => acc + precioANumero(s.precio), 0);

  function toggleServicio(servicio: Servicio) {
    setServiciosSeleccionados((actual) =>
      actual.includes(servicio.id)
        ? actual.filter((id) => id !== servicio.id)
        : [...actual, servicio.id],
    );
  }

  function irAHorario() {
    setHoraSeleccionada(null);
    setMensajeHorario("");
    setPaso("horario");
  }

  function elegirSlot(slot: SlotDisponible) {
    setHoraSeleccionada(slot.hora_inicio);
    setPaso("datos");
  }

  async function handleSubmitDatos(e: FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) {
      setErrorDatos("Ingresá tu nombre");
      return;
    }
    if (telefono.replace(/\D/g, "").length !== MAX_DIGITS_TELEFONO) {
      setErrorDatos("Ingresá un teléfono válido");
      return;
    }
    setErrorDatos("");
    setEnviandoCodigo(true);
    try {
      await solicitarCodigo(telefono);
      setCooldownReenvio(COOLDOWN_SEGUNDOS);
      setCodigo("");
      setEstadoOtp("idle");
      setCodigoBloqueado(false);
      setIntentosRestantes(null);
      setPaso("otp");
    } catch (error) {
      setErrorDatos(
        isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : "No se pudo enviar el código. Probá de nuevo en unos segundos.",
      );
    } finally {
      setEnviandoCodigo(false);
    }
  }

  async function handleReenviar() {
    if (cooldownReenvio > 0) return;
    try {
      await solicitarCodigo(telefono);
      setCooldownReenvio(COOLDOWN_SEGUNDOS);
      setCodigo("");
      setResetKeyOtp((k) => k + 1);
      setCodigoBloqueado(false);
      setErrorOtp("");
      setIntentosRestantes(null);
    } catch {
      setErrorOtp("No se pudo reenviar el código. Probá de nuevo en unos segundos.");
    }
  }

  // ============================================================
  // Render
  // ============================================================

  if (paso === "exito" && turnoConfirmado) {
    return (
      <div className="mx-auto max-w-md px-6 py-20 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-oro text-superficie">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path
              d="M20 6 9 17l-5-5"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h1 className="font-serif text-3xl text-espresso">¡Turno confirmado!</h1>
        <p className="mt-3 text-sm text-espresso/70">
          Te esperamos el <strong>{fecha}</strong> a las <strong>{horaSeleccionada}</strong>.
        </p>
        <p className="mt-1 text-xs text-espresso/50">
          Guardá tu teléfono — lo vas a necesitar para consultar, cancelar o reprogramar este turno.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <div className="mb-10 text-center">
        <h1 className="font-serif text-4xl text-espresso">Reservar turno</h1>
        <p className="mt-3 text-sm text-espresso/60">
          Elegí tus servicios, un horario disponible, y confirmá con tu teléfono.
        </p>
      </div>

      {/* Paso 1: servicios */}
      {paso === "servicios" && (
        <div className="flex flex-col gap-4">
          {cargandoServicios && (
            <p className="py-10 text-center text-sm text-espresso/50">Cargando servicios...</p>
          )}
          {!cargandoServicios && servicios.filter((s) => s.activo).length === 0 && (
            <p className="py-10 text-center text-sm text-espresso/50">
              No hay servicios disponibles por el momento.
            </p>
          )}
          <div className="flex flex-col gap-3">
            {servicios
              .filter((s) => s.activo)
              .map((servicio) => {
                const elegido = serviciosSeleccionados.includes(servicio.id);
                return (
                  <button
                    key={servicio.id}
                    type="button"
                    onClick={() => toggleServicio(servicio)}
                    className={`flex items-center justify-between rounded-xl border px-5 py-4 text-left transition ${
                      elegido
                        ? "border-rosewood bg-rosewood/5"
                        : "border-espresso/10 hover:border-rosewood/30"
                    }`}
                  >
                    <div>
                      <p className="font-serif text-lg text-espresso">{servicio.nombre}</p>
                      <p className="text-xs text-espresso/50">
                        {formatearDuracion(servicio.duracion_minutos)}
                      </p>
                    </div>
                    <span className="font-semibold text-rosewood">
                      {formatearPrecio(servicio.precio)}
                    </span>
                  </button>
                );
              })}
          </div>

          {serviciosSeleccionados.length > 0 && (
            <div className="sticky bottom-4 mt-4 flex items-center justify-between rounded-xl border border-espresso/10 bg-superficie p-4 shadow-md">
              <div className="text-sm text-espresso/70">
                {serviciosSeleccionados.length} servicio(s) — {formatearDuracion(duracionTotal)} —{" "}
                <span className="font-semibold text-rosewood">
                  {precioTotal.toLocaleString("es-AR", { style: "currency", currency: "ARS" })}
                </span>
              </div>
              <Button onClick={irAHorario}>Elegir horario</Button>
            </div>
          )}
        </div>
      )}

      {/* Paso 2: fecha y horario */}
      {paso === "horario" && (
        <div className="flex flex-col gap-4">
          <button
            type="button"
            onClick={() => setPaso("servicios")}
            className="flex w-fit items-center gap-1.5 text-xs uppercase tracking-widest text-espresso/50 hover:text-rosewood"
          >
            <IconArrowLeft size={16} /> Volver
          </button>

          <div>
            <label className="mb-1 block text-sm font-medium text-espresso/70">Fecha</label>
            <input
              type="date"
              min={hoyISO()}
              value={fecha}
              onChange={(e) => {
                setFecha(e.target.value);
                setHoraSeleccionada(null);
                setMensajeHorario("");
              }}
              className="w-full rounded-xl border border-espresso/15 bg-superficie px-4 py-2.5 text-sm text-espresso focus:border-rosewood focus:outline-none focus:ring-2 focus:ring-rosewood/20"
            />
          </div>

          {mensajeHorario && <p className="text-sm text-rosewood">{mensajeHorario}</p>}

          {cargandoSlots && (
            <p className="py-6 text-center text-sm text-espresso/50">Buscando horarios...</p>
          )}

          {!cargandoSlots && slots.length === 0 && (
            <p className="py-6 text-center text-sm text-espresso/50">
              No hay horarios disponibles para esta fecha — probá con otro día.
            </p>
          )}

          {!cargandoSlots && slots.length > 0 && (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {slots.map((slot) => (
                <button
                  key={slot.hora_inicio}
                  type="button"
                  onClick={() => elegirSlot(slot)}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-espresso/15 py-2.5 text-sm text-espresso transition hover:border-rosewood hover:text-rosewood"
                >
                  <IconClock size={14} />
                  {slot.hora_inicio}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Paso 3: resumen + datos de contacto */}
      {paso === "datos" && (
        <div className="flex flex-col gap-6">
          <button
            type="button"
            onClick={() => setPaso("horario")}
            className="flex w-fit items-center gap-1.5 text-xs uppercase tracking-widest text-espresso/50 hover:text-rosewood"
          >
            <IconArrowLeft size={16} /> Volver
          </button>

          <div className="rounded-xl border border-espresso/10 bg-espresso/5 p-4 text-sm">
            <p className="font-medium text-espresso">
              {fecha} a las {horaSeleccionada}
            </p>
            <p className="mt-1 text-espresso/60">
              {serviciosElegidos.map((s) => s.nombre).join(", ")}
            </p>
            <p className="mt-2 flex justify-between text-espresso/70">
              <span>{formatearDuracion(duracionTotal)}</span>
              <span className="font-semibold text-rosewood">
                {precioTotal.toLocaleString("es-AR", { style: "currency", currency: "ARS" })}
              </span>
            </p>
          </div>

          <form onSubmit={handleSubmitDatos} className="flex flex-col gap-5">
            <Input
              label="Nombre"
              icon={<IconUser size={18} />}
              value={nombre}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setNombre(e.target.value)}
              placeholder="María"
              disabled={enviandoCodigo}
              required
            />
            <Input
              label="Teléfono"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="3644-401020"
              prefix="+54"
              icon={<IconPhone size={18} />}
              value={telefono}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setTelefono(formatearTelefono(e.target.value))
              }
              maxLength={11}
              disabled={enviandoCodigo}
              required
            />
            {errorDatos && <p className="text-sm text-rosewood">{errorDatos}</p>}
            <Button type="submit" fullWidth disabled={enviandoCodigo}>
              {enviandoCodigo ? "Enviando código..." : "Confirmar y recibir código"}
            </Button>
          </form>
        </div>
      )}

      {/* Paso 4: OTP (reutiliza CodeStep de auth tal cual) */}
      {paso === "otp" && (
        <CodeStep
          telefono={telefono}
          codigo={codigo}
          onCodigoChange={manejarCambioCodigo}
          onVolver={() => setPaso("datos")}
          onReenviar={handleReenviar}
          cooldownReenvio={cooldownReenvio}
          intentosRestantes={intentosRestantes}
          codigoBloqueado={codigoBloqueado}
          resetKey={resetKeyOtp}
          estado={estadoOtp}
          error={errorOtp}
        />
      )}
    </div>
  );
}