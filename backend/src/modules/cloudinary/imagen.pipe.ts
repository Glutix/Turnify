import {
  BadRequestException,
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
  type PipeTransform,
} from "@nestjs/common";

export const TAMANO_MAXIMO_IMAGEN = 5 * 1024 * 1024;

export class ImagenPipe implements PipeTransform<
  Express.Multer.File | undefined,
  Promise<Express.Multer.File>
> {
  // El tamaño se valida primero: es barato y evita analizar archivos enormes.
  private readonly validador = new ParseFilePipe({
    fileIsRequired: false,
    validators: [
      new MaxFileSizeValidator({
        maxSize: TAMANO_MAXIMO_IMAGEN,
        errorMessage: "La imagen no puede superar los 5 MB",
      }),
      new FileTypeValidator({
        fileType: /^image\/(jpeg|png|webp)$/,
        errorMessage:
          "El formato de la imagen no es compatible. Usá JPG, PNG o WebP",
      }),
    ],
    exceptionFactory: (mensaje) => new BadRequestException(mensaje),
  });

  async transform(
    archivo: Express.Multer.File | undefined,
  ): Promise<Express.Multer.File> {
    if (!archivo) {
      throw new BadRequestException(
        'Falta el archivo de la imagen (campo "imagen")',
      );
    }
    return this.validador.transform(archivo);
  }
}
