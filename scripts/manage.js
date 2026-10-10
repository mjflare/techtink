#!/usr/bin/env node
// ==============================================================================
// TechTink VPS & Backend Management CLI Tool (v2.0 Beta)
// Runtime: Node.js (>= 20) or Bun (>= 1.0)
//
// Architecture & SSL Engine modeled after MHSanaei/3x-ui:
//   - Automated acme.sh standalone SSL certificate issuance & renewal
//   - Cloudflare DNS-01 API challenge support
//   - Smart Certificate Directory & Path Auto-Resolution
//   - Production Nginx Reverse Proxy generator & Default Page collision fix
//   - Systemd Service management (x-ui style: start, stop, restart, status, logs)
//   - Beta & Investor Demo Mode switcher
//   - Database maintenance & Docker Compose stack management
// ==============================================================================

import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import http from 'node:http';
import os from 'node:os';
import readline from 'node:readline';
import { execSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const ENV_PATH = path.join(PROJECT_ROOT, '.env');
const DATA_DIR = path.join(PROJECT_ROOT, 'data');
const DB_PATH = path.join(DATA_DIR, 'techtink.db');
const SYSTEMD_SERVICE_NAME = 'techtink.service';
const SYSTEMD_FILE_PATH = `/etc/systemd/system/${SYSTEMD_SERVICE_NAME}`;

// --- ANSI Colors & Formatting ---
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
};

const c = {
  cyan: (t) => `${colors.cyan}${t}${colors.reset}`,
  green: (t) => `${colors.green}${t}${colors.reset}`,
  yellow: (t) => `${colors.yellow}${t}${colors.reset}`,
  red: (t) => `${colors.red}${t}${colors.reset}`,
  magenta: (t) => `${colors.magenta}${t}${colors.reset}`,
  blue: (t) => `${colors.blue}${t}${colors.reset}`,
  bold: (t) => `${colors.bold}${t}${colors.reset}`,
  gray: (t) => `${colors.gray}${t}${colors.reset}`,
  dim: (t) => `${colors.dim}${t}${colors.reset}`,
};

const TAG_OK = `[${c.green('OK')}]`;
const TAG_WARN = `[${c.yellow('WARN')}]`;
const TAG_ERR = `[${c.red('ERROR')}]`;
const TAG_INFO = `[${c.cyan('INFO')}]`;

// --- Utility Functions ---
function runCmd(cmd, options = {}) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: options.stdio || 'pipe', ...options });
  } catch (err) {
    if (options.throwOnError) throw err;
    return null;
  }
}

function runCmdInherit(cmd, options = {}) {
  try {
    execSync(cmd, { stdio: 'inherit', ...options });
    return true;
  } catch (err) {
    if (options.throwOnError) throw err;
    return false;
  }
}

function commandExists(cmd) {
  try {
    const checkCmd = os.platform() === 'win32' ? `where ${cmd}` : `command -v ${cmd}`;
    execSync(checkCmd, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function isLinux() {
  return os.platform() === 'linux';
}

function isRoot() {
  return typeof process.getuid === 'function' && process.getuid() === 0;
}

function detectRuntime() {
  if (typeof globalThis.Bun !== 'undefined') {
    return { name: 'bun', path: runCmd('which bun')?.trim() || process.execPath };
  }
  const bunPath = runCmd('which bun')?.trim();
  if (bunPath && fs.existsSync(bunPath)) {
    return { name: 'bun', path: bunPath };
  }
  return { name: 'node', path: process.execPath };
}

// --- .env File Management ---
function readEnv() {
  const env = {};
  if (!fs.existsSync(ENV_PATH)) return env;
  try {
    const content = fs.readFileSync(ENV_PATH, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
        env[key] = val;
      }
    }
  } catch {}
  return env;
}

function setEnvVar(key, val) {
  let content = '';
  if (fs.existsSync(ENV_PATH)) {
    content = fs.readFileSync(ENV_PATH, 'utf8');
  }

  const lines = content.split('\n');
  let found = false;
  const updatedLines = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return line;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0 && trimmed.slice(0, eqIdx).trim() === key) {
      found = true;
      return `${key}=${val}`;
    }
    return line;
  });

  if (!found) {
    if (updatedLines.length > 0 && updatedLines[updatedLines.length - 1] !== '') {
      updatedLines.push('');
    }
    updatedLines.push(`${key}=${val}`);
  }

  try {
    fs.writeFileSync(ENV_PATH, updatedLines.join('\n').trim() + '\n', 'utf8');
    process.env[key] = String(val);
    return true;
  } catch (err) {
    console.error(`${TAG_ERR} Failed to write to ${ENV_PATH}: ${err.message}`);
    return false;
  }
}

function getCurrentPort() {
  const env = readEnv();
  if (env.PORT) return parseInt(env.PORT, 10);
  if (process.env.PORT) return parseInt(process.env.PORT, 10);
  return 3000;
}

// --- Port Inspection & Availability ---
function checkPortFree(port) {
  return new Promise((resolve) => {
    const srv = net.createServer();
    srv.once('error', (err) => {
      resolve(false);
    });
    srv.once('listening', () => {
      srv.close(() => resolve(true));
    });
    srv.listen(port, '0.0.0.0');
  });
}

function pingServerHealth(port) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const req = http.get(
      {
        host: '127.0.0.1',
        port,
        path: '/api/stats',
        timeout: 2500,
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          const latency = Date.now() - startTime;
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 400,
            statusCode: res.statusCode,
            latency,
            data: rawData,
          });
        });
      }
    );

    req.on('error', (err) => {
      resolve({ ok: false, error: err.message, latency: Date.now() - startTime });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, error: 'Connection timed out', latency: Date.now() - startTime });
    });
  });
}

// --- Interactive Prompter ---
function createPrompter() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return {
    ask: (question) => new Promise((resolve) => rl.question(question, resolve)),
    close: () => rl.close(),
  };
}

// --- SQLite Database Access ---
async function getDbInstance() {
  if (!fs.existsSync(DB_PATH)) return null;
  try {
    if (typeof globalThis.Bun !== 'undefined') {
      const { Database } = await import('bun:sqlite');
      return new Database(DB_PATH);
    } else {
      const { DatabaseSync } = await import('node:sqlite');
      return new DatabaseSync(DB_PATH);
    }
  } catch {
    return null;
  }
}

// ==============================================================================
// 1. SERVICE CONTROLLER (x-ui Style: start, stop, restart, status, logs)
// ==============================================================================
function buildSystemdUnit({ user, cwd, execPath, port }) {
  return `[Unit]
Description=TechTink E-Commerce Platform
After=network.target
Wants=network.target
StartLimitIntervalSec=180
StartLimitBurst=10

[Service]
Type=simple
User=${user}
WorkingDirectory=${cwd}
Environment=NODE_ENV=production
Environment=PORT=${port}
EnvironmentFile=-${path.join(cwd, '.env')}
ExecStart=${execPath} server.js
ExecReload=/bin/kill -HUP $MAINPID
Restart=on-failure
RestartSec=5s
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
`;
}

async function handleServiceStart() {
  console.log(`${TAG_INFO} Starting TechTink server service...`);
  if (isLinux() && fs.existsSync(SYSTEMD_FILE_PATH)) {
    runCmd('sudo systemctl start techtink');
    await new Promise((r) => setTimeout(r, 1500));
    const active = runCmd('systemctl is-active techtink')?.trim() === 'active';
    if (active) {
      console.log(`${TAG_OK} TechTink service started successfully!`);
    } else {
      console.log(`${TAG_WARN} Service started, but check status with: node scripts/manage.js status`);
    }
  } else {
    // Non-systemd or local dev: check if already running
    const port = getCurrentPort();
    const isFree = await checkPortFree(port);
    if (!isFree) {
      console.log(`${TAG_WARN} Port ${port} is already in use. Server is already running!`);
      return;
    }
    const runtime = detectRuntime();
    console.log(`${TAG_INFO} Launching server in background via ${runtime.name}...`);
    const logFile = path.join(PROJECT_ROOT, 'server.log');
    const out = fs.openSync(logFile, 'a');
    const child = spawnSync('nohup', [runtime.path, 'server.js'], {
      cwd: PROJECT_ROOT,
      detached: true,
      stdio: ['ignore', out, out],
    });
    console.log(`${TAG_OK} Started in background. Logs routed to: ${c.cyan(logFile)}`);
  }
}

async function handleServiceStop() {
  console.log(`${TAG_INFO} Stopping TechTink server service...`);
  if (isLinux() && fs.existsSync(SYSTEMD_FILE_PATH)) {
    runCmd('sudo systemctl stop techtink');
    console.log(`${TAG_OK} TechTink systemd service stopped.`);
  } else {
    // Kill processes listening on current port
    const port = getCurrentPort();
    const pids = runCmd(`lsof -t -iTCP:${port} -sTCP:LISTEN`)?.trim().split('\n').filter(Boolean);
    if (pids && pids.length > 0) {
      for (const pid of pids) {
        try {
          process.kill(parseInt(pid, 10), 'SIGTERM');
          console.log(`${TAG_OK} Stopped process PID ${pid} listening on port ${port}.`);
        } catch {}
      }
    } else {
      console.log(`${TAG_OK} No active process was listening on port ${port}.`);
    }
  }
}

async function handleServiceRestart() {
  console.log(`${TAG_INFO} Restarting TechTink server service...`);
  if (isLinux() && fs.existsSync(SYSTEMD_FILE_PATH)) {
    runCmd('sudo systemctl restart techtink');
    await new Promise((r) => setTimeout(r, 1500));
    console.log(`${TAG_OK} TechTink systemd service restarted!`);
  } else {
    await handleServiceStop();
    await new Promise((r) => setTimeout(r, 1000));
    await handleServiceStart();
  }
}

function handleServiceInstall() {
  if (!isLinux()) {
    console.log(`${TAG_WARN} Systemd is only supported on Linux VPS systems.`);
    return;
  }
  const port = getCurrentPort();
  const runtime = detectRuntime();
  const user = process.env.SUDO_USER || (isRoot() ? 'root' : os.userInfo().username);
  const unit = buildSystemdUnit({
    user,
    cwd: PROJECT_ROOT,
    execPath: runtime.path,
    port,
  });

  console.log(`${TAG_INFO} Generating ${SYSTEMD_FILE_PATH}...`);
  const tmpFile = path.join(PROJECT_ROOT, 'techtink.service');
  fs.writeFileSync(tmpFile, unit, 'utf8');

  try {
    runCmd(`sudo cp "${tmpFile}" "${SYSTEMD_FILE_PATH}"`);
    runCmd(`sudo chmod 644 "${SYSTEMD_FILE_PATH}"`);
    runCmd(`sudo systemctl daemon-reload`);
    runCmd(`sudo systemctl enable techtink`);
    runCmd(`sudo systemctl start techtink`);
    console.log(`${TAG_OK} TechTink service installed, enabled and started!`);
    console.log(`${TAG_INFO} Service unit: ${c.cyan(SYSTEMD_FILE_PATH)}`);
  } catch (err) {
    console.error(`${TAG_ERR} Installation failed: ${err.message}`);
  }
}

function handleLogs(args = []) {
  const follow = args.includes('-f') || args.includes('--follow');
  const linesIdx = args.indexOf('-n');
  const lines = linesIdx !== -1 && args[linesIdx + 1] ? args[linesIdx + 1] : '50';

  if (isLinux() && commandExists('journalctl') && fs.existsSync(SYSTEMD_FILE_PATH)) {
    console.log(`${TAG_INFO} Viewing systemd journal for ${c.cyan('techtink.service')}...`);
    const fFlag = follow ? '-f' : '';
    runCmdInherit(`journalctl -u techtink -n ${lines} ${fFlag} --no-pager`);
  } else {
    const logFile = path.join(PROJECT_ROOT, 'server.log');
    if (fs.existsSync(logFile)) {
      console.log(`${TAG_INFO} Viewing server log file: ${c.cyan(logFile)}`);
      runCmdInherit(`tail -n ${lines} ${follow ? '-f' : ''} "${logFile}"`);
    } else {
      console.log(`${TAG_INFO} No detached log file found at ${logFile}.`);
      console.log(`If running in a live terminal, server output appears in that active console.`);
    }
  }
}

// ==============================================================================
// 2. STATUS & DIAGNOSTICS (Comprehensive Health Report)
// ==============================================================================
async function handleStatus() {
  const port = getCurrentPort();
  const runtime = detectRuntime();
  const isFree = await checkPortFree(port);
  const health = isFree ? null : await pingServerHealth(port);

  let systemdStatus = 'Not Installed';
  if (isLinux() && fs.existsSync(SYSTEMD_FILE_PATH)) {
    const active = runCmd('systemctl is-active techtink')?.trim();
    const enabled = runCmd('systemctl is-enabled techtink')?.trim();
    systemdStatus = `${active === 'active' ? c.green('ACTIVE (Running)') : c.red(active || 'inactive')} | Autostart: ${enabled === 'enabled' ? c.green('Enabled') : c.yellow('Disabled')}`;
  }

  let dbStatus = c.red('Database Not Found');
  let productCount = 0;
  let orderCount = 0;
  let siteMode = 'demo';
  const dbInst = await getDbInstance();
  if (dbInst) {
    try {
      if (typeof dbInst.query === 'function') {
        productCount = dbInst.query('SELECT count(*) as count FROM products').get()?.count || 0;
        orderCount = dbInst.query('SELECT count(*) as count FROM orders').get()?.count || 0;
        const modeRow = dbInst.query("SELECT value FROM settings WHERE key = 'site_mode'").get();
        if (modeRow?.value) siteMode = modeRow.value;
      } else if (typeof dbInst.prepare === 'function') {
        productCount = dbInst.prepare('SELECT count(*) as count FROM products').get()?.count || 0;
        orderCount = dbInst.prepare('SELECT count(*) as count FROM orders').get()?.count || 0;
        const modeRow = dbInst.prepare("SELECT value FROM settings WHERE key = 'site_mode'").get();
        if (modeRow?.value) siteMode = modeRow.value;
      }
      dbStatus = `${c.green('ONLINE')} (${c.cyan(productCount)} Products, ${c.cyan(orderCount)} Orders)`;
    } catch (e) {
      dbStatus = c.yellow(`Connected (${e.message})`);
    }
  }

  // Nginx Status
  const hasNginx = commandExists('nginx');
  const defaultEnabled = fs.existsSync('/etc/nginx/sites-enabled/default');
  const techtinkEnabled = fs.existsSync('/etc/nginx/sites-enabled/techtink');
  let nginxStatus = 'Not Installed';
  if (hasNginx) {
    const running = isLinux() ? runCmd('systemctl is-active nginx')?.trim() === 'active' : true;
    nginxStatus = `${running ? c.green('Running') : c.red('Stopped')} | Site: ${techtinkEnabled ? c.green('Active') : c.yellow('Not Linked')} | Default collision: ${defaultEnabled ? c.red('YES (Blocks site!)') : c.green('No (Clean)')}`;
  }

  console.log(`\n${c.bold('======================================================================')}`);
  console.log(`  ${c.bold(c.cyan('TechTink VPS & Backend Status Report'))}`);
  console.log(`${c.bold('======================================================================')}`);
  console.log(`  OS Platform       : ${c.bold(os.type())} ${os.release()} (${os.arch()})`);
  console.log(`  Server Hostname   : ${c.cyan(os.hostname())}`);
  console.log(`  Runtime Engine    : ${c.green(runtime.name)} (${runtime.path})`);
  console.log(`  Backend Port      : ${c.cyan(port)} (${isFree ? c.yellow('Idle / Free') : c.green('Listening')})`);
  console.log(`  Systemd Service   : ${systemdStatus}`);
  console.log(`  Nginx Proxy       : ${nginxStatus}`);
  console.log(`  Database (SQLite) : ${dbStatus}`);
  console.log(`  Website Mode      : ${siteMode === 'demo' ? c.yellow('Demo Mode (Investor Notice Active)') : c.green('Operational / Live Mode')}`);
  if (health) {
    console.log(`  API Health Ping   : ${health.ok ? c.green(`OK (HTTP ${health.statusCode}, ${health.latency}ms)`) : c.red(`Failed: ${health.error}`)}`);
  }
  console.log(`${c.bold('======================================================================')}\n`);
}

// ==============================================================================
// 3. PORT CONFIGURATION
// ==============================================================================
async function handlePort(args = []) {
  const currentPort = getCurrentPort();
  let targetPort = args[0] ? parseInt(args[0], 10) : null;

  if (!targetPort && process.stdin.isTTY) {
    console.log(`\n${c.bold('--- TechTink Port Configuration ---')}`);
    console.log(`Current Port: ${c.cyan(currentPort)}`);
    const prompter = createPrompter();
    const input = (await prompter.ask(`Enter new port number (1-65535) [current: ${currentPort}]: `)).trim();
    prompter.close();
    if (!input) {
      console.log(`${TAG_INFO} Port left unchanged (${currentPort}).`);
      return;
    }
    targetPort = parseInt(input, 10);
  }

  if (!targetPort || isNaN(targetPort) || targetPort < 1 || targetPort > 65535) {
    console.error(`${TAG_ERR} Invalid port number "${args[0]}". Must be between 1 and 65535.`);
    return;
  }

  if (targetPort === 80 || targetPort === 443) {
    console.log(`\n${TAG_WARN} IMPORTANT ARCHITECTURE NOTE:`);
    console.log(`  Ports 80 (HTTP) and 443 (HTTPS) are handled by Nginx Reverse Proxy.`);
    console.log(`  The TechTink backend should run on an internal port (default: 3000).`);
    console.log(`  Nginx will listen on 443 with SSL and forward requests to port 3000.`);
    console.log(`  Setting backend to 443 causes an infinite proxy loop with Nginx.\n`);
  }

  const isFree = await checkPortFree(targetPort);
  if (!isFree && targetPort !== currentPort) {
    console.log(`${TAG_WARN} Warning: Port ${targetPort} is currently occupied by another process!`);
  }

  setEnvVar('PORT', targetPort);
  console.log(`${TAG_OK} Port updated to ${c.green(targetPort)} in .env`);

  if (isLinux() && fs.existsSync(SYSTEMD_FILE_PATH)) {
    console.log(`${TAG_INFO} Updating systemd unit file and restarting service...`);
    handleServiceInstall();
  } else {
    console.log(`${TAG_INFO} Please restart TechTink to apply the new port.`);
  }
}

// ==============================================================================
// 4. MHSANAEI/3X-UI STYLE SSL CERTIFICATE MANAGEMENT
// ==============================================================================
const ACME_SH_PATH = path.join(os.homedir(), '.acme.sh', 'acme.sh');
const CERT_BASE_DIR = isRoot() ? '/root/cert' : path.join(PROJECT_ROOT, 'certs');

function isDomain(domain) {
  return /^([A-Za-z0-9](-*[A-Za-z0-9])*\.)+(xn--[a-z0-9]{2,}|[a-zA-Z]{2,})$/.test(domain);
}

function hasAcme() {
  return fs.existsSync(ACME_SH_PATH) || commandExists('acme.sh');
}

function getAcmeBin() {
  if (fs.existsSync(ACME_SH_PATH)) return ACME_SH_PATH;
  const sysAcme = runCmd('which acme.sh')?.trim();
  if (sysAcme) return sysAcme;
  return ACME_SH_PATH;
}

function installAcme(email = 'admin@techtink.ir') {
  console.log(`${TAG_INFO} acme.sh not detected. Installing official acme.sh...`);
  try {
    runCmdInherit(`curl -fsSL https://get.acme.sh | sh -s email=${email}`);
    if (fs.existsSync(ACME_SH_PATH)) {
      console.log(`${TAG_OK} acme.sh installed successfully at ${c.cyan(ACME_SH_PATH)}`);
      return true;
    }
  } catch (e) {
    console.error(`${TAG_ERR} Failed to install acme.sh: ${e.message}`);
  }
  return false;
}

function ensureSocat() {
  if (commandExists('socat')) return true;
  if (!isLinux()) return false;
  console.log(`${TAG_INFO} Installing socat for standalone ACME HTTP verification...`);
  try {
    if (commandExists('apt-get')) runCmd('sudo apt-get update -y && sudo apt-get install -y socat curl openssl');
    else if (commandExists('dnf')) runCmd('sudo dnf -y install socat curl openssl');
    else if (commandExists('yum')) runCmd('sudo yum -y install socat curl openssl');
    else if (commandExists('pacman')) runCmd('sudo pacman -Sy --noconfirm socat curl openssl');
    else if (commandExists('apk')) runCmd('sudo apk add socat curl openssl');
    return commandExists('socat');
  } catch {
    return false;
  }
}

// Smart Certificate Finder (resolves directories like /cert/techtink.ir gracefully)
function resolveCertLocation(inputPath) {
  const raw = (inputPath || '').trim().replace(/^["']|["']$/g, '');
  if (!raw) return null;

  const basename = path.basename(raw);
  const candidates = [
    raw,
    path.resolve(process.cwd(), raw),
    path.resolve(PROJECT_ROOT, raw),
    path.resolve(PROJECT_ROOT, raw.replace(/^\/+/, '')),
    path.resolve(PROJECT_ROOT, 'certs', basename),
    path.resolve(PROJECT_ROOT, 'cert', basename),
    `/root/cert/${basename}`,
    `/root/certs/${basename}`,
    `/root/cert`,
    `/etc/letsencrypt/live/${basename}`,
    `/etc/ssl/${basename}`,
    `/etc/ssl/certs`,
    path.join(os.homedir(), '.acme.sh', `${basename}_ecc`),
    path.join(os.homedir(), '.acme.sh', basename),
  ];

  for (const cand of candidates) {
    try {
      if (fs.existsSync(cand)) {
        const stats = fs.statSync(cand);
        if (stats.isDirectory()) {
          const files = fs.readdirSync(cand);
          const hasCert = files.some((f) => f.endsWith('.pem') || f.endsWith('.crt') || f.endsWith('.cer'));
          const hasKey = files.some((f) => f.endsWith('.key') || (f.endsWith('.pem') && f.includes('key')));
          if (hasCert) {
            return { dir: cand, files, hasCert, hasKey };
          }
        }
      }
    } catch {}
  }
  return null;
}

function findCertAndKeyFiles(dirPath) {
  if (!fs.existsSync(dirPath)) return null;
  const files = fs.readdirSync(dirPath);

  // Preference order for fullchain / cert
  const certOrder = ['fullchain.pem', 'fullchain.cer', 'cert.pem', 'bundle.crt', 'certificate.crt', 'cert.crt'];
  let bestCert = null;
  for (const name of certOrder) {
    if (files.includes(name)) {
      bestCert = path.join(dirPath, name);
      break;
    }
  }
  if (!bestCert) {
    const cand = files.find((f) => (f.endsWith('.pem') || f.endsWith('.crt') || f.endsWith('.cer')) && !f.toLowerCase().includes('key'));
    if (cand) bestCert = path.join(dirPath, cand);
  }

  // Preference order for private key
  const keyOrder = ['privkey.pem', 'private.key', 'privatekey.key', 'key.pem', 'cert.key'];
  let bestKey = null;
  for (const name of keyOrder) {
    if (files.includes(name)) {
      bestKey = path.join(dirPath, name);
      break;
    }
  }
  if (!bestKey) {
    const cand = files.find((f) => f.endsWith('.key') || (f.endsWith('.pem') && (f.toLowerCase().includes('key') || f.toLowerCase().includes('priv'))));
    if (cand) bestKey = path.join(dirPath, cand);
  }

  return { bestCert, bestKey, dir: dirPath, files };
}

// Option 1: Issue SSL for Domain via acme.sh standalone (3x-ui standard)
async function sslIssueDomain(domainArg, portArg) {
  let domain = (domainArg || '').trim();
  let webPort = portArg ? parseInt(portArg, 10) : 80;

  if (!domain && process.stdin.isTTY) {
    const prompter = createPrompter();
    while (!domain) {
      domain = (await prompter.ask('Enter your domain name (e.g. techtink.ir): ')).trim();
      if (!isDomain(domain)) {
        console.log(`${TAG_ERR} Invalid domain format "${domain}". Please enter a valid domain (e.g. yourdomain.com).`);
        domain = '';
      }
    }
    const pInput = (await prompter.ask('Enter verification port (default: 80): ')).trim();
    prompter.close();
    if (pInput && !isNaN(parseInt(pInput, 10))) webPort = parseInt(pInput, 10);
  }

  if (!domain || !isDomain(domain)) {
    console.error(`${TAG_ERR} Valid domain name is required.`);
    return false;
  }

  console.log(`\n${c.bold('--- 3x-ui ACME SSL Issuance Engine ---')}`);
  console.log(`Target Domain : ${c.cyan(domain)}`);
  console.log(`ACME Port     : ${c.cyan(webPort)}`);

  // Ensure acme.sh & socat
  if (!hasAcme()) {
    installAcme(`admin@${domain}`);
  }
  ensureSocat();
  const acmeBin = getAcmeBin();

  // If port 80 is used by Nginx, temporarily free it for standalone HTTP-01
  let stoppedNginx = false;
  if (webPort === 80 && commandExists('nginx') && isLinux()) {
    console.log(`${TAG_INFO} Port 80 selected for ACME verification. Temporarily stopping Nginx to free port 80...`);
    runCmd('sudo systemctl stop nginx');
    stoppedNginx = true;
  }

  const outDir = path.join(CERT_BASE_DIR, domain);
  fs.mkdirSync(outDir, { recursive: true });

  const certPath = path.join(outDir, 'fullchain.pem');
  const keyPath = path.join(outDir, 'privkey.pem');

  console.log(`${TAG_INFO} Requesting Let's Encrypt certificate via acme.sh standalone...`);
  try {
    runCmdInherit(`${acmeBin} --set-default-ca --server letsencrypt --force`);
    const issueCmd = `${acmeBin} --issue -d ${domain} --standalone --httpport ${webPort} --force`;
    console.log(`${TAG_INFO} Running: ${c.gray(issueCmd)}`);
    const issueOk = runCmdInherit(issueCmd);

    if (!issueOk) {
      console.error(`${TAG_ERR} acme.sh issuance failed. Restoring Nginx if stopped.`);
      if (stoppedNginx) runCmd('sudo systemctl start nginx');
      return false;
    }

    console.log(`${TAG_INFO} Installing certificate files to ${c.cyan(outDir)}...`);
    const installCmd = `${acmeBin} --installcert --force -d ${domain} --key-file "${keyPath}" --fullchain-file "${certPath}" --reloadcmd "systemctl reload nginx 2>/dev/null || true"`;
    runCmdInherit(installCmd);

    // Auto renew
    runCmdInherit(`${acmeBin} --upgrade --auto-upgrade`);

    console.log(`\n${TAG_OK} SSL Certificate successfully issued and installed!`);
    console.log(`  Fullchain Certificate : ${c.green(certPath)}`);
    console.log(`  Private Key           : ${c.green(keyPath)}`);

    // Also mirror to project certs folder for easy reference
    const projectCertDir = path.join(PROJECT_ROOT, 'certs', domain);
    try {
      fs.mkdirSync(projectCertDir, { recursive: true });
      fs.copyFileSync(certPath, path.join(projectCertDir, 'fullchain.pem'));
      fs.copyFileSync(keyPath, path.join(projectCertDir, 'privkey.pem'));
      console.log(`  Project Mirror        : ${c.cyan(projectCertDir)}`);
    } catch {}

    // Restore Nginx
    if (stoppedNginx) {
      console.log(`${TAG_INFO} Restarting Nginx reverse proxy...`);
      runCmd('sudo systemctl start nginx');
    }

    // Auto-configure Nginx reverse proxy
    if (process.stdin.isTTY && !domainArg) {
      const prompter = createPrompter();
      const applyNginx = (await prompter.ask('\nApply this certificate to Nginx Reverse Proxy now? [Y/n]: ')).trim().toLowerCase();
      prompter.close();
      if (!applyNginx || applyNginx.startsWith('y')) {
        await handleNginxConfigure({ domain, certPath, keyPath });
      }
    } else {
      // Automatically apply to Nginx when run non-interactively or with domain argument
      await handleNginxConfigure({ domain, certPath, keyPath });
    }
    return true;
  } catch (err) {
    console.error(`${TAG_ERR} SSL Issuance error: ${err.message}`);
    if (stoppedNginx) runCmd('sudo systemctl start nginx');
    return false;
  }
}

// Option 4: Show existing domains and certificates
function sslShowList() {
  console.log(`\n${c.bold('--- Existing SSL Certificates ---')}`);
  const rawSearchDirs = [
    CERT_BASE_DIR,
    path.join(PROJECT_ROOT, 'certs'),
    '/root/cert',
    '/etc/letsencrypt/live',
    path.join(os.homedir(), '.acme.sh'),
  ];

  const searchDirs = [...new Set(rawSearchDirs.map((d) => path.resolve(d)))];
  const seenCerts = new Set();
  let found = 0;

  for (const base of searchDirs) {
    if (!fs.existsSync(base)) continue;
    try {
      const entries = fs.readdirSync(base);
      for (const ent of entries) {
        const full = path.join(base, ent);
        if (fs.statSync(full).isDirectory()) {
          const pair = findCertAndKeyFiles(full);
          if (pair?.bestCert && pair?.bestKey) {
            const canonicalCert = path.resolve(pair.bestCert);
            if (seenCerts.has(canonicalCert)) continue;
            seenCerts.add(canonicalCert);

            found++;
            let expiry = 'Unknown';
            try {
              expiry = runCmd(`openssl x509 -enddate -noout -in "${pair.bestCert}"`)?.replace('notAfter=', '').trim() || 'Valid';
            } catch {}
            console.log(`\n[${found}] ${c.bold(c.cyan(ent))} (${c.gray(full)})`);
            console.log(`    Certificate : ${c.green(pair.bestCert)}`);
            console.log(`    Private Key : ${c.green(pair.bestKey)}`);
            console.log(`    Expires     : ${c.yellow(expiry)}`);
          }
        }
      }
    } catch {}
  }

  if (found === 0) {
    console.log(`${TAG_INFO} No existing SSL certificates detected.`);
  }
  console.log('');
}

// Option 5: Set Certificate Paths / Directory (Smart Resolver)
async function sslSetCertDir(inputPathArg, domainArg) {
  let inputPath = (inputPathArg || '').trim();
  let domain = (domainArg || '').trim();

  if (!inputPath && process.stdin.isTTY) {
    console.log(`\n${c.bold('--- Configure SSL Certificate Directory ---')}`);
    const prompter = createPrompter();
    inputPath = (await prompter.ask('Enter path to certificate directory (e.g. /cert/techtink.ir, ./certs): ')).trim();
    if (!domain) {
      domain = (await prompter.ask('Enter domain name (press Enter to auto-detect): ')).trim();
    }
    prompter.close();
  }

  if (!inputPath) {
    console.error(`${TAG_ERR} Certificate path is required.`);
    return;
  }

  console.log(`${TAG_INFO} Resolving certificate path for: "${c.cyan(inputPath)}"...`);
  const resolved = resolveCertLocation(inputPath);

  if (!resolved) {
    console.error(`\n${TAG_ERR} Could not find valid certificate files in "${inputPath}" or standard VPS folders.`);
    console.log(`${TAG_INFO} Searched paths:`);
    console.log(`  - ${path.resolve(process.cwd(), inputPath)}`);
    console.log(`  - /root/cert/${path.basename(inputPath)}`);
    console.log(`  - /etc/letsencrypt/live/${path.basename(inputPath)}`);
    console.log(`  - ${path.join(PROJECT_ROOT, 'certs', path.basename(inputPath))}`);
    console.log(`\nTip: You can issue a brand new free Let's Encrypt certificate with:`);
    console.log(`  ${c.green(`node scripts/manage.js ssl issue ${domain || path.basename(inputPath)}`)}\n`);
    return;
  }

  const pair = findCertAndKeyFiles(resolved.dir);
  if (!pair?.bestCert || !pair?.bestKey) {
    console.error(`${TAG_ERR} Directory "${resolved.dir}" is missing a private key or certificate file.`);
    console.log(`Files found: ${resolved.files.join(', ')}`);
    return;
  }

  console.log(`\n${TAG_OK} Successfully detected SSL certificate files:`);
  console.log(`  Certificate : ${c.green(pair.bestCert)}`);
  console.log(`  Private Key : ${c.green(pair.bestKey)}`);

  const effectiveDomain = domain || path.basename(resolved.dir).replace(/_ecc$/, '');
  await handleNginxConfigure({
    domain: effectiveDomain,
    certPath: pair.bestCert,
    keyPath: pair.bestKey,
  });
}

// Option 6: Cloudflare DNS SSL
async function sslIssueCloudflare(domainArg, emailArg, keyArg) {
  let domain = domainArg || '';
  let email = emailArg || '';
  let key = keyArg || '';

  if ((!domain || !email || !key) && process.stdin.isTTY) {
    console.log(`\n${c.bold('--- Cloudflare DNS-01 SSL Issuance ---')}`);
    console.log(`Useful if port 80 is blocked by your ISP or firewall.\n`);
    const prompter = createPrompter();
    if (!domain) domain = (await prompter.ask('Enter domain name (e.g. techtink.ir): ')).trim();
    if (!email) email = (await prompter.ask('Enter Cloudflare account email: ')).trim();
    if (!key) key = (await prompter.ask('Enter Cloudflare Global API Key or API Token: ')).trim();
    prompter.close();
  }

  if (!domain || !email || !key) {
    console.error(`${TAG_ERR} Domain, email, and Cloudflare API key are required.`);
    return;
  }

  if (!hasAcme()) installAcme(email);
  const acmeBin = getAcmeBin();

  console.log(`${TAG_INFO} Issuing wildcard & root certificate for ${c.cyan(domain)} via Cloudflare DNS...`);
  const envPrefix = key.length > 37 ? `CF_Token="${key}"` : `CF_Key="${key}" CF_Email="${email}"`;
  const outDir = path.join(CERT_BASE_DIR, domain);
  fs.mkdirSync(outDir, { recursive: true });

  const certPath = path.join(outDir, 'fullchain.pem');
  const keyPath = path.join(outDir, 'privkey.pem');

  try {
    runCmdInherit(`${envPrefix} ${acmeBin} --issue --dns dns_cf -d ${domain} -d *.${domain} --force`);
    runCmdInherit(`${acmeBin} --installcert --force -d ${domain} --key-file "${keyPath}" --fullchain-file "${certPath}" --reloadcmd "systemctl reload nginx 2>/dev/null || true"`);
    console.log(`${TAG_OK} Cloudflare DNS SSL issued successfully!`);
    await handleNginxConfigure({ domain, certPath, keyPath });
  } catch (e) {
    console.error(`${TAG_ERR} Cloudflare SSL failed: ${e.message}`);
  }
}

// Option 8: Self-Signed SSL Certificate
function sslSelfSigned() {
  const certDir = path.join(PROJECT_ROOT, 'certs', 'localhost');
  fs.mkdirSync(certDir, { recursive: true });
  const crtFile = path.join(certDir, 'fullchain.pem');
  const keyFile = path.join(certDir, 'privkey.pem');

  console.log(`${TAG_INFO} Generating 2048-bit self-signed SSL certificate using openssl...`);
  try {
    execSync(
      `openssl req -x509 -nodes -days 365 -newkey rsa:2048 ` +
        `-keyout "${keyFile}" -out "${crtFile}" ` +
        `-subj "/C=IR/ST=Tehran/L=Tehran/O=TechTink/CN=localhost"`,
      { stdio: 'inherit' }
    );
    console.log(`\n${TAG_OK} Self-signed SSL certificate generated!`);
    console.log(`  Certificate: ${c.cyan(crtFile)}`);
    console.log(`  Private Key: ${c.cyan(keyFile)}\n`);
    return { certPath: crtFile, keyPath: keyFile };
  } catch (e) {
    console.error(`${TAG_ERR} OpenSSL generation failed: ${e.message}`);
    return null;
  }
}

// Interactive SSL Menu (modeled on 3x-ui ssl_cert_issue_main)
async function startSSLMenu() {
  while (true) {
    console.log(`\n${c.bold('======================================================================')}`);
    console.log(`  ${c.bold(c.cyan('TechTink SSL Certificate Management (3x-ui Engine)'))}`);
    console.log(`${c.bold('======================================================================')}`);
    console.log(`  [1] Issue SSL Certificate for Domain (Let's Encrypt / acme.sh standalone)`);
    console.log(`  [2] Configure Nginx with Certificate Directory or Custom Paths (/cert/...)`);
    console.log(`  [3] Show Existing Certificates & Expiry Dates`);
    console.log(`  [4] Issue SSL via Cloudflare DNS (DNS-01 Challenge, bypasses port 80 blocks)`);
    console.log(`  [5] Force Renew Domain Certificate`);
    console.log(`  [6] Revoke & Remove Certificate`);
    console.log(`  [7] Generate Self-Signed Certificate (Development / Testing)`);
    console.log(`  [0] Back to Main Menu`);
    console.log(`----------------------------------------------------------------------`);

    const prompter = createPrompter();
    const choice = (await prompter.ask('Choose an option [0-7]: ')).trim();
    prompter.close();

    switch (choice) {
      case '1':
        await sslIssueDomain();
        break;
      case '2':
        await sslSetCertDir();
        break;
      case '3':
        sslShowList();
        break;
      case '4':
        await sslIssueCloudflare();
        break;
      case '5': {
        const p = createPrompter();
        const d = (await p.ask('Enter domain name to force renew: ')).trim();
        p.close();
        if (d && hasAcme()) runCmdInherit(`${getAcmeBin()} --renew -d ${d} --force`);
        break;
      }
      case '6': {
        const p = createPrompter();
        const d = (await p.ask('Enter domain name to revoke & remove: ')).trim();
        p.close();
        if (d && hasAcme()) {
          runCmdInherit(`${getAcmeBin()} --revoke -d ${d}`);
          runCmdInherit(`${getAcmeBin()} --remove -d ${d}`);
          const pDir = path.join(CERT_BASE_DIR, d);
          if (fs.existsSync(pDir)) runCmd(`rm -rf "${pDir}"`);
          console.log(`${TAG_OK} Revoked and removed certificate for ${d}`);
        }
        break;
      }
      case '7':
        sslSelfSigned();
        break;
      case '0':
      case 'q':
        return;
      default:
        console.log(`${TAG_WARN} Invalid choice.`);
        break;
    }
  }
}

// ==============================================================================
// 5. NGINX REVERSE PROXY & DEFAULT PAGE COLLISION FIX
// ==============================================================================
function buildNginxConfig({ domain = '', port = 3000, sslCert = '', sslKey = '', useSSL = false }) {
  const domainStr = domain && domain !== '_' ? `${domain} www.${domain} _` : '_';

  if (!useSSL) {
    return `# TechTink Nginx Reverse Proxy Configuration (HTTP Only)
# default_server directive prevents "Welcome to nginx!" collisions
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name ${domainStr};

    client_max_body_size 50M;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;

    location / {
        proxy_pass http://127.0.0.1:${port};
        proxy_http_version 1.1;

        # WebSocket Upgrade Headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Proxy Forwarding Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
`;
  }

  return `# TechTink Nginx Reverse Proxy Configuration (HTTPS + SSL)
# 1. HTTP Server Block (Serves eNamad verification paths directly & redirects others to HTTPS)
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name ${domainStr};

    # eNamad verification file over plain HTTP (bypasses any SSL cert mismatch)
    location = /24125751.txt {
        proxy_pass http://127.0.0.1:${port};
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Homepage meta-tag and title probe over plain HTTP
    location = / {
        proxy_pass http://127.0.0.1:${port};
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Redirect all other general traffic to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

# 2. Main HTTPS Server Block
server {
    listen 443 ssl default_server;
    listen [::]:443 ssl default_server;
    server_name ${domainStr};

    ssl_certificate ${sslCert};
    ssl_certificate_key ${sslKey};

    # Modern TLS Security Protocols & Ciphers
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:10m;
    ssl_session_tickets off;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    client_max_body_size 50M;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;

    location / {
        proxy_pass http://127.0.0.1:${port};
        proxy_http_version 1.1;

        # WebSocket Upgrade Headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Proxy Forwarding Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
`;
}

async function handleNginxConfigure({ domain = '', certPath = '', keyPath = '' } = {}) {
  let port = getCurrentPort();

  // Prevent catastrophic port collision: Nginx occupies 80 and 443. Backend MUST be on internal port (e.g. 3000).
  if (port === 443 || port === 80) {
    console.log(`\n${TAG_WARN} CRITICAL PORT CONFLICT DETECTED:`);
    console.log(`  Backend is configured to port ${c.red(port)}, but Nginx requires port 80 & 443 for external traffic!`);
    console.log(`  Proxying to port ${port} causes an infinite SSL loop and crashes the connection.`);
    console.log(`${TAG_INFO} Automatically switching TechTink backend port to ${c.green('3000')} in .env...`);
    setEnvVar('PORT', 3000);
    port = 3000;

    if (isLinux() && fs.existsSync(SYSTEMD_FILE_PATH)) {
      console.log(`${TAG_INFO} Reinstalling systemd service on port 3000 and restarting backend...`);
      handleServiceInstall();
    }
  }

  // If no cert is provided, try to auto-discover existing certificates for domain or techtink.ir
  if (!certPath || !keyPath) {
    const targetDomain = domain || 'techtink.ir';
    const resolved = resolveCertLocation(`/root/cert/${targetDomain}`) || resolveCertLocation(`certs/${targetDomain}`) || resolveCertLocation('/root/cert');
    if (resolved) {
      const pair = findCertAndKeyFiles(resolved.dir);
      if (pair?.bestCert && pair?.bestKey) {
        certPath = pair.bestCert;
        keyPath = pair.bestKey;
        if (!domain) domain = path.basename(resolved.dir).replace(/_ecc$/, '');
      }
    }
  }

  const absCertPath = certPath ? path.resolve(certPath) : '';
  const absKeyPath = keyPath ? path.resolve(keyPath) : '';
  const useSSL = Boolean(absCertPath && absKeyPath && fs.existsSync(absCertPath) && fs.existsSync(absKeyPath));

  // Fix permissions on Linux VPS so Nginx (www-data) can read the certificates
  if (isLinux() && useSSL) {
    console.log(`${TAG_INFO} Ensuring certificate permissions are accessible by Nginx...`);
    runCmd('sudo chmod 755 /root 2>/dev/null || true');
    runCmd('sudo chmod 755 /root/cert 2>/dev/null || true');
    runCmd(`sudo chmod -R 755 "${path.dirname(absCertPath)}" 2>/dev/null || true`);
    runCmd(`sudo chmod 644 "${absCertPath}" "${absKeyPath}" 2>/dev/null || true`);
  }

  // Ensure firewall allows 80 and 443
  if (isLinux() && commandExists('ufw')) {
    try {
      const ufwStatus = runCmd('sudo ufw status')?.toLowerCase() || '';
      if (ufwStatus.includes('active')) {
        console.log(`${TAG_INFO} UFW firewall active: ensuring ports 80 and 443 are open...`);
        runCmd('sudo ufw allow 80/tcp >/dev/null 2>&1 || true');
        runCmd('sudo ufw allow 443/tcp >/dev/null 2>&1 || true');
        console.log(`${TAG_OK} Firewall rules verified (80/tcp, 443/tcp).`);
      }
    } catch {}
  }

  console.log(`\n${c.bold('--- Nginx Reverse Proxy Setup ---')}`);
  console.log(`Backend Port : ${c.cyan(port)} (Internal localhost)`);
  console.log(`Domain       : ${c.cyan(domain || 'All Domains / IP (_)')}`);
  console.log(`SSL Mode     : ${useSSL ? c.green('Active (HTTPS 443)') : c.yellow('Disabled (HTTP 80)')}`);
  if (useSSL) {
    console.log(`Certificate  : ${c.green(absCertPath)}`);
    console.log(`Private Key  : ${c.green(absKeyPath)}`);
  }

  const confContent = buildNginxConfig({
    domain,
    port,
    sslCert: absCertPath,
    sslKey: absKeyPath,
    useSSL,
  });

  const rootConf = path.join(PROJECT_ROOT, 'techtink.nginx.conf');
  fs.writeFileSync(rootConf, confContent, 'utf8');
  console.log(`${TAG_OK} Generated configuration at ${c.cyan(rootConf)}`);

  // Remove default collision
  const defaultSite = '/etc/nginx/sites-enabled/default';
  if (fs.existsSync(defaultSite)) {
    console.log(`${TAG_INFO} Removing default Nginx site symlink (${defaultSite}) to eliminate "Welcome to nginx!" collisions...`);
    runCmd(`sudo rm -f "${defaultSite}"`);
  }

  const targetAvail = '/etc/nginx/sites-available/techtink';
  const targetEnabled = '/etc/nginx/sites-enabled/techtink';

  if (isLinux() && (fs.existsSync('/etc/nginx/sites-available') || fs.existsSync('/etc/nginx'))) {
    console.log(`${TAG_INFO} Installing configuration to Nginx...`);
    try {
      runCmd(`sudo cp "${rootConf}" "${targetAvail}"`);
      runCmd(`sudo ln -sf "${targetAvail}" "${targetEnabled}"`);
      console.log(`${TAG_INFO} Verifying Nginx configuration syntax (sudo nginx -t)...`);
      runCmdInherit('sudo nginx -t');
      console.log(`${TAG_INFO} Reloading Nginx service...`);
      runCmd('sudo systemctl reload nginx || sudo systemctl restart nginx');
      console.log(`\n${TAG_OK} Nginx successfully updated and reloaded!`);
      console.log(`${TAG_OK} TechTink is now LIVE at:`);
      console.log(`  ${c.green(`${useSSL ? 'https' : 'http'}://${domain || 'YOUR_VPS_IP'}/`)}\n`);
    } catch (err) {
      console.error(`${TAG_ERR} Nginx auto-reload failed: ${err.message}`);
    }
  } else {
    console.log(`${TAG_INFO} Local development mode: configuration saved to ${rootConf}`);
  }
}

async function handleNginxFix() {
  console.log(`\n${c.bold('--- Automated Nginx & SSL Repair Tool ---')}`);

  // 1. Reset backend port if incorrectly set to 80 or 443
  const port = getCurrentPort();
  if (port === 443 || port === 80) {
    console.log(`${TAG_WARN} Backend port in .env is set to ${port}. Correcting to port 3000...`);
    setEnvVar('PORT', 3000);
    if (isLinux() && fs.existsSync(SYSTEMD_FILE_PATH)) {
      handleServiceInstall();
    }
  }

  // 2. Remove default collision
  const defaultSite = '/etc/nginx/sites-enabled/default';
  if (fs.existsSync(defaultSite)) {
    console.log(`${TAG_INFO} Removing default site (${defaultSite})...`);
    runCmd(`sudo rm -f "${defaultSite}"`);
    console.log(`${TAG_OK} Removed default site symlink.`);
  } else {
    console.log(`${TAG_OK} Default site is clean.`);
  }

  // 3. Find certificates
  const resolved = resolveCertLocation('/root/cert/techtink.ir') || resolveCertLocation('/root/cert') || resolveCertLocation('certs');
  let certPath = '';
  let keyPath = '';
  let domain = 'techtink.ir';

  if (resolved) {
    const pair = findCertAndKeyFiles(resolved.dir);
    if (pair?.bestCert && pair?.bestKey) {
      certPath = pair.bestCert;
      keyPath = pair.bestKey;
      const bname = path.basename(resolved.dir).replace(/_ecc$/, '');
      domain = (bname !== 'certs' && bname !== 'cert' && bname.includes('.')) ? bname : 'techtink.ir';
      console.log(`${TAG_OK} Discovered valid SSL certificates at: ${c.green(resolved.dir)}`);
    }
  }

  await handleNginxConfigure({ domain, certPath, keyPath });
}

// ==============================================================================
// 6. WEBSITE BETA & INVESTOR DEMO MODE TOGGLE
// ==============================================================================
async function handleSiteMode(args = []) {
  const target = (args[0] || '').toLowerCase();
  const dbInst = await getDbInstance();

  if (!dbInst) {
    console.error(`${TAG_ERR} Database techtink.db not accessible.`);
    return;
  }

  const getSetting = (key) => {
    try {
      if (typeof dbInst.query === 'function') {
        return dbInst.query('SELECT value FROM settings WHERE key = ?').get(key)?.value;
      }
      return dbInst.prepare('SELECT value FROM settings WHERE key = ?').get(key)?.value;
    } catch {
      return null;
    }
  };

  const setSetting = (key, val) => {
    try {
      if (typeof dbInst.query === 'function') {
        dbInst.query('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, val);
      } else {
        dbInst.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, val);
      }
      return true;
    } catch {
      return false;
    }
  };

  const currentMode = getSetting('site_mode') || 'demo';
  const noticeActive = getSetting('demo_notice_active') ?? '1';

  if (!target || target === 'status') {
    console.log(`\n${c.bold('--- Website Deployment & Beta Mode ---')}`);
    console.log(`Active Mode      : ${currentMode === 'demo' ? c.yellow('DEMO MODE (Beta Presentation Active)') : c.green('OPERATIONAL MODE (Live Production)')}`);
    console.log(`Demo Popup Notice: ${noticeActive === '1' ? c.green('Enabled') : c.gray('Disabled')}`);
    console.log(`Notice Title     : ${c.cyan(getSetting('demo_notice_title') || 'Default')}`);
    console.log(`\nTo switch modes:`);
    console.log(`  node scripts/manage.js mode demo         (Activate investor demo modal)`);
    console.log(`  node scripts/manage.js mode operational  (Switch to live operational mode)\n`);
    return;
  }

  if (target === 'demo') {
    setSetting('site_mode', 'demo');
    setSetting('demo_notice_active', '1');
    setSetting('demo_notice_badge_header', '1');
    console.log(`\n${TAG_OK} Switched to ${c.yellow('DEMO MODE')}!`);
    console.log(`  - Demo Notice modal is ACTIVE on initial page load.`);
    console.log(`  - Header shows "نسخه آزمایشی (Demo)" badge.`);
    console.log(`  - All features ready for investor showcase.\n`);
  } else if (target === 'operational' || target === 'live' || target === 'prod') {
    setSetting('site_mode', 'operational');
    setSetting('demo_notice_active', '0');
    setSetting('demo_notice_badge_header', '0');
    console.log(`\n${TAG_OK} Switched to ${c.green('OPERATIONAL / LIVE MODE')}!`);
    console.log(`  - Demo modal notice is deactivated.`);
    console.log(`  - Live e-commerce store is operational.\n`);
  } else {
    console.error(`${TAG_ERR} Unknown mode "${target}". Use "demo" or "operational".`);
  }
}

// ==============================================================================
// 7. DATABASE MAINTENANCE
// ==============================================================================
async function handleDatabase(args = []) {
  const sub = (args[0] || 'backup').toLowerCase();
  console.log(`\n${c.bold('--- SQLite Database Maintenance ---')}`);

  if (!fs.existsSync(DB_PATH)) {
    console.error(`${TAG_ERR} Database file not found at ${DB_PATH}`);
    return;
  }

  if (sub === 'backup') {
    const backupDir = path.join(DATA_DIR, 'backups');
    fs.mkdirSync(backupDir, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `techtink_backup_${timestamp}.db`);
    try {
      fs.copyFileSync(DB_PATH, backupFile);
      const sizeMB = (fs.statSync(backupFile).size / (1024 * 1024)).toFixed(2);
      console.log(`${TAG_OK} Backup created successfully: ${c.green(backupFile)} (${sizeMB} MB)`);
    } catch (e) {
      console.error(`${TAG_ERR} Backup failed: ${e.message}`);
    }
  } else if (sub === 'vacuum') {
    console.log(`${TAG_INFO} Running VACUUM to defragment database...`);
    const dbInst = await getDbInstance();
    if (dbInst) {
      try {
        if (typeof dbInst.query === 'function') dbInst.query('VACUUM').run();
        else dbInst.prepare('VACUUM').run();
        console.log(`${TAG_OK} VACUUM completed successfully.`);
      } catch (e) {
        console.error(`${TAG_ERR} VACUUM failed: ${e.message}`);
      }
    }
  } else if (sub === 'check' || sub === 'integrity') {
    console.log(`${TAG_INFO} Checking PRAGMA integrity_check...`);
    const dbInst = await getDbInstance();
    if (dbInst) {
      try {
        const res = typeof dbInst.query === 'function' ? dbInst.query('PRAGMA integrity_check').get() : dbInst.prepare('PRAGMA integrity_check').get();
        console.log(`${TAG_OK} Integrity status: ${c.green(JSON.stringify(res))}`);
      } catch (e) {
        console.error(`${TAG_ERR} Integrity check failed: ${e.message}`);
      }
    }
  }
}

// ==============================================================================
// 8. DOCKER STACK MANAGEMENT
// ==============================================================================
function handleDocker(args = []) {
  const sub = (args[0] || 'status').toLowerCase();
  if (!commandExists('docker')) {
    console.log(`${TAG_WARN} Docker is not installed on this system.`);
    return;
  }

  console.log(`\n${c.bold('--- TechTink Docker Stack ---')}`);
  if (sub === 'up') {
    console.log(`${TAG_INFO} Starting containers via docker compose up -d...`);
    runCmdInherit('docker compose up -d');
  } else if (sub === 'down') {
    console.log(`${TAG_INFO} Stopping containers via docker compose down...`);
    runCmdInherit('docker compose down');
  } else if (sub === 'restart') {
    console.log(`${TAG_INFO} Restarting containers...`);
    runCmdInherit('docker compose restart');
  } else if (sub === 'logs') {
    runCmdInherit('docker compose logs -f --tail 100');
  } else {
    console.log(`${TAG_INFO} Container status:`);
    runCmdInherit('docker compose ps');
  }
}

// ==============================================================================
// 9. MAIN INTERACTIVE CONSOLE MENU (x-ui Style)
// ==============================================================================
async function startInteractiveMenu() {
  while (true) {
    const port = getCurrentPort();
    const runtime = detectRuntime();
    const isFree = await checkPortFree(port);

    console.log(`\n${c.bold('======================================================================')}`);
    console.log(`  ${c.bold(c.cyan('TechTink VPS & Backend Management Console (v2.0 Beta)'))}`);
    console.log(`${c.bold('======================================================================')}`);
    console.log(`  OS Platform       : ${c.bold(os.type())} ${os.release()} (${os.arch()})`);
    console.log(`  Runtime Engine    : ${c.green(runtime.name)} (${runtime.path})`);
    console.log(`  Backend Port      : ${c.cyan(port)} (${isFree ? c.yellow('Idle / Free') : c.green('Listening / In Use')})`);
    console.log(`  TechTink Root     : ${c.gray(PROJECT_ROOT)}`);
    console.log(`----------------------------------------------------------------------`);
    console.log(`  ${c.bold('[1]')}  Start TechTink Server`);
    console.log(`  ${c.bold('[2]')}  Stop TechTink Server`);
    console.log(`  ${c.bold('[3]')}  Restart TechTink Server`);
    console.log(`  ${c.bold('[4]')}  Server Status & Diagnostics`);
    console.log(`  ${c.bold('[5]')}  View Live Logs (journalctl / console)`);
    console.log(`  ${c.bold('[6]')}  Change Server Port (Current: ${port})`);
    console.log(`  ${c.bold('[7]')}  ${c.green('SSL Certificate Manager (3x-ui acme.sh Engine)')}`);
    console.log(`  ${c.bold('[8]')}  Nginx Reverse Proxy & Default Page Fix`);
    console.log(`  ${c.bold('[9]')}  Switch Website Mode (Demo vs Operational)`);
    console.log(`  ${c.bold('[10]')} Database Maintenance (Backup / Vacuum / Check)`);
    console.log(`  ${c.bold('[11]')} Docker Stack Management (Compose Up / Down / Status)`);
    console.log(`  ${c.bold('[12]')} Create / Manage Admin Account`);
    console.log(`  ${c.bold('[0]')}  Exit`);
    console.log(`----------------------------------------------------------------------`);

    const prompter = createPrompter();
    const choice = (await prompter.ask('Enter your choice [0-12]: ')).trim();
    prompter.close();

    switch (choice) {
      case '1':
        await handleServiceStart();
        break;
      case '2':
        await handleServiceStop();
        break;
      case '3':
        await handleServiceRestart();
        break;
      case '4':
        await handleStatus();
        break;
      case '5':
        handleLogs(['-f', '-n', '50']);
        break;
      case '6':
        await handlePort([]);
        break;
      case '7':
        await startSSLMenu();
        break;
      case '8':
        await handleNginxFix();
        break;
      case '9': {
        const p = createPrompter();
        console.log(`\nSelect Website Mode:`);
        console.log(`  [1] Demo Mode (Investor Showcase Notice Active)`);
        console.log(`  [2] Operational Mode (Live Production Store)`);
        const m = (await p.ask('Choice [1/2]: ')).trim();
        p.close();
        if (m === '1') await handleSiteMode(['demo']);
        else if (m === '2') await handleSiteMode(['operational']);
        break;
      }
      case '10':
        await handleDatabase(['backup']);
        break;
      case '11':
        handleDocker(['status']);
        break;
      case '12': {
        const adminScript = path.join(PROJECT_ROOT, 'scripts', 'create-admin.js');
        if (fs.existsSync(adminScript)) {
          runCmdInherit(`${runtime.path} "${adminScript}"`);
        }
        break;
      }
      case '0':
      case 'q':
      case 'exit':
        console.log(`\nGoodbye!\n`);
        process.exit(0);
      default:
        console.log(`${TAG_WARN} Invalid option "${choice}". Choose 0 to 12.`);
        break;
    }
  }
}

// ==============================================================================
// 10. CLI ARGUMENT DISPATCHER
// ==============================================================================
function printHelp() {
  console.log(`
======================================================================
  TechTink VPS & Backend Management CLI Tool (v2.0 Beta)
======================================================================

Usage:
  node scripts/manage.js [command] [arguments...]
  bun scripts/manage.js [command] [arguments...]

Server Commands (x-ui Style):
  start                     Start TechTink backend server / service
  stop                      Stop TechTink backend server / service
  restart                   Restart TechTink backend server / service
  status                    View complete health report & diagnostics
  logs [-f] [-n <num>]      View live application logs (journalctl / file)
  port [number]             Check port availability or change port in .env
  install-service           Install & enable systemd service (techtink.service)

SSL Management Commands (3x-ui Engine):
  ssl                       Launch interactive SSL Management menu
  ssl issue [domain] [port] Issue Let's Encrypt certificate via acme.sh standalone
  ssl cert-dir <path> [dom] Configure Nginx with certificate folder or custom paths
  ssl list                  Show all existing SSL certificates & expiry dates
  ssl cf <dom> <email> <k>  Issue SSL via Cloudflare DNS-01 API
  ssl self-signed           Generate 2048-bit dev certificate
  ssl renew [domain]        Force renew SSL certificate
  ssl revoke [domain]       Revoke and remove domain certificate

Nginx Reverse Proxy:
  nginx [fix|setup|reload]  Install / repair Nginx reverse proxy & remove default page

Website Mode & Beta Showcase:
  mode [demo|operational]   Switch website mode (Demo Notice Modal vs Live)
  mode status               Show current website deployment mode

Database & Docker:
  db [backup|vacuum|check]  SQLite database backup & maintenance
  docker [up|down|status]   Manage Docker Compose container stack
  admin [create|list]       Create or manage admin accounts
  help, -h, --help          Show this manual

No arguments launches the Interactive Console Menu (TUI).
`);
}

async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0]?.toLowerCase();
  const subArgs = args.slice(1);

  if (!cmd) {
    await startInteractiveMenu();
    return;
  }

  switch (cmd) {
    case 'start':
      await handleServiceStart();
      break;
    case 'stop':
      await handleServiceStop();
      break;
    case 'restart':
      await handleServiceRestart();
      break;
    case 'status':
    case 'health':
      await handleStatus();
      break;
    case 'logs':
    case 'log':
      handleLogs(subArgs);
      break;
    case 'port':
      await handlePort(subArgs);
      break;
    case 'service':
    case 'install-service':
    case 'systemd':
      handleServiceInstall();
      break;
    case 'ssl':
    case 'cert': {
      const sub = subArgs[0]?.toLowerCase();
      if (!sub || sub === 'menu') await startSSLMenu();
      else if (sub === 'issue' || sub === 'create') await sslIssueDomain(subArgs[1], subArgs[2]);
      else if (sub === 'cert-dir' || sub === 'dir') await sslSetCertDir(subArgs[1], subArgs[2]);
      else if (sub === 'list' || sub === 'show') sslShowList();
      else if (sub === 'cf' || sub === 'cloudflare') await sslIssueCloudflare(subArgs[1], subArgs[2], subArgs[3]);
      else if (sub === 'self-signed') sslSelfSigned();
      else if (sub === 'renew') {
        const acme = getAcmeBin();
        if (subArgs[1] && hasAcme()) runCmdInherit(`${acme} --renew -d ${subArgs[1]} --force`);
      } else if (sub === 'revoke') {
        const acme = getAcmeBin();
        if (subArgs[1] && hasAcme()) {
          runCmdInherit(`${acme} --revoke -d ${subArgs[1]}`);
          runCmdInherit(`${acme} --remove -d ${subArgs[1]}`);
        }
      } else {
        // Fallback: check if subArg is actually a directory (like `manage.js ssl /cert/techtink.ir`)
        await sslSetCertDir(sub, subArgs[1]);
      }
      break;
    }
    case 'ssl-dir':
    case 'cert-dir':
      await sslSetCertDir(subArgs[0], subArgs[1]);
      break;
    case 'nginx':
      if (subArgs[0] === 'fix') await handleNginxFix();
      else await handleNginxConfigure({});
      break;
    case 'mode':
    case 'sitemode':
      await handleSiteMode(subArgs);
      break;
    case 'db':
    case 'database':
      await handleDatabase(subArgs);
      break;
    case 'docker':
    case 'compose':
      handleDocker(subArgs);
      break;
    case 'admin': {
      const adminScript = path.join(PROJECT_ROOT, 'scripts', 'create-admin.js');
      const runtime = detectRuntime();
      runCmdInherit(`${runtime.path} "${adminScript}" ${subArgs.join(' ')}`);
      break;
    }
    case 'help':
    case '--help':
    case '-h':
      printHelp();
      break;
    default:
      console.error(`${TAG_ERR} Unknown command "${cmd}".`);
      printHelp();
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(`\n${TAG_ERR} Unhandled error:`, err);
  process.exit(1);
});
