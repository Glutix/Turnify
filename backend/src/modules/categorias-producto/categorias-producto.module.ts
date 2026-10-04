import { Module } from "@nestjs/common";
import { CategoriasProductoController } from "./categorias-producto.controller";
import { CategoriasProductoService } from "./categorias-producto.service";

@Module({
  controllers: [CategoriasProductoController],
  providers: [CategoriasProductoService],
})
export class CategoriasProductoModule {}
