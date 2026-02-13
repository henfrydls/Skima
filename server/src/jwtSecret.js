import { randomBytes } from 'crypto';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { customDbPath } from './db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * JWT Secret management — unique per installation.
 *
 * Priority:
 * 1. JWT_SECRET env var (CI, custom deployments)
 * 2. .jwt-secret file adjacent to the database
 * 3. Generate new secret and persist it
 */
function getSecretPath() {
  if (customDbPath) {
    // Tauri sidecar: store next to the DB in app_data_dir
    return resolve(dirname(customDbPath), '.jwt-secret');
  }
  // Dev mode: store next to skills.db
  return resolve(__dirname, '../prisma/.jwt-secret');
}

function loadOrCreateSecret() {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }

  const secretPath = getSecretPath();

  if (existsSync(secretPath)) {
    return readFileSync(secretPath, 'utf-8').trim();
  }

  const secret = randomBytes(64).toString('hex');
  writeFileSync(secretPath, secret, 'utf-8');
  console.log('[Skima Server] Generated new JWT secret.');
  return secret;
}

export const JWT_SECRET = loadOrCreateSecret();
