# Turnify
Turnify es una aplicación web para la gestión integral de un salón de belleza. Permite administrar turnos, servicios, categorías, portafolio y productos. Los clientes pueden reservar turnos sin registro previo y gestionar su perfil mediante OTP. Incluye notificaciones por WhatsApp y módulo de e-commerce.



```bash
turnify/
├── apps/                          # Aplicaciones del sistema
│   ├── frontend/                  # React + Vite + TypeScript
│   └── backend/                   # NestJS + Prisma + TypeScript
├── docs/                          # Documentación del proyecto
├── .gitignore                     # Archivos ignorados por Git
├── .env.example                   # Variables de entorno de referencia
└── README.md                      # Descripción general del proyecto
```

```bash
frontend/
├── public/                        # Archivos estáticos (favicon, imágenes base)
├── src/
│   ├── assets/                    # Imágenes, íconos, fuentes locales
│   ├── components/                # Componentes reutilizables
│   │   ├── ui/                    # Componentes genéricos (Button, Input, Modal...)
│   │   └── shared/                # Componentes compartidos entre páginas (Navbar, Footer...)
│   ├── pages/                     # Vistas/páginas del sistema
│   │   ├── public/                # Vistas accesibles sin autenticación
│   │   │   ├── Home.tsx           # Landing page
│   │   │   ├── Servicios.tsx      # Catálogo de servicios
│   │   │   ├── Portafolio.tsx     # Portafolio de trabajos
│   │   │   ├── Productos.tsx      # Catálogo de productos
│   │   │   └── ReservarTurno.tsx  # Flujo de reserva de turno
│   │   ├── cliente/               # Vistas del cliente autenticado
│   │   │   ├── MisTurnos.tsx      # Historial y gestión de turnos
│   │   │   ├── MiPerfil.tsx       # Perfil y datos personales
│   │   │   ├── Carrito.tsx        # Carrito de compras
│   │   │   └── MisCompras.tsx     # Historial de compras
│   │   └── admin/                 # Panel de administración
│   │       ├── Dashboard.tsx      # Vista principal del panel
│   │       ├── Agenda.tsx         # Gestión de agenda y turnos
│   │       ├── Servicios.tsx      # Gestión de servicios
│   │       ├── Portafolio.tsx     # Gestión del portafolio
│   │       ├── Productos.tsx      # Gestión de productos
│   │       ├── Pedidos.tsx        # Gestión de pedidos
│   │       ├── Horarios.tsx       # Configuración de franjas horarias
│   │       └── Clientes.tsx       # Historial de clientes
│   ├── hooks/                     # Custom hooks de React
│   │   ├── useAuth.ts             # Hook de autenticación
│   │   ├── useTurnos.ts           # Hook para gestión de turnos
│   │   └── useCarrito.ts          # Hook para el carrito de compras
│   ├── services/                  # Llamadas a la API REST
│   │   ├── api.ts                 # Instancia base de axios/fetch con interceptores
│   │   ├── auth.service.ts        # Endpoints de autenticación
│   │   ├── turnos.service.ts      # Endpoints de turnos
│   │   ├── servicios.service.ts   # Endpoints de servicios
│   │   ├── productos.service.ts   # Endpoints de productos
│   │   └── pedidos.service.ts     # Endpoints de pedidos
│   ├── context/                   # Contextos globales de React
│   │   ├── AuthContext.tsx        # Contexto de autenticación y sesión
│   │   └── CarritoContext.tsx     # Contexto del carrito de compras
│   ├── router/                    # Configuración de rutas
│   │   ├── index.tsx              # Definición de todas las rutas
│   │   ├── PrivateRoute.tsx       # Ruta protegida para clientes autenticados
│   │   └── AdminRoute.tsx         # Ruta protegida para la administradora
│   ├── types/                     # Tipos e interfaces TypeScript
│   │   ├── usuario.types.ts       # Tipos relacionados a usuarios
│   │   ├── turno.types.ts         # Tipos relacionados a turnos
│   │   └── pedido.types.ts        # Tipos relacionados a pedidos
│   ├── utils/                     # Funciones utilitarias
│   │   ├── fecha.utils.ts         # Formateo y cálculo de fechas
│   │   └── validaciones.utils.ts  # Validaciones de formularios
│   ├── App.tsx                    # Componente raíz
│   └── main.tsx                   # Punto de entrada de la aplicación
├── .env.example                   # Variables de entorno de referencia
├── index.html                     # HTML base de Vite
├── vite.config.ts                 # Configuración de Vite
├── tsconfig.json                  # Configuración de TypeScript
└── package.json                   # Dependencias del frontend
```


```bash
backend/
├── prisma/                        # Configuración y migraciones de Prisma
│   ├── schema.prisma              # Esquema de la base de datos
│   ├── migrations/                # Historial de migraciones generadas por Prisma
│   └── seed.ts                    # Datos iniciales (admin, categorías, servicios)
├── src/
│   ├── modules/                   # Módulos de NestJS (uno por dominio)
│   │   ├── auth/                  # Autenticación OTP y JWT
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.module.ts
│   │   ├── usuarios/              # Gestión de usuarios y perfiles
│   │   │   ├── usuarios.controller.ts
│   │   │   ├── usuarios.service.ts
│   │   │   ├── usuarios.module.ts
│   │   │   └── dto/               # Data Transfer Objects
│   │   │       ├── crear-usuario.dto.ts
│   │   │       └── actualizar-usuario.dto.ts
│   │   ├── turnos/                # Reservas, cancelaciones, reprogramaciones
│   │   │   ├── turnos.controller.ts
│   │   │   ├── turnos.service.ts
│   │   │   ├── turnos.module.ts
│   │   │   └── dto/
│   │   │       ├── crear-turno.dto.ts
│   │   │       └── reprogramar-turno.dto.ts
│   │   ├── servicios/             # Catálogo de servicios y categorías
│   │   │   ├── servicios.controller.ts
│   │   │   ├── servicios.service.ts
│   │   │   ├── servicios.module.ts
│   │   │   └── dto/
│   │   │       └── crear-servicio.dto.ts
│   │   ├── horarios/              # Franjas horarias y excepciones
│   │   │   ├── horarios.controller.ts
│   │   │   ├── horarios.service.ts
│   │   │   ├── horarios.module.ts
│   │   │   └── dto/
│   │   │       └── crear-franja.dto.ts
│   │   ├── portafolio/            # Imágenes y categorías del portafolio
│   │   │   ├── portafolio.controller.ts
│   │   │   ├── portafolio.service.ts
│   │   │   └── portafolio.module.ts
│   │   ├── productos/             # Catálogo de productos del e-commerce
│   │   │   ├── productos.controller.ts
│   │   │   ├── productos.service.ts
│   │   │   ├── productos.module.ts
│   │   │   └── dto/
│   │   │       └── crear-producto.dto.ts
│   │   ├── pedidos/               # Órdenes de compra del e-commerce
│   │   │   ├── pedidos.controller.ts
│   │   │   ├── pedidos.service.ts
│   │   │   ├── pedidos.module.ts
│   │   │   └── dto/
│   │   │       └── crear-pedido.dto.ts
│   │   └── notificaciones/        # Envío y registro de notificaciones WhatsApp
│   │       ├── notificaciones.service.ts
│   │       └── notificaciones.module.ts
│   ├── common/                    # Código compartido entre módulos
│   │   ├── guards/                # Guards de autenticación y autorización
│   │   │   ├── jwt.guard.ts       # Verifica token JWT
│   │   │   └── admin.guard.ts     # Verifica que el usuario sea admin
│   │   ├── decorators/            # Decoradores personalizados
│   │   │   └── usuario-actual.decorator.ts  # Extrae el usuario del token JWT
│   │   ├── filters/               # Filtros de excepciones globales
│   │   │   └── http-exception.filter.ts
│   │   └── pipes/                 # Pipes de validación global
│   │       └── validacion.pipe.ts
│   ├── config/                    # Configuración centralizada
│   │   ├── database.config.ts     # Configuración de PostgreSQL/Prisma
│   │   ├── jwt.config.ts          # Configuración de JWT
│   │   └── cloudinary.config.ts   # Configuración de Cloudinary
│   ├── app.module.ts              # Módulo raíz de NestJS
│   └── main.ts                    # Punto de entrada del servidor
├── .env.example                   # Variables de entorno de referencia
├── nest-cli.json                  # Configuración del CLI de NestJS
├── tsconfig.json                  # Configuración de TypeScript
└── package.json                   # Dependencias del backend
```