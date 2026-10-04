# Turnify — Backend

API REST del sistema de gestión integral para salón de belleza, desarrollada con NestJS + TypeScript + Prisma + PostgreSQL.

---

## Tecnologías

| Tecnología | Versión         | Uso                                 |
| ---------- | --------------- | ----------------------------------- |
| Node.js    | v18+            | Entorno de ejecución                |
| NestJS     | v11+            | Framework principal                 |
| TypeScript | v5+             | Lenguaje de programación            |
| Prisma     | v7+             | ORM y migraciones                   |
| PostgreSQL | v15+            | Base de datos relacional            |
| pnpm       | v8+             | Gestor de paquetes                  |
| Swagger    | @nestjs/swagger | Documentación interactiva de la API |

---

## Requisitos previos

Antes de continuar, asegurate de tener instalado en tu máquina:

- [Node.js](https://nodejs.org/) v18 o superior
- [pnpm](https://pnpm.io/) v8 o superior
- [PostgreSQL](https://www.postgresql.org/) v15 o superior

Verificá las versiones instaladas ejecutando:

```bash
node -v
pnpm -v
psql --version
```

---

## Instalación y configuración

### 1. Posicionarse en la carpeta del backend

Desde la raíz del monorepo:

```bash
cd backend
```

### 2. Instalar dependencias

```bash
pnpm install
```

### 3. Configurar las variables de entorno

Copiá el archivo de ejemplo:

```bash
cp .env.example .env
```

Abrí el `.env` y completá los valores según tu entorno local:

```env
# ─── BASE DE DATOS ───────────────────────────────────────────
DATABASE_URL="postgresql://postgres:tupassword@localhost:5432/turnify?schema=public"

# ─── FRONTEND ───────────────────────────────────────────
FRONTEND_URL="http://localhost:5173"

# ─── JWT ─────────────────────────────────────────────────────
JWT_SECRET="reemplazar_con_una_clave_secreta_larga_y_segura"
JWT_EXPIRES_IN="7d"

# ─── WHATSAPP BUSINESS API ───────────────────────────────────
WHATSAPP_API_URL=""
WHATSAPP_TOKEN=""
WHATSAPP_PHONE_NUMBER_ID=""

# ─── CLOUDINARY ──────────────────────────────────────────────
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""

# ─── MERCADOPAGO ─────────────────────────────────────────────
MERCADOPAGO_ACCESS_TOKEN=""

# ─── CORS ────────────────────────────────────────────────────
FRONTEND_URL="http://localhost:5173"

# ─── CREDENCIALES DE ADMIN ───────────────────────────────────
ADMIN_NOMBRE="Juan"
ADMIN_APELLIDO="Perez"
ADMIN_TELEFONO="+5493644123456"
```

> ⚠️ El archivo `.env` está incluido en el `.gitignore` y nunca debe subirse al repositorio. Las credenciales reales se comparten entre el equipo de forma privada.

---

## Configuración de la base de datos

### 4. Crear la base de datos en PostgreSQL

Abrí una terminal y conectate a PostgreSQL:

```bash
psql -U postgres
```

Creá la base de datos:

```sql
CREATE DATABASE turnify;
\q
```

### 5. Aplicar las migraciones

```bash
pnpm dlx prisma migrate deploy
```
ó
```bash
pnpm exec prisma migrate deploy
```
Este comando lee el historial de migraciones en `prisma/migrations/` y aplica todos los cambios a la base de datos. Las tablas quedan creadas automáticamente.

### 6. Generar el cliente de Prisma

```bash
pnpm dlx prisma generate
```
ó
```bash
pnpm exec prisma generate
```
Este comando genera los tipos TypeScript a partir del `schema.prisma`. Es necesario ejecutarlo cada vez que el schema cambie.

---

## Ejecutar el servidor

### Modo desarrollo (recomendado)

```bash
pnpm run start:dev
```

El servidor se inicia con hot reload: cualquier cambio en el código se refleja automáticamente sin necesidad de reiniciar.

Una vez iniciado, deberías ver en la terminal:

```
[Nest] LOG [NestFactory] Starting Nest application...
[Nest] LOG [InstanceLoader] AppModule dependencies initialized
[Nest] LOG [InstanceLoader] PrismaModule dependencies initialized
[Nest] LOG [NestApplication] Nest application successfully started
Servidor corriendo en http://localhost:3000
Documentación disponible en http://localhost:3000/api/docs
```

### Modo producción

```bash
pnpm run build
pnpm run start:prod
```

---

## Documentación de la API — Swagger

Una vez que el servidor esté corriendo, la documentación interactiva está disponible en:

```
http://localhost:3000/api/docs
```

Swagger permite explorar y probar todos los endpoints del sistema directamente desde el navegador sin necesidad de herramientas externas como Postman.

### Cómo usar Swagger

**1. Explorar endpoints:** cada módulo agrupa sus rutas (Usuarios, Turnos, Servicios, etc.) con sus métodos HTTP, parámetros y ejemplos de respuesta.

**2. Probar un endpoint:**

- Hacé click en el endpoint que querés probar
- Hacé click en **Try it out**
- Completá los parámetros o el body requerido
- Hacé click en **Execute**
- Swagger muestra la respuesta real del servidor

**3. Autenticación con JWT:** para probar endpoints protegidos:

- Primero obtené un token usando el endpoint de login en el módulo `auth`
- Hacé click en el botón **Authorize** (candado) en la parte superior
- Pegá el token en el campo `Bearer Token`
- Todos los endpoints protegidos quedan autenticados automáticamente

### URL base de la API

Todos los endpoints tienen el prefijo `/api`:

```
http://localhost:3000/api/usuarios
http://localhost:3000/api/turnos
http://localhost:3000/api/servicios
```

---

## Estructura del proyecto

```
backend/
├── prisma/
│   ├── migrations/
│   │   └── 20260707002647_init/
│   │       └── migration.sql  # SQL generado por Prisma en la migración inicial
│   └── schema.prisma          # Definición del esquema de la base de datos
├── src/
│   ├── modules/               # Módulos de negocio
│   │   ├── auth/              # Autenticación OTP + JWT
│   │   │   ├── dto/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.controller.spec.ts
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.service.spec.ts
│   │   ├── horarios/          # Franjas horarias y excepciones
│   │   │   ├── dto/
│   │   │   ├── horarios.controller.ts
│   │   │   ├── horarios.controller.spec.ts
│   │   │   ├── horarios.module.ts
│   │   │   ├── horarios.service.ts
│   │   │   └── horarios.service.spec.ts
│   │   ├── notificaciones/    # Envío de notificaciones vía WhatsApp
│   │   │   ├── notificaciones.module.ts
│   │   │   ├── notificaciones.service.ts
│   │   │   └── notificaciones.service.spec.ts
│   │   ├── pedidos/           # Órdenes de compra del e-commerce
│   │   │   ├── dto/
│   │   │   ├── pedidos.controller.ts
│   │   │   ├── pedidos.controller.spec.ts
│   │   │   ├── pedidos.module.ts
│   │   │   ├── pedidos.service.ts
│   │   │   └── pedidos.service.spec.ts
│   │   ├── portafolio/        # Imágenes y categorías del portafolio
│   │   │   ├── dto/
│   │   │   ├── portafolio.controller.ts
│   │   │   ├── portafolio.controller.spec.ts
│   │   │   ├── portafolio.module.ts
│   │   │   ├── portafolio.service.ts
│   │   │   └── portafolio.service.spec.ts
│   │   ├── productos/         # Catálogo de productos del e-commerce
│   │   │   ├── dto/
│   │   │   ├── productos.controller.ts
│   │   │   ├── productos.controller.spec.ts
│   │   │   ├── productos.module.ts
│   │   │   ├── productos.service.ts
│   │   │   └── productos.service.spec.ts
│   │   ├── servicios/         # Catálogo de servicios del salón
│   │   │   ├── dto/
│   │   │   ├── servicios.controller.ts
│   │   │   ├── servicios.controller.spec.ts
│   │   │   ├── servicios.module.ts
│   │   │   ├── servicios.service.ts
│   │   │   └── servicios.service.spec.ts
│   │   ├── turnos/            # Reservas, cancelaciones, reprogramaciones
│   │   │   ├── dto/
│   │   │   ├── turnos.controller.ts
│   │   │   ├── turnos.controller.spec.ts
│   │   │   ├── turnos.module.ts
│   │   │   ├── turnos.service.ts
│   │   │   └── turnos.service.spec.ts
│   │   └── usuarios/          # Gestión de usuarios y perfiles
│   │       ├── dto/
│   │       │   ├── crear-usuario.dto.ts
│   │       │   └── actualizar-usuario.dto.ts
│   │       ├── usuarios.controller.ts
│   │       ├── usuarios.controller.spec.ts
│   │       ├── usuarios.module.ts
│   │       ├── usuarios.service.ts
│   │       └── usuarios.service.spec.ts
│   ├── prisma/
│   │   ├── prisma.module.ts   # Módulo global de Prisma (@Global)
│   │   └── prisma.service.ts  # Servicio de conexión a la base de datos
│   ├── app.controller.ts
│   ├── app.controller.spec.ts
│   ├── app.module.ts          # Módulo raíz — registra todos los módulos
│   ├── app.service.ts
│   └── main.ts                # Punto de entrada — configura Swagger y ValidationPipe
├── test/
│   ├── app.e2e-spec.ts        # Tests end-to-end
│   └── jest-e2e.json          # Configuración de Jest para e2e
├── .env                       # Variables de entorno locales (no subir a Git)
├── .env.example               # Ejemplo de variables de entorno (sin valores reales)
├── .gitignore
├── .prettierrc
├── eslint.config.mjs
├── nest-cli.json
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── prisma.config.ts           # Configuración de conexión a PostgreSQL para Prisma 7
└── tsconfig.json
```

### Estructura interna de cada módulo

Todos los módulos siguen la misma convención:

```
modulo/
├── modulo.module.ts       # Registra controller, service y dependencias
├── modulo.controller.ts   # Recibe solicitudes HTTP y delega al service
├── modulo.service.ts      # Contiene la lógica de negocio y consultas Prisma
└── dto/                   # Data Transfer Objects — validan los datos de entrada
    ├── crear-modulo.dto.ts
    └── actualizar-modulo.dto.ts
```

---

## CORS

El backend tiene CORS configurado para aceptar requests únicamente desde el origen definido en `FRONTEND_URL`. En desarrollo local el valor es `http://localhost:5173`.

Si el frontend corre en un puerto distinto o en producción desde otra URL, actualizá esa variable de entorno y reiniciá el servidor.

---

## Comandos de referencia

### NestJS

| Comando               | Descripción                                |
| --------------------- | ------------------------------------------ |
| `pnpm run start:dev`  | Inicia en modo desarrollo con hot reload   |
| `pnpm run start:prod` | Inicia en modo producción                  |
| `pnpm run build`      | Compila TypeScript a JavaScript            |
| `pnpm run test`       | Ejecuta los tests unitarios                |
| `pnpm run test:e2e`   | Ejecuta los tests end-to-end               |
| `pnpm run test:cov`   | Ejecuta los tests con reporte de cobertura |
| `pnpm run db:reset`   | Resetea todos los datos que hay en la DB   |
| `pnpm run seed`       | Cargan datos iniciales en la DB            |

### Prisma

| Comando                                     | Descripción                                         |
| ------------------------------------------- | --------------------------------------------------- |
| `pnpm dlx prisma generate`                  | Genera el cliente TypeScript desde el schema        |
| `pnpm dlx prisma migrate dev --name nombre` | Crea y aplica una nueva migración en desarrollo     |
| `pnpm dlx prisma migrate deploy`            | Aplica migraciones pendientes                       |
| `pnpm dlx prisma migrate reset`             | Resetea la base de datos y aplica todo desde cero   |
| `pnpm dlx prisma studio`                    | Abre interfaz visual para explorar la base de datos |

> ⚠️ `prisma migrate reset` borra todos los datos. Usarlo solo en desarrollo.

---

## Cuando tu compañero modifica el schema

Si tu compañero hizo cambios en `prisma/schema.prisma` y creó una nueva migración, después de hacer `git pull` ejecutá:

```bash
pnpm dlx prisma migrate deploy
pnpm dlx prisma generate
```

Esto aplica las migraciones nuevas y regenera el cliente en tu máquina. Sin este paso el código TypeScript puede quedar desincronizado con la base de datos.

---

## Variables de entorno — referencia completa

| Variable                   | Requerida | Descripción                                   |
| -------------------------- | --------- | --------------------------------------------- |
| `DATABASE_URL`             | Sí        | URL de conexión a PostgreSQL                  |
| `FRONTEND_URL`             | Sí        | URL del frontend — usada para configurar CORS |
| `JWT_SECRET`               | Sí        | Clave secreta para firmar tokens JWT          |
| `JWT_EXPIRES_IN`           | Sí        | Duración del token (ej: `7d`, `24h`)          |
| `ADMIN_NOMBRE`             | Sí        | Nombre para el seed de admin (ej: `Juan`)     |
| `ADMIN_APELLIDO`           | Sí        | Apellido para el seed de admin (ej: `Perez`)  |
| `ADMIN_TELEFONO`           | Sí        | Tel. para el seed de admin (ej: `3644-xxxxxx`)|
| `WHATSAPP_API_URL`         | No*       | URL base de la WhatsApp Business API          |
| `WHATSAPP_TOKEN`           | No*       | Token de autenticación de Meta                |
| `WHATSAPP_PHONE_NUMBER_ID` | No*       | ID del número de teléfono en Meta             |
| `CLOUDINARY_CLOUD_NAME`    | No*       | Nombre del cloud en Cloudinary                |
| `CLOUDINARY_API_KEY`       | No*       | API Key de Cloudinary                         |
| `CLOUDINARY_API_SECRET`    | No*       | API Secret de Cloudinary                      |
| `MERCADOPAGO_ACCESS_TOKEN` | No*       | Access token de MercadoPago                   |



> *No requeridas para desarrollo local básico, pero necesarias para las funcionalidades de notificaciones, imágenes y pagos.

---
