const DEMO_BLOCKED = [
  ['POST',   /^\/api\/reset-database$/],
  ['POST',   /^\/api\/setup$/],
  ['POST',   /^\/api\/reset-demo$/],
  ['POST',   /^\/api\/import$/],
  ['PUT',    /^\/api\/config$/],
  ['DELETE', /^\/api\/categories\/\d+$/],
  ['DELETE', /^\/api\/collaborators\/\d+$/],
  ['DELETE', /^\/api\/skills\/\d+$/],
  ['DELETE', /^\/api\/role-profiles\/[^/]+$/],
  ['DELETE', /^\/api\/evaluations\/[^/]+$/],
  ['DELETE', /^\/api\/development-plans\/\d+$/],
  ['DELETE', /^\/api\/development-goals\/\d+$/],
  ['DELETE', /^\/api\/development-actions\/\d+$/],
];

export function demoModeMiddleware(req, res, next) {
  if (process.env.DEMO_MODE !== 'true') return next();

  const blocked = DEMO_BLOCKED.some(
    ([method, pattern]) => req.method === method && pattern.test(req.path)
  );

  if (blocked) {
    return res.status(403).json({
      error: 'DEMO_MODE',
      message: 'This action is not available in demo mode.',
    });
  }

  next();
}
