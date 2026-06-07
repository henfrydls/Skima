// Demo-mode guard for the public online demo (skima.henfrydls.com).
//
// Allowlist model: when DEMO_MODE=true the shared demo must stay read-only.
// All safe reads (GET/HEAD/OPTIONS) pass through, plus an explicit allowlist of
// safe write operations (auth + demo seeding). EVERY other mutation is blocked
// by default — so a newly-added write endpoint is protected automatically
// instead of leaking until someone remembers to deny-list it.

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const DEMO_ALLOWED_MUTATIONS = [
  ['POST', /^\/api\/auth\/login$/],
  ['POST', /^\/api\/config\/verify$/],
  ['POST', /^\/api\/seed-demo$/],
];

export function demoModeMiddleware(req, res, next) {
  if (process.env.DEMO_MODE !== 'true') return next();

  // Reads are always safe.
  if (SAFE_METHODS.has(req.method)) return next();

  // Mutations are denied unless explicitly allowlisted.
  const allowed = DEMO_ALLOWED_MUTATIONS.some(
    ([method, pattern]) => req.method === method && pattern.test(req.path)
  );
  if (allowed) return next();

  return res.status(403).json({
    error: 'DEMO_MODE',
    message: 'This action is not available in demo mode.',
  });
}
