// Detección de errores de base de datos SIN depender de `instanceof`.
//
// Por qué: con el driver adapter (@prisma/adapter-pg) el error puede llegar como
// PrismaClientKnownRequestError con `code` (P2002/P2003), o con la info recién en
// `meta.driverAdapterError.cause`, o incluso como error crudo de pg (SQLSTATE).
// Y si el cliente de Prisma no está generado, `Prisma` es undefined en runtime y
// `error instanceof Prisma.PrismaClientKnownRequestError` revienta con un 500.
// Mirar las propiedades es más robusto que mirar la clase.

export type CodigoErrorPrisma = "P2002" | "P2003";

const KIND_ADAPTER: Record<CodigoErrorPrisma, string> = {
  P2002: "UniqueConstraintViolation",
  P2003: "ForeignKeyConstraintViolation",
};

// Códigos SQLSTATE de PostgreSQL
const SQLSTATE: Record<CodigoErrorPrisma, string> = {
  P2002: "23505", // unique_violation
  P2003: "23503", // foreign_key_violation
};

interface ErrorConForma {
  code?: unknown;
  meta?: {
    driverAdapterError?: {
      cause?: { kind?: unknown; originalCode?: unknown };
    };
  };
  cause?: { code?: unknown };
}

export function esErrorPrisma(error: unknown, codigo: CodigoErrorPrisma): boolean {
  if (typeof error !== "object" || error === null) return false;
  const e = error as ErrorConForma;

  if (e.code === codigo || e.code === SQLSTATE[codigo]) return true;

  const causa = e.meta?.driverAdapterError?.cause;
  if (causa?.kind === KIND_ADAPTER[codigo]) return true;
  if (causa?.originalCode === SQLSTATE[codigo]) return true;

  return e.cause?.code === SQLSTATE[codigo];
}

export function esErrorTablaInexistente(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const e = error as ErrorConForma;
  const causa = e.meta?.driverAdapterError?.cause;
  return causa?.kind === "TableDoesNotExist" || causa?.originalCode === "42P01" || e.code === "42P01";
}
