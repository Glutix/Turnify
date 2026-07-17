/*
  Warnings:

  - You are about to drop the column `codigo_hash` on the `otp_verificaciones` table. All the data in the column will be lost.
  - Added the required column `codigo` to the `otp_verificaciones` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "otp_verificaciones" DROP COLUMN "codigo_hash",
ADD COLUMN     "codigo" VARCHAR(6) NOT NULL;
