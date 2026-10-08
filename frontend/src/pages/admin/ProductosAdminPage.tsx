import { useState } from "react";
import { CategoriasProductoTab } from "../../components/productos/CategoriasProductoTab";
import { ProductosTab } from "../../components/productos/ProductosTab";

type Tab = "productos" | "categorias";

export function ProductosAdminPage() {
  const [tab, setTab] = useState<Tab>("productos");

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="mb-6 font-serif text-3xl text-espresso">Productos</h1>

      <div className="mb-6 flex gap-2 border-b border-espresso/10">
        <button
          onClick={() => setTab("productos")}
          className={`px-4 py-2 text-sm font-medium transition ${
            tab === "productos"
              ? "border-b-2 border-rosewood text-rosewood"
              : "text-espresso/50 hover:text-espresso"
          }`}
        >
          Productos
        </button>
        <button
          onClick={() => setTab("categorias")}
          className={`px-4 py-2 text-sm font-medium transition ${
            tab === "categorias"
              ? "border-b-2 border-rosewood text-rosewood"
              : "text-espresso/50 hover:text-espresso"
          }`}
        >
          Categorías
        </button>
      </div>

      {tab === "productos" && <ProductosTab />}

      {tab === "categorias" && <CategoriasProductoTab />}
    </div>
  );
}
