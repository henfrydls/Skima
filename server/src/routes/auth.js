import express from 'express';
import bcrypt from 'bcryptjs';
import { generateToken } from '../middleware/auth.js';
import { prisma } from '../index.js';

const router = express.Router();

// Admin password - in production, store hashed in DB
// For now, use environment variable or default
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

/**
 * POST /api/auth/login
 * Authenticate admin user with password
 */
router.post('/login', async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ 
        message: 'Contraseña requerida',
        code: 'PASSWORD_REQUIRED'
      });
    }

    // For MVP: simple password comparison
    // In future: fetch hashed password from Admin table
    const isValid = password === ADMIN_PASSWORD;

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
    const jwt = require('jsonwebtoken');
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'skills-matrix-secret-key-change-in-production');
    res.json({ authenticated: true, user: decoded });
  } catch {
    res.json({ authenticated: false });
  }
});

export default router;
