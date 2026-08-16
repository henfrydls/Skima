# Vendored: @synapsenwerkstatt/prisma-bun-sqlite-adapter v1.2.2 (MIT)

Prisma driver adapter for `bun:sqlite`, used ONLY by the packaged desktop
sidecar (built with `bun build --compile`). Node paths (dev, Docker, tests)
use `@prisma/adapter-better-sqlite3` instead — see `src/dbAdapter.js`.

Vendored (2026-08-16) rather than npm-installed because:
1. It is the only bun:sqlite adapter compatible with Prisma 6 (the alternative
   requires Prisma 7 in all its versions), and it's a small upstream package.
2. **We patch its DateTime serialization** (see `conversion.js`, marked
   `SKIMA PATCH`): upstream writes dates as ISO text, but every existing
   v1.4.x user database stores dates as unix-epoch-ms INTEGERs (the legacy
   Rust engine dialect, and what our better-sqlite3 adapter writes via
   `timestampFormat: 'unixepoch-ms'`). Without the patch, the sidecar would
   corrupt user databases with mixed date formats. Reads already accept both.

Upstream: https://github.com/nogo/prisma-bun-sqlite-adapter (MIT).
If you update this vendor copy, re-apply the SKIMA PATCH and re-run the
date-compatibility test in `src/__tests__/` plus the sidecar smoke test.
