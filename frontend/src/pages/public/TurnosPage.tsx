// frontend\src\pages\public\TurnosPage.tsx
import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { isAxiosError } from "axios";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { IconPhone, IconUser, IconArrowLeft } from "../../components/common/Icons";
import { CodeStep } from "../../components/auth/CodeStep";
import { CatalogoServicios } from "../../components/servicios/CatalogoServicios";
import { ResumenTurno } from "../../components/turnos/ResumenTurno";
import { SelectorFecha } from "../../components/turnos/SelectorFecha";
import { SelectorHorario } from "../../components/turnos/SelectorHorario";
import { solicitarCodigo } from "../../api/auth";
import { useServicios } from "../../hooks/useServicios";
import {
  useDiasReservables,
  useDisponibilidad,
  useReservarTurno,
  useReservarTurnoAutenticado,
} from "../../hooks/useTurnos";
import { useAuthStore } from "../../stores/authStore";
import { extraerIntentosRestantes, extraerMensajeError } from "../../utils/extraerMensajeError";
import { MAX_DURACION_TURNO_MINUTOS, MENSAJE_DURACION_MAXIMA } from "../../utils/servicio";
import { formatearDuracion, precioANumero } from "../../utils/servicio";
import type { Servicio } from "../../types/servicio";
import type { Turno } from "../../types/turno";

type Paso = "servicios" | "horario" | "datos" | "otp" | "exito";
type EstadoOtp = "idle" | "verificando" | "correcto" | "incorrecto";

const LARGO_CODIGO = 6;
const COOLDOWN_SEGUNDOS = 10; // mismo ttl que el ThrottlerGuard de /auth/solicitar-codigo
const MAX_DIGITS_TELEFONO = 10;

function formatearTelefono(valorCrudo: string): string {
  const soloDigitos = valorCrudo.replace(/\D/g, "").slice(0, MAX_DIGITS_TELEFONO);
  if (soloDigitos.length <= 4) return soloDigitos;
  return `${soloDigitos.slice(0, 4)}-${soloDigitos.slice(4)}`;
}

// El teléfono guardado del usuario es "+5493644401020"; /auth/solicitar-codigo
// espera "3644-401020" (característica + número, sin +54 ni 9).
function telefonoParaOtp(telefonoGuardado: string): string {
  let digitos = telefonoGuardado.replace(/\D/g, "");
  if (digitos.startsWith("549")) digitos = digitos.slice(3);
  return formatearTelefono(digitos);
}

export function TurnosPage() {
  const [paso, setPaso] = useState<Paso>("servicios");

  // Con sesión iniciada no se piden nombre ni teléfono (salen de la cuenta);
  // el OTP se mantiene igual como verificación anti-bot. "Reservar para otra
  // persona" vuelve al flujo de invitado (nombre + teléfono + OTP de esa persona).
  const usuarioLogueado = useAuthStore((estado) => estado.usuario);
  const [otraPersona, setOtraPersona] = useState(false);
  const reservaPropia = usuarioLogueado !== null && !otraPersona;

  // Paso 1: servicios
  const { data: servicios = [], isLoading: cargandoServicios } = useServicios();
  // ?servicio=ID (desde "Reservar ahora" de las cards) preselecciona ese servicio.
  const [searchParams] = useSearchParams();
  const [seleccionIds, setServiciosSeleccionados] = useState<number[]>(() => {
    const preseleccionado = Number(searchParams.get("servicio"));
    return Number.isInteger(preseleccionado) && preseleccionado > 0 ? [preseleccionado] : [];
  });
  // Solo cuentan los servicios que existen y están activos (un ?servicio=
  // inválido en la URL se ignora en vez de llegar al backend).
  const serviciosSeleccionados = seleccionIds.filter((id) =>
    servicios.some((s) => s.id === id && s.activo),
  );

  // Paso 2: fecha y horario
  // Vacío hasta que se elige un día: solo se ofrecen los días con atención.
  const [fecha, setFecha] = useState("");
  const { data: dias = [], isLoading: cargandoDias } = useDiasReservables();
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
  const reservarTurnoAutenticado = useReservarTurnoAutenticado();

  // Teléfono al que se manda el OTP (y que se muestra en el paso del código).
  const telefonoOtp =
    reservaPropia && usuarioLogueado ? telefonoParaOtp(usuarioLogueado.telefono) : telefono;

  // Recibe el código como parámetro explícito (no lo lee de estado) a
  // propósito: se llama inmediatamente después de setCodigo(valor) en
  // manejarCambioCodigo, más abajo, y el estado todavía no se actualizó en
  // ese mismo tick — leer `codigo` del closure ahí daría el valor viejo.
  const confirmarReserva = useCallback(
    (codigoIngresado: string) => {
      if (!horaSeleccionada) return;
      setEstadoOtp("verificando");
      const callbacks = {
        onSuccess: (turno: Turno) => {
          setEstadoOtp("correcto");
          window.setTimeout(() => {
            setTurnoConfirmado(turno);
            setPaso("exito");
          }, 1400);
        },
        onError: (error: unknown) => {
          // 409: el horario se ocupó justo en este momento (carrera entre
          // consultar disponibilidad y confirmar) — no es un error de OTP.
          if (isAxiosError(error) && error.response?.status === 409) {
            setEstadoOtp("idle");
            setCodigo("");
            setMensajeHorario(
              extraerMensajeError(error, "Ese horario ya no está disponible, elegí otro."),
            );
            setPaso("horario");
            return;
          }

          const intentos = extraerIntentosRestantes(error) ?? null;
          setIntentosRestantes(intentos);
          setCodigoBloqueado(intentos === 0);
          setErrorOtp(extraerMensajeError(error, "No se pudo validar el código"));
          setEstadoOtp("incorrecto");
          window.setTimeout(() => {
            setEstadoOtp("idle");
            setCodigo("");
            setResetKeyOtp((k) => k + 1);
          }, 900);
        },
      };

      if (reservaPropia) {
        reservarTurnoAutenticado.mutate(
          { servicios: serviciosSeleccionados, fecha, hora_inicio: horaSeleccionada, codigo: codigoIngresado },
          callbacks,
        );
      } else {
        reservarTurno.mutate(
          {
            servicios: serviciosSeleccionados,
            fecha,
            hora_inicio: horaSeleccionada,
            nombre,
            telefono,
            codigo: codigoIngresado,
          },
          callbacks,
        );
      }
    },
    [
      horaSeleccionada,
      serviciosSeleccionados,
      fecha,
      nombre,
      telefono,
      reservaPropia,
      reservarTurno,
      reservarTurnoAutenticado,
    ],
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
  const excedeDuracionMaxima = duracionTotal > MAX_DURACION_TURNO_MINUTOS;
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

  function elegirHora(hora: string) {
    setHoraSeleccionada(hora);
    setPaso("datos");
  }

  async function handleSubmitDatos(e: FormEvent) {
    e.preventDefault();
    if (!reservaPropia) {
      if (!nombre.trim()) {
        setErrorDatos("Ingresá tu nombre");
        return;
      }
      if (telefono.replace(/\D/g, "").length !== MAX_DIGITS_TELEFONO) {
        setErrorDatos("Ingresá un teléfono válido");
        return;
      }
    }
    setErrorDatos("");
    setEnviandoCodigo(true);
    try {
      await solicitarCodigo(telefonoOtp);
      setCooldownReenvio(COOLDOWN_SEGUNDOS);
      setCodigo("");
      setEstadoOtp("idle");
      setCodigoBloqueado(false);
      setIntentosRestantes(null);
      setPaso("otp");
    } catch (error) {
      setErrorDatos(
        extraerMensajeError(error, "No se pudo enviar el código. Probá de nuevo en unos segundos."),
      );
    } finally {
      setEnviandoCodigo(false);
    }
  }

  async function handleReenviar() {
    if (cooldownReenvio > 0) return;
    try {
      await solicitarCodigo(telefonoOtp);
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
        <p className="mt-3 text-xs text-espresso/60">
          {usuarioLogueado ? (
            <>
              Podés consultarlo, reprogramarlo o cancelarlo desde{" "}
              <Link to="/mis-turnos" className="text-rosewood underline">
                Mis turnos
              </Link>
              .
            </>
          ) : (
            <>
              Para consultarlo, reprogramarlo o cancelarlo{" "}
              <Link to="/login" className="text-rosewood underline">
                ingresá con tu teléfono
              </Link>{" "}
              (te enviamos un código por WhatsApp) y entrá a Mis turnos.
            </>
          )}
        </p>
      </div>
    );
  }

  return (
    <div className={`mx-auto px-6 py-16 ${paso === "servicios" ? "max-w-6xl" : "max-w-2xl"}`}>
      <div className="mb-10 text-center">
        <h1 className="font-serif text-4xl text-espresso">Reservar turno</h1>
        <p className="mt-3 text-sm text-espresso/60">
          Elegí tus servicios, un horario disponible, y confirmá con tu teléfono.
        </p>
      </div>

      {/* Paso 1: servicios */}
      {paso === "servicios" && (
        <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
          <div>
            {cargandoServicios && (
              <p className="py-10 text-center text-sm text-espresso/50">Cargando servicios...</p>
            )}
            {!cargandoServicios && servicios.filter((s) => s.activo).length === 0 && (
              <p className="py-10 text-center text-sm text-espresso/50">
                No hay servicios disponibles por el momento.
              </p>
            )}
            {excedeDuracionMaxima && (
              <p className="mb-4 rounded-xl bg-rosewood/5 px-4 py-3 text-sm text-rosewood">
                {MENSAJE_DURACION_MAXIMA}
              </p>
            )}
            {servicios.some((s) => s.activo) && (
              <CatalogoServicios
                servicios={servicios.filter((s) => s.activo)}
                columnas="2"
                seleccionados={serviciosSeleccionados}
                onToggle={toggleServicio}
                noEntra={(s) => duracionTotal + s.duracion_minutos > MAX_DURACION_TURNO_MINUTOS}
              />
            )}
          </div>

          {/* Escritorio: panel "Tu turno" fijo a la derecha */}
          <div className="hidden lg:block">
            <div className="sticky top-28">
              <ResumenTurno
                elegidos={serviciosElegidos}
                duracionTotal={duracionTotal}
                precioTotal={precioTotal}
                onQuitar={toggleServicio}
                onContinuar={irAHorario}
              />
            </div>
          </div>

          {/* Mobile: barra inferior con el resumen */}
          {serviciosSeleccionados.length > 0 && (
            <div className="sticky bottom-4 flex items-center justify-between rounded-xl border border-espresso/10 bg-superficie p-4 shadow-md lg:hidden">
              <div className="text-sm text-espresso/70">
                {serviciosSeleccionados.length} servicio(s) — {formatearDuracion(duracionTotal)} —{" "}
                <span className="font-semibold text-rosewood">
                  {precioTotal.toLocaleString("es-AR", { style: "currency", currency: "ARS" })}
                </span>
              </div>
              <Button onClick={irAHorario} disabled={excedeDuracionMaxima}>
                Elegir horario
              </Button>
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
            <p className="mb-2 text-sm font-medium text-espresso/70">Fecha</p>
            <SelectorFecha
              diasHabilitados={dias}
              value={fecha || null}
              isLoading={cargandoDias}
              onChange={(f) => {
                setFecha(f);
                setHoraSeleccionada(null);
                setMensajeHorario("");
              }}
            />
          </div>

          {mensajeHorario && <p className="text-sm text-rosewood">{mensajeHorario}</p>}

          <SelectorHorario
            slots={slots}
            value={horaSeleccionada}
            isLoading={cargandoSlots}
            mensajeInactivo={!fecha ? "Elegí un día para ver los horarios." : undefined}
            onChange={elegirHora}
          />
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

          {reservaPropia && usuarioLogueado ? (
            <form onSubmit={handleSubmitDatos} className="flex flex-col gap-5">
              <div className="rounded-xl border border-espresso/10 p-4 text-sm">
                <p className="text-espresso/60">Reservando como</p>
                <p className="font-medium text-espresso">
                  {usuarioLogueado.nombre} {usuarioLogueado.apellido ?? ""}
                </p>
                <p className="mt-1 text-espresso/60">+54 {telefonoOtp}</p>
              </div>
              <p className="text-xs text-espresso/60">
                Te enviamos un código por WhatsApp a este número para confirmar que sos vos.
              </p>
              {errorDatos && <p className="text-sm text-rosewood">{errorDatos}</p>}
              <Button type="submit" fullWidth disabled={enviandoCodigo}>
                {enviandoCodigo ? "Enviando código..." : "Confirmar y recibir código"}
              </Button>
              <button
                type="button"
                onClick={() => {
                  setOtraPersona(true);
                  setErrorDatos("");
                }}
                className="text-center text-xs uppercase tracking-widest text-espresso/50 hover:text-rosewood"
              >
                Reservar para otra persona
              </button>
            </form>
          ) : (
            <>
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
              {usuarioLogueado && (
                <button
                  type="button"
                  onClick={() => {
                    setOtraPersona(false);
                    setErrorDatos("");
                  }}
                  className="mt-4 w-full text-center text-xs uppercase tracking-widest text-espresso/50 hover:text-rosewood"
                >
                  Volver a reservar con mi cuenta
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Paso 4: OTP (reutiliza CodeStep de auth tal cual) */}
      {paso === "otp" && (
        <CodeStep
          telefono={telefonoOtp}
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