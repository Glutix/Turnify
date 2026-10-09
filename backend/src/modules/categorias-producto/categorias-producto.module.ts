import { Module } from "@nestjs/common";
import { CategoriasProductoController } from "./categorias-producto.controller";
import { CategoriasProductoService } from "./categorias-producto.service";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [CategoriasProductoController],
  providers: [CategoriasProductoService],
  exports: [CategoriasProductoService],
})
export class CategoriasProductoModule {}
