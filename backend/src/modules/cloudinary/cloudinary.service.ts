import {
  BadGatewayException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from "@nestjs/common";
import { v2 as cloudinary } from "cloudinary";

export interface ImagenSubida {
  url: string;
  publicId: string;
}

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  async subirImagen(buffer: Buffer, carpeta: string): Promise<ImagenSubida> {
    this.configurar();

    return new Promise<ImagenSubida>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: carpeta, resource_type: "image" },
        (error, resultado) => {
          if (error || !resultado) {
            this.logger.error(
              `Falló la subida: ${error?.message ?? "sin resultado"}`,
            );
            return reject(
              new BadGatewayException("No se pudo subir la imagen"),
            );
          }
          resolve({ url: resultado.secure_url, publicId: resultado.public_id });
        },
      );
      stream.end(buffer);
    });
  }

  async eliminarImagen(publicId: string): Promise<void> {
    this.configurar();

    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
    } catch (error) {
      this.logger.error(`Falló el borrado de ${publicId}: ${String(error)}`);
      throw new BadGatewayException("No se pudo eliminar la imagen");
    }
  }

  // Las credenciales son opcionales: el backend arranca sin ellas y recién
  // falla (503) cuando alguien intenta subir o borrar una imagen.
  private configurar() {
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
      process.env;

    if (
      !CLOUDINARY_CLOUD_NAME ||
      !CLOUDINARY_API_KEY ||
      !CLOUDINARY_API_SECRET
    ) {
      throw new ServiceUnavailableException(
        "La subida de imágenes no está configurada en el servidor",
      );
    }

    cloudinary.config({
      cloud_name: CLOUDINARY_CLOUD_NAME,
      api_key: CLOUDINARY_API_KEY,
      api_secret: CLOUDINARY_API_SECRET,
      secure: true,
    });
  }
}
