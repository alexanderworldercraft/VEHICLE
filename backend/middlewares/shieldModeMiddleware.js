const SHIELD_MODE_HEADER = 'x-shield-mode-level';

export const getShieldModeLevel = (request) => {
  const rawLevel = request.headers[SHIELD_MODE_HEADER];
  const level = Number(Array.isArray(rawLevel) ? rawLevel[0] : rawLevel);
  return level === 1 || level === 2 ? level : 0;
};

export const shieldModeMiddleware = async (request, reply) => {
  const shieldModeLevel = getShieldModeLevel(request);

  if (shieldModeLevel === 0) return;

  return reply.status(423).send({
    error: 'Backend verrouillé par Shield Mode',
    code: 'SHIELD_MODE_BACKEND_LOCKED',
    shieldModeLevel,
  });
};
