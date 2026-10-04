import { useState, type FormEvent } from "react";
import { Input } from "../common/Input";
import { Select } from "../common/Select";
import { Button } from "../common/Button";
import {
  ETIQUETA_ROL,
  type CrearUsuarioPayload,
  type RolUsuario,
  type Usuario,
} from "../../types/usuario";

interface UsuarioFormProps {
  // Si viene, el form edita; si no, da de alta (y permite elegir el rol).
  usuarioInicial?: Usuario;
  onSubmit: (payload: CrearUsuarioPayload) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  errorServidor?: string;
}

interface Errores {
  nombre?: string;
  telefono?: string;
  email?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TELEFONO_REGEX = /^\+?[\d\s()-]{8,20}$/;

const OPCIONES_ROL = (Object.keys(ETIQUETA_ROL) as RolUsuario[]).map((rol) => ({
  value: rol,
  label: ETIQUETA_ROL[rol],
}));

export function UsuarioForm({
  usuarioInicial,
  onSubmit,
  onCancel,
  isSubmitting,
  errorServidor,
}: UsuarioFormProps) {
  const [nombre, setNombre] = useState(usuarioInicial?.nombre ?? "");
  const [apellido, setApellido] = useState(usuarioInicial?.apellido ?? "");
  const [telefono, setTelefono] = useState(usuarioInicial?.telefono ?? "");
  const [email, setEmail] = useState(usuarioInicial?.email ?? "");
  const [direccion, setDireccion] = useState(usuarioInicial?.direccion ?? "");
  const [rol, setRol] = useState<RolUsuario>("cliente");
  const [errores, setErrores] = useState<Errores>({});

  const esEdicion = usuarioInicial !== undefined;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const nuevosErrores: Errores = {};
    if (!nombre.trim()) nuevosErrores.nombre = "El nombre es obligatorio";
    if (telefono.trim() && !TELEFONO_REGEX.test(telefono.trim())) {
      nuevosErrores.telefono = "Ingresá un teléfono válido";
    }
    // El login es por teléfono + OTP: un admin sin teléfono no podría entrar.
    if (!esEdicion && rol === "admin" && !telefono.trim()) {
      nuevosErrores.telefono =
        "Un administrador necesita teléfono para iniciar sesión";
    }
    if (email.trim() && !EMAIL_REGEX.test(email.trim())) {
      nuevosErrores.email = "Ingresá un email válido";
    }

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      return;
    }
    setErrores({});

    onSubmit({
      nombre: nombre.trim(),
      apellido: apellido.trim() || undefined,
      telefono: telefono.trim() || undefined,
      email: email.trim() || undefined,
      direccion: direccion.trim() || undefined,
      ...(esEdicion ? {} : { rol }),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Nombre"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        error={errores.nombre}
        maxLength={100}
        placeholder="Ej: María"
      />
      <Input
        label="Apellido (opcional)"
        value={apellido}
        onChange={(e) => setApellido(e.target.value)}
        maxLength={100}
        placeholder="Ej: González"
      />
      <Input
        label="Teléfono"
        value={telefono}
        onChange={(e) => setTelefono(e.target.value)}
        error={errores.telefono}
        maxLength={20}
        inputMode="tel"
        placeholder="Ej: 3644 401020"
      />
      <Input
        label="Email (opcional)"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errores.email}
        maxLength={150}
        placeholder="Ej: maria@gmail.com"
      />
      <Input
        label="Dirección (opcional)"
        value={direccion}
        onChange={(e) => setDireccion(e.target.value)}
        maxLength={255}
        placeholder="Ej: Av. Siempre Viva 123"
      />
      {!esEdicion && (
        <Select
          label="Rol"
          value={rol}
          onChange={(e) => setRol(e.target.value as RolUsuario)}
          options={OPCIONES_ROL}
        />
      )}
      {errorServidor && (
        <p className="text-xs text-rosewood">{errorServidor}</p>
      )}
      <div className="flex justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="subtle"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Guardando..."
            : esEdicion
              ? "Guardar cambios"
              : "Crear usuario"}
        </Button>
      </div>
    </form>
  );
}
