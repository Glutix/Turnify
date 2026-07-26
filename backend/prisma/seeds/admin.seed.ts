// prisma/seeds/admin.seed.ts

import { RolUsuario } from "@prisma/client";
import { prisma } from "./prisma";

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
  const telefono = process.env.ADMIN_TELEFONO;

  if (!nombre) {
    throw new Error("Falta la variable de entorno ADMIN_NOMBRE.");
  }

  if (!apellido) {
    throw new Error("Falta la variable de entorno ADMIN_APELLIDO.");
  }

  if (!telefono) {
    throw new Error("Falta la variable de entorno ADMIN_TELEFONO.");
  }

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
    return;
  }

  await prisma.usuario.create({
    data: {
      nombre,
      apellido,
      telefono,
      rol: RolUsuario.admin,
      perfil_completo: true,
    },
  });

  console.log(`✓ Administrador "${nombre} ${apellido}" creado correctamente.`);
}
