//vehiculeController.js

import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import bcrypt from 'bcrypt';
import { prisma } from "../services/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VEHICLE_UPLOAD_ROOT = path.join(__dirname, '../uploads/vehicules');
const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const PASSWORD_ATTEMPT_LIMIT = 3;
const PASSWORD_LOCK_MS = 5 * 60 * 1000;
const vehiclePasswordAttempts = new Map();
const CRC32_TABLE = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});

const resolveUploadPath = (publicPath) => {
  if (!publicPath || !publicPath.startsWith('/uploads/vehicules/')) return null;
  return path.join(__dirname, '..', publicPath);
};

const removeVehiclePhoto = async (publicPath) => {
  const filePath = resolveUploadPath(publicPath);
  if (!filePath) return;

  try {
    await fs.promises.unlink(filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error(`Erreur lors de la suppression de la photo du véhicule : ${error.message}`);
    }
  }

  try {
    await fs.promises.rmdir(path.dirname(filePath));
  } catch (error) {
    if (error.code !== 'ENOENT' && error.code !== 'ENOTEMPTY') {
      console.error(`Erreur lors de la suppression du dossier photo du véhicule : ${error.message}`);
    }
  }
};

const calculateCrc32 = (buffer) => {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = CRC32_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
};

const getDosDateTime = (date) => {
  const safeDate = date instanceof Date && !Number.isNaN(date.getTime()) ? date : new Date();
  const year = Math.max(1980, safeDate.getFullYear());

  return {
    time: (safeDate.getHours() << 11) | (safeDate.getMinutes() << 5) | Math.floor(safeDate.getSeconds() / 2),
    date: ((year - 1980) << 9) | ((safeDate.getMonth() + 1) << 5) | safeDate.getDate(),
  };
};

const buildZipArchive = (files) => {
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  files.forEach((file) => {
    const filename = Buffer.from(file.name.replace(/\\/g, '/'));
    const data = file.data;
    const crc32 = calculateCrc32(data);
    const { time, date } = getDosDateTime(file.modifiedAt);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0x0800, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(time, 10);
    localHeader.writeUInt16LE(date, 12);
    localHeader.writeUInt32LE(crc32, 14);
    localHeader.writeUInt32LE(data.length, 18);
    localHeader.writeUInt32LE(data.length, 22);
    localHeader.writeUInt16LE(filename.length, 26);
    localHeader.writeUInt16LE(0, 28);

    localParts.push(localHeader, filename, data);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0x0800, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(time, 12);
    centralHeader.writeUInt16LE(date, 14);
    centralHeader.writeUInt32LE(crc32, 16);
    centralHeader.writeUInt32LE(data.length, 20);
    centralHeader.writeUInt32LE(data.length, 24);
    centralHeader.writeUInt16LE(filename.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);

    centralParts.push(centralHeader, filename);
    offset += localHeader.length + filename.length + data.length;
  });

  const centralDirectory = Buffer.concat(centralParts);
  const endRecord = Buffer.alloc(22);
  endRecord.writeUInt32LE(0x06054b50, 0);
  endRecord.writeUInt16LE(0, 4);
  endRecord.writeUInt16LE(0, 6);
  endRecord.writeUInt16LE(files.length, 8);
  endRecord.writeUInt16LE(files.length, 10);
  endRecord.writeUInt32LE(centralDirectory.length, 12);
  endRecord.writeUInt32LE(offset, 16);
  endRecord.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, centralDirectory, endRecord]);
};

const readVehicleFolderFiles = async (folderPath, vehicleId) => {
  const files = [];
  const rootFolderName = `vehicule-${vehicleId}`;

  const readFolder = async (currentPath, relativePath = '') => {
    let entries;
    try {
      entries = await fs.promises.readdir(currentPath, { withFileTypes: true });
    } catch (error) {
      if (error.code === 'ENOENT') return;
      throw error;
    }

    for (const entry of entries) {
      const entryPath = path.join(currentPath, entry.name);
      const entryRelativePath = relativePath ? `${relativePath}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        await readFolder(entryPath, entryRelativePath);
      } else if (entry.isFile()) {
        const [data, stats] = await Promise.all([
          fs.promises.readFile(entryPath),
          fs.promises.stat(entryPath),
        ]);
        files.push({
          name: `${rootFolderName}/${entryRelativePath}`,
          data,
          modifiedAt: stats.mtime,
        });
      }
    }
  };

  await readFolder(folderPath);
  return files;
};

const formatCsvDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
};

const formatCsvBoolean = (value) => {
  if (value === true) return 'Oui';
  if (value === false) return 'Non';
  return '';
};

const escapeCsvValue = (value) => {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  if (/[;"\n\r]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

const buildCsvBuffer = (columns, rows) => {
  const header = columns.map((column) => escapeCsvValue(column.label)).join(';');
  const lines = rows.map((row) => (
    columns.map((column) => escapeCsvValue(column.value(row))).join(';')
  ));

  return Buffer.from(`\ufeff${[header, ...lines].join('\n')}\n`, 'utf8');
};

const createCsvFile = (rootFolderName, fileName, columns, rows) => ({
  name: `${rootFolderName}/donnéesBrute/${fileName}`,
  data: buildCsvBuffer(columns, rows),
  modifiedAt: new Date(),
});

const getPlannedMaintenanceLabel = (entretienPlanifie) => {
  if (!entretienPlanifie) return '';

  const details = [
    entretienPlanifie.EntretienType?.Nom,
    entretienPlanifie.DatePrevue ? formatCsvDate(entretienPlanifie.DatePrevue) : null,
    entretienPlanifie.KilometrePrevu ? `${entretienPlanifie.KilometrePrevu} km` : null,
  ].filter(Boolean);

  return details.join(' - ');
};

const buildVehicleRawDataFiles = async (vehicleId) => {
  const rootFolderName = `vehicule-${vehicleId}`;
  const vehicule = await prisma.vehicule.findUnique({
    where: { VehiculeID: vehicleId },
    include: {
      Etat: { select: { Nom: true } },
      Marque: { select: { Nom: true } },
      Type: { select: { Nom: true } },
      utilisateur: { select: { Surnom: true } },
      releves: {
        orderBy: [{ Date: 'asc' }, { Kilometre: 'asc' }],
        include: {
          Carburant: { select: { Nom: true, Couleur: true } },
        },
      },
      EntretienPlanifies: {
        orderBy: [{ DatePrevue: 'asc' }, { KilometrePrevu: 'asc' }],
        include: {
          EntretienType: {
            select: {
              Nom: true,
              Description: true,
              CategorieEntretien: { select: { Nom: true, Couleur: true, Icone: true } },
            },
          },
        },
      },
      EntretienRealises: {
        orderBy: [{ Date: 'asc' }, { Kilometre: 'asc' }],
        include: {
          EntretienType: {
            select: {
              Nom: true,
              Description: true,
              CategorieEntretien: { select: { Nom: true, Couleur: true, Icone: true } },
            },
          },
          EntretienPlanifie: {
            select: {
              DatePrevue: true,
              KilometrePrevu: true,
              Priorite: true,
              Note: true,
              EntretienType: { select: { Nom: true } },
            },
          },
        },
      },
    },
  });

  if (!vehicule) return [];

  return [
    createCsvFile(rootFolderName, 'vehicule.csv', [
      { label: 'Nom', value: (row) => row.Nom },
      { label: 'Modele', value: (row) => row.Modele },
      { label: 'Immatriculation', value: (row) => row.Immatriculation },
      { label: 'DateImmatriculation', value: (row) => formatCsvDate(row.DateImmatriculation) },
      { label: 'Marque', value: (row) => row.Marque?.Nom },
      { label: 'Type', value: (row) => row.Type?.Nom },
      { label: 'Etat', value: (row) => row.Etat?.Nom },
      { label: 'Utilisateur', value: (row) => row.utilisateur?.Surnom },
      { label: 'Photo', value: (row) => row.Photo },
      { label: 'CreateDate', value: (row) => formatCsvDate(row.CreateDate) },
      { label: 'UpdateDate', value: (row) => formatCsvDate(row.UpdateDate) },
    ], [vehicule]),
    createCsvFile(rootFolderName, 'releves.csv', [
      { label: 'Date', value: (row) => formatCsvDate(row.Date) },
      { label: 'Vehicule', value: () => vehicule.Nom },
      { label: 'Carburant', value: (row) => row.Carburant?.Nom },
      { label: 'CouleurCarburant', value: (row) => row.Carburant?.Couleur },
      { label: 'Kilometre', value: (row) => row.Kilometre },
      { label: 'Consommation', value: (row) => row.Consommation },
      { label: 'PrixLitre', value: (row) => row.PrixLitre },
      { label: 'PrixTotal', value: (row) => row.PrixTotal },
      { label: 'LitreTotal', value: (row) => row.LitreTotal },
      { label: 'InclinaisonGauche', value: (row) => row.InclinaisonGauche },
      { label: 'InclinaisonDroite', value: (row) => row.InclinaisonDroite },
      { label: 'CreateDate', value: (row) => formatCsvDate(row.CreateDate) },
      { label: 'UpdateDate', value: (row) => formatCsvDate(row.UpdateDate) },
    ], vehicule.releves),
    createCsvFile(rootFolderName, 'entretiens_planifies.csv', [
      { label: 'Vehicule', value: () => vehicule.Nom },
      { label: 'EntretienType', value: (row) => row.EntretienType?.Nom },
      { label: 'Categorie', value: (row) => row.EntretienType?.CategorieEntretien?.Nom },
      { label: 'CategorieCouleur', value: (row) => row.EntretienType?.CategorieEntretien?.Couleur },
      { label: 'CategorieIcone', value: (row) => row.EntretienType?.CategorieEntretien?.Icone },
      { label: 'Description', value: (row) => row.EntretienType?.Description },
      { label: 'DatePrevue', value: (row) => formatCsvDate(row.DatePrevue) },
      { label: 'KilometrePrevu', value: (row) => row.KilometrePrevu },
      { label: 'Priorite', value: (row) => row.Priorite },
      { label: 'Note', value: (row) => row.Note },
      { label: 'EstRealise', value: (row) => formatCsvBoolean(row.EstRealise) },
      { label: 'CreateDate', value: (row) => formatCsvDate(row.CreateDate) },
      { label: 'UpdateDate', value: (row) => formatCsvDate(row.UpdateDate) },
    ], vehicule.EntretienPlanifies),
    createCsvFile(rootFolderName, 'entretiens_realises.csv', [
      { label: 'Vehicule', value: () => vehicule.Nom },
      { label: 'EntretienType', value: (row) => row.EntretienType?.Nom },
      { label: 'Categorie', value: (row) => row.EntretienType?.CategorieEntretien?.Nom },
      { label: 'CategorieCouleur', value: (row) => row.EntretienType?.CategorieEntretien?.Couleur },
      { label: 'CategorieIcone', value: (row) => row.EntretienType?.CategorieEntretien?.Icone },
      { label: 'Description', value: (row) => row.EntretienType?.Description },
      { label: 'EntretienPlanifie', value: (row) => getPlannedMaintenanceLabel(row.EntretienPlanifie) },
      { label: 'Date', value: (row) => formatCsvDate(row.Date) },
      { label: 'Kilometre', value: (row) => row.Kilometre },
      { label: 'Cout', value: (row) => row.Cout },
      { label: 'Garage', value: (row) => row.Garage },
      { label: 'Note', value: (row) => row.Note },
      { label: 'EstArchive', value: (row) => formatCsvBoolean(row.EstArchive) },
      { label: 'CreateDate', value: (row) => formatCsvDate(row.CreateDate) },
      { label: 'UpdateDate', value: (row) => formatCsvDate(row.UpdateDate) },
    ], vehicule.EntretienRealises),
  ];
};

const getPasswordAttemptKey = (userId, vehicleId) => `${userId}:${vehicleId}`;

const getLockedPasswordAttempt = (key) => {
  const attempt = vehiclePasswordAttempts.get(key);
  if (!attempt?.lockedUntil) return null;

  if (attempt.lockedUntil <= Date.now()) {
    vehiclePasswordAttempts.delete(key);
    return null;
  }

  const retryAfterSeconds = Math.ceil((attempt.lockedUntil - Date.now()) / 1000);
  return {
    status: 429,
    error: `Trop d'essais incorrects. Réessayez dans ${Math.ceil(retryAfterSeconds / 60)} minute(s).`,
    retryAfterSeconds,
    attemptsRemaining: 0,
  };
};

const registerFailedPasswordAttempt = (key) => {
  const currentAttempt = vehiclePasswordAttempts.get(key);
  const failedAttempts = (currentAttempt?.failedAttempts || 0) + 1;
  const attemptsRemaining = Math.max(PASSWORD_ATTEMPT_LIMIT - failedAttempts, 0);

  if (failedAttempts >= PASSWORD_ATTEMPT_LIMIT) {
    const retryAfterSeconds = Math.ceil(PASSWORD_LOCK_MS / 1000);
    vehiclePasswordAttempts.set(key, {
      failedAttempts,
      lockedUntil: Date.now() + PASSWORD_LOCK_MS,
    });

    return {
      status: 429,
      error: `Mot de passe incorrect. Trop d'essais incorrects, réessayez dans 5 minutes.`,
      retryAfterSeconds,
      attemptsRemaining: 0,
    };
  }

  vehiclePasswordAttempts.set(key, { failedAttempts, lockedUntil: null });
  return {
    status: 401,
    error: `Mot de passe incorrect. ${attemptsRemaining} essai(s) restant(s).`,
    attemptsRemaining,
  };
};

const resetPasswordAttempts = (key) => {
  vehiclePasswordAttempts.delete(key);
};

const getVehicleDeletionContext = async (userId, vehicleId, password) => {
  if (!password) {
    return { status: 400, error: "Le mot de passe est requis." };
  }

  const user = await prisma.utilisateur.findUnique({
    where: { UtilisateurID: userId },
    select: { UtilisateurID: true, MotDePasse: true },
  });

  if (!user) {
    return { status: 404, error: "Utilisateur introuvable." };
  }

  const attemptKey = getPasswordAttemptKey(userId, vehicleId);
  const lockedAttempt = getLockedPasswordAttempt(attemptKey);
  if (lockedAttempt) return lockedAttempt;

  const isPasswordValid = await bcrypt.compare(password, user.MotDePasse);
  if (!isPasswordValid) {
    return registerFailedPasswordAttempt(attemptKey);
  }

  const vehicule = await prisma.vehicule.findFirst({
    where: { VehiculeID: vehicleId, UtilisateurID: userId },
    select: { VehiculeID: true, Nom: true, Photo: true },
  });

  if (!vehicule) {
    return { status: 404, error: "Véhicule introuvable." };
  }

  resetPasswordAttempts(attemptKey);

  return { user, vehicule };
};

export const vehiculeController = {



  // GET



  // Liste les véhicules actif de l'utilisateur
  async getAllVehicule(request, reply) {
    const { UtilisateurID } = request.params;
    console.log(`"getAllVehicule" à été appeler par l'Utilisateur "${UtilisateurID}".`);
    try {
      const vehicule = await prisma.vehicule.findMany({
        where: { EtatID: 1, UtilisateurID: parseInt(UtilisateurID) },
        orderBy: { VehiculeID: "desc" },
        select: {
          VehiculeID: true,
          Nom: true,
        },
      });
      reply.send(vehicule);
    } catch (error) {
      console.error("Erreur lors de la récupération des véhicules :", error);
      reply.status(500).send({ error: "Erreur lors de la récupération des véhicules." });
    }
  },
  // Liste les véhicules vendu de l'utilisateur
  async getAllSoldVehicule(request, reply) {
    const { UtilisateurID } = request.params;
    console.log(`"getAllSoldVehicule" à été appeler par l'Utilisateur "${UtilisateurID}".`);
    try {
      const vehicule = await prisma.vehicule.findMany({
        where: { EtatID: 4, UtilisateurID: parseInt(UtilisateurID) },
        orderBy: { VehiculeID: "desc" },
        select: {
          VehiculeID: true,
          Nom: true,
        },
      });
      reply.send(vehicule);
    } catch (error) {
      console.error("Erreur lors de la récupération des véhicules vendu :", error);
      reply.status(500).send({ error: "Erreur lors de la récupération des véhicules vendu." });
    }
  },
  // Liste les détails du véhicule de l'utilisateur
  async getVehicleDetails(request, reply) {
    const { UtilisateurID, VehiculeID } = request.params;
    console.log(`"getVehicleDetails" a été appelé par l'Utilisateur "${UtilisateurID}" pour le véhicule "${VehiculeID}".`);

    try {
      // Récupérer les détails du véhicule
      const vehicule = await prisma.vehicule.findMany({
        where: { UtilisateurID: parseInt(UtilisateurID), VehiculeID: parseInt(VehiculeID) },
        select: {
          VehiculeID: true,
          UtilisateurID: true,
          EtatID: true,
          Nom: true,
          Modele: true,
          Immatriculation: true,
          DateImmatriculation: true,
          Photo: true,
          CreateDate: true,
          UpdateDate: true,
          TypeID: true,
          MarqueID: true,
          Type: {
            select: {
              Nom: true,
            },
          },
          Marque: {
            select: {
              Nom: true,
            },
          },
        },
      });

      // Récupérer les détails des relevés
      const releverDetails = await prisma.relever.findMany({
        where: { VehiculeID: parseInt(VehiculeID) },
        orderBy: [
          { Date: 'asc' },
          { Kilometre: 'asc' }
        ],
        select: {
          ReleverID: true,
          CarburantID: true,
          Consommation: true,
          Date: true,
          Kilometre: true,
          PrixLitre: true,
          PrixTotal: true,
          LitreTotal: true,
          InclinaisonGauche: true,
          InclinaisonDroite: true,
          CreateDate: true,
          UpdateDate: true,
          Carburant: {
            select: {
              Nom: true,
              Couleur: true,
            },
          },
        },
      });

      // Combiner les résultats
      const result = {
        vehicule: vehicule[0], // Prendre le premier élément du tableau
        releverDetails: releverDetails, // Prendre le premier élément du tableau
      };

      reply.send(result);
    } catch (error) {
      console.error("Erreur lors de la récupération des détails du véhicule :", error);
      reply.status(500).send({ error: "Erreur lors de la récupération des détails du véhicule." });
    }
  },
  // Liste les statistiques des véhicules de l'utilisateur
  async getUserVehicleStatistics(request, reply) {
    const { UtilisateurID } = request.params;
    const includeSold = request.query?.includeSold === 'true';
    console.log(`"getUserVehicleStatistics" a été appelé par l'Utilisateur "${UtilisateurID}" avec includeSold="${includeSold}".`);

    try {
      const allowedEtatIDs = includeSold ? [1, 4] : [1];
      const vehicules = await prisma.vehicule.findMany({
        where: {
          UtilisateurID: parseInt(UtilisateurID),
          EtatID: { in: allowedEtatIDs },
        },
        orderBy: { VehiculeID: "desc" },
        select: {
          VehiculeID: true,
          Nom: true,
          EtatID: true,
          releves: {
            orderBy: [
              { Date: 'asc' },
              { Kilometre: 'asc' },
            ],
            select: {
              ReleverID: true,
              VehiculeID: true,
              CarburantID: true,
              Consommation: true,
              Date: true,
              Kilometre: true,
              PrixLitre: true,
              PrixTotal: true,
              LitreTotal: true,
              CreateDate: true,
              UpdateDate: true,
              Carburant: {
                select: {
                  Nom: true,
                  Couleur: true,
                },
              },
            },
          },
          EntretienRealises: {
            where: { EstArchive: false },
            orderBy: [
              { Date: 'asc' },
              { Kilometre: 'asc' },
            ],
            select: {
              EntretienRealiseID: true,
              VehiculeID: true,
              Date: true,
              Kilometre: true,
              Cout: true,
              EstArchive: true,
              EntretienType: {
                select: {
                  Nom: true,
                },
              },
            },
          },
        },
      });

      const releverDetails = vehicules.flatMap((vehicule) => (
        vehicule.releves.map((releve) => ({
          ...releve,
          Vehicule: {
            VehiculeID: vehicule.VehiculeID,
            Nom: vehicule.Nom,
            EtatID: vehicule.EtatID,
          },
        }))
      ));
      const entretienRealises = vehicules.flatMap((vehicule) => (
        vehicule.EntretienRealises.map((entretien) => ({
          ...entretien,
          Vehicule: {
            VehiculeID: vehicule.VehiculeID,
            Nom: vehicule.Nom,
            EtatID: vehicule.EtatID,
          },
        }))
      ));

      reply.send({
        vehicles: vehicules.map(({ releves, EntretienRealises, ...vehicule }) => ({
          ...vehicule,
          relevesCount: releves.length,
          entretienRealisesCount: EntretienRealises.length,
        })),
        releverDetails,
        entretienRealises,
      });
    } catch (error) {
      console.error("Erreur lors de la récupération des statistiques des véhicules :", error);
      reply.status(500).send({ error: "Erreur lors de la récupération des statistiques des véhicules." });
    }
  },
  // Liste les types de véhicule
  async getAllTypeVehicule(request, reply) {
    console.log(`"getAllTypeVehicule" à été appeler.`);
    try {
      const vehicule = await prisma.type.findMany({
        orderBy: { Nom: "asc" },
        select: {
          TypeID: true,
          Nom: true,
        },
      });
      reply.send(vehicule);
    } catch (error) {
      console.error("Erreur lors de la récupération des types de véhicule :", error);
      reply.status(500).send({ error: "Erreur lors de la récupération des types de véhicule vendu." });
    }
  },
  // Liste les marques de véhicule
  async getAllMarqueVehicule(request, reply) {
    console.log(`"getAllMarqueVehicule" à été appeler.`);
    try {
      const vehicule = await prisma.marque.findMany({
        orderBy: { Nom: "asc" },
        select: {
          MarqueID: true,
          Nom: true,
        },
      });
      reply.send(vehicule);
    } catch (error) {
      console.error("Erreur lors de la récupération des types de véhicule :", error);
      reply.status(500).send({ error: "Erreur lors de la récupération des types de véhicule vendu." });
    }
  },
  // Liste les carburants de véhicule
  async getAllCarburantVehicule(request, reply) {
    console.log(`"getAllCarburantVehicule" à été appeler.`);
    try {
      const vehicule = await prisma.carburant.findMany({
        orderBy: { Nom: "asc" },
        select: {
          CarburantID: true,
          Nom: true,
        },
      });
      reply.send(vehicule);
    } catch (error) {
      console.error("Erreur lors de la récupération des types de véhicule :", error);
      reply.status(500).send({ error: "Erreur lors de la récupération des types de véhicule vendu." });
    }
  },
  // Liste les détails du véhicule de l'utilisateur pour simulé les coût de roulage
  async getCostSimulationRolling(request, reply) {
    const { UtilisateurID } = request.params;
    console.log(`"getCostSimulationRolling" a été appelé par l'Utilisateur "${UtilisateurID}".`);

    try {
      // Récupérer les détails du véhicule
      const vehicules = await prisma.vehicule.findMany({
        where: { UtilisateurID: parseInt(UtilisateurID), EtatID: 1 },
        select: {
          VehiculeID: true,
        },
      });

      // Initialiser un tableau pour stocker les détails des relevés de tous les véhicules
      const releverDetails = [];

      // Boucler sur chaque véhicule pour récupérer les détails des relevés
      for (const vehicule of vehicules) {
        const details = await prisma.relever.findMany({
          where: { VehiculeID: vehicule.VehiculeID },
          orderBy: { Date: "desc" },
          take: 4,
          select: {
            Vehicule: {
              select: {
                Nom: true,
                Type: {
                  select: {
                    Nom: true,
                  },
                },
              },
            },
            ReleverID: true,
            VehiculeID: true,
            Date: true,
            Kilometre: true,
            PrixTotal: true,
            LitreTotal: true,
          },
        });
        releverDetails.push(...details);
      }

      // Combiner les résultats
      const result = releverDetails;

      reply.send(result);
    } catch (error) {
      console.error("Erreur lors de la récupération des relever de simulation de coût de roulage du véhicule :", error);
      reply.status(500).send({ error: "Erreur lors de la récupération des relever de simulation de coût de roulage du véhicule." });
    }
  },



  // POST



  // Ajoute un véhicule à l'utilisateur
  async postAddVehicule(request, reply) {
    try {
      const { UtilisateurID } = request.params;
      const { nom, modele, immatriculation, dateFirstImmatriculation, types, marques } = request.body;
      const serverDate = new Date();

      // Vérifier que toutes les données nécessaires sont présentes
      if (!nom || !modele || !immatriculation || !dateFirstImmatriculation || !types || !marques) {
        return reply.status(400).send({ error: "Données manquantes" });
      }

      // Vérifier la longueur du nom
      if (nom.length > 100) {
        return reply.status(400).send({ error: "Le nom ne doit pas dépasser 100 caractères." });
      }

      // Vérifier la longueur du nom
      if (modele.length > 100) {
        return reply.status(400).send({ error: "Le modèle ne doit pas dépasser 100 caractères." });
      }

      // Vérifier la longueur de l'immatriculation
      if (immatriculation.length > 20) {
        return reply.status(400).send({ error: "L'immatriculation ne doit pas dépasser 20 caractères." });
      }

      // Afficher les données reçues
      console.table({
        UtilisateurID,
        Nom: nom,
        Modele: modele,
        Immatriculation: immatriculation,
        DateImmatriculation: dateFirstImmatriculation,
        TypeID: types,
        MarqueID: marques,
        EtatID: 1 // Valeur par défaut pour l'état
      });

      // Ajouter le véhicule à la base de données
      const newVehicule = await prisma.vehicule.create({
        data: {
          Nom: nom,
          Modele: modele,
          Immatriculation: immatriculation,
          DateImmatriculation: new Date(dateFirstImmatriculation),
          TypeID: parseInt(types),
          MarqueID: parseInt(marques),
          EtatID: 1,
          UtilisateurID: parseInt(UtilisateurID),
          CreateDate: serverDate,
        },
      });

      // Répondre avec succès
      reply.status(201).send({ message: "Véhicule ajouté avec succès", vehicule: newVehicule });

    } catch (error) {
      console.error("Erreur lors de l'ajout du véhicule :", error);
      reply.status(500).send({ error: "Erreur interne du serveur" });
    }
  },
  // Ajoute un relever de véhicule à l'utilisateur
  async postAddRelever(request, reply) {
    try {
      const { UtilisateurID, VehiculeID } = request.params;
      const { date, kilometre, prixLitre, prixTotal, litreTotal, inclinaisonGauche, inclinaisonDroite, carburant, vehicule, consommation } = request.body;
      const serverDate = new Date();

      console.log("Requête reçue pour ajouter un relevé :");
      console.table({
        UtilisateurID: UtilisateurID,
        VehiculeID: VehiculeID,
        Date: date,
        Kilometre: kilometre,
        PrixLitre: prixLitre,
        PrixTotal: prixTotal,
        LitreTotal: litreTotal,
        InclinaisonGauche: inclinaisonGauche,
        InclinaisonDroite: inclinaisonDroite,
        CarburantID: carburant,
        VehiculeID: vehicule,
        Consommation: consommation,
      });

      // Vérifier que toutes les données nécessaires sont présentes
      if (!date || !kilometre || !prixLitre || !prixTotal || !litreTotal || !carburant || !vehicule) {
        return reply.status(400).send({ error: "Données manquantes" });
      }

      // Ajouter le relevé à la base de données
      const newRelever = await prisma.relever.create({
        data: {
          Date: new Date(date),
          Kilometre: parseFloat(kilometre),
          PrixLitre: parseFloat(prixLitre),
          PrixTotal: parseFloat(prixTotal),
          LitreTotal: parseFloat(litreTotal),
          InclinaisonGauche: inclinaisonGauche ? parseFloat(inclinaisonGauche) : null,
          InclinaisonDroite: inclinaisonDroite ? parseFloat(inclinaisonDroite) : null,
          CarburantID: parseInt(carburant),
          VehiculeID: parseInt(vehicule),
          Consommation: consommation ? parseFloat(consommation) : null,
          CreateDate: serverDate,
        },
      });

      // Répondre avec succès
      reply.status(201).send(newRelever);

    } catch (error) {
      console.error("Erreur lors de l'ajout du relevé :", error);
      reply.status(500).send({ error: "Erreur interne du serveur" });
    }
  },



  // PUT



  // Mettre à jour un relevé de véhicule
  async putUpdateRelever(request, reply) {
    try {
      const { UtilisateurID, VehiculeID, ReleverID } = request.params;
      const vehicleId = parseInt(VehiculeID);
      const userId = parseInt(UtilisateurID);
      const releverId = parseInt(ReleverID);
      const { date, kilometre, prixLitre, prixTotal, litreTotal, inclinaisonGauche, inclinaisonDroite, carburant, consommation } = request.body;
      const serverDate = new Date();

      const vehicule = await prisma.vehicule.findFirst({
        where: { VehiculeID: vehicleId, UtilisateurID: userId },
        select: { VehiculeID: true },
      });

      if (!vehicule) {
        return reply.status(404).send({ error: "Véhicule introuvable." });
      }

      const relever = await prisma.relever.findFirst({
        where: { ReleverID: releverId, VehiculeID: vehicleId },
        select: { ReleverID: true },
      });

      if (!relever) {
        return reply.status(404).send({ error: "Relevé introuvable." });
      }

      if (!date || !kilometre || !prixLitre || !prixTotal || !litreTotal || !carburant) {
        return reply.status(400).send({ error: "Données manquantes" });
      }

      const updatedRelever = await prisma.relever.update({
        where: { ReleverID: releverId },
        data: {
          Date: new Date(date),
          Kilometre: parseFloat(kilometre),
          PrixLitre: parseFloat(prixLitre),
          PrixTotal: parseFloat(prixTotal),
          LitreTotal: parseFloat(litreTotal),
          InclinaisonGauche: inclinaisonGauche ? parseFloat(inclinaisonGauche) : null,
          InclinaisonDroite: inclinaisonDroite ? parseFloat(inclinaisonDroite) : null,
          CarburantID: parseInt(carburant),
          Consommation: consommation ? parseFloat(consommation) : null,
          UpdateDate: serverDate,
        },
      });

      reply.send({ message: "Relevé mis à jour avec succès", relever: updatedRelever });
    } catch (error) {
      console.error("Erreur lors de la mise à jour du relevé :", error);
      reply.status(500).send({ error: "Erreur interne du serveur" });
    }
  },

  // Mettre à jour les informations d'un véhicule
  async putUpdateVehicule(request, reply) {
    let newPhotoPath = null;

    try {
      const { UtilisateurID, VehiculeID } = request.params;
      const vehicleId = parseInt(VehiculeID);
      const userId = parseInt(UtilisateurID);
      const fields = {};
      const serverDate = new Date();

      const vehicule = await prisma.vehicule.findFirst({
        where: { VehiculeID: vehicleId, UtilisateurID: userId },
      });

      if (!vehicule) {
        return reply.status(404).send({ error: "Véhicule introuvable." });
      }

      if (request.isMultipart()) {
        for await (const part of request.parts()) {
          if (part.file) {
            if (!ALLOWED_IMAGE_MIME_TYPES.includes(part.mimetype)) {
              return reply.status(400).send({ error: "Le fichier envoyé doit être une image." });
            }

            const fileName = `${Date.now()}-${path.basename(part.filename)}`;
            const dirPath = path.join(VEHICLE_UPLOAD_ROOT, String(userId), String(vehicleId));
            const uploadPath = path.join(dirPath, fileName);
            await fs.promises.mkdir(dirPath, { recursive: true });
            await fs.promises.writeFile(uploadPath, await part.toBuffer());
            newPhotoPath = `/uploads/vehicules/${userId}/${vehicleId}/${fileName}`;
          } else {
            fields[part.fieldname] = part.value;
          }
        }
      } else {
        Object.assign(fields, request.body || {});
      }

      const { nom, modele, immatriculation, dateFirstImmatriculation, types, marques, removePhoto } = fields;

      if (!nom || !modele || !immatriculation || !dateFirstImmatriculation || !types || !marques) {
        if (newPhotoPath) await removeVehiclePhoto(newPhotoPath);
        return reply.status(400).send({ error: "Données manquantes" });
      }

      if (nom.length > 100) {
        if (newPhotoPath) await removeVehiclePhoto(newPhotoPath);
        return reply.status(400).send({ error: "Le nom ne doit pas dépasser 100 caractères." });
      }

      if (modele.length > 100) {
        if (newPhotoPath) await removeVehiclePhoto(newPhotoPath);
        return reply.status(400).send({ error: "Le modèle ne doit pas dépasser 100 caractères." });
      }

      if (immatriculation.length > 20) {
        if (newPhotoPath) await removeVehiclePhoto(newPhotoPath);
        return reply.status(400).send({ error: "L'immatriculation ne doit pas dépasser 20 caractères." });
      }

      const updateData = {
        Nom: nom.trim(),
        Modele: modele.trim(),
        Immatriculation: immatriculation.trim(),
        DateImmatriculation: new Date(dateFirstImmatriculation),
        TypeID: parseInt(types),
        MarqueID: parseInt(marques),
        UpdateDate: serverDate,
      };

      if (removePhoto === 'true') {
        updateData.Photo = null;
      } else if (newPhotoPath) {
        updateData.Photo = newPhotoPath;
      }

      const updatedVehicule = await prisma.vehicule.update({
        where: { VehiculeID: vehicleId },
        data: updateData,
      });

      if (removePhoto === 'true' && newPhotoPath) {
        await removeVehiclePhoto(newPhotoPath);
        newPhotoPath = null;
      }

      if ((removePhoto === 'true' || newPhotoPath) && vehicule.Photo) {
        await removeVehiclePhoto(vehicule.Photo);
      }

      reply.send({ message: "Véhicule mis à jour avec succès", vehicule: updatedVehicule });
    } catch (error) {
      if (newPhotoPath) await removeVehiclePhoto(newPhotoPath);
      console.error("Erreur lors de la mise à jour du véhicule :", error);
      reply.status(500).send({ error: "Erreur interne du serveur" });
    }
  },

  // Retirer un véhicule à l'utilisateur (vendu)
  async putSoldVehicule(request, reply) {
    console.log(`"putSoldVehicule" à été appeler.`);
    try {
      const { VehiculeID } = request.params;
      const serverDate = new Date();
      const updatedVehicule = await prisma.vehicule.update({
        where: { VehiculeID: parseInt(VehiculeID) },
        data: { EtatID: 4, UpdateDate: serverDate },
      });

      // Répondre avec succès
      reply.status(201).send({ message: "Véhicule ajouté dans les vente avec succès", vehicule: updatedVehicule });

    } catch (error) {
      console.error("Erreur lors de mise en vente du véhicule :", error);
      reply.status(500).send({ error: "Erreur interne du serveur" });
    }
  },

  // Réhabiliter un véhicule vendu
  async putActiveVehicule(request, reply) {
    console.log(`"putActiveVehicule" à été appeler.`);
    try {
      const { VehiculeID } = request.params;
      const serverDate = new Date();
      const updatedVehicule = await prisma.vehicule.update({
        where: { VehiculeID: parseInt(VehiculeID) },
        data: { EtatID: 1, UpdateDate: serverDate },
      });

      reply.status(200).send({ message: "Véhicule réhabilité avec succès", vehicule: updatedVehicule });

    } catch (error) {
      console.error("Erreur lors de la réhabilitation du véhicule :", error);
      reply.status(500).send({ error: "Erreur interne du serveur" });
    }
  },

  // Télécharger le dossier de fichiers du véhicule
  async downloadVehiculeFolder(request, reply) {
    try {
      const { UtilisateurID, VehiculeID } = request.params;
      const { password } = request.body || {};
      const userId = parseInt(UtilisateurID);
      const vehicleId = parseInt(VehiculeID);

      const context = await getVehicleDeletionContext(userId, vehicleId, password);
      if (context.error) {
        return reply.status(context.status).send({
          error: context.error,
          attemptsRemaining: context.attemptsRemaining,
          retryAfterSeconds: context.retryAfterSeconds,
        });
      }

      const folderPath = path.join(VEHICLE_UPLOAD_ROOT, String(userId), String(vehicleId));
      const [folderFiles, rawDataFiles] = await Promise.all([
        readVehicleFolderFiles(folderPath, vehicleId),
        buildVehicleRawDataFiles(vehicleId),
      ]);
      const archive = buildZipArchive([...folderFiles, ...rawDataFiles]);
      const safeVehicleName = (context.vehicule.Nom || `vehicule-${vehicleId}`)
        .replace(/[^a-z0-9-_]+/gi, '-')
        .replace(/^-+|-+$/g, '')
        || `vehicule-${vehicleId}`;

      reply
        .header('Content-Type', 'application/zip')
        .header('Content-Disposition', `attachment; filename="${safeVehicleName}-dossier.zip"`)
        .send(archive);
    } catch (error) {
      console.error("Erreur lors du téléchargement du dossier véhicule :", error);
      reply.status(500).send({ error: "Erreur interne du serveur" });
    }
  },

  // Supprimer un relevé de véhicule
  async deleteRelever(request, reply) {
    try {
      const { UtilisateurID, VehiculeID, ReleverID } = request.params;
      const userId = parseInt(UtilisateurID);
      const vehicleId = parseInt(VehiculeID);
      const releverId = parseInt(ReleverID);

      if (!userId || !vehicleId || !releverId) {
        return reply.status(400).send({ error: "Données manquantes." });
      }

      const relever = await prisma.relever.findFirst({
        where: {
          ReleverID: releverId,
          VehiculeID: vehicleId,
          Vehicule: { UtilisateurID: userId },
        },
        select: { ReleverID: true },
      });

      if (!relever) {
        return reply.status(404).send({ error: "Relevé introuvable." });
      }

      await prisma.relever.delete({
        where: { ReleverID: releverId },
      });

      reply.send({ message: "Relevé supprimé avec succès." });
    } catch (error) {
      console.error("Erreur lors de la suppression du relevé :", error);
      reply.status(500).send({ error: "Erreur interne du serveur" });
    }
  },

  // Supprimer définitivement un véhicule et ses données liées
  async deleteVehicule(request, reply) {
    try {
      const { UtilisateurID, VehiculeID } = request.params;
      const { password } = request.body || {};
      const userId = parseInt(UtilisateurID);
      const vehicleId = parseInt(VehiculeID);

      const context = await getVehicleDeletionContext(userId, vehicleId, password);
      if (context.error) {
        return reply.status(context.status).send({
          error: context.error,
          attemptsRemaining: context.attemptsRemaining,
          retryAfterSeconds: context.retryAfterSeconds,
        });
      }

      await prisma.$transaction([
        prisma.entretienRealise.deleteMany({ where: { VehiculeID: vehicleId } }),
        prisma.entretienPlanifie.deleteMany({ where: { VehiculeID: vehicleId } }),
        prisma.relever.deleteMany({ where: { VehiculeID: vehicleId } }),
        prisma.vehicule.delete({ where: { VehiculeID: vehicleId } }),
      ]);

      if (context.vehicule.Photo) {
        await removeVehiclePhoto(context.vehicule.Photo);
      }

      reply.send({ message: "Véhicule supprimé avec succès." });
    } catch (error) {
      console.error("Erreur lors de la suppression du véhicule :", error);
      reply.status(500).send({ error: "Erreur interne du serveur" });
    }
  },
};
