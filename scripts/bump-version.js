#!/usr/bin/env node

/**
 * bump-version.js - Synchronizes version across all package.json files and tauri.conf.json
 *
 * Usage:
 *   node scripts/bump-version.js <version>
 *   node scripts/bump-version.js 1.0.0
 *   node scripts/bump-version.js patch   (1.0.0 -> 1.0.1)
 *   node scripts/bump-version.js minor   (1.0.0 -> 1.1.0)
 *   node scripts/bump-version.js major   (1.0.0 -> 2.0.0)
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const FILES = [
  'package.json',
  'client/package.json',
  'server/package.json',
  'src-tauri/tauri.conf.json',
];

function getCurrentVersion() {
  const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf-8'));
  return pkg.version;
}

function bumpVersion(current, type) {
  const [major, minor, patch] = current.split('.').map(Number);
  switch (type) {
    case 'major': return `${major + 1}.0.0`;
    case 'minor': return `${major}.${minor + 1}.0`;
    case 'patch': return `${major}.${minor}.${patch + 1}`;
    default: return type; // Assume it's an explicit version
  }
}

function updateFile(filePath, newVersion) {
  const fullPath = resolve(root, filePath);
  const content = JSON.parse(readFileSync(fullPath, 'utf-8'));
  content.version = newVersion;
  writeFileSync(fullPath, JSON.stringify(content, null, 2) + '\n');
  console.log(`  Updated ${filePath} -> ${newVersion}`);
}

function updateCargoToml(newVersion) {
  const cargoPath = resolve(root, 'src-tauri/Cargo.toml');
  let content = readFileSync(cargoPath, 'utf-8');
  content = content.replace(/^version = ".*"$/m, `version = "${newVersion}"`);
  writeFileSync(cargoPath, content);
  console.log(`  Updated src-tauri/Cargo.toml -> ${newVersion}`);
}

// Main
const arg = process.argv[2];
if (!arg) {
  console.error('Usage: node scripts/bump-version.js <version|patch|minor|major>');
  process.exit(1);
}

const currentVersion = getCurrentVersion();
const newVersion = bumpVersion(currentVersion, arg);

// Validate semver format
if (!/^\d+\.\d+\.\d+$/.test(newVersion)) {
  console.error(`Invalid version: ${newVersion}`);
  process.exit(1);
}

console.log(`Bumping version: ${currentVersion} -> ${newVersion}\n`);

for (const file of FILES) {
  try {
    updateFile(file, newVersion);
  } catch (err) {
    console.warn(`  Skipped ${file}: ${err.message}`);
  }
}

try {
  updateCargoToml(newVersion);
} catch (err) {
  console.warn(`  Skipped Cargo.toml: ${err.message}`);
}

console.log('\nDone!');
