// controllers/userController.js

import { userRepository } from '../models/user.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Recrée __dirname pour les modules ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const secretKey = process.env.JWT_SECRET;

function validatePassword(password) {
  const minLength = 8;
  const maxLength = 20;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (
    password.length < minLength ||
    password.length > maxLength ||
    !hasUpperCase ||
    !hasLowerCase ||
    !hasNumber ||
    !hasSpecialChar
  ) {
    return false;
  }
  return true;
}

export const userController = {
  async register(request, reply) {
    try {
      const parts = request.parts(); // Permet de lire les fichiers et champs
      let fields = {};
      let cheminImage = null;

      for await (const part of parts) {
        if (part.file) {
          const fileName = `${Date.now()}-${part.filename}`;
          const uploadPath = path.join(__dirname, '../uploads/pp', fileName);

          await fs.promises.writeFile(uploadPath, await part.toBuffer());
          cheminImage = `/uploads/pp/${fileName}`;
        } else {
          fields[part.fieldname] = part.value;
        }
      }

      const { surnom, email, motDePasse, gradeId } = fields;

      if (!surnom || !email || !motDePasse) {
        return reply.status(400).send({ error: 'Surnom, Email, and Mot de Passe are required' });
      }

      // Valider le mot de passe
      if (!validatePassword(motDePasse)) {
        return reply.status(400).send({
          error:
            'Le mot de passe doit contenir entre 8 et 20 caractères, inclure une majuscule, une minuscule, un chiffre et un caractère spécial.',
        });
      }

      // Vérifier si le surnom ou l'email existe déjà
      const existingUser = await userRepository.getUserBySurnomOrEmail(surnom, email);
      if (existingUser) {
        return reply.status(400).send({
          error: existingUser.Surnom === surnom
            ? 'Ce surnom est déjà utilisé. Veuillez en choisir un autre.'
            : 'Cet email est déjà utilisé. Veuillez en choisir un autre.',
        });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(motDePasse, salt);

      // Ajouter un grade et un état par défaut
      const DEFAULT_GRADE_ID = 3; // Grade utilisateur standard
      const DEFAULT_ETAT_ID = 1; // Etat actif par défaut

      const user = await userRepository.createUser({
        Surnom: surnom,
        Email: email,
        MotDePasse: hashedPassword,
        CheminImage: cheminImage,
        Salt: salt,
        GradeID: gradeId ? parseInt(gradeId) : DEFAULT_GRADE_ID,
        EtatID: DEFAULT_ETAT_ID,
      });

      reply.send(user);
    } catch (err) {
      console.error('Error in register:', err);
      reply.status(500).send({ error: 'Internal Server Error', message: err.message });
    }
  },

  async login(request, reply) {
    try {
      const { surnom, motDePasse } = request.body;

      // Vérifier si les champs sont présents
      if (!surnom || !motDePasse) {
        return reply.status(400).send({ error: 'Surnom and Mot de Passe are required' });
      }

      // Récupérer l'utilisateur par surnom
      const user = await userRepository.getUserBySurnom(surnom);
      if (!user) {
        return reply.status(401).send({ error: 'Invalid credentials' });
      }

      // Vérifier l'état du compte
      if (user.EtatID === 3) { // Compte bloqué
        return reply.status(403).send({
          error: 'Votre compte est bloqué. Veuillez contacter l\'administrateur.',
        });
      }

      // Vérifier le mot de passe
      const isPasswordValid = await bcrypt.compare(motDePasse, user.MotDePasse);
      if (!isPasswordValid) {
        return reply.status(401).send({ error: 'Invalid credentials' });
      }

      // Générer un jeton JWT
      const token = jwt.sign(
        { userId: user.UtilisateurID, surnom: user.Surnom },
        process.env.JWT_SECRET,
        { expiresIn: '15h' } // Expiration en 7 heure
      );

      // Répondre avec le jeton
      reply.send({ token });
    } catch (err) {
      console.error('Error in login:', err);
      reply.status(500).send({ error: 'Internal Server Error', message: err.message });
    }
  },

  async updatePassword(request, reply) {
    const { surnom, oldPassword, newPassword } = request.body;

    const user = await userRepository.getUserBySurnom(surnom);
    if (!user) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.motDePasse);
    if (!isOldPasswordValid) {
      return reply.status(401).send({ error: 'Invalid old password' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, user.salt);
    await userRepository.updateUserPassword(surnom, hashedNewPassword);

    reply.send({ message: 'Password updated successfully' });
  },

  async deleteUser(request, reply) {
    const token = request.headers['authorization']?.split(' ')[1];
    if (!token) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    try {
      const decoded = jwt.verify(token, secretKey);
      const { surnom } = request.body;

      if (decoded.surnom !== surnom) {
        return reply.status(403).send({ error: 'Forbidden' });
      }

      await userRepository.deleteUserBySurnom(surnom);
      reply.send({ message: 'User deleted successfully' });
    } catch (err) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
  },

  async updateSurnom(request, reply) {
    const token = request.headers['authorization']?.split(' ')[1];
    if (!token) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    try {
      const decoded = jwt.verify(token, secretKey);
      const { newSurnom } = request.body;

      if (!newSurnom) {
        return reply.status(400).send({ error: 'New surnom is required' });
      }

      await userRepository.updateUserSurnom(decoded.surnom, newSurnom);
      reply.send({ message: 'Surnom updated successfully' });
    } catch (err) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
  },

  async updateEmail(request, reply) {
    const token = request.headers['authorization']?.split(' ')[1];
    if (!token) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    try {
      const decoded = jwt.verify(token, secretKey);
      const { newEmail } = request.body;

      if (!newEmail) {
        return reply.status(400).send({ error: 'New email is required' });
      }

      await userRepository.updateUserEmail(decoded.surnom, newEmail);
      reply.send({ message: 'Email updated successfully' });
    } catch (err) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
  },

  async updateProfileImage(request, reply) {
    const token = request.headers['authorization']?.split(' ')[1];
    if (!token) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    try {
      const decoded = jwt.verify(token, secretKey);
      const { cheminImage } = request.body;

      await userRepository.updateUserProfileImage(decoded.surnom, cheminImage);
      reply.send({ message: 'Profile image updated successfully' });
    } catch (err) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
  },
  async deleteProfileImage(request, reply) {
    const token = request.headers['authorization']?.split(' ')[1];
    if (!token) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    try {
      const decoded = jwt.verify(token, secretKey);

      await userRepository.deleteUserProfileImage(decoded.surnom);
      reply.send({ message: 'Profile image deleted successfully' });
    } catch (err) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
  },
  async updateUser(request, reply) {
    const token = request.headers['authorization']?.split(' ')[1];
    if (!token) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    try {
      const decoded = jwt.verify(token, secretKey);
      const parts = request.parts();
      let fields = {};
      let newImagePath = null;
      let oldImagePath = null; // Pour stocker le chemin de l'ancienne image si elle existe

      const user = await userRepository.getUserById(decoded.userId); // Récupère les infos actuelles de l'utilisateur
      const idNumber = user.UtilisateurID;
      const id = idNumber.toString();


      // Lire les champs et fichiers
      for await (const part of parts) {
        if (part.file) {
          const fileName = `${Date.now()}-${part.filename}`;
          const uploadPath = path.join(__dirname, '../uploads/pp/', id, '/', fileName);
          
          // Vérifier si le dossier existe
          const dirPath = path.join(__dirname, '../uploads/pp/', id);
          if (!fs.existsSync(dirPath)) {
            // Créer le dossier s'il n'existe pas
            fs.mkdirSync(dirPath, { recursive: true });
          }

          await fs.promises.writeFile(uploadPath, await part.toBuffer());
          newImagePath = `/uploads/pp/${id}/${fileName}`;
        } else {
          fields[part.fieldname] = part.value;
        }
      }

      const { surnom, email, motDePasse, removeImage } = fields;

      const updateData = {};

      if (!user) {
        return reply.status(404).send({ error: 'User not found' });
      }

      // Sauvegarder l'ancien chemin d'image pour suppression ultérieure
      oldImagePath = user.CheminImage ? path.join(__dirname, `..${user.CheminImage}`) : null;

      if (motDePasse) {
        const { oldPassword, newPassword, confirmPassword } = JSON.parse(motDePasse);

        // Vérifiez que tous les champs sont présents
        if (!oldPassword || !newPassword || !confirmPassword) {
          return reply.status(400).send({ error: "Tous les champs de mot de passe sont requis." });
        }

        // Vérifiez que les arguments sont valides
        if (!oldPassword || !user.MotDePasse) {
          return reply.status(400).send({ error: "Données invalides pour la mise à jour du mot de passe." });
        }

        // Vérifiez l'ancien mot de passe
        const isOldPasswordValid = await bcrypt.compare(oldPassword, user.MotDePasse);
        if (!isOldPasswordValid) {
          return reply.status(400).send({ error: "L'ancien mot de passe est incorrect." });
        }

        // Vérifiez que le nouveau mot de passe et la confirmation correspondent
        if (newPassword !== confirmPassword) {
          return reply.status(400).send({ error: "Le nouveau mot de passe et la confirmation ne correspondent pas." });
        }

        // Validez le nouveau mot de passe
        if (!validatePassword(newPassword)) {
          return reply.status(400).send({
            error:
              "Le nouveau mot de passe doit contenir entre 8 et 20 caractères, inclure une majuscule, une minuscule, un chiffre et un caractère spécial.",
          });
        }

        // Hachez le nouveau mot de passe
        const hashedPassword = await bcrypt.hash(newPassword, user.Salt);
        updateData.MotDePasse = hashedPassword;
      }

      if (surnom) updateData.Surnom = surnom;
      if (email) updateData.Email = email;

      // Gérer la suppression ou le remplacement de l'image
      if (removeImage === 'true') {
        updateData.CheminImage = null;
        newImagePath = null; // Pas besoin d'ajouter une nouvelle image
      } else if (newImagePath) {
        updateData.CheminImage = newImagePath;
      }

      // Mettre à jour les données de l'utilisateur
      const updatedUser = await userRepository.updateUserById(decoded.userId, updateData);

      // Supprimer l'ancienne image si une nouvelle est ajoutée ou si l'image est supprimée
      if ((removeImage === 'true' || newImagePath) && oldImagePath) {
        fs.unlink(oldImagePath, (err) => {
          if (err) {
            console.error(`Erreur lors de la suppression de l'image : ${err.message}`);
          } else {
            console.log(`Ancienne image supprimée : ${oldImagePath}`);
          }
        });
      }

      reply.send({ message: 'User updated successfully', user: updatedUser });
    } catch (err) {
      console.error('Error in updateUser:', err);
      reply.status(500).send({ error: 'Internal Server Error', message: err.message });
    }
  },
  async getAdmins(request, reply) {
    console.log("getAdmins a été appelé"); // Log pour vérifier si la méthode est appelée
    try {
      const token = request.headers["authorization"]?.split(" ")[1];
      console.log("Token reçu:", token); // Logguer le token

      if (!token) {
        return reply.status(401).send({ error: "Unauthorized" });
      }

      const decoded = jwt.verify(token, secretKey);
      console.log("Données décodées du JWT:", decoded); // Logguer les données décodées

      // Vérifier si l'utilisateur est superadmin ou admin
      const user = await userRepository.getUserById(decoded.userId);
      console.log("Utilisateur récupéré:", user); // Logguer les infos utilisateur

      if (!user || (user.GradeID !== 1 && user.GradeID !== 2)) {
        return reply.status(403).send({ error: "Forbidden" });
      }

      const admins = await userRepository.getAdmins();
      console.log("Admins récupérés:", admins); // Logguer les admins récupérés
      reply.send(admins);
    } catch (err) {
      console.error("Error in getAdmins:", err); // Logguer les erreurs
      reply.status(500).send({ error: "Internal Server Error", message: err.message });
    }
  },
  async getUsersByCriteria(request, reply) {
    try {
      const token = request.headers["authorization"]?.split(" ")[1];
      if (!token) {
        return reply.status(401).send({ error: "Unauthorized" });
      }

      const decoded = jwt.verify(token, secretKey);

      // Vérifier si l'utilisateur est superadmin ou admin
      const user = await userRepository.getUserById(decoded.userId);
      if (!user || (user.GradeID !== 1 && user.GradeID !== 2)) {
        return reply.status(403).send({ error: "Forbidden" });
      }

      const { gradeId = 3, etatId = 1 } = request.query; // Paramètres par défaut : utilisateurs classiques actifs

      // Récupérer les utilisateurs correspondant aux critères
      const users = await userRepository.getUsersByCriteria(Number(gradeId), Number(etatId));
      reply.send(users);
    } catch (err) {
      console.error("Error in getUsersByCriteria:", err);
      reply.status(500).send({ error: "Internal Server Error", message: err.message });
    }
  },
  async changeUserEtat(request, reply) {
    try {
      const token = request.headers["authorization"]?.split(" ")[1];
      if (!token) {
        return reply.status(401).send({ error: "Unauthorized" });
      }

      const decoded = jwt.verify(token, secretKey);

      // Vérifie si l'utilisateur qui effectue l'action est SuperAdmin ou Admin
      const user = await userRepository.getUserById(decoded.userId);
      if (!user || (user.GradeID !== 1 && user.GradeID !== 2)) {
        return reply.status(403).send({ error: "Forbidden" });
      }

      const { userId, newEtat } = request.body;

      // Vérifie les paramètres de la requête
      if (!userId || ![1, 3].includes(newEtat)) {
        return reply.status(400).send({ error: "Invalid request parameters" });
      }

      // Met à jour l'état de l'utilisateur
      const updatedUser = await userRepository.updateUserById(userId, {
        EtatID: newEtat,
      });

      if (!updatedUser) {
        return reply.status(404).send({ error: "User not found" });
      }

      reply.send({
        message: `L'état de l'utilisateur a été modifié avec succès.`,
        user: updatedUser,
      });
    } catch (err) {
      console.error("Error in changeUserEtat:", err);
      reply.status(500).send({ error: "Internal Server Error", message: err.message });
    }
  },
  async changeEtat(request, reply) {
    try {
      const token = request.headers["authorization"]?.split(" ")[1];
      if (!token) {
        return reply.status(401).send({ error: "Unauthorized" });
      }

      const decoded = jwt.verify(token, secretKey);
      const user = await userRepository.getUserById(decoded.userId);

      // Vérifier si l'utilisateur est superadmin
      if (!user || user.GradeID !== 1) {
        return reply.status(403).send({ error: "Forbidden" });
      }

      const { userId, newEtat } = request.body;
      const targetUser = await userRepository.getUserById(userId);

      // Empêcher de modifier les superadmins
      if (targetUser.GradeID === 1) {
        return reply.status(403).send({ error: "Cannot modify a superadmin." });
      }

      // Modifier l'état de l'utilisateur
      await userRepository.updateUserEtat(userId, newEtat);

      reply.send({ message: "User state updated successfully." });
    } catch (err) {
      console.error("Error in changeEtat:", err);
      reply.status(500).send({ error: "Internal Server Error", message: err.message });
    }
  },
  async deleteAccount(request, reply) {
    try {
      const token = request.headers["authorization"]?.split(" ")[1];
      if (!token) {
        return reply.status(401).send({ error: "Unauthorized" });
      }

      const decoded = jwt.verify(token, secretKey);
      console.log("Decoded Token:", decoded); // Log le contenu du token

      const user = await userRepository.getUserById(decoded.userId);
      if (!user) {
        console.log("Utilisateur introuvable");
        return reply.status(404).send({ error: "Utilisateur introuvable." });
      }

      console.log("User avant suppression:", user);

      const currentTimestamp = new Date().toISOString().replace(/[:.]/g, "-");

      const deletedEmail =
        user.GradeID === 1 || user.GradeID === 2 // Vérifier si c'est un admin ou superadmin
          ? "Admin@delete.com"
          : "Utilisateur@delete.com";

      const deletedMotDePasse = await bcrypt.hash("deleted", 10);

      // Mettre à jour l'utilisateur dans la BDD
      try {
        const updatedUser = await userRepository.updateUserById(user.UtilisateurID, {
          Surnom: `delete-${currentTimestamp}`,
          Email: deletedEmail,
          MotDePasse: deletedMotDePasse,
          CheminImage: null,
          EtatID: 2, // État supprimé
        });
        console.log("Utilisateur mis à jour :", updatedUser); // Debug
      } catch (err) {
        console.error("Erreur lors de la mise à jour de l'utilisateur :", err);
        throw err;
      }

      // Supprimer physiquement l'image de profil
      if (user.CheminImage) {
        const imagePath = path.join(__dirname, `..${user.CheminImage}`);
        console.log("Chemin de l'image à supprimer :", imagePath);

        fs.unlink(imagePath, (err) => {
          if (err) {
            console.error(`Erreur lors de la suppression de l'image : ${err.message}`);
          } else {
            console.log(`Image supprimée : ${imagePath}`);
          }
        });
      }

      reply.send({ message: "Compte supprimé avec succès." });
    } catch (err) {
      console.error("Error in deleteAccount:", err); // Ajoutez ce log pour voir l'erreur complète
      reply.status(500).send({ error: "Erreur interne du serveur.", message: err.message });
    }
  }
};
