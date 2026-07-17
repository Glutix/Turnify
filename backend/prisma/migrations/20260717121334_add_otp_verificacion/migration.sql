-- CreateTable
CREATE TABLE "otp_verificaciones" (
    "id" SERIAL NOT NULL,
    "telefono" VARCHAR(20) NOT NULL,
    "codigo_hash" VARCHAR(255) NOT NULL,
    "intentos" INTEGER NOT NULL DEFAULT 0,
    "verificado" BOOLEAN NOT NULL DEFAULT false,
    "expira_en" TIMESTAMP NOT NULL,
    "fecha_creacion" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_verificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "otp_verificaciones_telefono_idx" ON "otp_verificaciones"("telefono");
