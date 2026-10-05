// prisma/seeds/admin.seed.ts

import { RolUsuario } from "@prisma/client";
import { prisma } from "./prisma";
import { normalizarTelefono } from "../../src/modules/auth/utils/normalizar-telefono";
import { hashearPassword } from "../../src/modules/auth/utils/password";

/**
 * Crea el administrador inicial del sistema.
 *
 * Este seed garantiza la existencia del administrador definido
 * mediante las variables ADMIN_* del archivo .env.
 *
 * Si el administrador ya existe (identificado por su teléfono),
 * no realiza ninguna acción.
 *
 * Los administradores adicionales deben crearse desde el
 * panel de administración de la aplicación.
 */
export async function seedAdmin() {
  const nombre = process.env.ADMIN_NOMBRE;
  const apellido = process.env.ADMIN_APELLIDO;
  const telefonoCrudo = process.env.ADMIN_TELEFONO;
  // Opcional: si no está, la admin entra solo por OTP hasta que cree su contraseña en "Mi perfil".
  const password = process.env.ADMIN_PASSWORD;

  if (!nombre) {
    throw new Error("Falta la variable de entorno ADMIN_NOMBRE.");
  }

  if (!apellido) {
    throw new Error("Falta la variable de entorno ADMIN_APELLIDO.");
  }

  if (!telefonoCrudo) {
    throw new Error("Falta la variable de entorno ADMIN_TELEFONO.");
  }

  if (password && password.length < 8) {
    throw new Error("ADMIN_PASSWORD debe tener al menos 8 caracteres.");
  }

  // Mismo formato (+549...) que usa el login, para que el admin coincida siempre.
  const telefono = normalizarTelefono(telefonoCrudo);

  console.log("\nVerificando administrador inicial...");

  const adminExistente = await prisma.usuario.findUnique({
    where: {
      telefono,
    },
  });

  if (adminExistente) {
    console.log(
      `✓ El administrador con teléfono ${telefono} ya existe. Se omite la creación.`,
    );
    // Solo se carga la contraseña si todavía no tiene una: nunca pisa la que ya eligió.
    if (password && !adminExistente.password_hash) {
      await prisma.usuario.update({
        where: { id: adminExistente.id },
        data: { password_hash: await hashearPassword(password) },
      });
      console.log("✓ Se cargó la contraseña inicial del administrador.");
    }
    return;
  }

  await prisma.usuario.create({
    data: {
      nombre,
      apellido,
      telefono,
      rol: RolUsuario.admin,
      perfil_completo: true,
      password_hash: password ? await hashearPassword(password) : undefined,
    },
  });

  console.log(`✓ Administrador "${nombre} ${apellido}" creado correctamente.`);
}
