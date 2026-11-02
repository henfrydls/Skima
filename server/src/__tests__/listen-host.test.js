import { describe, it, expect, afterEach } from 'vitest';
import net from 'node:net';
import os from 'node:os';
import { createApp } from '../index.js';
import { listen, listenHost, LOOPBACK } from '../listenHost.js';

// The desktop API has no password, so it must not be reachable from the local network.
describe('listen host', () => {
  let server;

  afterEach(async () => {
    if (server) await new Promise((done) => server.close(done));
    server = undefined;
  });

  function start(host) {
    return new Promise((resolve) => {
      server = listen(createApp(), 0, host, (s) => resolve(s.address()));
    });
  }

  function canConnect(host, port) {
    return new Promise((resolve) => {
      const socket = net.connect({ host, port });
      socket.setTimeout(2000);
      socket.once('connect', () => { socket.destroy(); resolve(true); });
      socket.once('error', () => resolve(false));
      socket.once('timeout', () => { socket.destroy(); resolve(false); });
    });
  }

  // An address of this machine that is not loopback, if it has one.
  function networkAddress() {
    return Object.values(os.networkInterfaces()).flat()
      .find((i) => i && i.family === 'IPv4' && !i.internal)?.address;
  }

  it('is IPv4 loopback on the desktop', () => {
    expect(listenHost({})).toBe(LOOPBACK);
    expect(LOOPBACK).toBe('127.0.0.1');
  });

  it('is every interface in Docker, so the container stays reachable', () => {
    expect(listenHost({ DOCKER: 'true' })).toBeUndefined();
  });

  it('follows SKIMA_HOST when it is set, in both', () => {
    expect(listenHost({ SKIMA_HOST: '0.0.0.0' })).toBe('0.0.0.0');
    expect(listenHost({ SKIMA_HOST: '0.0.0.0', DOCKER: 'true' })).toBe('0.0.0.0');
  });

  // Shells and dev tools export HOST (tcsh: the machine name; Vite and others: 0.0.0.0),
  // and the sidecar inherits the user's environment.
  it('ignores a plain HOST', () => {
    expect(listenHost({ HOST: '0.0.0.0' })).toBe(LOOPBACK);
    expect(listenHost({ HOST: 'my-laptop' })).toBe(LOOPBACK);
  });

  it('listens on loopback only by default', async () => {
    const { address, port } = await start(listenHost({}));
    expect(address).toBe('127.0.0.1');
    expect(await canConnect('127.0.0.1', port)).toBe(true);
    const lan = networkAddress();
    if (lan) expect(await canConnect(lan, port)).toBe(false);
  });

  it('listens on every interface in Docker', async () => {
    const { address, port } = await start(listenHost({ DOCKER: 'true' }));
    expect(['::', '0.0.0.0']).toContain(address);
    expect(await canConnect('127.0.0.1', port)).toBe(true);
    const lan = networkAddress();
    if (lan) expect(await canConnect(lan, port)).toBe(true);
  });
});
