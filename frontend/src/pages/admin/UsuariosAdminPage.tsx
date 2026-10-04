//Turnify\frontend\src\pages\admin\UsuariosAdminPage.tsx
import { useState, type FormEvent } from "react";
import { Table } from "../../components/common/Table";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { Select } from "../../components/common/Select";
import { Modal } from "../../components/common/Modal";
import { Toast } from "../../components/common/Toast";
import { ConfirmDialog } from "../../components/servicios/ConfirmDialog";
import { UsuarioForm } from "../../components/usuarios/UsuarioForm";
import {
  useUsuarios,
  useCrearUsuario,
  useActualizarUsuario,
  useCambiarRolUsuario,
  useEliminarUsuario,
} from "../../hooks/useUsuarios";
import { useAuthStore } from "../../stores/authStore";
import {
  ETIQUETA_ROL,
  nombreCompleto,
  type CrearUsuarioPayload,
  type RolUsuario,
  type Usuario,
} from "../../types/usuario";
import { extraerMensajeError } from "../../utils/extraerMensajeError";

type ToastState = { message: string; type: "success" | "error" } | null;

interface FormFiltros {
  busqueda: string;
  rol: RolUsuario | "todos";
}

const FILTROS_VACIOS: FormFiltros = { busqueda: "", rol: "todos" };

const OPCIONES_FILTRO_ROL = [
  { value: "todos", label: "Todos" },
  ...(Object.keys(ETIQUETA_ROL) as RolUsuario[]).map((rol) => ({
    value: rol,
    label: ETIQUETA_ROL[rol],
  })),
];

export function UsuariosAdminPage() {
  const yo = useAuthStore((state) => state.usuario);

  // "form" es lo que se tipea; "aplicados" lo que consulta al backend (al buscar).
  const [form, setForm] = useState<FormFiltros>(FILTROS_VACIOS);
  const [aplicados, setAplicados] = useState<FormFiltros>(FILTROS_VACIOS);

  const [toast, setToast] = useState<ToastState>(null);
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
  const [usuarioAEditar, setUsuarioAEditar] = useState<Usuario | null>(null);
  const [errorFormulario, setErrorFormulario] = useState("");

  const [usuarioACambiarRol, setUsuarioACambiarRol] = useState<Usuario | null>(null);
  const [errorRol, setErrorRol] = useState("");
  const [usuarioAEliminar, setUsuarioAEliminar] = useState<Usuario | null>(null);
  const [errorEliminar, setErrorEliminar] = useState("");

  const { data: usuarios = [], isLoading, isError } = useUsuarios({
    busqueda: aplicados.busqueda.trim() || undefined,
    rol: aplicados.rol === "todos" ? undefined : aplicados.rol,
  });
  const crearUsuario = useCrearUsuario();
  const actualizarUsuario = useActualizarUsuario();
  const cambiarRol = useCambiarRolUsuario();
  const eliminarUsuario = useEliminarUsuario();

  function handleBuscar(e: FormEvent) {
    e.preventDefault();
    setAplicados(form);
  }

  function handleLimpiar() {
    setForm(FILTROS_VACIOS);
    setAplicados(FILTROS_VACIOS);
  }

  function abrirCrear() {
    setErrorFormulario("");
    setModalCrearAbierto(true);
  }

  function abrirEditar(usuario: Usuario) {
    setErrorFormulario("");
    setUsuarioAEditar(usuario);
  }

  function handleCrear(payload: CrearUsuarioPayload) {
    crearUsuario.mutate(payload, {
      onSuccess: () => {
        setModalCrearAbierto(false);
        setToast({ message: "Usuario creado correctamente", type: "success" });
      },
      onError: (error) =>
        setErrorFormulario(extraerMensajeError(error, "No se pudo crear el usuario")),
    });
  }

  function handleEditar(payload: CrearUsuarioPayload) {
    if (!usuarioAEditar) return;
    // El rol no se edita acá (tiene su propia acción), así que no se envía.
    const { rol: _rol, ...datos } = payload;
    void _rol;
    actualizarUsuario.mutate(
      { id: usuarioAEditar.id, payload: datos },
      {
        onSuccess: () => {
          setUsuarioAEditar(null);
          setToast({ message: "Usuario actualizado correctamente", type: "success" });
        },
        onError: (error) =>
          setErrorFormulario(extraerMensajeError(error, "No se pudo actualizar el usuario")),
      },
    );
  }

  function pedirCambioRol(usuario: Usuario) {
    setErrorRol("");
    setUsuarioACambiarRol(usuario);
  }

  function handleConfirmarCambioRol() {
    if (!usuarioACambiarRol) return;
    const nuevoRol: RolUsuario = usuarioACambiarRol.rol === "admin" ? "cliente" : "admin";
    cambiarRol.mutate(
      { id: usuarioACambiarRol.id, rol: nuevoRol },
      {
        onSuccess: () => {
          setUsuarioACambiarRol(null);
          setToast({ message: `Rol actualizado: ${ETIQUETA_ROL[nuevoRol]}`, type: "success" });
        },
        onError: (error) =>
          setErrorRol(extraerMensajeError(error, "No se pudo cambiar el rol")),
      },
    );
  }

  function pedirEliminacion(usuario: Usuario) {
    setErrorEliminar("");
    setUsuarioAEliminar(usuario);
  }

  function handleConfirmarEliminar() {
    if (!usuarioAEliminar) return;
    eliminarUsuario.mutate(usuarioAEliminar.id, {
      onSuccess: () => {
        setUsuarioAEliminar(null);
        setToast({ message: "Usuario eliminado", type: "success" });
      },
      onError: (error) =>
        setErrorEliminar(extraerMensajeError(error, "No se pudo eliminar el usuario")),
    });
  }

  const nuevoRol: RolUsuario = usuarioACambiarRol?.rol === "admin" ? "cliente" : "admin";

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="font-serif text-3xl text-espresso">Usuarios</h1>
        <Button onClick={abrirCrear}>Nuevo usuario</Button>
      </div>

      <form onSubmit={handleBuscar} className="mb-6 grid gap-4 sm:grid-cols-2">
        <Input
          label="Buscar"
          placeholder="Nombre, email o teléfono"
          value={form.busqueda}
          onChange={(e) => setForm({ ...form, busqueda: e.target.value })}
        />
        <Select
          label="Rol"
          options={OPCIONES_FILTRO_ROL}
          value={form.rol}
          onChange={(e) => setForm({ ...form, rol: e.target.value as FormFiltros["rol"] })}
        />
        <div className="flex gap-3 sm:col-span-2">
          <Button type="submit">Buscar</Button>
          <Button type="button" variant="subtle" onClick={handleLimpiar}>
            Limpiar
          </Button>
        </div>
      </form>

      {isLoading ? (
        <p className="py-10 text-center text-sm text-espresso/50">Cargando usuarios...</p>
      ) : isError ? (
        <p className="py-10 text-center text-sm text-rosewood">
          No se pudieron cargar los usuarios.
        </p>
      ) : (
        <Table<Usuario>
          data={usuarios}
          keyExtractor={(u) => u.id}
          emptyMessage="No hay usuarios que coincidan con la búsqueda."
          columns={[
            { header: "Nombre", render: (u) => nombreCompleto(u) },
            { header: "Teléfono", render: (u) => u.telefono ?? "—" },
            { header: "Email", render: (u) => u.email ?? "—" },
            { header: "Rol", render: (u) => ETIQUETA_ROL[u.rol] },
            {
              header: "Perfil",
              render: (u) => (
                <span className={u.perfil_completo ? "text-espresso" : "text-espresso/50"}>
                  {u.perfil_completo ? "Completo" : "Incompleto"}
                </span>
              ),
            },
            {
              header: "Acciones",
              render: (u) => (
                <div className="flex gap-3">
                  <Button variant="link" onClick={() => abrirEditar(u)}>
                    Editar
                  </Button>
                  {/* Sobre uno mismo no se cambia el rol ni se elimina (lo rechaza el backend). */}
                  {u.id !== yo?.id && (
                    <>
                      <Button variant="link" onClick={() => pedirCambioRol(u)}>
                        {u.rol === "admin" ? "Quitar admin" : "Hacer admin"}
                      </Button>
                      <Button variant="link" onClick={() => pedirEliminacion(u)}>
                        Eliminar
                      </Button>
                    </>
                  )}
                </div>
              ),
            },
          ]}
        />
      )}

      <Modal
        isOpen={modalCrearAbierto}
        onClose={() => setModalCrearAbierto(false)}
        title="Nuevo usuario"
      >
        <UsuarioForm
          onSubmit={handleCrear}
          onCancel={() => setModalCrearAbierto(false)}
          isSubmitting={crearUsuario.isPending}
          errorServidor={errorFormulario}
        />
      </Modal>

      <Modal
        isOpen={usuarioAEditar !== null}
        onClose={() => setUsuarioAEditar(null)}
        title="Editar usuario"
      >
        {usuarioAEditar && (
          <UsuarioForm
            key={usuarioAEditar.id}
            usuarioInicial={usuarioAEditar}
            onSubmit={handleEditar}
            onCancel={() => setUsuarioAEditar(null)}
            isSubmitting={actualizarUsuario.isPending}
            errorServidor={errorFormulario}
          />
        )}
      </Modal>

      <ConfirmDialog
        isOpen={usuarioACambiarRol !== null}
        title="Cambiar rol"
        message={`¿Querés cambiar el rol de ${usuarioACambiarRol ? nombreCompleto(usuarioACambiarRol) : "este usuario"} a ${ETIQUETA_ROL[nuevoRol]}?`}
        onConfirm={handleConfirmarCambioRol}
        onCancel={() => setUsuarioACambiarRol(null)}
        isConfirming={cambiarRol.isPending}
        errorMessage={errorRol}
      />

      <ConfirmDialog
        isOpen={usuarioAEliminar !== null}
        title="Eliminar usuario"
        message={`¿Seguro que querés eliminar a ${usuarioAEliminar ? nombreCompleto(usuarioAEliminar) : "este usuario"}? Esta acción no se puede deshacer.`}
        onConfirm={handleConfirmarEliminar}
        onCancel={() => setUsuarioAEliminar(null)}
        isConfirming={eliminarUsuario.isPending}
        errorMessage={errorEliminar}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
