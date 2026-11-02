import { listenHost } from '../listenHost.js';

// Listening on loopback is not enough on its own: a web page can point a name it
// controls at 127.0.0.1 and, as far as the browser knows, talk to Skima from its own
// origin, so CORS and the API header no longer apply. Such a request still names
// that other host in its Host header, so only the names Skima is really reached by
// are accepted.

// As they appear in a Host header, and as a listen address.
const LOOPBACK_NAMES = ['localhost', '127.0.0.1', '[::1]'];
const LOOPBACK_LISTEN = ['localhost', '127.0.0.1', '::1'];

function list(value) {
  return (value || '').split(',').map((v) => v.trim().toLowerCase()).filter(Boolean);
}

/** The host name of a Host header value, without the port, lower case. */
export function hostName(value) {
  const host = (value || '').trim().toLowerCase();
  if (host.startsWith('[')) return host.slice(0, host.indexOf(']') + 1);
  return host.split(':')[0];
}

function originHost(origin) {
  try {
    return new URL(origin).hostname.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * The host names to accept, or null to accept any.
 * The loopback names are always accepted: a rebound request carries its own name,
 * never these, and the container's entrypoint and health checks call localhost.
 * Listening on loopback (the desktop): those, plus ALLOWED_HOSTS.
 * Listening beyond it (Docker, or SKIMA_HOST): those, plus the hosts of
 * ALLOWED_ORIGINS and ALLOWED_HOSTS; or any when neither is set, as a deployment
 * reached by a name Skima cannot know would otherwise stop working.
 */
export function allowedHosts(env = process.env) {
  const extra = list(env.ALLOWED_HOSTS).map(hostName);
  const host = listenHost(env)?.toLowerCase();
  if (LOOPBACK_LISTEN.includes(host)) return [...LOOPBACK_NAMES, ...extra];
  const configured = [...list(env.ALLOWED_ORIGINS).map(originHost).filter(Boolean), ...extra];
  return configured.length ? [...LOOPBACK_NAMES, ...configured] : null;
}

export function hostCheck(env = process.env) {
  const allowed = allowedHosts(env);
  return function checkHost(req, res, next) {
    if (!allowed || allowed.includes(hostName(req.headers.host))) return next();
    return res.status(421).json({ message: 'Unknown host.', code: 'HOST_NOT_ALLOWED' });
  };
}
