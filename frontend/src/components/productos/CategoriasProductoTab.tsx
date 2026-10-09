import { useState } from "react";
import { Table } from "../common/Table";
import { Button } from "../common/Button";
import { Modal } from "../common/Modal";
import { ConfirmDialog } from "../servicios/ConfirmDialog";
import { CategoriaProductoForm } from "./CategoriaProductoForm";
import { extraerMensajeError } from "../../utils/extraerMensajeError";
import { useToastStore } from "../../stores/toastStore";
import {
  useCategoriasProducto,
  useCrearCategoriaProducto,
  useActualizarCategoriaProducto,
  useEliminarCategoriaProducto,
} from "../../hooks/useCategoriasProducto";
import type {
  CategoriaProducto,
  CrearCategoriaProductoPayload,
} from "../../types/producto";

export function CategoriasProductoTab() {
  const mostrarToast = useToastStore((state) => state.mostrarToast);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [categoriaEnEdicion, setCategoriaEnEdicion] = useState<
    CategoriaProducto | undefined
  >();
  const [errorFormulario, setErrorFormulario] = useState("");
  const [categoriaAEliminar, setCategoriaAEliminar] =
    useState<CategoriaProducto | null>(null);
  const [errorEliminar, setErrorEliminar] = useState("");

  const {
    data: categorias = [],
    isLoading: cargandoCategorias,
    isError: errorCategorias,
  } = useCategoriasProducto();

  const crearCategoria = useCrearCategoriaProducto();
  const actualizarCategoria = useActualizarCategoriaProducto();
  const eliminarCategoria = useEliminarCategoriaProducto();

  function abrirCrearCategoria() {
    setCategoriaEnEdicion(undefined);
    setErrorFormulario("");
    setModalAbierto(true);
  }

  function abrirEditarCategoria(categoria: CategoriaProducto) {
    setCategoriaEnEdicion(categoria);
    setErrorFormulario("");
    setModalAbierto(true);
  }

  function handleSubmitCategoria(payload: CrearCategoriaProductoPayload) {
    setErrorFormulario("");

    if (categoriaEnEdicion) {
      actualizarCategoria.mutate(
        { id: categoriaEnEdicion.id, payload },
        {
          onSuccess: (categoria) => {
            setModalAbierto(false);
            mostrarToast(
              "actualizacion",
              `La categoría "${categoria.nombre}" fue actualizada`,
            );
          },
          onError: (error) => {
            setErrorFormulario(
              extraerMensajeError(error, "No se pudo actualizar la categoría"),
            );
          },
        },
      );
    } else {
      crearCategoria.mutate(payload, {
        onSuccess: (categoria) => {
          setModalAbierto(false);
          mostrarToast(
            "creacion",
            `La categoría "${categoria.nombre}" fue creada`,
          );
        },
        onError: (error) => {
          setErrorFormulario(
            extraerMensajeError(error, "No se pudo crear la categoría"),
          );
        },
      });
    }
  }

  function abrirConfirmarEliminar(categoria: CategoriaProducto) {
    setErrorEliminar("");
    setCategoriaAEliminar(categoria);
  }

  function handleConfirmarEliminar() {
    if (!categoriaAEliminar) return;

    const { id, nombre } = categoriaAEliminar;

    eliminarCategoria.mutate(id, {
      onSuccess: () => {
        setCategoriaAEliminar(null);
        mostrarToast("eliminacion", `La categoría "${nombre}" fue eliminada`);
      },
      onError: (error) => {
        setErrorEliminar(
          extraerMensajeError(error, "No se pudo eliminar la categoría"),
        );
      },
    });
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex justify-end">
          <Button onClick={abrirCrearCategoria}>Nueva categoría</Button>
        </div>

        {cargandoCategorias ? (
          <p className="py-10 text-center text-sm text-espresso/50">
            Cargando categorías...
          </p>
        ) : errorCategorias ? (
          <p className="py-10 text-center text-sm text-rosewood">
            No pudimos cargar las categorías. Intentá nuevamente más tarde.
          </p>
        ) : (
          <Table<CategoriaProducto>
            data={categorias}
            keyExtractor={(c) => c.id}
            emptyMessage="Todavía no hay categorías creadas."
            columns={[
              { header: "Nombre", render: (c) => c.nombre },
              { header: "Descripción", render: (c) => c.descripcion ?? "—" },
              {
                header: "Acciones",
                render: (c) => (
                  <div className="flex gap-3">
                    <Button
                      variant="link"
                      onClick={() => abrirEditarCategoria(c)}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="link"
                      onClick={() => abrirConfirmarEliminar(c)}
                    >
                      Eliminar
                    </Button>
                  </div>
                ),
              },
            ]}
          />
        )}
      </div>

      <Modal
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        title={categoriaEnEdicion ? "Editar categoría" : "Nueva categoría"}
      >
        <CategoriaProductoForm
          categoriaInicial={categoriaEnEdicion}
          onSubmit={handleSubmitCategoria}
          onCancel={() => setModalAbierto(false)}
          isSubmitting={
            crearCategoria.isPending || actualizarCategoria.isPending
          }
          errorServidor={errorFormulario}
        />
      </Modal>

      <ConfirmDialog
        isOpen={categoriaAEliminar !== null}
        title="Eliminar categoría"
        message={`¿Seguro que querés eliminar "${categoriaAEliminar?.nombre}"? Esta acción no se puede deshacer.`}
        onConfirm={handleConfirmarEliminar}
        onCancel={() => setCategoriaAEliminar(null)}
        isConfirming={eliminarCategoria.isPending}
        errorMessage={errorEliminar}
      />
    </>
  );
}
