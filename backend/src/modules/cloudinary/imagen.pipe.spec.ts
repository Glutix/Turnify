import { BadRequestException } from "@nestjs/common";
import { ImagenPipe, TAMANO_MAXIMO_IMAGEN } from "./imagen.pipe";

// La validación del formato usa un paquete que Jest no carga sin
// --experimental-vm-modules: acá solo se prueba lo que no depende de eso.
describe("ImagenPipe", () => {
  const pipe = new ImagenPipe();

  it("rechaza si no llega ningún archivo", async () => {
    await expect(pipe.transform(undefined)).rejects.toThrow(
      BadRequestException,
    );
  });

  it("rechaza una imagen que supera el tamaño máximo", async () => {
    const grande = {
      buffer: Buffer.alloc(0),
      mimetype: "image/jpeg",
      size: TAMANO_MAXIMO_IMAGEN + 1,
    } as Express.Multer.File;

    await expect(pipe.transform(grande)).rejects.toThrow(
      "La imagen no puede superar los 5 MB",
    );
  });
});
