<div align="center">

# ✂️ Turnify

### Sistema de gestión integral para salón de belleza

[![NestJS](https://img.shields.io/badge/Backend-NestJS-E0234E?style=flat-square&logo=nestjs)](https://nestjs.com/)
[![React](https://img.shields.io/badge/Frontend-React-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/Lenguaje-TypeScript-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/Base%20de%20datos-PostgreSQL-4169E1?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/ORM-Prisma-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)

**Prácticas Profesionalizantes III — Instituto de Educación Superior "Juan Mantovani" — 2026**

</div>

---

## ¿Qué es Turnify?

Turnify es una aplicación web desarrollada como proyecto académico para la materia **Prácticas Profesionalizantes III**. Su objetivo es digitalizar y centralizar la gestión operativa de un salón de belleza, permitiendo administrar turnos, clientes, servicios, productos y ventas online desde una única plataforma.

El sistema fue diseñado tomando como caso real el salón de belleza de **Gisela Toloza**, buscando resolver los problemas derivados de la gestión manual mediante WhatsApp, Google Calendar e Instagram.

---

## El problema

La administración del negocio se realizaba utilizando múltiples herramientas independientes, lo que ocasionaba:

| Problema | Descripción |
|---|---|
| 🔁 Superposición de turnos | Sin sistema centralizado, era fácil asignar el mismo horario a dos clientas |
| 📂 Información dispersa | Datos repartidos entre WhatsApp, Instagram, Google Calendar y agenda en papel |
| 🚫 Sin historial de clientes | No había registro estructurado de atenciones anteriores |
| ✋ Confirmaciones manuales | Recordatorios y confirmaciones dependían exclusivamente de la profesional |
| 📵 Baja presencia digital | Sin plataforma propia para mostrar servicios, precios y portafolio |

---

## Solución

Turnify centraliza todo en una sola plataforma web accesible desde cualquier dispositivo, con especial énfasis en la experiencia móvil.

---

## Funcionalidades principales

### 👤 Para las clientas
- Reserva de turnos online sin necesidad de crear una cuenta
- Inicio de sesión mediante teléfono y código OTP vía WhatsApp
- Cancelación y reprogramación con hasta 12 horas de anticipación
- Historial de turnos y compras
- Gestión del perfil personal

### 🛠️ Para la administradora
- Gestión completa de la agenda del salón
- Administración de servicios, horarios y franjas de atención
- Gestión del portafolio de trabajos organizado por servicio
- Gestión del catálogo de productos y stock
- Seguimiento de pedidos del e-commerce

### ⚙️ Automatizaciones del sistema
- Notificaciones automáticas por WhatsApp al confirmar un turno
- Recordatorios automáticos a las clientas 24 horas antes del turno
- Validación automática de disponibilidad horaria
- Prevención de superposición de turnos
- Alertas de stock en cero

---

## Arquitectura

Turnify implementa una arquitectura **cliente-servidor desacoplada** basada en una API REST.

```
┌─────────────────┐         HTTP / JSON        ┌─────────────────┐
│                 │ ─────────────────────────> │                 │
│    Frontend     │                             │   API REST      │
│  React + Vite   │ <───────────────────────── │    NestJS       │
│                 │                             │                 │
└─────────────────┘                             └────────┬────────┘
                                                         │
                                                         │ Prisma ORM
                                                         │
                                                ┌────────▼────────┐
                                                │                 │
                                                │   PostgreSQL    │
                                                │                 │
                                                └─────────────────┘
```

Esta separación permite desarrollar, desplegar y escalar cada capa de forma independiente.

---

## Tecnologías

### Frontend
| Tecnología | Uso |
|---|---|
| React + Vite | Interfaz de usuario |
| TypeScript | Tipado estático |
| Tailwind CSS | Estilos |
| React Router | Navegación |
| TanStack Query | Gestión de estado del servidor |

### Backend
| Tecnología | Uso |
|---|---|
| NestJS | Framework principal |
| TypeScript | Tipado estático |
| Prisma ORM | Acceso a la base de datos |
| Swagger | Documentación interactiva de la API |

### Base de datos
| Tecnología | Uso |
|---|---|
| PostgreSQL | Motor relacional principal |

### Servicios externos
| Servicio | Uso |
|---|---|
| WhatsApp Business API | Notificaciones y OTP |
| Cloudinary | Almacenamiento de imágenes |
| MercadoPago | Pagos online (alcance secundario) |
| JWT | Autenticación stateless |

---

## Estructura del monorepo

```
turnify/
├── backend/          # API REST — NestJS + Prisma + PostgreSQL
├── frontend/         # Interfaz web — React + Vite + TypeScript
└── docs/             # Documentación académica del proyecto
```

> Cada subcarpeta tiene su propio `README.md` con instrucciones detalladas de instalación y ejecución.

---

## Documentación

| Documento | Descripción |
|---|---|
| [`backend/README_backend.md`](./backend/README_backend.md) | Instalación, configuración y ejecución del backend |
| `frontend/README_frontend.md` | Instalación, configuración y ejecución del frontend *(próximamente)* |

---

## Estado del proyecto

> 🚧 **En desarrollo activo**

| Etapa | Estado |
|---|---|
| Relevamiento y análisis | ✅ Completado |
| Diseño de base de datos | ✅ Completado |
| Arquitectura del sistema | ✅ Completado |
| Casos de uso y requerimientos | ✅ Completado |
| Configuración del backend | ✅ Completado |
| Desarrollo de módulos | 🔄 En progreso |
| Frontend | ⏳ Pendiente |
| Pruebas | ⏳ Pendiente |

---

## Alcance secundario (futuro)

Las siguientes funcionalidades están planificadas pero sujetas a disponibilidad de tiempo:

- 🛒 E-commerce completo con carrito de compras
- 💳 Integración con MercadoPago
- 📦 Control de stock automatizado
- 📊 Dashboard con estadísticas y reportes
- 🧾 Facturación electrónica

---

## Equipo

<table>
  <tr>
    <td align="center"><b>Ricardo Ferreyra</b></td>
    <td align="center"><b>Alejandro Vargas</b></td>
  </tr>
</table>

**Institución:** Instituto de Educación Superior "Juan Mantovani"

**Materia:** Prácticas Profesionalizantes III

**Profesor:** Paszco, Gustavo

**Año:** 2026