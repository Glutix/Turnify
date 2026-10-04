// El Module es el "contenedor" del módulo.
// Registra el Controller y el Service para que NestJS
// sepa que existen y pueda inyectarlos automáticamente.
// Importa CategoriasServicioModule para poder inyectar
// CategoriasServicioService y validar categoria_id.

import { Module } from "@nestjs/common";
import { ServiciosController } from "./servicios.controller";
import { ServiciosService } from "./servicios.service";
import { CategoriasServicioModule } from "../categorias-servicio/categorias-servicio.module";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [CategoriasServicioModule, AuthModule],
  controllers: [ServiciosController],
  providers: [ServiciosService],
  exports: [ServiciosService],
})
export class ServiciosModule {}
