CREATE TABLE `EntretienFichier` (
    `EntretienFichierID` INTEGER NOT NULL AUTO_INCREMENT,
    `EntretienPlanifieID` INTEGER NULL,
    `EntretienRealiseID` INTEGER NULL,
    `NomOriginal` VARCHAR(255) NOT NULL,
    `NomStockage` VARCHAR(255) NOT NULL,
    `TypeMime` VARCHAR(100) NOT NULL,
    `TailleOctets` BIGINT NOT NULL,
    `Categorie` VARCHAR(50) NULL,
    `Chemin` VARCHAR(500) NOT NULL,
    `CreateDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `UpdateDate` DATETIME(3) NOT NULL,

    INDEX `EntretienFichier_EntretienPlanifieID_fkey`(`EntretienPlanifieID`),
    INDEX `EntretienFichier_EntretienRealiseID_fkey`(`EntretienRealiseID`),
    PRIMARY KEY (`EntretienFichierID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `EntretienFichier`
    ADD CONSTRAINT `EntretienFichier_EntretienPlanifieID_fkey`
    FOREIGN KEY (`EntretienPlanifieID`) REFERENCES `EntretienPlanifie`(`EntretienPlanifieID`)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `EntretienFichier`
    ADD CONSTRAINT `EntretienFichier_EntretienRealiseID_fkey`
    FOREIGN KEY (`EntretienRealiseID`) REFERENCES `EntretienRealise`(`EntretienRealiseID`)
    ON DELETE SET NULL ON UPDATE CASCADE;
