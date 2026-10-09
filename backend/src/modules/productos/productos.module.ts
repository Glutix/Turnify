import { Module } from "@nestjs/common";
import { ProductosController } from "./productos.controller";
import { ProductosService } from "./productos.service";
import { AuthModule } from "../auth/auth.module";
import { CategoriasProductoModule } from "../categorias-producto/categorias-producto.module";
import { CatalogoController } from "./catalogo.controller";
import { CloudinaryModule } from "../cloudinary/cloudinary.module";

@Module({
  imports: [AuthModule, CategoriasProductoModule, CloudinaryModule],
  controllers: [ProductosController, CatalogoController],
  providers: [ProductosService],
})
export class ProductosModule {}
