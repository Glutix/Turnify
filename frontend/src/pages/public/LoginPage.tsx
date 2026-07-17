/*import { useState, type FormEvent } from "react";
import { NavLink } from "react-router-dom";
import { PhoneStep } from "../../components/auth/PhoneStep";
import { CodeStep } from "../../components/auth/CodeStep";
import { CredentialsStep } from "../../components/auth/CredentialsStep";

type LoginStep = "telefono" | "codigo" | "credenciales";

export function LoginPage() {
  const [step, setStep] = useState<LoginStep>("telefono");

  const [telefono, setTelefono] = useState("");
  const [codigo, setCodigo] = useState("");
  const [identificador, setIdentificador] = useState("");
  const [contrasena, setContrasena] = useState("");

  function handleSubmitTelefono(e: FormEvent) {
    e.preventDefault();
    // TODO: reemplazar por la llamada real a la API que envía el SMS
    setStep("codigo");
  }

  function handleSubmitCodigo(e: FormEvent) {
    e.preventDefault();
    // TODO: reemplazar por la llamada real a la API que verifica el código
  }

  function handleSubmitCredenciales(e: FormEvent) {
    e.preventDefault();
    // TODO: reemplazar por la llamada real a la API de login con usuario/contraseña
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-blush px-6 py-12 font-sans text-espresso">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <NavLink
            to="/"
            className="rounded-sm font-serif text-3xl font-medium tracking-wide text-espresso"
          >
            Turni<span className="italic text-rosewood">fy</span>
          </NavLink>
          <p className="mt-2 text-sm text-espresso/60">
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
              onIrACredenciales={() => setStep("credenciales")}
            />
          )}

          {step === "codigo" && (
            <CodeStep
              telefono={telefono}
              codigo={codigo}
              onCodigoChange={setCodigo}
              onSubmit={handleSubmitCodigo}
              onVolver={() => setStep("telefono")}
            />
          )}

          {step === "credenciales" && (
            <CredentialsStep
              identificador={identificador}
              onIdentificadorChange={setIdentificador}
              contrasena={contrasena}
              onContrasenaChange={setContrasena}
              onSubmit={handleSubmitCredenciales}
              onIrATelefono={() => setStep("telefono")}
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
*/
import { useAuthStore } from "../../stores/authStore";

export function LoginPage() {
  const setAuth = useAuthStore((state) => state.setAuth);

  function entrarComoAdmin() {
    setAuth(
      {
        id: 1,
        nombre: "Administrador",
        rol: "admin",
        perfil_completo: true,
      },
      "token-prueba-admin",
    );
  }

  return (
    <button onClick={entrarComoAdmin}>
      Entrar como administrador
    </button>
  );
}