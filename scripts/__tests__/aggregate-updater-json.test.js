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

const { notesFromReleaseBody } = require('../aggregate-updater-json.js');

describe('aggregate-updater-json — notesFromReleaseBody', () => {
  const URL = 'https://github.com/o/r/releases/tag/v9.9.9';
  const generated = [
    "## What's Changed",
    '* feat(development): show per-goal progress percentage by @someone in https://github.com/o/r/pull/95',
    '* fix(dates): render date-only fields in UTC by @someone in https://github.com/o/r/pull/94',
    '* ci(release): Windows date smoke must match the raw JSON by @someone in https://github.com/o/r/pull/101',
    '* chore(release): v9.9.9 by @someone in https://github.com/o/r/pull/103',
    '* perf: faster dashboard by @someone in https://github.com/o/r/pull/7',
    '',
    '',
    '**Full Changelog**: https://github.com/o/r/compare/v9.9.8...v9.9.9',
  ].join('\n');

  it('keeps user-facing changes, without prefix, author or link', () => {
    assert.equal(
      notesFromReleaseBody(generated, URL),
      ['• Show per-goal progress percentage', '• Render date-only fields in UTC', '• Faster dashboard'].join('\n'),
    );
  });

  it('a curated Highlights section wins over the generated list', () => {
    const body = `## Highlights\n- Store package\n- Check-in switch\n\n${generated}`;
    assert.equal(notesFromReleaseBody(body, URL), '- Store package\n- Check-in switch');
  });

  it('a Highlights section at the very end is still read', () => {
    assert.equal(notesFromReleaseBody('## Highlights\nOne line only', URL), 'One line only');
  });

  it('caps the list and links to the rest', () => {
    const many = Array.from({ length: 13 }, (_, i) => `* fix: thing ${i} by @a in https://x/pull/${i}`).join('\n');
    const lines = notesFromReleaseBody(many, URL).split('\n');
    assert.equal(lines.length, 11);
    assert.equal(lines[10], `…and 3 more changes: ${URL}`);
  });

  it('with no user-facing change, points to the full notes', () => {
    assert.equal(notesFromReleaseBody('* chore(release): v1 by @a in https://x/pull/1', URL), `See what's new: ${URL}`);
  });

  it('never returns the empty string the dialog shows as "No release notes provided"', () => {
    for (const body of ['', null, undefined, '**Full Changelog**: x']) {
      assert.ok(notesFromReleaseBody(body, URL).length > 0, `body=${JSON.stringify(body)}`);
    }
  });

  it('handles CRLF bodies', () => {
    assert.equal(notesFromReleaseBody('* fix: a by @x in https://x/pull/1\r\n', URL), '• A');
  });
});
