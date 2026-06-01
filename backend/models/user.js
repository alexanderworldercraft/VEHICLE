// models/user.js

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const userRepository = {
  async createUser(userData) {
    const serverDate = new Date();
    return prisma.utilisateur.create({
      data: { ...userData, CreateDate: serverDate },
    });
  },

  async getUserBySurnom(surnom) {
    return prisma.utilisateur.findUnique({
      where: { Surnom: surnom },
    });
  },

  async updateUserPassword(surnom, hashedPassword) {
    const serverDate = new Date();
    return prisma.utilisateur.update({
      where: { surnom },
      data: { motDePasse: hashedPassword, UpdateDate: serverDate },
    });
  },

  async deleteUserBySurnom(surnom) {
    return prisma.utilisateur.delete({
      where: { surnom },
    });
  },

  async updateUserSurnom(surnom, newSurnom) {
    const serverDate = new Date();
    return prisma.utilisateur.update({
      where: { surnom },
      data: { surnom: newSurnom, UpdateDate: serverDate },
    });
  },

  async updateUserEmail(surnom, newEmail) {
    const serverDate = new Date();
    return prisma.utilisateur.update({
      where: { surnom },
      data: { email: newEmail, UpdateDate: serverDate },
    });
  },

  async updateUserProfileImage(surnom, cheminImage) {
    const serverDate = new Date();
    return prisma.utilisateur.update({
      where: { surnom },
      data: { cheminImage, UpdateDate: serverDate },
    });
  },

  async deleteUserProfileImage(surnom) {
    const serverDate = new Date();
    return prisma.utilisateur.update({
      where: { surnom },
      data: { cheminImage: null, UpdateDate: serverDate },
    });
  },
  async getUserById(userId) {
    return await prisma.utilisateur.findUnique({
      where: { UtilisateurID: userId },
      select: {
        UtilisateurID: true,
        Surnom: true,
        Email: true,
        MotDePasse: true,
        Salt: true,
        CheminImage: true,
        EtatID: true,
        GradeID: true,
      },
    });
  },
  async getUserBySurnomOrEmail(surnom, email) {
    return prisma.utilisateur.findFirst({
      where: {
        OR: [
          { Surnom: surnom },
          { Email: email },
        ],
      },
    });
  },
  async updateUserByField(where, data) {
    const serverDate = new Date();
    return prisma.utilisateur.update({
      where,
      data: { ...data, UpdateDate: serverDate },
    });
  },
  async updateUserById(userId, updateData) {
    const serverDate = new Date();
    return prisma.utilisateur.update({
      where: { UtilisateurID: userId },
      data: { ...updateData, UpdateDate: serverDate },
    });
  },
  async getAdmins() {
    return (await prisma.utilisateur.findMany({
      where: {
        GradeID: {
          in: [1, 2], // Superadmin et admin
        },
      },
      select: {
        UtilisateurID: true,
        Surnom: true,
        Email: true,
        Grade: {
          select: {
            Nom: true, // Nom du grade
          },
        },
        GradeID: true,
        EtatID: true,
      },
    })) || []; // Renvoie un tableau vide par défaut
  },
  async getUsersByCriteria(gradeId, etatId) {
    return prisma.utilisateur.findMany({
        where: {
            GradeID: gradeId,
            EtatID: etatId,
        },
        select: {
            UtilisateurID: true,
            Surnom: true,
            Email: true,
            CheminImage: true,
            EtatID: true,
        },
    });
}

};
