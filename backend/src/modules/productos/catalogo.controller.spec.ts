import { GUARDS_METADATA } from "@nestjs/common/constants";
import { CatalogoController } from "./catalogo.controller";

const rutas = Object.getOwnPropertyNames(CatalogoController.prototype).filter(
  (nombre) => nombre !== "constructor",
);

describe("CatalogoController", () => {
  it("expone las 2 rutas del catálogo", () => {
    expect(rutas).toHaveLength(2);
  });

  it.each(rutas)("%s es pública (sin guards)", (nombre) => {
    const handler =
      CatalogoController.prototype[nombre as keyof CatalogoController];

    expect(Reflect.getMetadata(GUARDS_METADATA, handler)).toBeUndefined();
  });

  it("no tiene guards a nivel de clase", () => {
    expect(
      Reflect.getMetadata(GUARDS_METADATA, CatalogoController),
    ).toBeUndefined();
  });
});
