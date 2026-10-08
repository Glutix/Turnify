import { esErrorPrisma, esErrorTablaInexistente } from "./prisma-errors.util";

describe("prisma-errors.util", () => {
  describe("esErrorPrisma", () => {
    it("reconoce el código P2002 / P2003", () => {
      expect(esErrorPrisma({ code: "P2002" }, "P2002")).toBe(true);
      expect(esErrorPrisma({ code: "P2003" }, "P2003")).toBe(true);
    });

    it("no confunde un código con otro", () => {
      expect(esErrorPrisma({ code: "P2002" }, "P2003")).toBe(false);
    });

    it("reconoce la forma del driver adapter (meta.driverAdapterError.cause.kind)", () => {
      const error = { meta: { driverAdapterError: { cause: { kind: "ForeignKeyConstraintViolation" } } } };
      expect(esErrorPrisma(error, "P2003")).toBe(true);
      expect(esErrorPrisma(error, "P2002")).toBe(false);
    });

    it("reconoce el SQLSTATE crudo de Postgres", () => {
      expect(esErrorPrisma({ code: "23503" }, "P2003")).toBe(true);
      expect(esErrorPrisma({ code: "23505" }, "P2002")).toBe(true);
      expect(
        esErrorPrisma({ meta: { driverAdapterError: { cause: { originalCode: "23503" } } } }, "P2003"),
      ).toBe(true);
    });

    it("devuelve false para valores que no son errores", () => {
      expect(esErrorPrisma(null, "P2003")).toBe(false);
      expect(esErrorPrisma("texto", "P2003")).toBe(false);
      expect(esErrorPrisma(new Error("x"), "P2003")).toBe(false);
    });
  });

  describe("esErrorTablaInexistente", () => {
    it("reconoce TableDoesNotExist y 42P01", () => {
      expect(
        esErrorTablaInexistente({ meta: { driverAdapterError: { cause: { kind: "TableDoesNotExist" } } } }),
      ).toBe(true);
      expect(esErrorTablaInexistente({ code: "42P01" })).toBe(true);
      expect(esErrorTablaInexistente(new Error("x"))).toBe(false);
    });
  });
});
