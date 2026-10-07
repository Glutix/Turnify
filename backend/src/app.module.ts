import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./modules/auth/auth.module";
import { UsuariosModule } from "./modules/usuarios/usuarios.module";
import { TurnosModule } from "./modules/turnos/turnos.module";
import { ServiciosModule } from "./modules/servicios/servicios.module";
import { HorariosModule } from "./modules/horarios/horarios.module";
import { PortafolioModule } from "./modules/portafolio/portafolio.module";
import { ProductosModule } from "./modules/productos/productos.module";
import { PedidosModule } from "./modules/pedidos/pedidos.module";
import { NotificacionesModule } from "./modules/notificaciones/notificaciones.module";
import { PrismaModule } from "./prisma/prisma.module";
import { CategoriasServicioModule } from "./modules/categorias-servicio/categorias-servicio.module";
import { CategoriasProductoModule } from "./modules/categorias-producto/categorias-producto.module";
@Module({
  imports: [
    AuthModule,
    UsuariosModule,
    TurnosModule,
    ServiciosModule,
    HorariosModule,
    PortafolioModule,
    ProductosModule,
    PedidosModule,
    NotificacionesModule,
    PrismaModule,
    CategoriasServicioModule,
    CategoriasProductoModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
