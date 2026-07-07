-- CreateEnum
CREATE TYPE "rol_usuario" AS ENUM ('cliente', 'admin');

-- CreateEnum
CREATE TYPE "dia_semana" AS ENUM ('lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo');

-- CreateEnum
CREATE TYPE "tipo_excepcion" AS ENUM ('bloqueo_total', 'horario_especial');

-- CreateEnum
CREATE TYPE "estado_turno" AS ENUM ('confirmado', 'cancelado', 'reprogramado', 'atendido');

-- CreateEnum
CREATE TYPE "destinatario_notif" AS ENUM ('cliente', 'admin');

-- CreateEnum
CREATE TYPE "tipo_notificacion" AS ENUM ('turno_confirmado', 'recordatorio_turno', 'cancelacion_cliente', 'reprogramacion_cliente', 'cancelacion_admin', 'reprogramacion_admin', 'compra_realizada');

-- CreateEnum
CREATE TYPE "canal_notificacion" AS ENUM ('whatsapp');

-- CreateEnum
CREATE TYPE "estado_notificacion" AS ENUM ('enviada', 'fallida', 'pendiente');

-- CreateEnum
CREATE TYPE "modalidad_entrega" AS ENUM ('retiro_local', 'envio_domicilio');

-- CreateEnum
CREATE TYPE "estado_pedido" AS ENUM ('pendiente', 'confirmado', 'en_preparacion', 'listo_para_retirar', 'enviado', 'entregado', 'cancelado');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "apellido" VARCHAR(100),
    "telefono" VARCHAR(20),
    "email" VARCHAR(150),
    "password_hash" VARCHAR(255),
    "rol" "rol_usuario" NOT NULL DEFAULT 'cliente',
    "perfil_completo" BOOLEAN NOT NULL DEFAULT false,
    "direccion" VARCHAR(255),
    "fecha_alta" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias_servicio" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" VARCHAR(255),

    CONSTRAINT "categorias_servicio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servicios" (
    "id" SERIAL NOT NULL,
    "categoria_id" INTEGER NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "descripcion" TEXT,
    "duracion_minutos" INTEGER NOT NULL,
    "precio" DECIMAL(10,2) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "servicios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "franjas_horarias" (
    "id" SERIAL NOT NULL,
    "dia_semana" "dia_semana" NOT NULL,
    "hora_inicio" TIME NOT NULL,
    "hora_fin" TIME NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "franjas_horarias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "excepciones_horario" (
    "id" SERIAL NOT NULL,
    "fecha_desde" DATE NOT NULL,
    "fecha_hasta" DATE NOT NULL,
    "tipo" "tipo_excepcion" NOT NULL,
    "descripcion" VARCHAR(255),
    "hora_inicio" TIME,
    "hora_fin" TIME,

    CONSTRAINT "excepciones_horario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "turnos" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "turno_origen_id" INTEGER,
    "fecha_hora_inicio" TIMESTAMP NOT NULL,
    "fecha_hora_fin" TIMESTAMP NOT NULL,
    "estado" "estado_turno" NOT NULL DEFAULT 'confirmado',
    "recordatorio_enviado" BOOLEAN NOT NULL DEFAULT false,
    "fecha_creacion" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "turnos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "turno_servicios" (
    "id" SERIAL NOT NULL,
    "turno_id" INTEGER NOT NULL,
    "servicio_id" INTEGER NOT NULL,
    "precio_unitario" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "turno_servicios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portafolio_categorias" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" VARCHAR(255),
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "portafolio_categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portafolio_imagenes" (
    "id" SERIAL NOT NULL,
    "categoria_id" INTEGER NOT NULL,
    "url_cloudinary" VARCHAR(500) NOT NULL,
    "public_id" VARCHAR(255) NOT NULL,
    "descripcion" VARCHAR(255),
    "destacada" BOOLEAN NOT NULL DEFAULT false,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "portafolio_imagenes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias_producto" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" VARCHAR(255),

    CONSTRAINT "categorias_producto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productos" (
    "id" SERIAL NOT NULL,
    "categoria_id" INTEGER NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "descripcion" TEXT,
    "precio" DECIMAL(10,2) NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "imagenes_producto" (
    "id" SERIAL NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "url_cloudinary" VARCHAR(500) NOT NULL,
    "public_id" VARCHAR(255) NOT NULL,
    "es_principal" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "imagenes_producto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidos" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "modalidad_entrega" "modalidad_entrega" NOT NULL,
    "estado" "estado_pedido" NOT NULL DEFAULT 'pendiente',
    "direccion_entrega" VARCHAR(255),
    "mercadopago_payment_id" VARCHAR(100),
    "fecha_creacion" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pedidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedido_items" (
    "id" SERIAL NOT NULL,
    "pedido_id" INTEGER NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precio_unitario" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "pedido_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificaciones" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER,
    "destinatario" "destinatario_notif" NOT NULL,
    "tipo" "tipo_notificacion" NOT NULL,
    "canal" "canal_notificacion" NOT NULL DEFAULT 'whatsapp',
    "estado" "estado_notificacion" NOT NULL DEFAULT 'pendiente',
    "mensaje" TEXT,
    "fecha_envio" TIMESTAMP,
    "fecha_expiracion" TIMESTAMP,

    CONSTRAINT "notificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_telefono_key" ON "usuarios"("telefono");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_servicio_nombre_key" ON "categorias_servicio"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "franjas_horarias_dia_semana_hora_inicio_hora_fin_key" ON "franjas_horarias"("dia_semana", "hora_inicio", "hora_fin");

-- CreateIndex
CREATE UNIQUE INDEX "portafolio_categorias_nombre_key" ON "portafolio_categorias"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_producto_nombre_key" ON "categorias_producto"("nombre");

-- AddForeignKey
ALTER TABLE "servicios" ADD CONSTRAINT "servicios_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias_servicio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turnos" ADD CONSTRAINT "turnos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turnos" ADD CONSTRAINT "turnos_turno_origen_id_fkey" FOREIGN KEY ("turno_origen_id") REFERENCES "turnos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turno_servicios" ADD CONSTRAINT "turno_servicios_turno_id_fkey" FOREIGN KEY ("turno_id") REFERENCES "turnos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turno_servicios" ADD CONSTRAINT "turno_servicios_servicio_id_fkey" FOREIGN KEY ("servicio_id") REFERENCES "servicios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portafolio_imagenes" ADD CONSTRAINT "portafolio_imagenes_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "portafolio_categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias_producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imagenes_producto" ADD CONSTRAINT "imagenes_producto_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedido_items" ADD CONSTRAINT "pedido_items_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedido_items" ADD CONSTRAINT "pedido_items_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
