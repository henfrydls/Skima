#!/usr/bin/env node
/**
 * aggregate-updater-json.js
 *
 * Runs as the final job in the release workflow. Validates that the latest.json
 * uploaded by tauri-action's matrix jobs (Linux, macOS, Windows in parallel)
 * contains entries for all expected platforms. Re-publishes a canonical
 * manifest with a fresh pub_date so consumers know aggregation is complete.
 *
 * Why this exists:
 *   - tauri-action with `includeUpdaterJson: true` does read-modify-write on
 *     latest.json from each matrix job. Last writer wins, but the merge logic
 *     in tauri-action's `upload-version-json.ts` reads the existing manifest
 *     first and preserves prior platforms — usually fine.
 *   - However: if a matrix job FAILS to find its updater artifact (e.g. macOS
 *     before bundle.targets included "app", see issue #51), it silently skips
 *     uploading without error. The last successful job wins and overwrites
 *     anything missing with its own partial set. Result: clients on the
 *     missing platform see "platform not in manifest" errors.
 *   - This aggregator validates the final manifest, logs which platforms are
 *     present/missing, and re-publishes with an updated pub_date as the
 *     "release fully aggregated" signal.
 *
 * Local testing:
 *   DRY_RUN=1 GITHUB_TOKEN=... TAG_NAME=v1.4.0 \
 *     GITHUB_REPOSITORY=henfrydls/Skima \
 *     node scripts/aggregate-updater-json.js
 *
 *   With DRY_RUN=1 the script reads the manifest and reports what it would do
 *   without deleting or re-uploading anything. Useful to validate logic against
 *   already-published releases.
 */

// Validators for config strings before interpolating into URL paths.
// In CI these come from `${{ github.ref_name }}` and `${{ github.repository }}`,
// but DRY_RUN local invocation is also supported — defense-in-depth against
// path traversal if someone passes a malicious value.
const SAFE_REF = /^[\w.+/-]+$/;
const SAFE_REPO = /^[\w.-]+\/[\w.-]+$/;

// Cap on the size of latest.json we'll download. The real file is ~3KB; if
// anything above this lands as latest.json it's a misuploaded asset, not a
// real manifest — abort rather than OOM the runner.
const MAX_MANIFEST_BYTES = 1_000_000;

// Resolved at main() time, after env validation runs. Module-level scope so
// the helper functions can read them.
let GITHUB_TOKEN;
let TAG_NAME;
let DRY_RUN;
let OWNER;
let REPO_NAME;

// Platform keys that tauri-plugin-updater queries on each OS/arch.
// If any are missing from the final manifest after the matrix jobs complete,
// the corresponding platform's users will see "platform not in manifest" errors.
const EXPECTED_PLATFORMS = [
  'linux-x86_64',
  'linux-x86_64-appimage',
  'linux-x86_64-deb',
  'darwin-x86_64',
  'darwin-aarch64',
  'darwin-x86_64-app',
  'darwin-aarch64-app',
  'windows-x86_64',
  'windows-x86_64-nsis',
];

async function gh(path, options = {}) {
  const url = `https://api.github.com${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`GitHub API ${path} returned ${res.status}: ${body}`);
  }
  return res;
}

async function getReleaseByTag(tag) {
  const res = await gh(`/repos/${OWNER}/${REPO_NAME}/releases/tags/${tag}`);
  return res.json();
}

async function listReleaseAssets(releaseId) {
  const res = await gh(
    `/repos/${OWNER}/${REPO_NAME}/releases/${releaseId}/assets?per_page=100`
  );
  return res.json();
}

async function downloadAsset(assetId) {
  const res = await gh(
    `/repos/${OWNER}/${REPO_NAME}/releases/assets/${assetId}`,
    { headers: { Accept: 'application/octet-stream' } }
  );
  return res.text();
}

async function deleteAsset(assetId) {
  await gh(`/repos/${OWNER}/${REPO_NAME}/releases/assets/${assetId}`, {
    method: 'DELETE',
  });
}

async function uploadAsset(release, filename, content) {
  const uploadUrl = release.upload_url.replace('{?name,label}', '');
  const url = `${uploadUrl}?name=${encodeURIComponent(filename)}&label=${encodeURIComponent(filename)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      'Content-Type': 'application/octet-stream',
      'Content-Length': Buffer.byteLength(content).toString(),
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: content,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Upload failed ${res.status}: ${body}`);
  }
  return res.json();
}

/**
 * Pure helper: given a manifest object, return which expected platforms
 * are present and which are missing. Exported for unit testing.
 */
function summarizePlatforms(manifest, expectedPlatforms = EXPECTED_PLATFORMS) {
  const platforms = manifest && typeof manifest.platforms === 'object' && manifest.platforms !== null
    ? manifest.platforms
    : {};
  const present = Object.keys(platforms).sort();
  const missing = expectedPlatforms.filter((p) => !present.includes(p));
  return { present, missing };
}

module.exports = { summarizePlatforms, EXPECTED_PLATFORMS };

async function main() {
  console.log(`Aggregating latest.json for ${TAG_NAME}${DRY_RUN ? ' (dry-run)' : ''}...`);

  const release = await getReleaseByTag(TAG_NAME);
  console.log(`Release ID: ${release.id}`);

  const assets = await listReleaseAssets(release.id);
  const latestJsonAsset = assets.find((a) => a.name === 'latest.json');

  if (!latestJsonAsset) {
    console.error(
      'latest.json not found in release assets. ' +
      'All build-tauri matrix jobs may have failed or did not produce updater artifacts.'
    );
    process.exit(1);
  }

  // Defense-in-depth: refuse to download anything pretending to be the manifest
  // that's wildly larger than expected.
  if (latestJsonAsset.size > MAX_MANIFEST_BYTES) {
    console.error(
      `latest.json asset size ${latestJsonAsset.size} exceeds ${MAX_MANIFEST_BYTES} byte cap. ` +
      `Refusing to download. Investigate which job uploaded a malformed manifest.`
    );
    process.exit(1);
  }

  const rawContent = await downloadAsset(latestJsonAsset.id);

  let manifest;
  try {
    manifest = JSON.parse(rawContent);
  } catch (e) {
    console.error('Failed to parse latest.json:', e.message);
    process.exit(1);
  }

  const { present, missing } = summarizePlatforms(manifest);

  console.log(`\nPlatforms present (${present.length}):`);
  present.forEach((p) => console.log(`  + ${p}`));

  if (missing.length > 0) {
    console.log(`\nPlatforms missing (${missing.length}):`);
    missing.forEach((p) => console.log(`  - ${p}`));
    // GitHub Actions annotation so the run summary surfaces the partial state
    // instead of burying it in stdout.
    const missingList = missing.join(', ');
    console.log(`::warning title=Updater manifest is incomplete::Missing platforms: ${missingList}. Users on these platforms will see "platform not in manifest" errors until the next release.`);
  } else {
    console.log('\nAll expected platforms are present in the manifest.');
  }

  if (present.length === 0) {
    console.error('FATAL: manifest has zero platforms. Aborting.');
    process.exit(1);
  }

  // Re-upload with refreshed pub_date to signal "aggregation complete".
  const finalManifest = {
    ...manifest,
    pub_date: new Date().toISOString(),
  };
  const finalContent = JSON.stringify(finalManifest, null, 2);

  if (DRY_RUN) {
    console.log('\n[DRY RUN] Would delete asset id', latestJsonAsset.id);
    console.log('[DRY RUN] Would upload latest.json with content:');
    console.log(finalContent.slice(0, 200) + '...');
    return;
  }

  // Critical: the delete-then-upload sequence must be atomic from the user's
  // perspective. If upload fails after delete succeeds, the release is left
  // with NO latest.json — every client gets a 404 on the next auto-check.
  // Try the upload, and on failure, attempt to put back the original content
  // so existing clients keep working until we manually re-run.
  console.log('\nDeleting existing latest.json...');
  await deleteAsset(latestJsonAsset.id);
  try {
    console.log('Uploading canonical latest.json...');
    await uploadAsset(release, 'latest.json', finalContent);
  } catch (uploadErr) {
    console.error('Upload failed after delete; attempting to restore previous manifest...');
    try {
      await uploadAsset(release, 'latest.json', rawContent);
      console.error('Restored previous manifest. Investigate the upload failure and re-run this job.');
    } catch (restoreErr) {
      console.error('Restore ALSO failed. The release has no latest.json. Manual intervention required.');
      console.error('Restore error:', restoreErr.message);
    }
    throw uploadErr;
  }

  console.log(`\nDone. latest.json re-published with ${present.length} platform(s).`);
}

// Only run when invoked as the entry point (not when required for tests).
if (require.main === module) {
  // Validate env at entry, not at require time
  GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  TAG_NAME = process.env.TAG_NAME;
  DRY_RUN = process.env.DRY_RUN === '1';
  const REPO = process.env.GITHUB_REPOSITORY || 'henfrydls/Skima';

  if (!GITHUB_TOKEN || !TAG_NAME) {
    console.error('GITHUB_TOKEN and TAG_NAME are required');
    process.exit(1);
  }
  if (!SAFE_REF.test(TAG_NAME)) {
    console.error(`Invalid TAG_NAME: must match ${SAFE_REF}`);
    process.exit(1);
  }
  if (!SAFE_REPO.test(REPO)) {
    console.error(`Invalid GITHUB_REPOSITORY: must match ${SAFE_REPO}`);
    process.exit(1);
  }
  [OWNER, REPO_NAME] = REPO.split('/');

  main().catch((e) => {
    console.error('Unhandled error:', e);
    process.exit(1);
  });
}
