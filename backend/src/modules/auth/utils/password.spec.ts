import { hashearPassword, verificarPassword } from "./password";

describe("password (scrypt)", () => {
  it("verifica la contraseña correcta y rechaza una incorrecta", async () => {
    const hash = await hashearPassword("MiClaveSegura1");
    await expect(verificarPassword("MiClaveSegura1", hash)).resolves.toBe(true);
    await expect(verificarPassword("miclavesegura1", hash)).resolves.toBe(false);
  });

  it("el hash no contiene la contraseña y es distinto cada vez (salt)", async () => {
    const a = await hashearPassword("MiClaveSegura1");
    const b = await hashearPassword("MiClaveSegura1");
    expect(a).not.toContain("MiClaveSegura1");
    expect(a).not.toEqual(b);
    expect(a.startsWith("scrypt$")).toBe(true);
  });

  it("un hash con formato inválido devuelve false (no tira error)", async () => {
    await expect(verificarPassword("x", "texto-cualquiera")).resolves.toBe(false);
    await expect(verificarPassword("x", "bcrypt$1$2$3$4$5")).resolves.toBe(false);
  });
});
