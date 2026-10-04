import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { CambiarRolUsuarioDto } from "./cambiar-rol-usuario.dto";

describe("CambiarRolUsuarioDto", () => {
  it.each(["admin", "cliente"])("acepta el rol %s", async (rol) => {
    const dto = plainToInstance(CambiarRolUsuarioDto, { rol });
    expect(await validate(dto)).toHaveLength(0);
  });

  it("rechaza un rol inexistente", async () => {
    const dto = plainToInstance(CambiarRolUsuarioDto, { rol: "superadmin" });
    expect(await validate(dto)).toHaveLength(1);
  });

  it("rechaza si falta el rol", async () => {
    const dto = plainToInstance(CambiarRolUsuarioDto, {});
    expect(await validate(dto)).toHaveLength(1);
  });
});
