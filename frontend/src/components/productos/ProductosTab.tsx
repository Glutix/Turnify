import { useState } from "react";
import { Table } from "../common/Table";
import { Button } from "../common/Button";
import { Modal } from "../common/Modal";
import { ProductoForm } from "./ProductoForm";
import { extraerMensajeError } from "../../utils/extraerMensajeError";
import { useToastStore } from "../../stores/toastStore";

import { AjustarStockForm } from "./AjustarStockForm";
import {
  useProductos,
  useCrearProducto,
  useActualizarProducto,
  useAjustarStockProducto,
} from "../../hooks/useProductos";
import { useCategoriasProducto } from "../../hooks/useCategoriasProducto";
import { formatearPrecio } from "../../utils/servicio";
import type {
  Producto,
  CrearProductoPayload,
  AjustarStockPayload,
} from "../../types/producto";

type FiltroEstado = "activos" | "inactivos" | "todos";

const CLASE_CONTROL =
  "rounded-xl border border-espresso/15 bg-superficie px-4 py-2.5 text-sm text-espresso focus:border-rosewood focus:outline-none focus:ring-2 focus:ring-rosewood/20";

export function ProductosTab() {
  const mostrarToast = useToastStore((state) => state.mostrarToast);

  const [busqueda, setBusqueda] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("activos");
  const [soloSinStock, setSoloSinStock] = useState(false);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [productoEnEdicion, setProductoEnEdicion] = useState<
    Producto | undefined
  >();
  const [errorFormulario, setErrorFormulario] = useState("");
  const [productoStock, setProductoStock] = useState<Producto | null>(null);
  const [errorStock, setErrorStock] = useState("");

  const {
    data: productos = [],
    isLoading: cargandoProductos,
    isError: errorProductos,
  } = useProductos();
  const { data: categorias = [] } = useCategoriasProducto();

  const crearProducto = useCrearProducto();
  const actualizarProducto = useActualizarProducto();
  const ajustarStock = useAjustarStockProducto();

  const productosFiltrados = productos.filter((p) => {
    if (filtroEstado === "activos" && !p.activo) return false;
    if (filtroEstado === "inactivos" && p.activo) return false;
    if (filtroCategoria && String(p.categoria_id) !== filtroCategoria)
      return false;
    if (soloSinStock && p.stock > 0) return false;
    if (busqueda && !p.nombre.toLowerCase().includes(busqueda.toLowerCase()))
      return false;
    return true;
  });

  function abrirCrearProducto() {
    setProductoEnEdicion(undefined);
    setErrorFormulario("");
    setModalAbierto(true);
  }

  function abrirEditarProducto(producto: Producto) {
    setProductoEnEdicion(producto);
    setErrorFormulario("");
    setModalAbierto(true);
  }

  function handleSubmitProducto(payload: CrearProductoPayload) {
    setErrorFormulario("");

    if (productoEnEdicion) {
      actualizarProducto.mutate(
        { id: productoEnEdicion.id, payload },
        {
          onSuccess: (producto) => {
            setModalAbierto(false);
            mostrarToast(
              "actualizacion",
              `El producto "${producto.nombre}" fue actualizado`,
            );
          },
          onError: (error) => {
            setErrorFormulario(
              extraerMensajeError(error, "No se pudo actualizar el producto"),
            );
          },
        },
      );
    } else {
      crearProducto.mutate(payload, {
        onSuccess: (producto) => {
          setModalAbierto(false);
          mostrarToast(
            "creacion",
            `El producto "${producto.nombre}" fue creado`,
          );
        },
        onError: (error) => {
          setErrorFormulario(
            extraerMensajeError(error, "No se pudo crear el producto"),
          );
        },
      });
    }
  }

  function abrirAjustarStock(producto: Producto) {
    setErrorStock("");
    setProductoStock(producto);
  }

  function handleSubmitStock(payload: AjustarStockPayload) {
    if (!productoStock) return;
    setErrorStock("");

    ajustarStock.mutate(
      { id: productoStock.id, payload },
      {
        onSuccess: (producto) => {
          setProductoStock(null);
          mostrarToast(
            "actualizacion",
            `El stock de "${producto.nombre}" ahora es ${producto.stock}`,
          );
        },
        onError: (error) => {
          setErrorStock(
            extraerMensajeError(error, "No se pudo ajustar el stock"),
          );
        },
      },
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className={`${CLASE_CONTROL} placeholder:text-espresso/35`}
            />
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className={CLASE_CONTROL}
            >
              <option value="">Todas las categorías</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value as FiltroEstado)}
              className={CLASE_CONTROL}
            >
              <option value="todos">Todos</option>
              <option value="activos">Activos</option>
              <option value="inactivos">Inactivos</option>
            </select>
            <label className="flex items-center gap-2 text-sm text-espresso/70">
              <input
                type="checkbox"
                checked={soloSinStock}
                onChange={(e) => setSoloSinStock(e.target.checked)}
              />
              Solo sin stock
            </label>
          </div>
          <Button onClick={abrirCrearProducto}>Nuevo producto</Button>
        </div>

        {cargandoProductos ? (
          <p className="py-10 text-center text-sm text-espresso/50">
            Cargando productos...
          </p>
        ) : errorProductos ? (
          <p className="py-10 text-center text-sm text-rosewood">
            No pudimos cargar los productos. Intentá nuevamente más tarde.
          </p>
        ) : (
          <Table<Producto>
            data={productosFiltrados}
            keyExtractor={(p) => p.id}
            emptyMessage={
              productos.length === 0
                ? "Todavía no hay productos cargados."
                : "No se encontraron productos con esos filtros."
            }
            columns={[
              { header: "Nombre", render: (p) => p.nombre },
              { header: "Categoría", render: (p) => p.categoria.nombre },
              { header: "Precio", render: (p) => formatearPrecio(p.precio) },
              {
                header: "Stock",
                render: (p) =>
                  p.stock === 0 ? (
                    <span className="text-red-600">Sin stock</span>
                  ) : (
                    p.stock
                  ),
              },
              {
                header: "Estado",
                render: (p) => (
                  <span className="inline-flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${p.activo ? "bg-emerald-500" : "bg-red-500"}`}
                    />
                    {p.activo ? "Activo" : "Inactivo"}
                  </span>
                ),
              },
              {
                header: "Acciones",
                render: (p) => (
                  <div className="flex gap-3">
                    <Button
                      variant="link"
                      onClick={() => abrirEditarProducto(p)}
                    >
                      Editar
                    </Button>

                    <Button variant="link" onClick={() => abrirAjustarStock(p)}>
                      Ajustar stock
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
        title={productoEnEdicion ? "Editar producto" : "Nuevo producto"}
      >
        <ProductoForm
          productoInicial={productoEnEdicion}
          categorias={categorias}
          onSubmit={handleSubmitProducto}
          onCancel={() => setModalAbierto(false)}
          isSubmitting={crearProducto.isPending || actualizarProducto.isPending}
          errorServidor={errorFormulario}
        />
      </Modal>

      <Modal
        isOpen={productoStock !== null}
        onClose={() => setProductoStock(null)}
        title="Ajustar stock"
      >
        {productoStock && (
          <AjustarStockForm
            producto={productoStock}
            onSubmit={handleSubmitStock}
            onCancel={() => setProductoStock(null)}
            isSubmitting={ajustarStock.isPending}
            errorServidor={errorStock}
          />
        )}
      </Modal>
    </>
  );
}
