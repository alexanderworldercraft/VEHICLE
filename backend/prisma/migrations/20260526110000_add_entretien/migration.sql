CREATE TABLE `CategorieEntretien` (
  `CategorieEntretienID` INTEGER NOT NULL AUTO_INCREMENT,
  `Nom` VARCHAR(100) NOT NULL,
  `Couleur` VARCHAR(50) NOT NULL,
  `Icone` VARCHAR(100) NULL,

  PRIMARY KEY (`CategorieEntretienID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `EntretienType` (
  `EntretienTypeID` INTEGER NOT NULL AUTO_INCREMENT,
  `Nom` VARCHAR(100) NOT NULL,
  `Description` VARCHAR(255) NULL,
  `CategorieEntretienID` INTEGER NOT NULL,

  INDEX `EntretienType_CategorieEntretienID_fkey`(`CategorieEntretienID`),
  PRIMARY KEY (`EntretienTypeID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `EntretienPlanifie` (
  `EntretienPlanifieID` INTEGER NOT NULL AUTO_INCREMENT,
  `VehiculeID` INTEGER NOT NULL,
  `EntretienTypeID` INTEGER NOT NULL,
  `DatePrevue` DATETIME(3) NULL,
  `KilometrePrevu` DOUBLE NULL,
  `Priorite` VARCHAR(50) NULL,
  `Note` VARCHAR(255) NULL,
  `EstRealise` BOOLEAN NOT NULL DEFAULT false,
  `CreateDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `UpdateDate` DATETIME(3) NULL,

  INDEX `EntretienPlanifie_VehiculeID_fkey`(`VehiculeID`),
  INDEX `EntretienPlanifie_EntretienTypeID_fkey`(`EntretienTypeID`),
  PRIMARY KEY (`EntretienPlanifieID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `EntretienRealise` (
  `EntretienRealiseID` INTEGER NOT NULL AUTO_INCREMENT,
  `VehiculeID` INTEGER NOT NULL,
  `EntretienTypeID` INTEGER NOT NULL,
  `EntretienPlanifieID` INTEGER NULL,
  `Date` DATETIME(3) NOT NULL,
  `Kilometre` DOUBLE NULL,
  `Cout` DOUBLE NULL,
  `Garage` VARCHAR(150) NULL,
  `Note` VARCHAR(500) NULL,
  `CreateDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `UpdateDate` DATETIME(3) NULL,

  INDEX `EntretienRealise_VehiculeID_fkey`(`VehiculeID`),
  INDEX `EntretienRealise_EntretienTypeID_fkey`(`EntretienTypeID`),
  INDEX `EntretienRealise_EntretienPlanifieID_fkey`(`EntretienPlanifieID`),
  PRIMARY KEY (`EntretienRealiseID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `EntretienType`
  ADD CONSTRAINT `EntretienType_CategorieEntretienID_fkey`
  FOREIGN KEY (`CategorieEntretienID`) REFERENCES `CategorieEntretien`(`CategorieEntretienID`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `EntretienPlanifie`
  ADD CONSTRAINT `EntretienPlanifie_VehiculeID_fkey`
  FOREIGN KEY (`VehiculeID`) REFERENCES `Vehicule`(`VehiculeID`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `EntretienPlanifie`
  ADD CONSTRAINT `EntretienPlanifie_EntretienTypeID_fkey`
  FOREIGN KEY (`EntretienTypeID`) REFERENCES `EntretienType`(`EntretienTypeID`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `EntretienRealise`
  ADD CONSTRAINT `EntretienRealise_VehiculeID_fkey`
  FOREIGN KEY (`VehiculeID`) REFERENCES `Vehicule`(`VehiculeID`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `EntretienRealise`
  ADD CONSTRAINT `EntretienRealise_EntretienTypeID_fkey`
  FOREIGN KEY (`EntretienTypeID`) REFERENCES `EntretienType`(`EntretienTypeID`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `EntretienRealise`
  ADD CONSTRAINT `EntretienRealise_EntretienPlanifieID_fkey`
  FOREIGN KEY (`EntretienPlanifieID`) REFERENCES `EntretienPlanifie`(`EntretienPlanifieID`)
  ON DELETE SET NULL ON UPDATE CASCADE;
