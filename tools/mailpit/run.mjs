/**
 * Mailpit launcher
 * ─────────────────────────────────────────────────────────────────────────────
 * Cross-platform helper that ensures a local Mailpit binary is present and then
 * runs it.  Mailpit is a free, self-contained SMTP capture server with a REST
 * API and web UI -- the perfect target for end-to-end email tests:
 *
 *   - SMTP listener   : 127.0.0.1:1025  (the email-sender app relays here)
 *   - HTTP UI + API   : 127.0.0.1:8025  (tests read messages via the REST API)
 *
 * Nothing is sent over the public internet, no port 25, no third-party inbox.
 *
 * The Playwright `Email` project boots this via the `webServer` block, so you
 * normally never run it by hand.  To run it manually:  `npm run mailpit`.
 *
 * Override ports / host with env vars:
 *   MAILPIT_SMTP_ADDR   (default 127.0.0.1:1025)
 *   MAILPIT_HTTP_ADDR   (default 127.0.0.1:8025)
 *   MAILPIT_VERSION     (default "latest")
 *
 * The binary is cached under tools/mailpit/bin/ and is git-ignored.
 */
import { createWriteStream, existsSync, mkdirSync, chmodSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BIN_DIR = join(__dirname, 'bin');
const SMTP_ADDR = process.env.MAILPIT_SMTP_ADDR ?? '127.0.0.1:1025';
const HTTP_ADDR = process.env.MAILPIT_HTTP_ADDR ?? '127.0.0.1:8025';
const VERSION = process.env.MAILPIT_VERSION ?? 'latest';

const isWin = process.platform === 'win32';
const BIN_NAME = isWin ? 'mailpit.exe' : 'mailpit';
const BIN_PATH = join(BIN_DIR, BIN_NAME);

/** Map Node's platform/arch onto Mailpit's release asset naming. */
function assetName() {
  const osMap = { darwin: 'darwin', linux: 'linux', win32: 'windows' };
  const archMap = { x64: 'amd64', arm64: 'arm64' };
  const os = osMap[process.platform];
  const arch = archMap[process.arch];
  if (!os || !arch) {
    throw new Error(`Unsupported platform/arch for Mailpit: ${process.platform}/${process.arch}`);
  }
  // e.g. mailpit-linux-amd64.tar.gz / mailpit-windows-amd64.zip
  return isWin ? `mailpit-${os}-${arch}.zip` : `mailpit-${os}-${arch}.tar.gz`;
}

function releaseUrl() {
  const asset = assetName();
  return VERSION === 'latest'
    ? `https://github.com/axllent/mailpit/releases/latest/download/${asset}`
    : `https://github.com/axllent/mailpit/releases/download/${VERSION}/${asset}`;
}

async function download(url, dest) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok || !res.body) {
    throw new Error(`Failed to download Mailpit (${res.status}) from ${url}`);
  }
  await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));
}

/** Extract the mailpit binary out of the downloaded archive into BIN_DIR. */
async function extract(archivePath) {
  if (isWin) {
    // Use PowerShell's Expand-Archive -- always available on modern Windows.
    await run('powershell', [
      '-NoProfile', '-Command',
      `Expand-Archive -Force -Path '${archivePath}' -DestinationPath '${BIN_DIR}'`,
    ]);
  } else {
    // tar is available on macOS and Linux by default.
    await run('tar', ['-xzf', archivePath, '-C', BIN_DIR]);
  }
}

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: 'inherit' });
    p.on('error', reject);
    p.on('exit', code => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
  });
}

async function ensureBinary() {
  if (existsSync(BIN_PATH)) return BIN_PATH;
  mkdirSync(BIN_DIR, { recursive: true });
  const url = releaseUrl();
  const archive = join(tmpdir(), assetName());
  console.log(`[mailpit] binary not found -- downloading ${url}`);
  await download(url, archive);
  await extract(archive);
  if (!existsSync(BIN_PATH)) {
    throw new Error(`Mailpit binary missing after extraction at ${BIN_PATH}`);
  }
  if (!isWin) chmodSync(BIN_PATH, 0o755);
  console.log(`[mailpit] installed at ${BIN_PATH}`);
  return BIN_PATH;
}

async function main() {
  const bin = await ensureBinary();
  const args = [
    '--smtp', SMTP_ADDR,
    '--listen', HTTP_ADDR,
    // No auth, accept everything -- this is a disposable local test sink.
    '--smtp-auth-accept-any',
    '--smtp-auth-allow-insecure',
  ];
  console.log(`[mailpit] starting: smtp=${SMTP_ADDR} http=${HTTP_ADDR}`);
  const proc = spawn(bin, args, { stdio: 'inherit' });
  const shutdown = sig => () => { proc.kill(sig); };
  process.on('SIGINT', shutdown('SIGINT'));
  process.on('SIGTERM', shutdown('SIGTERM'));
  proc.on('exit', code => process.exit(code ?? 0));
}

main().catch(err => {
  console.error('[mailpit] fatal:', err.message);
  process.exit(1);
});
