import { entretienController } from '../controllers/entretienController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { shieldModeMiddleware } from '../middlewares/shieldModeMiddleware.js';

export default async function entretienRoutes(fastify, options) {
  const withAuthAndShieldModeLock = [shieldModeMiddleware, authMiddleware];

  fastify.get('/:UtilisateurID/overview', entretienController.getOverview);
  fastify.post('/:UtilisateurID/add', { preHandler: shieldModeMiddleware }, entretienController.postAddEntretien);
  fastify.put('/:UtilisateurID/planned/:EntretienPlanifieID', { preHandler: shieldModeMiddleware }, entretienController.putUpdatePlanifie);
  fastify.put('/:UtilisateurID/planned/:EntretienPlanifieID/complete', { preHandler: shieldModeMiddleware }, entretienController.putCompletePlanifie);
  fastify.delete('/:UtilisateurID/planned/:EntretienPlanifieID', { preHandler: shieldModeMiddleware }, entretienController.deletePlanifie);
  fastify.put('/:UtilisateurID/realized/:EntretienRealiseID', { preHandler: shieldModeMiddleware }, entretienController.putUpdateRealise);
  fastify.delete('/:UtilisateurID/realized/:EntretienRealiseID', { preHandler: shieldModeMiddleware }, entretienController.deleteRealise);
  fastify.get('/:UtilisateurID/files/:EntretienFichierID', { preHandler: authMiddleware }, entretienController.getFichier);
  fastify.delete('/:UtilisateurID/files/:EntretienFichierID', { preHandler: withAuthAndShieldModeLock }, entretienController.deleteFichier);
}
