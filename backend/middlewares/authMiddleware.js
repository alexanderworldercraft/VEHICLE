// middlewares/authMiddleware.js

import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();
const secretKey = process.env.JWT_SECRET;

export const authMiddleware = async (request, reply) => {
  try {
    const authHeader = request.headers['authorization'];
    if (!authHeader) {
      return reply.status(401).send({ error: 'Aucun jeton fourni' });
    }

    const token = authHeader.split(' ')[1];

    // Vérification du token
    const decoded = jwt.verify(token, secretKey);
    request.user = decoded;
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      console.error('Token expired at:', err.expiredAt);
      return reply.status(401).send({ error: 'Token expired', expiredAt: err.expiredAt });
    }

    if (err.name === 'JsonWebTokenError') {
      console.error('Invalid token:', err.message);
      return reply.status(401).send({ error: 'Invalid token' });
    }

    console.error('Authentication error:', err);
    return reply.status(500).send({ error: 'Internal server error' });
  }
};
