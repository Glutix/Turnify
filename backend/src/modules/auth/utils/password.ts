import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

// Hash de contraseñas con scrypt (módulo `crypto` de Node: no agrega dependencias).
// Formato guardado: scrypt$N$r$p$salt(base64)$hash(base64) — los parámetros viajan
// dentro del hash, así se pueden subir a futuro sin invalidar los hashes viejos.

const N = 16384;
const R = 8;
const P = 1;
const LONGITUD_CLAVE = 64;

function derivar(
  password: string,
  salt: Buffer,
  n: number,
  r: number,
  p: number,
  longitud: number,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, longitud, { N: n, r, p }, (error, clave) => {
      if (error) reject(error);
      else resolve(clave);
    });
  });
}

export async function hashearPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const clave = await derivar(password, salt, N, R, P, LONGITUD_CLAVE);
  return ["scrypt", N, R, P, salt.toString("base64"), clave.toString("base64")].join("$");
}

export async function verificarPassword(password: string, almacenado: string): Promise<boolean> {
  const partes = almacenado.split("$");
  if (partes.length !== 6 || partes[0] !== "scrypt") return false;

  const [, n, r, p, saltB64, claveB64] = partes;
  const esperada = Buffer.from(claveB64, "base64");

  try {
    const obtenida = await derivar(
      password,
      Buffer.from(saltB64, "base64"),
      Number(n),
      Number(r),
      Number(p),
      esperada.length,
    );
    return obtenida.length === esperada.length && timingSafeEqual(obtenida, esperada);
  } catch {
    return false;
  }
}
