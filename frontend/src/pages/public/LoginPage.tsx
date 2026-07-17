import { useState, type FormEvent } from "react";

import { NavLink, useNavigate } from "react-router-dom";

import { PhoneStep } from "../../components/auth/PhoneStep";
import { CodeStep } from "../../components/auth/CodeStep";
import { CredentialsStep } from "../../components/auth/CredentialsStep";
import { RegisterStep } from "../../components/auth/RegisterStep";

import api from "../../api/axios";
import { useAuthStore } from "../../stores/authStore";

type LoginStep = "telefono" | "codigo" | "registro" | "credenciales";

export function LoginPage() {
  const navigate = useNavigate();

  const setAuth = useAuthStore((state) => state.setAuth);

  const [step, setStep] = useState<LoginStep>("telefono");

  const [telefono, setTelefono] = useState("");

  const [codigo, setCodigo] = useState("");

  const [identificador, setIdentificador] = useState("");

  const [contrasena, setContrasena] = useState("");

  async function handleSubmitTelefono(e: FormEvent) {
    e.preventDefault();

    try {
      await api.post("/auth/solicitar-codigo", {
        telefono,
      });

      setStep("codigo");
    } catch (error) {
      console.error("Error enviando OTP", error);
    }
  }

  async function handleSubmitCodigo(e: FormEvent) {
    e.preventDefault();

    try {
      const response = await api.post("/auth/validar-codigo", {
        telefono,
        codigo,
      });

      const data = response.data;

      console.log("Respuesta OTP:", data);

      if (data.requiereRegistro) {
        setStep("registro");

        return;
      }

      setAuth(data.usuario, data.token);

      navigate("/");
    } catch (error) {
      console.error("Error validando código", error);
    }
  }

  async function handleRegistro(
    e: FormEvent,
    nombre: string,
    apellido: string,
  ) {
    e.preventDefault();

    try {
      const response = await api.post("/auth/registro", {
        telefono,
        nombre,
        apellido,
      });

      const data = response.data;

      setAuth(data.usuario, data.token);

      navigate("/");
    } catch (error) {
      console.error("Error registrando usuario", error);
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
          <NavLink
            to="/"
            className="rounded-sm font-serif text-3xl font-medium tracking-wide text-espresso"
          >
            Turni
            <span className="italic text-rosewood">fy</span>
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

          {step === "registro" && (
            <RegisterStep
              telefono={telefono}

              onSubmit={handleRegistro}
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
