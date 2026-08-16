#!/usr/bin/env node
/**
 * Build the desktop sidecar binaries with `bun build --compile`.
 *
 * All four targets cross-compile from ONE host (CI uses ubuntu-latest) — this
 * replaced @yao-pkg/pkg, whose macOS binaries had to be prebuilt manually on a
 * Mac (ICU abort) and could silently ship without a Prisma engine. The client
 * is fully Rust-free (see prisma/schema.prisma), so there are no per-platform
 * engines anymore; the only non-JS asset is the Prisma WASM query compiler.
 *
 * Steps per run:
 *   1. `prisma generate` (Rust-free client; fails if native engines appear).
 *   2. Patch the generated WASM loader: the client loads query_compiler_bg.wasm
 *      via readFileSync(join(config.dirname, ...)) — not statically analyzable,
 *      so Bun would NOT embed it and the binary would break on any machine
 *      without the file on disk. The patch reads from Bun.embeddedFiles inside
 *      a standalone binary and falls back to disk under Node (dev/tests).
 *   3. `bun build --compile` per target, passing the .wasm as an extra
 *      entrypoint so it lands in Bun.embeddedFiles.
 *
 * darwin-x64 uses the *-baseline* (non-AVX) Bun build: the standard x64 build
 * warns "CPU lacks AVX support, strange crashes may occur" under Rosetta and
 * on pre-AVX Intel Macs.
 *
 * Usage: node scripts/build-sidecars.mjs [target ...]
 *   targets: linux | windows | darwin-x64 | darwin-arm64 | all (default)
 */
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const SERVER_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = resolve(SERVER_DIR, '../src-tauri/binaries');
const WASM = 'node_modules/.prisma/client/query_compiler_bg.wasm';
const GENERATED = 'node_modules/.prisma/client/index.js';

const TARGETS = {
  'linux':        { bun: 'bun-linux-x64',            out: 'skima-server-x86_64-unknown-linux-gnu' },
  'windows':      { bun: 'bun-windows-x64',          out: 'skima-server-x86_64-pc-windows-msvc.exe' },
  'darwin-x64':   { bun: 'bun-darwin-x64-baseline',  out: 'skima-server-x86_64-apple-darwin' },
  'darwin-arm64': { bun: 'bun-darwin-arm64',         out: 'skima-server-aarch64-apple-darwin' },
};

const run = (cmd) => execSync(cmd, { cwd: SERVER_DIR, stdio: 'inherit' });

// ── 1. Generate the Rust-free client ──
run('npx prisma generate');
// Any .node addon or engine binary in the generated client means the generator
// config regressed (covers .so.node/.dylib.node/.dll.node — any host OS).
const engines = readdirSync(resolve(SERVER_DIR, 'node_modules/.prisma/client'))
  .filter((f) => f.endsWith('.node') || f.includes('query_engine-'));
if (engines.length > 0) {
  console.error('FATAL: native engines emitted — the client is not Rust-free:', engines);
  process.exit(1);
}
if (!existsSync(resolve(SERVER_DIR, WASM))) {
  console.error('FATAL: query_compiler_bg.wasm not found — wrong generator config?');
  process.exit(1);
}

// ── 2. Patch the WASM loader (idempotent) ──
const genPath = resolve(SERVER_DIR, GENERATED);
let gen = readFileSync(genPath, 'utf8');
if (!gen.includes('Bun.embeddedFiles')) {
  const anchor = `      getQueryCompilerWasmModule: async () => {
        const queryCompilerWasmFilePath = require('path').join(config.dirname, 'query_compiler_bg.wasm')
        const queryCompilerWasmFileBytes = require('fs').readFileSync(queryCompilerWasmFilePath)

        return new WebAssembly.Module(queryCompilerWasmFileBytes)
      }`;
  const patched = `      getQueryCompilerWasmModule: async () => {
        // PATCHED(build-sidecars): in a Bun standalone binary the wasm ships
        // as an embedded file (extra compile entrypoint); Node reads from disk.
        if (typeof Bun !== 'undefined' && Bun.embeddedFiles && Bun.embeddedFiles.length) {
          const f = Bun.embeddedFiles.find((f) => f.name && f.name.includes('query_compiler_bg'))
          if (f) return new WebAssembly.Module(new Uint8Array(await f.arrayBuffer()))
        }
        const queryCompilerWasmFilePath = require('path').join(config.dirname, 'query_compiler_bg.wasm')
        const queryCompilerWasmFileBytes = require('fs').readFileSync(queryCompilerWasmFilePath)

        return new WebAssembly.Module(queryCompilerWasmFileBytes)
      }`;
  if (!gen.includes(anchor)) {
    console.error('FATAL: WASM-loader anchor not found in generated client — Prisma layout changed; update this script.');
    process.exit(1);
  }
  writeFileSync(genPath, gen.replace(anchor, patched));
  console.log('WASM loader patched.');
} else {
  console.log('WASM loader already patched.');
}

// ── 3. Compile ──
mkdirSync(OUT_DIR, { recursive: true });
const requested = process.argv.slice(2).filter((t) => t !== 'all');
const names = requested.length ? requested : Object.keys(TARGETS);
for (const name of names) {
  const t = TARGETS[name];
  if (!t) { console.error(`Unknown target '${name}'. Valid: ${Object.keys(TARGETS).join(', ')}`); process.exit(1); }
  console.log(`\n=== ${name} (${t.bun}) -> ${t.out} ===`);
  run(`bun build --compile --target=${t.bun} src/index.js ${WASM} --outfile "${resolve(OUT_DIR, t.out)}"`);
}
console.log('\nDone. Binaries in', OUT_DIR);
