import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { ListarUsuariosDto } from "./listar-usuarios.dto";

describe("ListarUsuariosDto", () => {
  it("acepta filtros vacíos", async () => {
    const dto = plainToInstance(ListarUsuariosDto, {});
    expect(await validate(dto)).toHaveLength(0);
  });

  it("acepta búsqueda y rol válido", async () => {
    const dto = plainToInstance(ListarUsuariosDto, { busqueda: "ana", rol: "cliente" });
    expect(await validate(dto)).toHaveLength(0);
  });

  it("rechaza un rol inexistente", async () => {
    const dto = plainToInstance(ListarUsuariosDto, { rol: "superadmin" });
    const errores = await validate(dto);
    expect(errores).toHaveLength(1);
    expect(errores[0].property).toBe("rol");
  });
});
