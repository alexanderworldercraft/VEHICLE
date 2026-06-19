//vehiculeRoutes.js
import { vehiculeController } from '../controllers/vehiculeController.js';
import { shieldModeMiddleware } from '../middlewares/shieldModeMiddleware.js';

export default async function userRoutes(fastify, options) {
  fastify.get('/:UtilisateurID', vehiculeController.getAllVehicule); // Liste les véhicules de l'utilisateur
  fastify.get('/:UtilisateurID/sold', vehiculeController.getAllSoldVehicule); // Liste les véhicules vendu de l'utilisateur
  fastify.get('/:UtilisateurID/statistiques', vehiculeController.getUserVehicleStatistics); // Liste les statistiques de tous les véhicules de l'utilisateur
  fastify.get('/:UtilisateurID/:VehiculeID', vehiculeController.getVehicleDetails); // Liste les détails du véhicule de l'utilisateur
  fastify.get('/:UtilisateurID/cost/simulation/rolling', vehiculeController.getCostSimulationRolling); // Liste les détails du véhicule de l'utilisateur pour simulé les coût de roulage
  fastify.get('/type', vehiculeController.getAllTypeVehicule); // Liste les types de véhicule
  fastify.get('/marque', vehiculeController.getAllMarqueVehicule); // Liste les marques de véhicule
  fastify.get('/carburant', vehiculeController.getAllCarburantVehicule); // Liste les carburants de véhicule

  fastify.post('/:UtilisateurID/add', { preHandler: shieldModeMiddleware }, vehiculeController.postAddVehicule); // Ajoute un véhicule à l'utilisateur
  fastify.post('/:UtilisateurID/:VehiculeID/add/relever', { preHandler: shieldModeMiddleware }, vehiculeController.postAddRelever); // Ajoute un relever de véhicule à l'utilisateur
  fastify.post('/:UtilisateurID/:VehiculeID/download-folder', { preHandler: shieldModeMiddleware }, vehiculeController.downloadVehiculeFolder); // Télécharge le dossier du véhicule

  fastify.put('/:VehiculeID/sold', { preHandler: shieldModeMiddleware }, vehiculeController.putSoldVehicule); // Retirer un véhicule à l'utilisateur (vendu)
  fastify.put('/:VehiculeID/active', { preHandler: shieldModeMiddleware }, vehiculeController.putActiveVehicule); // Réhabilite un véhicule vendu
  fastify.put('/:UtilisateurID/:VehiculeID/relever/:ReleverID', { preHandler: shieldModeMiddleware }, vehiculeController.putUpdateRelever); // Met à jour un relevé du véhicule
  fastify.put('/:UtilisateurID/:VehiculeID', { preHandler: shieldModeMiddleware }, vehiculeController.putUpdateVehicule); // Met à jour les informations du véhicule
  fastify.delete('/:UtilisateurID/:VehiculeID/relever/:ReleverID', { preHandler: shieldModeMiddleware }, vehiculeController.deleteRelever); // Supprime un relevé du véhicule
  fastify.delete('/:UtilisateurID/:VehiculeID', { preHandler: shieldModeMiddleware }, vehiculeController.deleteVehicule); // Supprime définitivement un véhicule
};
