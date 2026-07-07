// El Module es el "contenedor" del módulo.
// Registra el Controller y el Service para que NestJS
// sepa que existen y pueda inyectarlos automáticamente.

import { Module } from '@nestjs/common';
import { UsuariosController } from './usuarios.controller';
import { UsuariosService } from './usuarios.service';

@Module({
  controllers: [UsuariosController], // Maneja las solicitudes HTTP
  providers: [UsuariosService],    // Contiene la lógica de negocio
  // Utilizarlo si es necesario
  exports: [UsuariosService],    // Permite que otros módulos usen este servicio
})
export class UsuariosModule { }