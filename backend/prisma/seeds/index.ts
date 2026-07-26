import { prisma } from "./prisma";
import { seedCategoriasServicios } from "./categorias-servicios.seed";
import { seedAdmin } from "./admin.seed";

async function main() {
  console.log("=================================");
  console.log("Iniciando seeds...");
  console.log("=================================");

  await seedCategoriasServicios();

  await seedAdmin();

  console.log("=================================");
  console.log("Seeds finalizados correctamente.");
  console.log("=================================");
}

main()
  .catch((error) => {
    console.error("Error ejecutando los seeds:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
