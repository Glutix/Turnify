import { GUARDS_METADATA } from "@nestjs/common/constants";
import { RolUsuario } from "@prisma/client";
import { ProductosController } from "./productos.controller";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { ROLES_KEY } from "../auth/decorators/roles.decorator";

const rutas = Object.getOwnPropertyNames(ProductosController.prototype).filter(
  (nombre) => nombre !== "constructor",
);

describe("ProductosController", () => {
  it("expone las 5 rutas del CRUD", () => {
    expect(rutas).toHaveLength(5);
  });

  it.each(rutas)("%s exige JWT y rol admin", (nombre) => {
    const handler =
      ProductosController.prototype[nombre as keyof ProductosController];

    expect(Reflect.getMetadata(GUARDS_METADATA, handler)).toEqual([
      JwtAuthGuard,
      RolesGuard,
    ]);
    expect(Reflect.getMetadata(ROLES_KEY, handler)).toEqual([RolUsuario.admin]);
  });
});
