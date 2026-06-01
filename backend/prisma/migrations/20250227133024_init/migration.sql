-- CreateTable
CREATE TABLE `Etat` (
    `EtatID` INTEGER NOT NULL AUTO_INCREMENT,
    `Nom` VARCHAR(100) NOT NULL,

    PRIMARY KEY (`EtatID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Type` (
    `TypeID` INTEGER NOT NULL AUTO_INCREMENT,
    `Nom` VARCHAR(100) NOT NULL,

    PRIMARY KEY (`TypeID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Marque` (
    `MarqueID` INTEGER NOT NULL AUTO_INCREMENT,
    `Nom` VARCHAR(100) NOT NULL,

    PRIMARY KEY (`MarqueID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Carburant` (
    `CarburantID` INTEGER NOT NULL AUTO_INCREMENT,
    `Nom` VARCHAR(100) NOT NULL,

    PRIMARY KEY (`CarburantID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Vehicule` (
    `VehiculeID` INTEGER NOT NULL AUTO_INCREMENT,
    `Nom` VARCHAR(100) NOT NULL,
    `Modele` VARCHAR(100) NULL,
    `Immatriculation` VARCHAR(20) NOT NULL,
    `DateImmatriculation` DATE NOT NULL,
    `MarqueID` INTEGER NOT NULL,
    `TypeID` INTEGER NOT NULL,
    `EtatID` INTEGER NOT NULL,
    `UtilisateurID` INTEGER NOT NULL,

    INDEX `Vehicule_EtatID_fkey`(`EtatID`),
    INDEX `Vehicule_MarqueID_fkey`(`MarqueID`),
    INDEX `Vehicule_TypeID_fkey`(`TypeID`),
    INDEX `Vehicle_utilisateurID_fkey`(`UtilisateurID`),
    PRIMARY KEY (`VehiculeID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Relever` (
    `ReleverID` INTEGER NOT NULL AUTO_INCREMENT,
    `VehiculeID` INTEGER NOT NULL,
    `CarburantID` INTEGER NOT NULL,
    `Date` DATETIME(3) NOT NULL,
    `Kilometre` DOUBLE NOT NULL,
    `PrixLitre` DOUBLE NOT NULL,
    `PrixTotal` DOUBLE NOT NULL,
    `LitreTotal` DOUBLE NOT NULL,
    `InclinaisonGauche` DOUBLE NULL,
    `InclinaisonDroite` DOUBLE NULL,

    INDEX `Relever_CarburantID_fkey`(`CarburantID`),
    INDEX `Relever_VehiculeID_fkey`(`VehiculeID`),
    PRIMARY KEY (`ReleverID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Grade` (
    `GradeID` INTEGER NOT NULL AUTO_INCREMENT,
    `Nom` VARCHAR(50) NOT NULL,

    UNIQUE INDEX `Grade_Nom_key`(`Nom`),
    PRIMARY KEY (`GradeID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Utilisateur` (
    `UtilisateurID` INTEGER NOT NULL AUTO_INCREMENT,
    `Surnom` VARCHAR(191) NOT NULL,
    `MotDePasse` VARCHAR(255) NOT NULL,
    `CheminImage` VARCHAR(255) NULL,
    `Email` VARCHAR(100) NOT NULL,
    `Salt` VARCHAR(255) NOT NULL,
    `GradeID` INTEGER NOT NULL,
    `EtatID` INTEGER NOT NULL,

    UNIQUE INDEX `Utilisateur_Surnom_key`(`Surnom`),
    INDEX `Utilisateur_GradeID_fkey`(`GradeID`),
    INDEX `Utilisateur_EtatID_fkey`(`EtatID`),
    PRIMARY KEY (`UtilisateurID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Vehicule` ADD CONSTRAINT `Vehicule_EtatID_fkey` FOREIGN KEY (`EtatID`) REFERENCES `Etat`(`EtatID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Vehicule` ADD CONSTRAINT `Vehicule_MarqueID_fkey` FOREIGN KEY (`MarqueID`) REFERENCES `Marque`(`MarqueID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Vehicule` ADD CONSTRAINT `Vehicule_TypeID_fkey` FOREIGN KEY (`TypeID`) REFERENCES `Type`(`TypeID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Vehicule` ADD CONSTRAINT `Vehicule_UtilisateurID_fkey` FOREIGN KEY (`UtilisateurID`) REFERENCES `Utilisateur`(`UtilisateurID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Relever` ADD CONSTRAINT `Relever_CarburantID_fkey` FOREIGN KEY (`CarburantID`) REFERENCES `Carburant`(`CarburantID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Relever` ADD CONSTRAINT `Relever_VehiculeID_fkey` FOREIGN KEY (`VehiculeID`) REFERENCES `Vehicule`(`VehiculeID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Utilisateur` ADD CONSTRAINT `Utilisateur_GradeID_fkey` FOREIGN KEY (`GradeID`) REFERENCES `Grade`(`GradeID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Utilisateur` ADD CONSTRAINT `Utilisateur_EtatID_fkey` FOREIGN KEY (`EtatID`) REFERENCES `Etat`(`EtatID`) ON DELETE RESTRICT ON UPDATE CASCADE;
