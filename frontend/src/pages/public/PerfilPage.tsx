//Turnify\frontend\src\pages\public\PerfilPage.tsx
// CU-12 (completar perfil) y CU-38 (editar datos personales).
import { useState, type FormEvent } from "react";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { Toast } from "../../components/common/Toast";
import {
  useActualizarMiPerfil,
  useEstablecerPassword,
  useMiPerfil,
} from "../../hooks/useUsuarios";
import { extraerMensajeError } from "../../utils/extraerMensajeError";
import type { Usuario } from "../../types/usuario";

type ToastState = { message: string; type: "success" | "error" } | null;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Errores {
  nombre?: string;
  email?: string;
}

function PerfilForm({ usuario }: { usuario: Usuario }) {
  const actualizar = useActualizarMiPerfil();

  const [nombre, setNombre] = useState(usuario.nombre);
  const [apellido, setApellido] = useState(usuario.apellido ?? "");
  const [email, setEmail] = useState(usuario.email ?? "");
  const [direccion, setDireccion] = useState(usuario.direccion ?? "");
  const [errores, setErrores] = useState<Errores>({});
  const [errorServidor, setErrorServidor] = useState("");
  const [toast, setToast] = useState<ToastState>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorServidor("");

    const nuevosErrores: Errores = {};
    if (!nombre.trim()) nuevosErrores.nombre = "El nombre es obligatorio";
    if (email.trim() && !EMAIL_REGEX.test(email.trim())) {
      nuevosErrores.email = "Ingresá un email válido";
    }
    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      return;
    }
    setErrores({});

    // Un campo vacío significa "no cambiar" (así lo trata el backend).
    actualizar.mutate(
      {
        nombre: nombre.trim(),
        apellido: apellido.trim() || undefined,
        email: email.trim() || undefined,
        direccion: direccion.trim() || undefined,
      },
      {
        onSuccess: (perfil) =>
          setToast({
            message: perfil.perfil_completo
              ? "Perfil actualizado. ¡Ya está completo!"
              : "Datos guardados correctamente",
            type: "success",
          }),
        // 409 de email duplicado → se muestra inline (CU-12: "pedir uno distinto")
        onError: (error) =>
          setErrorServidor(extraerMensajeError(error, "No se pudieron guardar los cambios")),
      },
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          error={errores.nombre}
          maxLength={100}
        />
        <Input
          label="Apellido"
          value={apellido}
          onChange={(e) => setApellido(e.target.value)}
          maxLength={100}
          placeholder="Ej: González"
        />
        <Input
          label="Teléfono"
          value={usuario.telefono ?? ""}
          readOnly
          disabled
          rightElement={<span className="text-xs text-espresso/40">Verificado</span>}
        />
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errores.email}
          maxLength={150}
          placeholder="Ej: maria@gmail.com"
        />
        <Input
          label="Dirección"
          value={direccion}
          onChange={(e) => setDireccion(e.target.value)}
          maxLength={255}
          placeholder="Ej: Av. Siempre Viva 123"
        />

        <p className="text-xs text-espresso/50">
          Tu teléfono es el que usás para ingresar, por eso solo el salón puede cambiarlo.
        </p>

        {errorServidor && <p className="text-xs text-rosewood">{errorServidor}</p>}

        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={actualizar.isPending}>
            {actualizar.isPending ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </form>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50">
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        </div>
      )}
    </>
  );
}

const MIN_PASSWORD = 8;

// RF20 / RF30: contraseña para ingresar con teléfono + contraseña.
function PasswordForm({ tienePassword }: { tienePassword: boolean }) {
  const establecer = useEstablecerPassword();

  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [repetir, setRepetir] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState<ToastState>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (tienePassword && !actual) return setError("Ingresá tu contraseña actual");
    if (nueva.length < MIN_PASSWORD) {
      return setError(`La contraseña debe tener al menos ${MIN_PASSWORD} caracteres`);
    }
    if (nueva !== repetir) return setError("Las contraseñas no coinciden");

    establecer.mutate(
      { passwordActual: tienePassword ? actual : undefined, passwordNueva: nueva },
      {
        onSuccess: () => {
          setActual("");
          setNueva("");
          setRepetir("");
          setToast({ message: "Contraseña guardada correctamente", type: "success" });
        },
        onError: (err) => setError(extraerMensajeError(err, "No se pudo guardar la contraseña")),
      },
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {tienePassword && (
          <Input
            label="Contraseña actual"
            type="password"
            autoComplete="current-password"
            value={actual}
            onChange={(e) => setActual(e.target.value)}
          />
        )}
        <Input
          label="Contraseña nueva"
          type="password"
          autoComplete="new-password"
          value={nueva}
          onChange={(e) => setNueva(e.target.value)}
          placeholder={`Mínimo ${MIN_PASSWORD} caracteres`}
        />
        <Input
          label="Repetir contraseña nueva"
          type="password"
          autoComplete="new-password"
          value={repetir}
          onChange={(e) => setRepetir(e.target.value)}
        />

        {error && <p className="text-xs text-rosewood">{error}</p>}

        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={establecer.isPending}>
            {establecer.isPending
              ? "Guardando..."
              : tienePassword
                ? "Cambiar contraseña"
                : "Crear contraseña"}
          </Button>
        </div>
      </form>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50">
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        </div>
      )}
    </>
  );
}

export function PerfilPage() {
  const { data: usuario, isLoading, isError } = useMiPerfil();

  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <div className="mb-10 text-center">
        <h1 className="font-serif text-4xl text-espresso">Mi perfil</h1>
        <p className="mt-3 text-sm text-espresso/60">
          Mantené tus datos al día para reservar y comprar más rápido.
        </p>
      </div>

      {isLoading && <p className="py-10 text-center text-sm text-espresso/50">Cargando perfil...</p>}

      {isError && (
        <p className="py-10 text-center text-sm text-rosewood">
          No pudimos cargar tu perfil. Probá de nuevo en unos minutos.
        </p>
      )}

      {usuario && (
        <div className="rounded-2xl border border-espresso/10 bg-superficie p-6 shadow-sm">
          <div
            className={`mb-6 rounded-xl px-4 py-3 text-sm ${
              usuario.perfil_completo
                ? "bg-oro/15 text-espresso"
                : "bg-rosewood/10 text-espresso"
            }`}
          >
            {usuario.perfil_completo
              ? "Tu perfil está completo."
              : "Completá apellido, email y dirección para poder comprar en la tienda."}
          </div>
          <PerfilForm usuario={usuario} />
        </div>
      )}

      {usuario && (usuario.perfil_completo || usuario.rol === "admin") && (
        <div className="mt-8 rounded-2xl border border-espresso/10 bg-superficie p-6 shadow-sm">
          <h2 className="font-serif text-2xl text-espresso">Contraseña</h2>
          <p className="mb-6 mt-1 text-sm text-espresso/60">
            {usuario.tiene_password
              ? "Podés ingresar con tu teléfono y contraseña, o con un código por WhatsApp."
              : "Creá una contraseña para ingresar sin esperar el código de WhatsApp."}
          </p>
          <PasswordForm tienePassword={!!usuario.tiene_password} />
        </div>
      )}
    </div>
  );
}
