import { Prisma } from "@prisma/client";
import { prisma } from "../services/db.js";

const resources = {
  types: {
    model: prisma.type,
    idField: "TypeID",
    orderBy: { Nom: "asc" },
    select: { TypeID: true, Nom: true },
    fields: ["Nom"],
  },
  marques: {
    model: prisma.marque,
    idField: "MarqueID",
    orderBy: { Nom: "asc" },
    select: { MarqueID: true, Nom: true },
    fields: ["Nom"],
  },
  carburants: {
    model: prisma.carburant,
    idField: "CarburantID",
    orderBy: { Nom: "asc" },
    select: { CarburantID: true, Nom: true, Couleur: true },
    fields: ["Nom", "Couleur"],
  },
  "categories-entretien": {
    model: prisma.categorieEntretien,
    idField: "CategorieEntretienID",
    orderBy: { Nom: "asc" },
    select: { CategorieEntretienID: true, Nom: true, Couleur: true, Icone: true },
    fields: ["Nom", "Couleur", "Icone"],
    optionalFields: ["Icone"],
  },
  "entretiens-types": {
    model: prisma.entretienType,
    idField: "EntretienTypeID",
    orderBy: { Nom: "asc" },
    select: {
      EntretienTypeID: true,
      Nom: true,
      Description: true,
      CategorieEntretienID: true,
      CategorieEntretien: {
        select: { CategorieEntretienID: true, Nom: true, Couleur: true, Icone: true },
      },
    },
    fields: ["Nom", "Description", "CategorieEntretienID"],
    optionalFields: ["Description"],
    relations: {
      CategorieEntretienID: {
        model: prisma.categorieEntretien,
        idField: "CategorieEntretienID",
        error: "Catégorie d'entretien introuvable.",
      },
    },
  },
};

const parseId = (value) => {
  const id = Number.parseInt(value, 10);
  return Number.isFinite(id) ? id : null;
};

const getResource = (resourceName, reply) => {
  const resource = resources[resourceName];
  if (!resource) {
    reply.status(404).send({ error: "Table de référence inconnue." });
    return null;
  }
  return resource;
};

const normalizeData = async (resource, body = {}) => {
  const data = {};
  const optionalFields = new Set(resource.optionalFields || []);

  for (const field of resource.fields) {
    const rawValue = body[field];

    if (field.endsWith("ID")) {
      const id = parseId(rawValue);
      if (!id && !optionalFields.has(field)) {
        return { error: "Données manquantes ou invalides." };
      }
      data[field] = id;
      continue;
    }

    const value = typeof rawValue === "string" ? rawValue.trim() : rawValue;
    if (!value && !optionalFields.has(field)) {
      return { error: "Données manquantes ou invalides." };
    }
    data[field] = value || null;
  }

  if (resource.relations) {
    for (const [field, relation] of Object.entries(resource.relations)) {
      const related = await relation.model.findUnique({
        where: { [relation.idField]: data[field] },
        select: { [relation.idField]: true },
      });
      if (!related) return { error: relation.error };
    }
  }

  return { data };
};

const sendPrismaError = (error, reply) => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2003") {
      return reply.status(409).send({
        error: "Impossible de supprimer cet élément car il est encore utilisé.",
      });
    }
    if (error.code === "P2025") {
      return reply.status(404).send({ error: "Élément introuvable." });
    }
  }

  console.error("Erreur données de référence :", error);
  return reply.status(500).send({ error: "Erreur lors de la mise à jour des données de référence." });
};

export const adminReferenceController = {
  async ensureAdmin(request, reply) {
    const userId = request.user?.userId;
    if (!userId) return reply.status(401).send({ error: "Unauthorized" });

    const user = await prisma.utilisateur.findUnique({
      where: { UtilisateurID: parseId(userId) },
      select: { GradeID: true },
    });

    if (!user || ![1, 2].includes(user.GradeID)) {
      return reply.status(403).send({ error: "Forbidden" });
    }
  },

  async getAll(request, reply) {
    try {
      const [
        types,
        marques,
        carburants,
        categoriesEntretien,
        entretiensTypes,
      ] = await Promise.all([
        resources.types.model.findMany({ orderBy: resources.types.orderBy, select: resources.types.select }),
        resources.marques.model.findMany({ orderBy: resources.marques.orderBy, select: resources.marques.select }),
        resources.carburants.model.findMany({ orderBy: resources.carburants.orderBy, select: resources.carburants.select }),
        resources["categories-entretien"].model.findMany({
          orderBy: resources["categories-entretien"].orderBy,
          select: resources["categories-entretien"].select,
        }),
        resources["entretiens-types"].model.findMany({
          orderBy: resources["entretiens-types"].orderBy,
          select: resources["entretiens-types"].select,
        }),
      ]);

      reply.send({
        types,
        marques,
        carburants,
        categoriesEntretien,
        entretiensTypes,
      });
    } catch (error) {
      sendPrismaError(error, reply);
    }
  },

  async create(request, reply) {
    const resource = getResource(request.params.resource, reply);
    if (!resource) return;

    try {
      const { data, error } = await normalizeData(resource, request.body);
      if (error) return reply.status(400).send({ error });
      const serverDate = new Date();

      const item = await resource.model.create({
        data: { ...data, CreateDate: serverDate },
        select: resource.select,
      });
      reply.status(201).send(item);
    } catch (error) {
      sendPrismaError(error, reply);
    }
  },

  async update(request, reply) {
    const resource = getResource(request.params.resource, reply);
    const id = parseId(request.params.id);
    if (!resource) return;
    if (!id) return reply.status(400).send({ error: "Identifiant invalide." });

    try {
      const { data, error } = await normalizeData(resource, request.body);
      if (error) return reply.status(400).send({ error });
      const serverDate = new Date();

      const item = await resource.model.update({
        where: { [resource.idField]: id },
        data: { ...data, UpdateDate: serverDate },
        select: resource.select,
      });
      reply.send(item);
    } catch (error) {
      sendPrismaError(error, reply);
    }
  },

  async remove(request, reply) {
    const resource = getResource(request.params.resource, reply);
    const id = parseId(request.params.id);
    if (!resource) return;
    if (!id) return reply.status(400).send({ error: "Identifiant invalide." });

    try {
      await resource.model.delete({
        where: { [resource.idField]: id },
      });
      reply.status(204).send();
    } catch (error) {
      sendPrismaError(error, reply);
    }
  },
};
