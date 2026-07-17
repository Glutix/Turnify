import "dotenv/config";
import { PrismaClient, RolUsuario } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const telefono = "3644-106124";

  const admin = await prisma.usuario.upsert({
    where: {
      telefono,
    },

    update: {
      nombre: "Admin",
      apellido: "Admin",
      rol: RolUsuario.admin,
      perfil_completo: true,
    },

    create: {
      nombre: "Admin",
      apellido: "Admin",
      telefono,
      rol: RolUsuario.admin,
      perfil_completo: true,
    },
  });

  console.log("Administrador creado:");
  console.log(admin);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
