import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { generateToken, JWT_SECRET } from '../middleware/auth.js';
import { prisma } from '../db.js';

const router = express.Router();

// Simple in-memory rate limiter for login attempts
const loginAttempts = new Map();
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(ip) {
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (!record || now - record.firstAttempt > WINDOW_MS) {
    loginAttempts.set(ip, { count: 1, firstAttempt: now });
    return true;
  }

  if (record.count >= MAX_ATTEMPTS) {
    return false;
  }

  record.count++;
  return true;
}

// Allow tests to reset rate limiter state
export function resetRateLimiter() {
  loginAttempts.clear();
}

/**
 * POST /api/auth/login
 * Authenticate admin user with password from SystemConfig
 */
router.post('/login', async (req, res) => {
  try {
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';

    if (!checkRateLimit(clientIp)) {
      return res.status(429).json({
        message: 'Demasiados intentos. Intenta de nuevo en 15 minutos.',
        code: 'RATE_LIMITED'
      });
    }

    const { password } = req.body;

    // Get password from SystemConfig
    const config = await prisma.systemConfig.findFirst();

    // If no password configured, grant access with any input
    if (!config?.adminPassword) {
      const token = generateToken({
        role: 'admin',
        loginTime: new Date().toISOString()
      });
      return res.json({
        success: true,
        token,
        message: 'Acceso concedido (sin contraseña configurada)'
      });
    }

    if (!password) {
      return res.status(400).json({
        message: 'Contraseña requerida',
        code: 'PASSWORD_REQUIRED'
      });
    }

    // Compare using bcrypt if the stored password is a hash, otherwise plain compare for migration
    let isValid = false;
    if (config.adminPassword.startsWith('$2a$') || config.adminPassword.startsWith('$2b$')) {
      isValid = await bcrypt.compare(password, config.adminPassword);
    } else {
      // Legacy plaintext comparison - auto-upgrade to bcrypt on successful login
      isValid = password === config.adminPassword;
      if (isValid) {
        const hashed = await bcrypt.hash(password, 10);
        await prisma.systemConfig.update({
          where: { id: config.id },
          data: { adminPassword: hashed }
        });
      }
    }

    if (!isValid) {
      return res.status(401).json({
        message: 'Contraseña incorrecta',
        code: 'INVALID_PASSWORD'
      });
    }

    // Generate JWT token
    const token = generateToken({
      role: 'admin',
      loginTime: new Date().toISOString()
    });

    res.json({
      success: true,
      token,
      message: 'Inicio de sesión exitoso'
    });
  } catch (error) {
    console.error('[API] POST /api/auth/login failed:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

/**
 * GET /api/auth/verify
 * Check if current token is valid
 */
router.get('/verify', (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.json({ authenticated: false });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ authenticated: true, user: decoded });
  } catch (err) {
    console.error('[API] Token verification failed:', err.message);
    res.json({ authenticated: false });
  }
});

export default router;
