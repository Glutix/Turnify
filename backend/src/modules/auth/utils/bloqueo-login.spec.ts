import { BloqueoLogin } from "./bloqueo-login";

describe("BloqueoLogin", () => {
  let ahora: number;
  let bloqueo: BloqueoLogin;
  const MIN = 60 * 1000;

  beforeEach(() => {
    ahora = 1_000_000;
    bloqueo = new BloqueoLogin(5, 15 * MIN, () => ahora);
  });

  it("cuenta los intentos restantes y bloquea al 5º fallo", () => {
    expect(bloqueo.registrarFallo("a")).toMatchObject({ bloqueado: false, intentosRestantes: 4 });
    for (let i = 0; i < 3; i++) bloqueo.registrarFallo("a");
    const quinto = bloqueo.registrarFallo("a");
    expect(quinto).toMatchObject({ bloqueado: true, intentosRestantes: 0 });
    expect(bloqueo.segundosRestantes("a")).toBe(15 * 60);
  });

  it("el bloqueo es por clave: otro teléfono no se ve afectado", () => {
    for (let i = 0; i < 5; i++) bloqueo.registrarFallo("a");
    expect(bloqueo.segundosRestantes("b")).toBe(0);
  });

  it("se libera pasados los 15 minutos", () => {
    for (let i = 0; i < 5; i++) bloqueo.registrarFallo("a");
    ahora += 15 * MIN + 1;
    expect(bloqueo.segundosRestantes("a")).toBe(0);
    // y arranca de cero
    expect(bloqueo.registrarFallo("a")).toMatchObject({ bloqueado: false, intentosRestantes: 4 });
  });

  it("un login correcto (limpiar) reinicia el contador", () => {
    bloqueo.registrarFallo("a");
    bloqueo.registrarFallo("a");
    bloqueo.limpiar("a");
    expect(bloqueo.registrarFallo("a").intentosRestantes).toBe(4);
  });

  it("los fallos viejos (fuera de la ventana) no se acumulan", () => {
    for (let i = 0; i < 4; i++) bloqueo.registrarFallo("a");
    ahora += 16 * MIN;
    expect(bloqueo.registrarFallo("a")).toMatchObject({ bloqueado: false, intentosRestantes: 4 });
  });
});
