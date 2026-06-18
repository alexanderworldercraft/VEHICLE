import fs from "fs";
import bcrypt from "bcrypt";
import { prisma } from "../services/db.js";
import { createDatabaseBackup } from "../services/backupService.js";

const parseId = (value) => {
  const id = Number.parseInt(value, 10);
  return Number.isFinite(id) ? id : null;
};

export const adminBackupController = {
  async ensureSuperAdmin(request, reply) {
    const userId = parseId(request.user?.userId);
    if (!userId) return reply.status(401).send({ error: "Unauthorized" });

    const user = await prisma.utilisateur.findUnique({
      where: { UtilisateurID: userId },
      select: { GradeID: true },
    });

    if (!user || user.GradeID !== 1) {
      return reply.status(403).send({ error: "Seul le superadmin peut lancer une sauvegarde manuelle." });
    }
  },

  async createManualBackup(request, reply) {
    const userId = parseId(request.user?.userId);
    const { motDePasse } = request.body || {};

    if (!motDePasse) {
      return reply.status(400).send({ error: "Mot de passe requis." });
    }

    try {
      const user = await prisma.utilisateur.findUnique({
        where: { UtilisateurID: userId },
        select: { MotDePasse: true, GradeID: true },
      });

      if (!user || user.GradeID !== 1) {
        return reply.status(403).send({ error: "Seul le superadmin peut lancer une sauvegarde manuelle." });
      }

      const isPasswordValid = await bcrypt.compare(motDePasse, user.MotDePasse);
      if (!isPasswordValid) {
        return reply.status(401).send({ error: "Mot de passe incorrect." });
      }

      const { fileName, filePath } = await createDatabaseBackup({ includeTime: true });

      return reply
        .type("application/sql")
        .header("Content-Disposition", `attachment; filename="${fileName}"`)
        .header("X-Backup-Filename", fileName)
        .send(fs.createReadStream(filePath));
    } catch (error) {
      request.log.error(error, "Erreur lors de la sauvegarde manuelle");
      return reply.status(500).send({ error: "Erreur lors de la création de la sauvegarde." });
    }
  },
};
