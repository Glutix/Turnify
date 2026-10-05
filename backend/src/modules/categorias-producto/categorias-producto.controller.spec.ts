import { GUARDS_METADATA } from "@nestjs/common/constants";
import { RolUsuario } from "@prisma/client";
import { CategoriasProductoController } from "./categorias-producto.controller";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { ROLES_KEY } from "../auth/decorators/roles.decorator";

const RUTAS_ADMIN = ["create", "update", "remove"];
const RUTAS_PUBLICAS = ["findAll", "findOne"];

const handlerDe = (nombre: string) =>
  CategoriasProductoController.prototype[
    nombre as keyof CategoriasProductoController
  ];

describe("CategoriasProductoController", () => {
  it("todas las rutas están clasificadas como públicas o de admin", () => {
    const rutas = Object.getOwnPropertyNames(
      CategoriasProductoController.prototype,
    ).filter((nombre) => nombre !== "constructor");

    expect(rutas.sort()).toEqual([...RUTAS_ADMIN, ...RUTAS_PUBLICAS].sort());
  });

  it.each(RUTAS_ADMIN)("%s exige JWT y rol admin", (nombre) => {
    const handler = handlerDe(nombre);

    expect(Reflect.getMetadata(GUARDS_METADATA, handler)).toEqual([
      JwtAuthGuard,
      RolesGuard,
    ]);
    expect(Reflect.getMetadata(ROLES_KEY, handler)).toEqual([RolUsuario.admin]);
  });

  it.each(RUTAS_PUBLICAS)(
    "%s es pública (el catálogo la necesita)",
    (nombre) => {
      expect(
        Reflect.getMetadata(GUARDS_METADATA, handlerDe(nombre)),
      ).toBeUndefined();
      expect(
        Reflect.getMetadata(GUARDS_METADATA, CategoriasProductoController),
      ).toBeUndefined();
    },
  );
});
