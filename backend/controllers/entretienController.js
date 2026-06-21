import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { prisma } from "../services/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const ENTRETIEN_UPLOAD_ROOT = path.join(__dirname, '../uploads/vehicules');
const ALLOWED_FILE_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];
const ALLOWED_FILE_CATEGORIES = ['facture', 'avant', 'apres', 'autre', 'devis', 'transaction'];
const MAX_ENTRETIEN_FILE_SIZE = 50 * 1024 * 1024;

const parseId = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseOptionalFloat = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseBoolean = (value) => value === true || value === 'true' || value === '1' || value === 1;

const normalizeDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const parseFilesMeta = (value) => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const readRequestPayload = async (request) => {
  if (!request.isMultipart?.()) {
    return { fields: request.body || {}, files: [] };
  }

  const fields = {};
  const files = [];

  for await (const part of request.parts()) {
    if (part.file) {
      files.push({
        filename: part.filename,
        mimetype: part.mimetype,
        buffer: await part.toBuffer(),
      });
    } else {
      fields[part.fieldname] = part.value;
    }
  }

  return { fields, files };
};

const sanitizeFileBaseName = (value) => {
  const name = String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);

  return name || 'document';
};

const getSafeExtension = (filename, mimetype) => {
  const extension = path.extname(path.basename(filename || '')).toLowerCase();
  if (extension && extension.length <= 10) return extension;
  if (mimetype === 'application/pdf') return '.pdf';
  if (mimetype === 'image/jpeg') return '.jpg';
  if (mimetype === 'image/png') return '.png';
  if (mimetype === 'image/webp') return '.webp';
  if (mimetype === 'image/gif') return '.gif';
  return '';
};

const buildStoredFileName = (file, meta, index) => {
  const extension = getSafeExtension(file.filename, file.mimetype);
  const baseName = sanitizeFileBaseName(meta?.name || file.filename);
  return `${Date.now()}-${index + 1}-${baseName}${extension}`;
};

const getEntretienFolder = (userId, vehicleId, kind, entretienId) => (
  path.join(ENTRETIEN_UPLOAD_ROOT, String(userId), String(vehicleId), 'entretiens', kind, String(entretienId))
);

const getEntretienPublicPath = (userId, vehicleId, kind, entretienId, fileName) => (
  `/uploads/vehicules/${userId}/${vehicleId}/entretiens/${kind}/${entretienId}/${fileName}`
);

const resolveUploadPath = (publicPath) => {
  if (!publicPath || !publicPath.startsWith('/uploads/vehicules/')) return null;
  return path.join(__dirname, '..', publicPath);
};

const formatEntretienFile = (file) => file ? ({
  EntretienFichierID: file.EntretienFichierID,
  EntretienPlanifieID: file.EntretienPlanifieID,
  EntretienRealiseID: file.EntretienRealiseID,
  NomOriginal: file.NomOriginal,
  NomStockage: file.NomStockage,
  TypeMime: file.TypeMime,
  TailleOctets: file.TailleOctets?.toString?.() ?? String(file.TailleOctets || 0),
  Categorie: file.Categorie,
  CreateDate: file.CreateDate,
  UpdateDate: file.UpdateDate,
}) : file;

const formatEntretienFiles = (files = []) => files.map(formatEntretienFile);

const normalizeEntretienWithFiles = (item) => ({
  ...item,
  EntretienFichiers: formatEntretienFiles(item.EntretienFichiers),
});

const validateEntretienFiles = (files = []) => {
  files.forEach((file) => {
    if (!ALLOWED_FILE_MIME_TYPES.includes(file.mimetype)) {
      throw new Error('UNSUPPORTED_FILE_TYPE');
    }
    if (file.buffer.length > MAX_ENTRETIEN_FILE_SIZE) {
      throw new Error('FILE_TOO_LARGE');
    }
  });
};

const saveEntretienFiles = async ({ tx = prisma, userId, vehicleId, kind, entretienId, files, filesMeta = [] }) => {
  if (!files.length) return [];

  validateEntretienFiles(files);

  const dirPath = getEntretienFolder(userId, vehicleId, kind, entretienId);
  await fs.promises.mkdir(dirPath, { recursive: true });

  const savedFiles = [];

  for (const [index, file] of files.entries()) {
    const meta = filesMeta[index] || {};
    const category = ALLOWED_FILE_CATEGORIES.includes(meta.category) ? meta.category : 'autre';
    const storageName = buildStoredFileName(file, meta, index);
    const uploadPath = path.join(dirPath, storageName);
    const publicPath = getEntretienPublicPath(userId, vehicleId, kind, entretienId, storageName);

    await fs.promises.writeFile(uploadPath, file.buffer);

    savedFiles.push(await tx.entretienFichier.create({
      data: {
        EntretienPlanifieID: kind === 'planifies' ? entretienId : null,
        EntretienRealiseID: kind === 'realises' ? entretienId : null,
        NomOriginal: (meta.name || path.basename(file.filename || storageName)).slice(0, 255),
        NomStockage: storageName,
        TypeMime: file.mimetype,
        TailleOctets: BigInt(file.buffer.length),
        Categorie: category,
        Chemin: publicPath,
      },
    }));
  }

  return savedFiles;
};

const removePhysicalFiles = async (files = []) => {
  for (const file of files) {
    const filePath = resolveUploadPath(file.Chemin);
    if (!filePath) continue;

    try {
      await fs.promises.unlink(filePath);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error(`Erreur lors de la suppression du fichier d'entretien : ${error.message}`);
      }
    }
  }
};

const removeEntretienFolder = async (userId, vehicleId, kind, entretienId) => {
  const folderPath = getEntretienFolder(userId, vehicleId, kind, entretienId);
  try {
    await fs.promises.rm(folderPath, { recursive: true, force: true });
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error(`Erreur lors de la suppression du dossier d'entretien : ${error.message}`);
    }
  }
};

const movePlannedFilesToRealized = async ({ tx = prisma, userId, vehicleId, plannedId, realizedId }) => {
  const files = await tx.entretienFichier.findMany({
    where: { EntretienPlanifieID: plannedId, EntretienRealiseID: null },
  });

  if (!files.length) return [];

  const targetDir = getEntretienFolder(userId, vehicleId, 'realises', realizedId);
  await fs.promises.mkdir(targetDir, { recursive: true });

  const movedFiles = [];

  for (const file of files) {
    const sourcePath = resolveUploadPath(file.Chemin);
    const targetPath = path.join(targetDir, file.NomStockage);
    const targetPublicPath = getEntretienPublicPath(userId, vehicleId, 'realises', realizedId, file.NomStockage);

    if (sourcePath) {
      try {
        await fs.promises.rename(sourcePath, targetPath);
      } catch (error) {
        if (error.code === 'ENOENT') {
          console.error(`Fichier planifié introuvable pendant le déplacement : ${file.Chemin}`);
        } else {
          throw error;
        }
      }
    }

    movedFiles.push(await tx.entretienFichier.update({
      where: { EntretienFichierID: file.EntretienFichierID },
      data: {
        EntretienPlanifieID: null,
        EntretienRealiseID: realizedId,
        Chemin: targetPublicPath,
      },
    }));
  }

  await removeEntretienFolder(userId, vehicleId, 'planifies', plannedId);
  return movedFiles;
};

const getUserOwnedEntretienFile = async (userId, fileId) => (
  prisma.entretienFichier.findFirst({
    where: {
      EntretienFichierID: fileId,
      OR: [
        { EntretienPlanifie: { Vehicule: { UtilisateurID: userId } } },
        { EntretienRealise: { Vehicule: { UtilisateurID: userId } } },
      ],
    },
  })
);

const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
const startOfNextMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 1);

const isPlannedOverdue = (planned, latestKilometersByVehicle, now = new Date()) => {
  const latestKilometer = latestKilometersByVehicle.get(planned.VehiculeID);
  const dateOverdue = planned.DatePrevue ? new Date(planned.DatePrevue) < now : false;
  const kilometerOverdue = Number.isFinite(latestKilometer) && Number.isFinite(planned.KilometrePrevu)
    ? planned.KilometrePrevu < latestKilometer
    : false;
  return dateOverdue || kilometerOverdue;
};

const getLatestKilometersByVehicle = async (vehicleIds) => {
  const latestKilometersByVehicle = new Map();

  await Promise.all(vehicleIds.map(async (VehiculeID) => {
    const latestRelever = await prisma.relever.findFirst({
      where: { VehiculeID },
      orderBy: [
        { Date: 'desc' },
        { Kilometre: 'desc' },
      ],
      select: { Kilometre: true },
    });
    latestKilometersByVehicle.set(VehiculeID, latestRelever?.Kilometre ?? null);
  }));

  return latestKilometersByVehicle;
};

const getVehicleSelect = {
  VehiculeID: true,
  Nom: true,
  Modele: true,
  Photo: true,
  EtatID: true,
  Marque: { select: { Nom: true } },
  Type: { select: { Nom: true } },
};

const getEntretienTypeSelect = {
  EntretienTypeID: true,
  Nom: true,
  Description: true,
  CategorieEntretienID: true,
  CategorieEntretien: {
    select: {
      CategorieEntretienID: true,
      Nom: true,
      Couleur: true,
      Icone: true,
    },
  },
};

export const entretienController = {
  async getOverview(request, reply) {
    const userId = parseId(request.params.UtilisateurID);
    if (!userId) return reply.status(400).send({ error: "Utilisateur invalide." });

    try {
      const now = new Date();
      const next90Days = new Date(now.getTime() + 90 * DAY_IN_MS);
      const last12Months = new Date(now);
      last12Months.setFullYear(last12Months.getFullYear() - 1);

      const vehicles = await prisma.vehicule.findMany({
        where: { UtilisateurID: userId, EtatID: 1 },
        orderBy: { VehiculeID: "desc" },
        select: getVehicleSelect,
      });
      const vehicleIds = vehicles.map((vehicle) => vehicle.VehiculeID);
      const latestKilometersByVehicle = await getLatestKilometersByVehicle(vehicleIds);

      const [categories, planned, realized] = await Promise.all([
        prisma.categorieEntretien.findMany({
          orderBy: { Nom: "asc" },
          include: {
            EntretienTypes: {
              orderBy: { Nom: "asc" },
              select: {
                EntretienTypeID: true,
                Nom: true,
                Description: true,
                CategorieEntretienID: true,
              },
            },
          },
        }),
        prisma.entretienPlanifie.findMany({
          where: {
            VehiculeID: { in: vehicleIds.length > 0 ? vehicleIds : [-1] },
            EstRealise: false,
          },
          orderBy: [
            { DatePrevue: "asc" },
            { KilometrePrevu: "asc" },
          ],
          include: {
            Vehicule: { select: getVehicleSelect },
            EntretienType: { select: getEntretienTypeSelect },
            EntretienFichiers: { orderBy: { CreateDate: "asc" } },
          },
        }),
        prisma.entretienRealise.findMany({
          where: {
            VehiculeID: { in: vehicleIds.length > 0 ? vehicleIds : [-1] },
          },
          orderBy: { Date: "desc" },
          include: {
            Vehicule: { select: getVehicleSelect },
            EntretienType: { select: getEntretienTypeSelect },
            EntretienFichiers: { orderBy: { CreateDate: "asc" } },
          },
        }),
      ]);

      const plannedWithStatus = planned.map((rawItem) => {
        const item = normalizeEntretienWithFiles(rawItem);
        return {
        ...item,
        LatestKilometre: latestKilometersByVehicle.get(item.VehiculeID),
        EstEnRetard: isPlannedOverdue(item, latestKilometersByVehicle, now),
        };
      });
      const realizedWithFiles = realized.map(normalizeEntretienWithFiles);
      const accountableRealized = realizedWithFiles.filter((item) => !item.EstArchive);

      const upcomingCount = plannedWithStatus.filter((item) => {
        if (item.EstEnRetard) return false;
        if (item.DatePrevue) return new Date(item.DatePrevue) <= next90Days;
        return item.KilometrePrevu !== null;
      }).length;
      const overdueCount = plannedWithStatus.filter((item) => item.EstEnRetard).length;
      const realizedThisMonth = accountableRealized.filter((item) => {
        const date = new Date(item.Date);
        return date >= startOfMonth(now) && date < startOfNextMonth(now);
      }).length;
      const realizedLast12Months = accountableRealized.filter((item) => new Date(item.Date) >= last12Months);
      const totalCostLast12Months = realizedLast12Months.reduce((sum, item) => sum + (Number(item.Cout) || 0), 0);
      const totalCostAllTime = accountableRealized.reduce((sum, item) => sum + (Number(item.Cout) || 0), 0);
      const costByCategory = accountableRealized.reduce((acc, item) => {
        const category = item.EntretienType.CategorieEntretien;
        const existing = acc.get(category.CategorieEntretienID) || {
          CategorieEntretienID: category.CategorieEntretienID,
          Nom: category.Nom,
          Couleur: category.Couleur,
          Icone: category.Icone,
          Cout: 0,
        };
        existing.Cout += Number(item.Cout) || 0;
        acc.set(category.CategorieEntretienID, existing);
        return acc;
      }, new Map());

      reply.send({
        vehicles,
        categories,
        planned: plannedWithStatus,
        realized: realizedWithFiles,
        latestKilometersByVehicle: Object.fromEntries(latestKilometersByVehicle),
        stats: {
          upcomingCount,
          overdueCount,
          realizedCount: accountableRealized.length,
          archivedCount: realizedWithFiles.length - accountableRealized.length,
          realizedThisMonth,
          totalCostLast12Months,
          totalCostAllTime,
          costByCategory: Array.from(costByCategory.values()).sort((a, b) => b.Cout - a.Cout),
        },
      });
    } catch (error) {
      console.error("Erreur lors de la récupération des entretiens :", error);
      reply.status(500).send({ error: "Erreur lors de la récupération des entretiens." });
    }
  },

  async postAddEntretien(request, reply) {
    const userId = parseId(request.params.UtilisateurID);
    const { fields, files } = await readRequestPayload(request);
    const {
      mode,
      vehiculeId,
      entretienTypeId,
      datePrevue,
      kilometrePrevu,
      priorite,
      note,
      date,
      kilometre,
      cout,
      garage,
      estArchive,
      filesMeta,
    } = fields;

    const vehicleId = parseId(vehiculeId);
    const typeId = parseId(entretienTypeId);
    const serverDate = new Date();
    const parsedFilesMeta = parseFilesMeta(filesMeta);

    if (!userId || !vehicleId || !typeId || !['planned', 'realized'].includes(mode)) {
      return reply.status(400).send({ error: "Données manquantes." });
    }

    try {
      const vehicule = await prisma.vehicule.findFirst({
        where: { VehiculeID: vehicleId, UtilisateurID: userId, EtatID: 1 },
        select: { VehiculeID: true },
      });

      if (!vehicule) return reply.status(404).send({ error: "Véhicule introuvable." });

      const entretienType = await prisma.entretienType.findUnique({
        where: { EntretienTypeID: typeId },
        select: { EntretienTypeID: true },
      });

      if (!entretienType) return reply.status(404).send({ error: "Type d'entretien introuvable." });

      if (mode === 'planned') {
        const parsedDatePrevue = normalizeDate(datePrevue);
        const parsedKilometrePrevu = parseOptionalFloat(kilometrePrevu);

        if (!parsedDatePrevue && parsedKilometrePrevu === null) {
          return reply.status(400).send({ error: "Ajoutez une date prévue, un kilométrage prévu, ou les deux." });
        }

        const entretien = await prisma.$transaction(async (tx) => {
          const created = await tx.entretienPlanifie.create({
            data: {
              VehiculeID: vehicleId,
              EntretienTypeID: typeId,
              DatePrevue: parsedDatePrevue,
              KilometrePrevu: parsedKilometrePrevu,
              Priorite: priorite || null,
              Note: note?.trim() || null,
              CreateDate: serverDate,
            },
          });

          const entretienFiles = await saveEntretienFiles({
            tx,
            userId,
            vehicleId,
            kind: 'planifies',
            entretienId: created.EntretienPlanifieID,
            files,
            filesMeta: parsedFilesMeta,
          });

          return { ...created, EntretienFichiers: formatEntretienFiles(entretienFiles) };
        });

        return reply.status(201).send({ message: "Entretien planifié ajouté avec succès", entretien });
      }

      const parsedDate = normalizeDate(date);
      if (!parsedDate) return reply.status(400).send({ error: "La date de réalisation est obligatoire." });

      const entretien = await prisma.$transaction(async (tx) => {
        const created = await tx.entretienRealise.create({
          data: {
            VehiculeID: vehicleId,
            EntretienTypeID: typeId,
            Date: parsedDate,
            Kilometre: parseOptionalFloat(kilometre),
            Cout: parseOptionalFloat(cout),
            Garage: garage?.trim() || null,
            Note: note?.trim() || null,
            EstArchive: parseBoolean(estArchive),
            CreateDate: serverDate,
          },
        });

        const entretienFiles = await saveEntretienFiles({
          tx,
          userId,
          vehicleId,
          kind: 'realises',
          entretienId: created.EntretienRealiseID,
          files,
          filesMeta: parsedFilesMeta,
        });

        return { ...created, EntretienFichiers: formatEntretienFiles(entretienFiles) };
      });

      reply.status(201).send({ message: "Entretien réalisé ajouté avec succès", entretien });
    } catch (error) {
      if (error.message === 'UNSUPPORTED_FILE_TYPE') {
        return reply.status(400).send({ error: "Les fichiers doivent être des images ou des PDF." });
      }
      if (error.message === 'FILE_TOO_LARGE') {
        return reply.status(400).send({ error: "Chaque fichier doit faire moins de 50 Mo." });
      }
      console.error("Erreur lors de l'ajout de l'entretien :", error);
      reply.status(500).send({ error: "Erreur interne du serveur" });
    }
  },

  async putUpdatePlanifie(request, reply) {
    const userId = parseId(request.params.UtilisateurID);
    const plannedId = parseId(request.params.EntretienPlanifieID);
    const { fields, files } = await readRequestPayload(request);
    const { vehiculeId, entretienTypeId, datePrevue, kilometrePrevu, priorite, note, filesMeta } = fields;
    const vehicleId = parseId(vehiculeId);
    const typeId = parseId(entretienTypeId);
    const serverDate = new Date();
    const parsedFilesMeta = parseFilesMeta(filesMeta);

    if (!userId || !plannedId || !vehicleId || !typeId) {
      return reply.status(400).send({ error: "Données manquantes." });
    }

    try {
      const planned = await prisma.entretienPlanifie.findFirst({
        where: {
          EntretienPlanifieID: plannedId,
          Vehicule: { UtilisateurID: userId },
        },
        select: { EntretienPlanifieID: true },
      });

      if (!planned) return reply.status(404).send({ error: "Entretien planifié introuvable." });

      const vehicule = await prisma.vehicule.findFirst({
        where: { VehiculeID: vehicleId, UtilisateurID: userId, EtatID: 1 },
        select: { VehiculeID: true },
      });
      if (!vehicule) return reply.status(404).send({ error: "Véhicule introuvable." });

      const entretienType = await prisma.entretienType.findUnique({
        where: { EntretienTypeID: typeId },
        select: { EntretienTypeID: true },
      });
      if (!entretienType) return reply.status(404).send({ error: "Type d'entretien introuvable." });

      const parsedDatePrevue = normalizeDate(datePrevue);
      const parsedKilometrePrevu = parseOptionalFloat(kilometrePrevu);

      if (!parsedDatePrevue && parsedKilometrePrevu === null) {
        return reply.status(400).send({ error: "Ajoutez une date prévue, un kilométrage prévu, ou les deux." });
      }

      const entretien = await prisma.$transaction(async (tx) => {
        const updated = await tx.entretienPlanifie.update({
          where: { EntretienPlanifieID: plannedId },
          data: {
            VehiculeID: vehicleId,
            EntretienTypeID: typeId,
            DatePrevue: parsedDatePrevue,
            KilometrePrevu: parsedKilometrePrevu,
            Priorite: priorite || null,
            Note: note?.trim() || null,
            UpdateDate: serverDate,
          },
          include: { EntretienFichiers: { orderBy: { CreateDate: "asc" } } },
        });

        const addedFiles = await saveEntretienFiles({
          tx,
          userId,
          vehicleId,
          kind: 'planifies',
          entretienId: plannedId,
          files,
          filesMeta: parsedFilesMeta,
        });

        return {
          ...updated,
          EntretienFichiers: formatEntretienFiles([...updated.EntretienFichiers, ...addedFiles]),
        };
      });

      reply.send({ message: "Entretien planifié mis à jour avec succès", entretien });
    } catch (error) {
      if (error.message === 'UNSUPPORTED_FILE_TYPE') {
        return reply.status(400).send({ error: "Les fichiers doivent être des images ou des PDF." });
      }
      if (error.message === 'FILE_TOO_LARGE') {
        return reply.status(400).send({ error: "Chaque fichier doit faire moins de 50 Mo." });
      }
      console.error("Erreur lors de la mise à jour de l'entretien planifié :", error);
      reply.status(500).send({ error: "Erreur interne du serveur" });
    }
  },

  async putUpdateRealise(request, reply) {
    const userId = parseId(request.params.UtilisateurID);
    const realizedId = parseId(request.params.EntretienRealiseID);
    const { fields, files } = await readRequestPayload(request);
    const { vehiculeId, entretienTypeId, date, kilometre, cout, garage, note, estArchive, filesMeta } = fields;
    const vehicleId = parseId(vehiculeId);
    const typeId = parseId(entretienTypeId);
    const serverDate = new Date();
    const parsedFilesMeta = parseFilesMeta(filesMeta);

    if (!userId || !realizedId || !vehicleId || !typeId) {
      return reply.status(400).send({ error: "Données manquantes." });
    }

    try {
      const realized = await prisma.entretienRealise.findFirst({
        where: {
          EntretienRealiseID: realizedId,
          Vehicule: { UtilisateurID: userId },
        },
        select: { EntretienRealiseID: true },
      });

      if (!realized) return reply.status(404).send({ error: "Entretien réalisé introuvable." });

      const vehicule = await prisma.vehicule.findFirst({
        where: { VehiculeID: vehicleId, UtilisateurID: userId, EtatID: 1 },
        select: { VehiculeID: true },
      });
      if (!vehicule) return reply.status(404).send({ error: "Véhicule introuvable." });

      const entretienType = await prisma.entretienType.findUnique({
        where: { EntretienTypeID: typeId },
        select: { EntretienTypeID: true },
      });
      if (!entretienType) return reply.status(404).send({ error: "Type d'entretien introuvable." });

      const parsedDate = normalizeDate(date);
      if (!parsedDate) return reply.status(400).send({ error: "La date de réalisation est obligatoire." });

      const entretien = await prisma.$transaction(async (tx) => {
        const updated = await tx.entretienRealise.update({
          where: { EntretienRealiseID: realizedId },
          data: {
            VehiculeID: vehicleId,
            EntretienTypeID: typeId,
            Date: parsedDate,
            Kilometre: parseOptionalFloat(kilometre),
            Cout: parseOptionalFloat(cout),
            Garage: garage?.trim() || null,
            Note: note?.trim() || null,
            EstArchive: parseBoolean(estArchive),
            UpdateDate: serverDate,
          },
          include: { EntretienFichiers: { orderBy: { CreateDate: "asc" } } },
        });

        const addedFiles = await saveEntretienFiles({
          tx,
          userId,
          vehicleId,
          kind: 'realises',
          entretienId: realizedId,
          files,
          filesMeta: parsedFilesMeta,
        });

        return {
          ...updated,
          EntretienFichiers: formatEntretienFiles([...updated.EntretienFichiers, ...addedFiles]),
        };
      });

      reply.send({ message: "Entretien réalisé mis à jour avec succès", entretien });
    } catch (error) {
      if (error.message === 'UNSUPPORTED_FILE_TYPE') {
        return reply.status(400).send({ error: "Les fichiers doivent être des images ou des PDF." });
      }
      if (error.message === 'FILE_TOO_LARGE') {
        return reply.status(400).send({ error: "Chaque fichier doit faire moins de 50 Mo." });
      }
      console.error("Erreur lors de la mise à jour de l'entretien réalisé :", error);
      reply.status(500).send({ error: "Erreur interne du serveur" });
    }
  },

  async putCompletePlanifie(request, reply) {
    const userId = parseId(request.params.UtilisateurID);
    const plannedId = parseId(request.params.EntretienPlanifieID);
    const { fields, files } = await readRequestPayload(request);
    const { date, kilometre, cout, garage, note, estArchive, filesMeta } = fields;
    const serverDate = new Date();
    const parsedFilesMeta = parseFilesMeta(filesMeta);

    if (!userId || !plannedId) return reply.status(400).send({ error: "Données manquantes." });

    try {
      validateEntretienFiles(files);

      const planned = await prisma.entretienPlanifie.findFirst({
        where: {
          EntretienPlanifieID: plannedId,
          Vehicule: { UtilisateurID: userId },
        },
        select: {
          EntretienPlanifieID: true,
          VehiculeID: true,
          EntretienTypeID: true,
        },
      });

      if (!planned) return reply.status(404).send({ error: "Entretien planifié introuvable." });

      const parsedDate = normalizeDate(date);
      if (!parsedDate) return reply.status(400).send({ error: "La date de réalisation est obligatoire." });

      const result = await prisma.$transaction(async (tx) => {
        const realized = await tx.entretienRealise.create({
          data: {
            VehiculeID: planned.VehiculeID,
            EntretienTypeID: planned.EntretienTypeID,
            EntretienPlanifieID: planned.EntretienPlanifieID,
            Date: parsedDate,
            Kilometre: parseOptionalFloat(kilometre),
            Cout: parseOptionalFloat(cout),
            Garage: garage?.trim() || null,
            Note: note?.trim() || null,
            EstArchive: parseBoolean(estArchive),
            CreateDate: serverDate,
          },
        });

        await tx.entretienPlanifie.update({
          where: { EntretienPlanifieID: plannedId },
          data: {
            EstRealise: true,
            UpdateDate: serverDate,
          },
        });

        const movedFiles = await movePlannedFilesToRealized({
          tx,
          userId,
          vehicleId: planned.VehiculeID,
          plannedId,
          realizedId: realized.EntretienRealiseID,
        });

        const addedFiles = await saveEntretienFiles({
          tx,
          userId,
          vehicleId: planned.VehiculeID,
          kind: 'realises',
          entretienId: realized.EntretienRealiseID,
          files,
          filesMeta: parsedFilesMeta,
        });

        return {
          ...realized,
          EntretienFichiers: formatEntretienFiles([...movedFiles, ...addedFiles]),
        };
      });

      reply.send({ message: "Entretien marqué comme réalisé avec succès", entretien: result });
    } catch (error) {
      if (error.message === 'UNSUPPORTED_FILE_TYPE') {
        return reply.status(400).send({ error: "Les fichiers doivent être des images ou des PDF." });
      }
      if (error.message === 'FILE_TOO_LARGE') {
        return reply.status(400).send({ error: "Chaque fichier doit faire moins de 50 Mo." });
      }
      console.error("Erreur lors du passage en réalisé :", error);
      reply.status(500).send({ error: "Erreur interne du serveur" });
    }
  },

  async deletePlanifie(request, reply) {
    const userId = parseId(request.params.UtilisateurID);
    const plannedId = parseId(request.params.EntretienPlanifieID);

    if (!userId || !plannedId) return reply.status(400).send({ error: "Données manquantes." });

    try {
      const planned = await prisma.entretienPlanifie.findFirst({
        where: {
          EntretienPlanifieID: plannedId,
          Vehicule: { UtilisateurID: userId },
        },
        select: {
          EntretienPlanifieID: true,
          VehiculeID: true,
          EntretienFichiers: true,
        },
      });

      if (!planned) return reply.status(404).send({ error: "Entretien planifié introuvable." });

      await prisma.$transaction(async (tx) => {
        await tx.entretienFichier.deleteMany({
          where: { EntretienPlanifieID: plannedId },
        });
        await tx.entretienPlanifie.delete({
          where: { EntretienPlanifieID: plannedId },
        });
      });
      await removePhysicalFiles(planned.EntretienFichiers);
      await removeEntretienFolder(userId, planned.VehiculeID, 'planifies', plannedId);

      reply.send({ message: "Entretien planifié supprimé avec succès." });
    } catch (error) {
      console.error("Erreur lors de la suppression de l'entretien planifié :", error);
      reply.status(500).send({ error: "Erreur interne du serveur" });
    }
  },

  async deleteRealise(request, reply) {
    const userId = parseId(request.params.UtilisateurID);
    const realizedId = parseId(request.params.EntretienRealiseID);

    if (!userId || !realizedId) return reply.status(400).send({ error: "Données manquantes." });

    try {
      const realized = await prisma.entretienRealise.findFirst({
        where: {
          EntretienRealiseID: realizedId,
          Vehicule: { UtilisateurID: userId },
        },
        select: {
          EntretienRealiseID: true,
          VehiculeID: true,
          EntretienFichiers: true,
        },
      });

      if (!realized) return reply.status(404).send({ error: "Entretien réalisé introuvable." });

      await prisma.$transaction(async (tx) => {
        await tx.entretienFichier.deleteMany({
          where: { EntretienRealiseID: realizedId },
        });
        await tx.entretienRealise.delete({
          where: { EntretienRealiseID: realizedId },
        });
      });
      await removePhysicalFiles(realized.EntretienFichiers);
      await removeEntretienFolder(userId, realized.VehiculeID, 'realises', realizedId);

      reply.send({ message: "Entretien réalisé supprimé avec succès." });
    } catch (error) {
      console.error("Erreur lors de la suppression de l'entretien réalisé :", error);
      reply.status(500).send({ error: "Erreur interne du serveur" });
    }
  },

  async deleteFichier(request, reply) {
    const userId = parseId(request.params.UtilisateurID);
    const fileId = parseId(request.params.EntretienFichierID);

    if (!userId || !fileId) return reply.status(400).send({ error: "Données manquantes." });
    if (request.user?.userId !== userId) return reply.status(403).send({ error: "Accès interdit." });

    try {
      const file = await getUserOwnedEntretienFile(userId, fileId);

      if (!file) return reply.status(404).send({ error: "Fichier introuvable." });

      await prisma.entretienFichier.delete({
        where: { EntretienFichierID: fileId },
      });
      await removePhysicalFiles([file]);

      reply.send({ message: "Fichier supprimé avec succès." });
    } catch (error) {
      console.error("Erreur lors de la suppression du fichier d'entretien :", error);
      reply.status(500).send({ error: "Erreur interne du serveur" });
    }
  },

  async getFichier(request, reply) {
    const userId = parseId(request.params.UtilisateurID);
    const fileId = parseId(request.params.EntretienFichierID);

    if (!userId || !fileId) return reply.status(400).send({ error: "Données manquantes." });
    if (request.user?.userId !== userId) return reply.status(403).send({ error: "Accès interdit." });

    try {
      const file = await getUserOwnedEntretienFile(userId, fileId);
      if (!file) return reply.status(404).send({ error: "Fichier introuvable." });

      const filePath = resolveUploadPath(file.Chemin);
      if (!filePath) return reply.status(404).send({ error: "Fichier introuvable." });

      try {
        await fs.promises.access(filePath, fs.constants.R_OK);
      } catch {
        return reply.status(404).send({ error: "Fichier introuvable." });
      }

      return reply
        .type(file.TypeMime)
        .header('Content-Disposition', `inline; filename="${encodeURIComponent(file.NomOriginal)}"`)
        .send(fs.createReadStream(filePath));
    } catch (error) {
      console.error("Erreur lors de la récupération du fichier d'entretien :", error);
      reply.status(500).send({ error: "Erreur interne du serveur" });
    }
  },
};
