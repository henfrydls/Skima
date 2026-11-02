// The API has no password on the desktop, so it must not be reachable from the network.
// The desktop app listens on IPv4 loopback only; the webview and the Tauri readiness
// check both connect to 127.0.0.1, so no name lookup can send them to ::1 instead.
// Docker has to accept connections from outside the container, so it keeps listening
// on every interface (no host, as before). SKIMA_HOST overrides both. Not plain HOST:
// shells and dev tools export that one (tcsh sets it to the machine name; Vite and
// others to 0.0.0.0), and the sidecar inherits the user's environment.
export const LOOPBACK = '127.0.0.1';

/** The host to listen on, or undefined for every interface. */
export function listenHost(env = process.env) {
  if (env.SKIMA_HOST) return env.SKIMA_HOST;
  return env.DOCKER === 'true' ? undefined : LOOPBACK;
}

/** app.listen on the right host; the callback gets the server. */
export function listen(app, port, host, onListening) {
  const server = host === undefined
    ? app.listen(port, () => onListening?.(server))
    : app.listen(port, host, () => onListening?.(server));
  return server;
}
