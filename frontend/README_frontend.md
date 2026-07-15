# Turnify — Frontend

Interfaz web del sistema de gestión integral para salón de belleza, desarrollada con React + Vite + TypeScript + Tailwind CSS.

---

## Tecnologías

| Tecnología     | Versión | Uso                               |
| -------------- | ------- | --------------------------------- |
| React          | v19+    | Biblioteca de interfaz de usuario |
| Vite           | v6+     | Entorno de desarrollo y build     |
| TypeScript     | v5+     | Tipado estático                   |
| Tailwind CSS   | v4+     | Estilos y diseño responsive       |
| React Router   | v7+     | Navegación entre páginas          |
| TanStack Query | v5+     | Gestión de datos del servidor     |
| Zustand        | v5+     | Estado global de la aplicación    |
| Axios          | v1+     | Llamadas HTTP a la API REST       |
| pnpm           | v8+     | Gestor de paquetes                |

---

## Requisitos previos

Antes de continuar, asegurate de tener instalado en tu máquina:

- [Node.js](https://nodejs.org/) v18 o superior
- [pnpm](https://pnpm.io/) v8 o superior

Verificá las versiones instaladas ejecutando:

```bash
node -v
pnpm -v
```

> ⚠️ El backend debe estar corriendo antes de iniciar el frontend. Consultá `backend/README_backend.md` para las instrucciones de instalación.

---

## Instalación y configuración

### 1. Posicionarse en la carpeta del frontend

Desde la raíz del monorepo:

```bash
cd frontend
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
# ─── API ─────────────────────────────────────────────────────
VITE_API_URL=http://localhost:3000/api
```

> ⚠️ En Vite todas las variables de entorno deben comenzar con el prefijo `VITE_` para ser accesibles desde el código. El archivo `.env` está incluido en el `.gitignore` y nunca debe subirse al repositorio.

---

## Ejecutar el proyecto

### Modo desarrollo (recomendado)

```bash
pnpm run dev
```

El servidor de desarrollo se inicia con hot reload: cualquier cambio en el código se refleja automáticamente en el navegador.

Una vez iniciado, el frontend estará disponible en:

```
http://localhost:5173
```

### Build de producción

```bash
pnpm run build
```

Genera los archivos optimizados en la carpeta `dist/`. Para previsualizar el build localmente:

```bash
pnpm run preview
```

---

## Rutas del sistema

### Sitio público

| Ruta          | Página         | Descripción                      |
| ------------- | -------------- | -------------------------------- |
| `/`           | LandingPage    | Página principal del sitio       |
| `/servicios`  | ServiciosPage  | Catálogo de servicios y precios  |
| `/portafolio` | PortafolioPage | Portafolio de trabajos del salón |
| `/turnos`     | TurnosPage     | Reserva de turnos online         |
| `/login`      | LoginPage      | Inicio de sesión                 |

### Panel de administración (protegido)

| Ruta                | Página              | Descripción                 |
| ------------------- | ------------------- | --------------------------- |
| `/admin`            | AgendaPage          | Agenda principal del salón  |
| `/admin/turnos`     | TurnosAdminPage     | Gestión de turnos           |
| `/admin/servicios`  | ServiciosAdminPage  | Gestión de servicios        |
| `/admin/horarios`   | HorariosAdminPage   | Gestión de franjas horarias |
| `/admin/portafolio` | PortafolioAdminPage | Gestión del portafolio      |
| `/admin/productos`  | ProductosAdminPage  | Gestión de productos        |
| `/admin/pedidos`    | PedidosAdminPage    | Gestión de pedidos          |
| `/admin/clientes`   | ClientesAdminPage   | Historial de clientes       |

### Rutas especiales

| Ruta | Descripción              |
| ---- | ------------------------ |
| `*`  | Redirige a la página 404 |

> Las rutas `/admin/*` requieren autenticación con rol `admin`. Si el usuario no está autenticado, es redirigido automáticamente a `/login`.

---

## Estructura del proyecto

```
frontend/
├── src/
│   ├── api/
│   │   └── axios.ts              # Instancia de Axios con interceptores JWT y manejo de errores
│   ├── assets/                   # Imágenes, íconos y fuentes estáticas
│   ├── components/
│   │   ├── common/               # Componentes reutilizables (botones, inputs, modales, etc.)
│   │   └── layout/               # Componentes estructurales (Navbar, Footer, Sidebar, etc.)
│   ├── hooks/                    # Custom hooks reutilizables
│   ├── pages/
│   │   ├── admin/                # Páginas del panel de administración
│   │   │   ├── AgendaPage.tsx
│   │   │   ├── ClientesAdminPage.tsx
│   │   │   ├── HorariosAdminPage.tsx
│   │   │   ├── PedidosAdminPage.tsx
│   │   │   ├── PortafolioAdminPage.tsx
│   │   │   ├── ProductosAdminPage.tsx
│   │   │   ├── ServiciosAdminPage.tsx
│   │   │   └── TurnosAdminPage.tsx
│   │   └── public/               # Páginas del sitio público
│   │       ├── LandingPage.tsx
│   │       ├── LoginPage.tsx
│   │       ├── NotFoundPage.tsx
│   │       ├── PortafolioPage.tsx
│   │       ├── ServiciosPage.tsx
│   │       └── TurnosPage.tsx
│   ├── router/
│   │   ├── AppRouter.tsx         # Definición de todas las rutas del sistema
│   │   └── ProtectedRoute.tsx    # Componente que protege rutas según autenticación y rol
│   ├── stores/
│   │   └── authStore.ts          # Store de Zustand — gestiona sesión del usuario y token JWT
│   ├── types/                    # Tipos e interfaces TypeScript globales
│   ├── utils/                    # Funciones auxiliares reutilizables
│   ├── App.tsx                   # Componente raíz — monta el router
│   ├── index.css                 # Estilos globales — importa Tailwind CSS
│   └── main.tsx                  # Punto de entrada — configura React, Router y TanStack Query
├── .env                          # Variables de entorno locales (no subir a Git)
├── .env.example                  # Ejemplo de variables de entorno (sin valores reales)
├── .gitignore
├── eslint.config.js              # Configuración de ESLint con reglas para React y TypeScript
├── index.html                    # HTML base de la SPA
├── package.json
├── pnpm-lock.yaml
├── tsconfig.app.json             # Configuración TypeScript para el código fuente
├── tsconfig.json                 # Configuración TypeScript raíz
├── tsconfig.node.json            # Configuración TypeScript para Vite
└── vite.config.ts                # Configuración de Vite con plugin de Tailwind
```

---

## Arquitectura del frontend

### Axios — `src/api/axios.ts`

Instancia centralizada de Axios configurada con:

- `baseURL` apuntando a `VITE_API_URL`
- **Interceptor de request:** agrega automáticamente el token JWT en el header `Authorization` de cada solicitud
- **Interceptor de response:** ante un error `401`, limpia la sesión del usuario y redirige al login

Todos los archivos de llamadas a la API deben importar esta instancia en lugar de usar Axios directamente.

### Zustand — `src/stores/authStore.ts`

Store global que gestiona el estado de autenticación:

- `usuario` — datos del usuario autenticado
- `token` — token JWT de sesión
- `setAuth(usuario, token)` — establece la sesión al hacer login
- `logout()` — limpia la sesión

Utiliza el middleware `persist` de Zustand para guardar el estado en `localStorage` automáticamente. Esto permite que el usuario permanezca autenticado al recargar la página.

### TanStack Query — `src/main.tsx`

Configurado globalmente con:

- `staleTime: 5 minutos` — los datos se consideran frescos por 5 minutos antes de revalidar
- `retry: 1` — reintenta una vez si una request falla

Se utiliza para todas las llamadas a la API que traen datos del servidor (turnos, servicios, productos, etc.), eliminando la necesidad de manejar estados de loading y error manualmente.

### Rutas protegidas — `src/router/ProtectedRoute.tsx`

Componente que verifica si el usuario está autenticado antes de renderizar una página protegida. Si no hay token o el rol no coincide, redirige automáticamente a `/login` o `/` según corresponda.

---

## Comandos de referencia

| Comando            | Descripción                                          |
| ------------------ | ---------------------------------------------------- |
| `pnpm run dev`     | Inicia el servidor de desarrollo con hot reload      |
| `pnpm run build`   | Genera el build de producción en `dist/`             |
| `pnpm run preview` | Previsualiza el build de producción localmente       |
| `pnpm run lint`    | Ejecuta ESLint sobre todos los archivos del proyecto |

---

## Convenciones del proyecto

### Nombres de archivos

- Componentes y páginas: `PascalCase` → `AgendaPage.tsx`, `ProtectedRoute.tsx`
- Stores, hooks y utilidades: `camelCase` → `authStore.ts`, `useAuth.ts`

### Imports

- Usar rutas relativas desde `src/` → `"../stores/authStore"`

### Estilos

- Usar clases de Tailwind CSS directamente en el JSX
- No crear archivos CSS adicionales salvo casos excepcionales

### Formato de código

- Comillas dobles `"` para todos los strings
- Punto y coma `;` al final de cada sentencia
- El autoformato se aplica al guardar mediante Prettier

---

## Variables de entorno — referencia completa

| Variable       | Requerida | Descripción                         |
| -------------- | --------- | ----------------------------------- |
| `VITE_API_URL` | Sí        | URL base de la API REST del backend |

> En producción actualizá `VITE_API_URL` con la URL real del backend desplegado.
