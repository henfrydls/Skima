/**
 * Unit tests for the aggregator's pure helper. Uses Node's built-in test runner
 * to avoid pulling vitest into the scripts/ tree (the actual script runs in CI
 * and locally with plain node).
 *
 * Run: node --test scripts/__tests__/aggregate-updater-json.test.js
 * Or:  npm run test:scripts
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { summarizePlatforms, EXPECTED_PLATFORMS } = require('../aggregate-updater-json.js');

describe('aggregate-updater-json — summarizePlatforms', () => {
  it('reports all expected platforms missing for an empty manifest', () => {
    const { present, missing } = summarizePlatforms({ platforms: {} });
    assert.deepEqual(present, []);
    assert.deepEqual(missing, EXPECTED_PLATFORMS);
  });

  it('reports the v1.4.0-style partial manifest correctly', () => {
    const manifest = {
      version: '1.4.0',
      platforms: {
        'linux-x86_64': { url: 'x' },
        'linux-x86_64-appimage': { url: 'x' },
        'linux-x86_64-deb': { url: 'x' },
        'windows-x86_64': { url: 'x' },
        'windows-x86_64-nsis': { url: 'x' },
      },
    };
    const { present, missing } = summarizePlatforms(manifest);
    assert.deepEqual(present, [
      'linux-x86_64',
      'linux-x86_64-appimage',
      'linux-x86_64-deb',
      'windows-x86_64',
      'windows-x86_64-nsis',
    ]);
    assert.deepEqual(missing, [
      'darwin-x86_64',
      'darwin-aarch64',
      'darwin-x86_64-app',
      'darwin-aarch64-app',
    ]);
  });

  it('reports zero missing for a complete manifest', () => {
    const platforms = {};
    EXPECTED_PLATFORMS.forEach((p) => { platforms[p] = { url: 'x' }; });
    const { present, missing } = summarizePlatforms({ platforms });
    assert.deepEqual(missing, []);
    assert.equal(present.length, EXPECTED_PLATFORMS.length);
  });

  it('handles missing platforms key on the manifest gracefully', () => {
    const { present, missing } = summarizePlatforms({});
    assert.deepEqual(present, []);
    assert.deepEqual(missing, EXPECTED_PLATFORMS);
  });

  it('handles null platforms value gracefully', () => {
    const { present, missing } = summarizePlatforms({ platforms: null });
    assert.deepEqual(present, []);
    assert.deepEqual(missing, EXPECTED_PLATFORMS);
  });

  it('handles null/undefined manifest argument', () => {
    assert.deepEqual(summarizePlatforms(null), { present: [], missing: EXPECTED_PLATFORMS });
    assert.deepEqual(summarizePlatforms(undefined), { present: [], missing: EXPECTED_PLATFORMS });
  });

  it('respects custom expectedPlatforms override', () => {
    const manifest = { platforms: { 'linux-x86_64': { url: 'x' } } };
    const { present, missing } = summarizePlatforms(manifest, ['linux-x86_64', 'windows-x86_64']);
    assert.deepEqual(present, ['linux-x86_64']);
    assert.deepEqual(missing, ['windows-x86_64']);
  });

  it('does not mutate the input manifest', () => {
    const manifest = { platforms: { 'linux-x86_64': { url: 'x' } } };
    const before = JSON.stringify(manifest);
    summarizePlatforms(manifest);
    assert.equal(JSON.stringify(manifest), before);
  });
});
