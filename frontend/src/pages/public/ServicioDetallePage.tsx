import { Link, useParams } from "react-router-dom";
import { useServicios } from "../../hooks/useServicios";
import { useServiciosVistos } from "../../hooks/useServiciosVistos";
import { ServicioCard } from "../../components/servicios/ServicioCard";
import { ServicioImagenPlaceholder } from "../../components/servicios/ServicioImagenPlaceholder";
import {
  IconArrowLeft,
  IconClock,
  IconShieldCheck,
} from "../../components/common/Icons";
import { formatearDuracion, formatearPrecio } from "../../utils/servicio";
import { obtenerContenidoServicio } from "../../utils/contenidoServicio";
import type { Servicio } from "../../types/servicio";

const CANTIDAD_RELACIONADOS = 3;

export function ServicioDetallePage() {
  const { id } = useParams();
  const servicioId = Number(id);
  const { data: servicios = [], isLoading, isError } = useServicios();

  const activos = servicios.filter((s) => s.activo);
  const servicio = activos.find((s) => s.id === servicioId);

  if (isLoading) {
    return <Mensaje texto="Cargando servicio..." />;
  }
  if (isError) {
    return (
      <Mensaje
        texto="No pudimos cargar el servicio. Intentá nuevamente más tarde."
        error
      />
    );
  }
  if (!servicio) {
    return <Mensaje texto="No encontramos este servicio." conVolver />;
  }

  // key: al pasar de un servicio a otro se remonta y el historial se reinicia.
  return (
    <DetalleServicio key={servicio.id} servicio={servicio} activos={activos} />
  );
}

function Mensaje({
  texto,
  error = false,
  conVolver = false,
}: {
  texto: string;
  error?: boolean;
  conVolver?: boolean;
}) {
  return (
    <div className="mx-auto max-w-4xl px-6 py-24 text-center">
      <p className={`text-sm ${error ? "text-rosewood" : "text-espresso/50"}`}>
        {texto}
      </p>
      {conVolver && <VolverAlCatalogo className="mt-6 justify-center" />}
    </div>
  );
}

function VolverAlCatalogo({ className = "" }: { className?: string }) {
  return (
    <Link
      to="/servicios"
      className={`inline-flex items-center gap-2 rounded-sm text-sm font-medium text-rosewood transition-colors hover:text-espresso focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rosewood/50 ${className}`}
    >
      <IconArrowLeft size={16} /> Volver a servicios
    </Link>
  );
}

function Bloque({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-rosewood/10 bg-superficie p-6 shadow-sm">
      <h2 className="font-serif text-xl text-espresso">{titulo}</h2>
      <div className="mt-3 text-sm leading-relaxed text-espresso/70">
        {children}
      </div>
    </section>
  );
}

function Lista({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span
            className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-oro"
            aria-hidden="true"
          />
          {item}
        </li>
      ))}
    </ul>
  );
}

function DetalleServicio({
  servicio,
  activos,
}: {
  servicio: Servicio;
  activos: Servicio[];
}) {
  const vistosIds = useServiciosVistos(servicio.id);
  const contenido = obtenerContenidoServicio(servicio);

  // Relacionados: misma categoría primero; si faltan, se completa con otros.
  const otros = activos.filter((s) => s.id !== servicio.id);
  const relacionados = [
    ...otros.filter((s) => s.categoria_id === servicio.categoria_id),
    ...otros.filter((s) => s.categoria_id !== servicio.categoria_id),
  ].slice(0, CANTIDAD_RELACIONADOS);

  const vistos = vistosIds
    .map((vid) => activos.find((s) => s.id === vid))
    .filter((s): s is Servicio => s !== undefined);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <VolverAlCatalogo />

      {/* Layout principal */}
      <div className="mt-8 grid gap-10 md:grid-cols-2">
        <ServicioImagenPlaceholder
          servicio={servicio}
          tamano="lg"
          className="aspect-4/3 w-full rounded-2xl border border-rosewood/10 shadow-sm md:aspect-square"
        />

        <div className="flex flex-col">
          <span className="self-start rounded-full bg-rosewood/10 px-3 py-1 text-xs font-medium uppercase tracking-widest text-rosewood">
            {servicio.categoria.nombre}
          </span>
          <h1 className="mt-4 font-serif text-4xl text-espresso">
            {servicio.nombre}
          </h1>

          <div className="mt-4 flex items-center gap-1.5 text-sm text-espresso/60">
            <IconClock size={16} />
            {formatearDuracion(servicio.duracion_minutos)}
          </div>

          <p className="mt-6 text-3xl font-semibold text-rosewood">
            {formatearPrecio(servicio.precio)}
          </p>

          <div className="mt-6 flex items-center gap-2 rounded-xl bg-oro/10 px-4 py-3 text-sm text-espresso/70">
            <IconShieldCheck size={20} className="shrink-0 text-oro" />
            Atención profesional garantizada
          </div>

          <Link
            to={`/turnos?servicio=${servicio.id}`}
            className="mt-8 rounded-full bg-linear-to-r from-oro to-rosewood px-8 py-3.5 text-center text-sm font-semibold uppercase tracking-widest text-superficie shadow-sm transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rosewood/50 focus-visible:ring-offset-2 focus-visible:ring-offset-blush"
          >
            Reservar ahora
          </Link>
        </div>
      </div>

      {/* Información */}
      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <Bloque titulo="Descripción">
            <p className="whitespace-pre-line">
              {servicio.descripcion ?? "Consultanos por este servicio."}
            </p>
          </Bloque>
        </div>
        <Bloque titulo="Beneficios">
          <Lista items={contenido.beneficios} />
        </Bloque>
        <Bloque titulo="Recomendaciones previas">
          <Lista items={contenido.recomendaciones} />
        </Bloque>
        <div className="md:col-span-2">
          <Bloque titulo="Cuidados post-tratamiento">
            <Lista items={contenido.cuidados} />
          </Bloque>
        </div>
      </div>

      {/* Relacionados */}
      {relacionados.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 font-serif text-2xl text-espresso">
            Tratamientos relacionados
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relacionados.map((s) => (
              <ServicioCard key={s.id} servicio={s} />
            ))}
          </div>
        </section>
      )}

      {/* Vistos recientemente */}
      {vistos.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 font-serif text-2xl text-espresso">
            Vistos recientemente
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {vistos.slice(0, 3).map((s) => (
              <ServicioCard key={s.id} servicio={s} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
