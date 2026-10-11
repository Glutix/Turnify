import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
} from "@nestjs/common";
import { ApiTags, ApiBody, ApiConsumes } from "@nestjs/swagger";
import { ProductosService } from "./productos.service";
import { CrearProductoDto } from "./dto/crear-producto.dto";
import { ActualizarProductoDto } from "./dto/actualizar-producto.dto";
import { ActualizarStockProductoDto } from "./dto/actualizar-stock-producto.dto";
import { SoloAdmin } from "../auth/decorators/auth.decorators";
import { FileInterceptor } from "@nestjs/platform-express";
import { ImagenPipe } from "../cloudinary/imagen.pipe";

@ApiTags("productos")
@Controller("productos")
export class ProductosController {
  constructor(private readonly productosService: ProductosService) {}

  @SoloAdmin()
  @Get()
  findAll() {
    return this.productosService.findAll();
  }

  @SoloAdmin()
  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.productosService.findOne(id);
  }

  @SoloAdmin()
  @Post()
  create(@Body() dto: CrearProductoDto) {
    return this.productosService.create(dto);
  }

  @SoloAdmin()
  @Patch(":id")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: ActualizarProductoDto,
  ) {
    return this.productosService.update(id, dto);
  }

  @SoloAdmin()
  @Patch(":id/stock")
  actualizarStock(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: ActualizarStockProductoDto,
  ) {
    return this.productosService.actualizarStock(id, dto);
  }

  //! Rutas de Cloudinary
  @SoloAdmin()
  @Post(":id/imagenes")
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      required: ["imagen"],
      properties: { imagen: { type: "string", format: "binary" } },
    },
  })
  @UseInterceptors(FileInterceptor("imagen"))
  agregarImagen(
    @Param("id", ParseIntPipe) id: number,
    @UploadedFile(new ImagenPipe()) archivo: Express.Multer.File,
  ) {
    return this.productosService.agregarImagen(id, archivo);
  }

  @SoloAdmin()
  @Delete(":id/imagenes/:imagenId")
  eliminarImagen(
    @Param("id", ParseIntPipe) id: number,
    @Param("imagenId", ParseIntPipe) imagenId: number,
  ) {
    return this.productosService.eliminarImagen(id, imagenId);
  }

  @SoloAdmin()
  @Patch(":id/imagenes/:imagenId/principal")
  marcarImagenPrincipal(
    @Param("id", ParseIntPipe) id: number,
    @Param("imagenId", ParseIntPipe) imagenId: number,
  ) {
    return this.productosService.marcarImagenPrincipal(id, imagenId);
  }

  @SoloAdmin()
  @Put(":id/imagenes/:imagenId")
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      required: ["imagen"],
      properties: { imagen: { type: "string", format: "binary" } },
    },
  })
  @UseInterceptors(FileInterceptor("imagen"))
  reemplazarImagen(
    @Param("id", ParseIntPipe) id: number,
    @Param("imagenId", ParseIntPipe) imagenId: number,
    @UploadedFile(new ImagenPipe()) archivo: Express.Multer.File,
  ) {
    return this.productosService.reemplazarImagen(id, imagenId, archivo);
  }
}
