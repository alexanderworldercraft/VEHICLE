/*
  Warnings:

  - Added the required column `Couleur` to the `Carburant` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Carburant` ADD COLUMN `Couleur` VARCHAR(50) NOT NULL;
