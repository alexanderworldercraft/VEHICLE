import { adminReferenceController } from "../controllers/adminReferenceController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { shieldModeMiddleware } from "../middlewares/shieldModeMiddleware.js";

export default async function adminReferenceRoutes(fastify, options) {
  const adminPreHandlers = [
    shieldModeMiddleware,
    authMiddleware,
    adminReferenceController.ensureAdmin,
  ];

  fastify.get("/reference-data", { preHandler: adminPreHandlers }, adminReferenceController.getAll);
  fastify.post("/reference-data/:resource", { preHandler: adminPreHandlers }, adminReferenceController.create);
  fastify.put("/reference-data/:resource/:id", { preHandler: adminPreHandlers }, adminReferenceController.update);
  fastify.delete("/reference-data/:resource/:id", { preHandler: adminPreHandlers }, adminReferenceController.remove);
}
