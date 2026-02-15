import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../jwtSecret.js';
import { prisma } from '../db.js';

/**
 * Auth middleware - verifies JWT token from Authorization header
 * When no password is configured, allows access without token.
 * Usage: app.post('/protected-route', authMiddleware, handler)
 */
export async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  // If no Bearer token, check if password is configured
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    try {
      const config = await prisma.systemConfig.findFirst();
      if (!config?.adminPassword) {
        // No password set — allow access without auth
        req.user = { role: 'admin' };
        return next();
      }
    } catch {
      // DB error — fall through to require auth
    }
    return res.status(401).json({
      message: 'No autorizado. Inicia sesión para continuar.',
      code: 'AUTH_REQUIRED'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: 'Sesión expirada. Por favor inicia sesión de nuevo.',
        code: 'TOKEN_EXPIRED'
      });
    }
    return res.status(401).json({
      message: 'Token inválido.',
      code: 'INVALID_TOKEN'
    });
  }
}

/**
 * Generate JWT token for authenticated user
 */
export function generateToken(payload, expiresIn = '24h') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export { JWT_SECRET };
