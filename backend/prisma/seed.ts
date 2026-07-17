import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

console.log("Console 1 >", process.cwd());
console.log("Console 1 >", process.env.DATABASE_URL);

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// ⚠️ Precios ilustrativos, solo para ver estilos en frontend admin/público.
// La administradora debe ajustarlos a valores reales desde el panel /admin/servicios.

async function main() {
  console.log("Iniciando seed de categorías y servicios...");

  const categorias = [
    {
      nombre: "Pigmentación",
      descripcion: "Micropigmentación de cejas y labios",
      servicios: [
        { nombre: "Microblading", duracion_minutos: 100, precio: 45000 },
        { nombre: "Powder Brow", duracion_minutos: 120, precio: 50000 },
        { nombre: "Hybrid Brows", duracion_minutos: 120, precio: 52000 },
        {
          nombre: "Pigmentación de labios",
          duracion_minutos: 120,
          precio: 55000,
        },
      ],
    },
    {
      nombre: "Cejas y pestañas",
      descripcion: "Diseño y mantenimiento de cejas y pestañas",
      servicios: [
        { nombre: "Perfilado de cejas", duracion_minutos: 35, precio: 8000 },
        { nombre: "Tinte de cejas", duracion_minutos: 45, precio: 9000 },
        { nombre: "Henna de cejas", duracion_minutos: 45, precio: 10000 },
        { nombre: "Lifting de pestañas", duracion_minutos: 60, precio: 18000 },
      ],
    },
    {
      nombre: "Uñas",
      descripcion: "Manicura y técnicas de uñas esculpidas",
      servicios: [
        {
          nombre: "Esmaltado semipermanente",
          duracion_minutos: 45,
          precio: 12000,
        },
        { nombre: "Capping", duracion_minutos: 75, precio: 18000 },
        { nombre: "Soft gel", duracion_minutos: 140, precio: 25000 },
        { nombre: "Poligel", duracion_minutos: 120, precio: 26000 },
      ],
    },
    {
      nombre: "Podoestética",
      descripcion: "Cuidado y esmaltado de pies",
      servicios: [
        {
          nombre: "Esmaltado tradicional (pies)",
          duracion_minutos: 45,
          precio: 9000,
        },
        {
          nombre: "Esmaltado semipermanente (pies)",
          duracion_minutos: 45,
          precio: 13000,
        },
      ],
    },
    {
      nombre: "Depilación",
      descripcion: "Depilación con cera por zona",
      servicios: [
        { nombre: "Depilación rostro", duracion_minutos: 35, precio: 6000 },
        { nombre: "Depilación bozo", duracion_minutos: 15, precio: 3000 },
        { nombre: "Depilación axilas", duracion_minutos: 15, precio: 4000 },
        { nombre: "Depilación piernas", duracion_minutos: 35, precio: 9000 },
        { nombre: "Depilación cavado", duracion_minutos: 40, precio: 10000 },
        { nombre: "Depilación espalda", duracion_minutos: 25, precio: 7000 },
        { nombre: "Depilación abdomen", duracion_minutos: 15, precio: 5000 },
        { nombre: "Depilación brazos", duracion_minutos: 15, precio: 5000 },
      ],
    },
  ];

  for (const cat of categorias) {
    const categoriaCreada = await prisma.categoriaServicio.upsert({
      where: { nombre: cat.nombre },
      update: {},
      create: {
        nombre: cat.nombre,
        descripcion: cat.descripcion,
      },
    });

    console.log(`Categoría: ${categoriaCreada.nombre}`);

    for (const servicio of cat.servicios) {
      const existente = await prisma.servicio.findFirst({
        where: { nombre: servicio.nombre, categoria_id: categoriaCreada.id },
      });

      if (existente) {
        console.log(`  - ${servicio.nombre} (ya existía, se omite)`);
        continue;
      }

      await prisma.servicio.create({
        data: {
          categoria_id: categoriaCreada.id,
          nombre: servicio.nombre,
          duracion_minutos: servicio.duracion_minutos,
          precio: servicio.precio,
          activo: true,
        },
      });

      console.log(`  - ${servicio.nombre} creado`);
    }
  }

  console.log("Seed finalizado.");
}

main()
  .catch((e) => {
    console.error("Error en el seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
