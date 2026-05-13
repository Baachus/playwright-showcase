/**
 * allure-generate.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 * Cross-platform replacement for: allure generate allure-results --clean
 *
 * What it does:
 *   1. Copies history/ from the PREVIOUS report (allure-report/history)
 *      into allure-results/history so Allure picks it up for Trend charts
 *   2. Writes executor.json so the Executors widget is populated
 *   3. Runs allure generate to build the fresh report
 *   4. Patches missing plugin/ assets and data files (Windows bug:
 *      allure-commandline silently skips the behaviors/packages plugin on
 *      Windows, causing 404s on those tabs and missing data)
 *
 * Why a script instead of shell commands?
 *   Windows has no cp/mv — a .mjs script works identically on Win/Mac/Linux.
 *
 * Usage:  node scripts/allure-generate.mjs
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const RESULTS_DIR = path.join(ROOT, 'allure-results');
const REPORT_DIR  = path.join(ROOT, 'allure-report');
const DATA_DIR    = path.join(REPORT_DIR, 'data');

// ── Step 1: Copy previous history into results so Allure sees it ─────────────
const PREV_HISTORY_DIR = path.join(REPORT_DIR, 'history');
const NEXT_HISTORY_DIR = path.join(RESULTS_DIR, 'history');

if (fs.existsSync(PREV_HISTORY_DIR)) {
  console.log('📋 Copying history from previous report into allure-results...');
  copyDirSync(PREV_HISTORY_DIR, NEXT_HISTORY_DIR);
  console.log('   ✅ History copied.');
} else {
  console.log('ℹ️  No previous history found — this will be run #1 on the Trend chart.');
}

// ── Step 2: Write executor.json so the Executors widget is populated ─────────
// On CI this is written by the CI system. Locally we write it ourselves.
const executorFile = path.join(RESULTS_DIR, 'executor.json');
const executor = {
  name: process.env.CI ? (process.env.GITHUB_REPOSITORY ?? 'CI') : 'Local',
  type: process.env.CI ? 'github' : 'local',
  buildName: process.env.GITHUB_RUN_NUMBER
    ? `Run #${process.env.GITHUB_RUN_NUMBER}`
    : `Local run — ${new Date().toLocaleString()}`,
  buildUrl:
    process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID
      ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
      : undefined,
};
fs.mkdirSync(RESULTS_DIR, { recursive: true });
fs.writeFileSync(executorFile, JSON.stringify(executor, null, 2));
console.log('\n🖥️  Executor info written.');

// ── Step 3: Generate the Allure report ───────────────────────────────────────
console.log('\n🔨 Generating Allure report...');
try {
  execSync('npx allure generate allure-results --clean -o allure-report', {
    cwd: ROOT,
    stdio: 'inherit',
  });
} catch {
  console.error('❌ allure generate failed.');
  process.exit(1);
}

// ── Step 4: Patch missing plugin assets + data files (Windows bug) ────────────
// allure-commandline on Windows silently skips the behaviors and packages
// plugins — neither the plugin/  static assets nor the data/*.json files get
// written. We detect and fix both independently.

let patched = false;

// 4a: Plugin static assets (behaviors/packages/screen-diff UI JavaScript)
const ALLURE_PLUGINS_SRC = path.join(ROOT, 'node_modules', 'allure-commandline', 'dist', 'plugins');
const STATIC_PLUGINS = ['behaviors-plugin', 'packages-plugin', 'screen-diff-plugin'];

for (const pluginDir of STATIC_PLUGINS) {
  const srcStatic = path.join(ALLURE_PLUGINS_SRC, pluginDir, 'static');
  if (!fs.existsSync(srcStatic)) continue;

  const shortName  = pluginDir.replace(/-plugin$/, '');
  const destStatic = path.join(REPORT_DIR, 'plugin', shortName);

  if (!fs.existsSync(destStatic)) {
    if (!patched) console.log('\n🔧 Patching missing plugin assets + data (Windows workaround)...');
    copyDirSync(srcStatic, destStatic);
    console.log(`   ✅ Copied ${shortName} plugin assets.`);
    patched = true;
  }
}

// 4b: Data files (behaviors.json, packages.json) built from result JSONs
const MISSING_DATA = [
  { file: 'behaviors.json', build: () => buildBehaviorsData(RESULTS_DIR) },
  { file: 'packages.json',  build: () => buildPackagesData(RESULTS_DIR)  },
];

for (const { file, build } of MISSING_DATA) {
  const dest = path.join(DATA_DIR, file);
  if (!fs.existsSync(dest)) {
    if (!patched) console.log('\n🔧 Patching missing plugin assets + data (Windows workaround)...');
    const data = build();
    fs.writeFileSync(dest, JSON.stringify(data));
    console.log(`   ✅ Generated ${file}`);
    patched = true;
  }
}

if (!patched) console.log('\n✅ Plugin assets and data already present — no patch needed.');

console.log('\n✅ Report ready at allure-report/');
console.log('   Run: npm run allure:open\n');

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Recursively copy a directory (Node 16+ compatible, no external deps). */
function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath  = path.join(src,  entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDirSync(srcPath, destPath);
    else fs.copyFileSync(srcPath, destPath);
  }
}

/** Deterministic UID from a seed string (no crypto dependency). */
function makeUid(seed) {
  let h1 = 0x811c9dc5, h2 = 0xdeadbeef;
  for (let i = 0; i < seed.length; i++) {
    const c = seed.charCodeAt(i);
    h1 = ((h1 ^ c) * 0x01000193) >>> 0;
    h2 = ((h2 ^ c) * 0x27220a95) >>> 0;
  }
  return h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0');
}

/** Build a test leaf node for the behaviors/packages tree. */
function makeTestItem(result, parentUid) {
  const labels = result.labels ?? [];
  return {
    name:                result.name,
    uid:                 result.uuid ?? makeUid(result.name + result.start),
    parentUid,
    status:              result.status,
    time: {
      start:    result.start,
      stop:     result.stop,
      duration: (result.stop ?? 0) - (result.start ?? 0),
    },
    flaky:               false,
    newFailed:           false,
    newPassed:           false,
    newBroken:           false,
    retriesCount:        0,
    retriesStatusChange: false,
    parameters:          (result.parameters ?? []).map(p => p.value),
    tags:                labels.filter(l => l.name === 'tag').map(l => l.value),
  };
}

/** Read all result JSONs from resultsDir, skipping unreadable files. */
function loadResults(resultsDir) {
  return fs.readdirSync(resultsDir)
    .filter(f => f.endsWith('-result.json'))
    .flatMap(f => {
      try { return [JSON.parse(fs.readFileSync(path.join(resultsDir, f), 'utf-8'))]; }
      catch { return []; }
    });
}

/**
 * Build behaviors.json: groups tests by epic → feature → story.
 * Tests with none of those labels appear at root level.
 */
function buildBehaviorsData(resultsDir) {
  const rootUid = makeUid('behaviors-root');
  const root    = { uid: rootUid, name: 'behaviors', children: [] };

  const epicNodes    = new Map(); // epic            → node
  const featureNodes = new Map(); // "epic:feature"  → node
  const storyNodes   = new Map(); // "epic:feat:story"→ node

  for (const result of loadResults(resultsDir)) {
    const labels     = result.labels ?? [];
    const get        = name => labels.find(l => l.name === name)?.value;
    const epic       = get('epic');
    const feature    = get('feature');
    const story      = get('story');

    let parent = root;

    if (epic) {
      if (!epicNodes.has(epic)) {
        const node = { name: epic, uid: makeUid('epic:' + epic), parentUid: rootUid, children: [] };
        epicNodes.set(epic, node);
        root.children.push(node);
      }
      parent = epicNodes.get(epic);

      if (feature) {
        const fKey = epic + ':' + feature;
        if (!featureNodes.has(fKey)) {
          const node = { name: feature, uid: makeUid('feature:' + fKey), parentUid: parent.uid, children: [] };
          featureNodes.set(fKey, node);
          parent.children.push(node);
        }
        parent = featureNodes.get(fKey);

        if (story) {
          const sKey = fKey + ':' + story;
          if (!storyNodes.has(sKey)) {
            const node = { name: story, uid: makeUid('story:' + sKey), parentUid: parent.uid, children: [] };
            storyNodes.set(sKey, node);
            parent.children.push(node);
          }
          parent = storyNodes.get(sKey);
        }
      }
    }

    parent.children.push(makeTestItem(result, parent.uid));
  }

  return root;
}

/**
 * Build packages.json: groups tests by their `package` label.
 * "ui.saucedemo.login.spec.ts" → dir group "ui.saucedemo" → file "login.spec.ts"
 */
function buildPackagesData(resultsDir) {
  const rootUid = makeUid('packages-root');
  const root    = { uid: rootUid, name: 'packages', children: [] };

  const dirNodes  = new Map(); // dir       → node
  const fileNodes = new Map(); // "dir:file" → node

  for (const result of loadResults(resultsDir)) {
    const labels = result.labels ?? [];
    const pkg    = labels.find(l => l.name === 'package')?.value ?? '';

    // Split "ui.saucedemo.login.spec.ts" → ["ui.saucedemo", "login.spec.ts"]
    const m = pkg.match(/^(.+)\.(\w[\w-]*\.(?:spec\.)?[jt]s)$/) ?? [];
    const [, pkgDir, pkgFile] = m.length ? m : [null, null, pkg];

    let parent = root;

    if (pkgDir) {
      if (!dirNodes.has(pkgDir)) {
        const node = { name: pkgDir, uid: makeUid('pkg:' + pkgDir), parentUid: rootUid, children: [] };
        dirNodes.set(pkgDir, node);
        root.children.push(node);
      }
      parent = dirNodes.get(pkgDir);
    }

    if (pkgFile) {
      const fKey = (pkgDir ?? '') + ':' + pkgFile;
      if (!fileNodes.has(fKey)) {
        const node = { name: pkgFile, uid: makeUid('file:' + fKey), parentUid: parent.uid, children: [] };
        fileNodes.set(fKey, node);
        parent.children.push(node);
      }
      parent = fileNodes.get(fKey);
    }

    parent.children.push(makeTestItem(result, parent.uid));
  }

  return root;
}
