import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../jwtSecret.js';

/**
 * Auth middleware - verifies JWT token from Authorization header
 * Usage: app.post('/protected-route', authMiddleware, handler)
 */
export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
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
