// El Module es el "contenedor" del módulo.
// Registra el Controller y el Service para que NestJS
// sepa que existen y pueda inyectarlos automáticamente.

import { Module } from "@nestjs/common";
import { CategoriasServicioController } from "./categorias-servicio.controller";
import { CategoriasServicioService } from "./categorias-servicio.service";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [CategoriasServicioController], // Maneja las solicitudes HTTP
  providers: [CategoriasServicioService], // Contiene la lógica de negocio
  exports: [CategoriasServicioService], // Permite que ServiciosModule use este servicio
})
export class CategoriasServicioModule {}
