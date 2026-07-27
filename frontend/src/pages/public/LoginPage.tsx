import { useEffect, useState, type FormEvent } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import { PhoneStep } from "../../components/auth/PhoneStep";
import { CodeStep } from "../../components/auth/CodeStep";
import { CredentialsStep } from "../../components/auth/CredentialsStep";
import { RegisterStep } from "../../components/auth/RegisterStep";
import { Logo } from "../../components/common/Logo";

import api from "../../api/axios";
import { useAuthStore } from "../../stores/authStore";
import { useOtpFlowStore } from "../../stores/otpFlowStore";
import { extraerMensajeError } from "../../utils/extraerMensajeError";

type LoginStep = "telefono" | "codigo" | "registro" | "credenciales";
const MAX_INTENTOS_CODIGO = 3;
type EstadoVerificacion = "idle" | "verificando" | "correcto" | "incorrecto";

export function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const telefono = useOtpFlowStore((state) => state.telefono);
  const setTelefono = useOtpFlowStore((state) => state.setTelefono);
  const cooldownHasta = useOtpFlowStore((state) => state.cooldownHasta);
  const registrarIntentoOtp = useOtpFlowStore(
    (state) => state.registrarIntento,
  );

  // Siempre arranca en "telefono", sin importar qué haya pasado antes en
  // otra sesión de login — esto es intencional (ver mensaje de la sesión).
  const [step, setStep] = useState<LoginStep>("telefono");

  const [codigo, setCodigo] = useState("");
  const [identificador, setIdentificador] = useState("");
  const [contrasena, setContrasena] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [intentosCodigo, setIntentosCodigo] = useState(0);
  const codigoBloqueado = intentosCodigo >= MAX_INTENTOS_CODIGO;

  const [estadoVerificacion, setEstadoVerificacion] =
    useState<EstadoVerificacion>("idle");
  const [otpResetKey, setOtpResetKey] = useState(0);

  const [ahora, setAhora] = useState(0);

  useEffect(() => {
    let frameId: number;
    let ultimoTick = 0;
    let esPrimerFrame = true;

    function tick(marcaTiempo: number) {
      const ahoraReal = Date.now();
      const terminado = ahoraReal >= cooldownHasta;

      // Siempre sincroniza en el primer frame Y en el frame donde el cooldown
      // termina — así nunca se detiene el loop sin haber reflejado el valor
      // final real (que es lo que causaba el "1s" congelado para siempre).
      if (esPrimerFrame || terminado || marcaTiempo - ultimoTick >= 250) {
        esPrimerFrame = false;
        ultimoTick = marcaTiempo;
        setAhora(ahoraReal);
      }

      if (!terminado) {
        frameId = requestAnimationFrame(tick);
      }
    }

    frameId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frameId);
  }, [cooldownHasta]);

  const cooldownActivo =
    ahora === 0 ? 0 : Math.max(0, Math.ceil((cooldownHasta - ahora) / 1000));

  function irAPaso(nuevoPaso: LoginStep) {
    setError(null);
    setEstadoVerificacion("idle");
    setStep(nuevoPaso);
  }

  function redirigirSegunRol(rol: "admin" | "cliente") {
    navigate(rol === "admin" ? "/admin" : "/", { replace: true });
  }

  async function solicitarCodigo() {
    setError(null);
    setIsLoading(true);

    try {
      await api.post("/auth/solicitar-codigo", { telefono });
      registrarIntentoOtp();
      setCodigo("");
      setIntentosCodigo(0);
      setEstadoVerificacion("idle");
      setOtpResetKey((k) => k + 1);
      return true;
    } catch (err) {
      registrarIntentoOtp();
      setError(
        extraerMensajeError(
          err,
          "No pudimos enviar el código. Intentá de nuevo.",
        ),
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmitTelefono(e: FormEvent) {
    e.preventDefault();
    const enviado = await solicitarCodigo();
    if (enviado) setStep("codigo");
  }

  async function handleReenviarCodigo() {
    await solicitarCodigo();
  }

  async function verificarCodigo(codigoAVerificar: string) {
    setError(null);
    setEstadoVerificacion("verificando");

    try {
      const { data } = await api.post("/auth/validar-codigo", {
        telefono,
        codigo: codigoAVerificar,
      });

      setEstadoVerificacion("correcto");

      setTimeout(() => {
        if (data.requiereRegistro) {
          setEstadoVerificacion("idle");
          setStep("registro");
          return;
        }
        setAuth(data.usuario, data.token);
        redirigirSegunRol(data.usuario.rol);
      }, 1100);
    } catch (err) {
      setIntentosCodigo((prev) => prev + 1);
      setError(extraerMensajeError(err, "Código incorrecto o expirado."));
      setEstadoVerificacion("incorrecto");

      setTimeout(() => {
        setCodigo("");
        setOtpResetKey((k) => k + 1);
        setEstadoVerificacion("idle");
      }, 1100);
    }
  }

  function handleCodigoChange(valor: string) {
    // Segunda barrera además del `disabled` del input: aunque algo dispare
    // el evento (paste, autofill, o un comportamiento inesperado del
    // navegador), el estado nunca acepta cambios estando bloqueado.
    if (codigoBloqueado) return;

    setCodigo(valor);

    if (valor.length === 6 && estadoVerificacion === "idle") {
      verificarCodigo(valor);
    }
  }

  async function handleRegistro(
    e: FormEvent,
    nombre: string,
    apellido: string,
  ) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { data } = await api.post("/auth/registro", {
        telefono,
        nombre,
        apellido,
      });

      setAuth(data.usuario, data.token);
      redirigirSegunRol(data.usuario.rol);
    } catch (err) {
      setError(extraerMensajeError(err, "No pudimos crear la cuenta."));
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmitCredenciales(e: FormEvent) {
    e.preventDefault();
    console.log("Login con usuario/contraseña pendiente");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-blush px-6 py-12 font-sans text-espresso">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <NavLink to="/" className="inline-block rounded-sm">
            <Logo size={128} variant="gradient" />
          </NavLink>

          <p className="mt-4 text-sm text-espresso/60">
            {step === "credenciales"
              ? "Ingresá con tu usuario y contraseña"
              : "Ingresá tu teléfono para continuar"}
          </p>
        </div>

        <div className="rounded-2xl border border-espresso/10 bg-superficie/90 p-8 shadow-sm backdrop-blur-md">
          {step === "telefono" && (
            <PhoneStep
              telefono={telefono}
              onTelefonoChange={setTelefono}
              onSubmit={handleSubmitTelefono}
              onIrACredenciales={() => irAPaso("credenciales")}
              error={error ?? undefined}
              isLoading={isLoading}
              cooldown={cooldownActivo}
            />
          )}

          {step === "codigo" && (
            <CodeStep
              telefono={telefono}
              codigo={codigo}
              onCodigoChange={handleCodigoChange}
              onVolver={() => irAPaso("telefono")}
              onReenviar={handleReenviarCodigo}
              cooldownReenvio={cooldownActivo}
              intentosRestantes={MAX_INTENTOS_CODIGO - intentosCodigo}
              codigoBloqueado={codigoBloqueado}
              resetKey={otpResetKey}
              estado={estadoVerificacion}
              error={error ?? undefined}
            />
          )}

          {step === "registro" && (
            <RegisterStep
              telefono={telefono}
              onSubmit={handleRegistro}
              error={error ?? undefined}
              isLoading={isLoading}
            />
          )}

          {step === "credenciales" && (
            <CredentialsStep
              identificador={identificador}
              onIdentificadorChange={setIdentificador}
              contrasena={contrasena}
              onContrasenaChange={setContrasena}
              onSubmit={handleSubmitCredenciales}
              onIrATelefono={() => irAPaso("telefono")}
            />
          )}
        </div>

        <p className="mt-6 text-center text-xs text-espresso/40">
          Al continuar aceptás nuestros términos y condiciones.
        </p>
      </div>
    </div>
  );
}
