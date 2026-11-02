import { describe, it, expect } from 'vitest';
import request from './helpers/request.js';
import { createApp } from '../index.js';
import { allowedHosts, hostName } from '../middleware/hostCheck.js';

// A page that points a name of its own at the local server must not reach the API:
// only the host names Skima is really reached by are accepted.

function withEnv(env, fn) {
  const keys = ['DOCKER', 'SKIMA_HOST', 'ALLOWED_ORIGINS', 'ALLOWED_HOSTS'];
  const saved = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
  keys.forEach((k) => delete process.env[k]);
  Object.assign(process.env, env);
  try {
    return fn();
  } finally {
    keys.forEach((k) => (saved[k] === undefined ? delete process.env[k] : (process.env[k] = saved[k])));
  }
}

const get = (host) => request(createApp()).get('/api/config').set('Host', host);

describe('host check', () => {
  it('reads the name out of a Host header', () => {
    expect(hostName('LocalHost:11420')).toBe('localhost');
    expect(hostName('127.0.0.1')).toBe('127.0.0.1');
    expect(hostName('[::1]:11420')).toBe('[::1]');
    expect(hostName(undefined)).toBe('');
  });

  describe('on the desktop (loopback)', () => {
    it.each(['localhost:11420', '127.0.0.1:11420', '[::1]:11420', '127.0.0.1'])('accepts %s', async (host) => {
      const res = await withEnv({}, () => get(host));
      expect(res.status).toBe(200);
    });

    it.each(['evil.example:11420', 'evil.example', '10.0.0.5:11420'])('refuses %s', async (host) => {
      const res = await withEnv({}, () => get(host));
      expect(res.status).toBe(421);
      expect(res.body.code).toBe('HOST_NOT_ALLOWED');
    });

    it('refuses writes and the export as well', async () => {
      const app = withEnv({}, () => createApp());
      expect((await request(app).post('/api/collaborators').set('Host', 'evil.example').send({})).status).toBe(421);
      expect((await request(app).get('/api/export').set('Host', 'evil.example')).status).toBe(421);
    });

    it('adds ALLOWED_HOSTS', () => {
      expect(withEnv({ ALLOWED_HOSTS: 'skima.lan' }, () => allowedHosts())).toContain('skima.lan');
    });
  });

  describe('in Docker', () => {
    it('accepts any host when no host is configured (the online demo)', async () => {
      const res = await withEnv({ DOCKER: 'true' }, () => get('demo.example'));
      expect(res.status).toBe(200);
    });

    it('accepts only the hosts of ALLOWED_ORIGINS and ALLOWED_HOSTS when set', async () => {
      const env = { DOCKER: 'true', ALLOWED_ORIGINS: 'https://skills.example', ALLOWED_HOSTS: 'skima.lan:3000' };
      expect((await withEnv(env, () => get('skills.example'))).status).toBe(200);
      expect((await withEnv(env, () => get('skima.lan:3000'))).status).toBe(200);
      expect((await withEnv(env, () => get('evil.example'))).status).toBe(421);
    });
  });

  it('follows SKIMA_HOST: listening beyond loopback works like Docker', () => {
    expect(withEnv({ SKIMA_HOST: '0.0.0.0' }, () => allowedHosts())).toBeNull();
    expect(withEnv({ SKIMA_HOST: '::1' }, () => allowedHosts())).toContain('[::1]');
  });
});
