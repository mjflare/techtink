#!/usr/bin/env node
// ==============================================================================
// TechTink VPS & Backend Management CLI Tool
// Runtime: Node.js (>= 20) or Bun (>= 1.0)
//
// Capabilities:
//   - Port selection, availability testing & .env configuration
//   - Systemd (systemctl) unit generator, installer & service management
//   - SSL certificate automation (Let's Encrypt / Certbot / Self-Signed)
//   - Production Nginx Reverse Proxy generator with SSL & WebSocket support
//   - Backend service health checks, latency tests & process monitoring
//   - Live log inspection (systemd journalctl, PM2, or log files)
//   - SQLite database maintenance (backups, vacuum, integrity check)
//   - Administrator account management & listing
//
// Usage:
//   Interactive Mode:
//     node scripts/manage.js
//     bun scripts/manage.js
//
//   Non-Interactive Commands:
//     node scripts/manage.js port [number]
//     node scripts/manage.js systemd [generate|install|start|stop|restart|status|reload]
//     node scripts/manage.js ssl [letsencrypt|self-signed|nginx-config|test-renew]
//     node scripts/manage.js status
//     node scripts/manage.js logs [-n lines] [-f]
//     node scripts/manage.js db [backup|vacuum|check|info]
//     node scripts/manage.js admin [list|create]
//     node scripts/manage.js env [show|set <KEY> <VALUE>]
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

function commandExists(cmd) {
  try {
    const checkCmd = os.platform() === 'win32' ? `where ${cmd}` : `command -v ${cmd}`;
    execSync(checkCmd, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
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
    console.log(`Please ensure the user has write permissions to .env (e.g. chmod u+w .env).`);
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
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        resolve(false);
      }
    });
    srv.once('listening', () => {
      srv.close(() => resolve(true));
    });
    srv.listen(port, '0.0.0.0');
  });
}

// --- HTTP API Health Ping ---
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

// ==============================================================================
// 1. PORT MANAGEMENT
// ==============================================================================
async function handlePort(args) {
  console.log(`\n${c.bold('--- TechTink Port Configuration ---')}`);
  const currentPort = getCurrentPort();
  console.log(`${TAG_INFO} Current active port: ${c.cyan(currentPort)}`);

  let targetPort = args[0] ? parseInt(args[0], 10) : null;

  if (!targetPort) {
    const prompter = createPrompter();
    const ans = await prompter.ask(`Enter new port number [current: ${currentPort}]: `);
    prompter.close();
    if (!ans.trim()) {
      console.log(`${TAG_INFO} Port unchanged.`);
      return;
    }
    targetPort = parseInt(ans.trim(), 10);
  }

  if (isNaN(targetPort) || targetPort < 1 || targetPort > 65535) {
    console.error(`${TAG_ERR} Invalid port number "${targetPort}". Must be between 1 and 65535.`);
    return;
  }

  console.log(`${TAG_INFO} Testing availability of port ${targetPort}...`);
  const isFree = await checkPortFree(targetPort);

  if (!isFree) {
    if (targetPort === currentPort) {
      console.log(`${TAG_WARN} Port ${targetPort} is currently in use (likely by your running TechTink process).`);
    } else {
      console.log(`${TAG_WARN} Port ${targetPort} is currently occupied by another process!`);
      const prompter = createPrompter();
      const cont = await prompter.ask(`Do you still want to assign port ${targetPort}? [y/N]: `);
      prompter.close();
      if (!cont.trim().toLowerCase().startsWith('y')) {
        console.log(`${TAG_INFO} Aborted.`);
        return;
      }
    }
  } else {
    console.log(`${TAG_OK} Port ${targetPort} is available and free.`);
  }

  setEnvVar('PORT', targetPort);
  console.log(`${TAG_OK} Updated ${c.bold('.env')}: PORT=${targetPort}`);

  // Check if systemd service exists and offer update
  if (fs.existsSync(SYSTEMD_FILE_PATH)) {
    console.log(`${TAG_INFO} Found existing systemd service at ${SYSTEMD_FILE_PATH}`);
    try {
      const content = fs.readFileSync(SYSTEMD_FILE_PATH, 'utf8');
      if (content.includes('Environment=PORT=')) {
        const updated = content.replace(/Environment=PORT=\d+/, `Environment=PORT=${targetPort}`);
        fs.writeFileSync('techtink.service.tmp', updated, 'utf8');
        runCmd(`sudo cp techtink.service.tmp ${SYSTEMD_FILE_PATH} && rm -f techtink.service.tmp`);
        runCmd('sudo systemctl daemon-reload');
        console.log(`${TAG_OK} Updated systemd service unit with new PORT=${targetPort} and ran daemon-reload.`);
      }
    } catch (e) {
      console.log(`${TAG_WARN} Could not automatically update ${SYSTEMD_FILE_PATH}: ${e.message}`);
    }
  }

  console.log(`\n${c.green('Port update successful!')}`);
  console.log(`Restart your backend for changes to take effect:`);
  console.log(`  sudo systemctl restart techtink  ${c.gray('(if running via systemd)')}`);
  console.log(`  bun server.js                    ${c.gray('(if running manually)')}\n`);
}

// ==============================================================================
// 2. SYSTEMD (SYSTEMCTL) CONFIGURATION & MANAGEMENT
// ==============================================================================
function buildSystemdUnit({ user, cwd, execPath, port }) {
  return `[Unit]
Description=TechTink E-Commerce Backend Service
After=network.target

[Service]
Type=simple
User=${user}
WorkingDirectory=${cwd}
Environment=NODE_ENV=production
Environment=PORT=${port}
EnvironmentFile=-${path.join(cwd, '.env')}
ExecStart=${execPath} server.js
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=techtink

# Resource limits and security hardening
LimitNOFILE=65535
TimeoutStopSec=15

[Install]
WantedBy=multi-user.target
`;
}

async function handleSystemd(args) {
  const sub = args[0] || 'menu';
  const port = getCurrentPort();
  const runtime = detectRuntime();
  const currentUser = process.env.USER || os.userInfo()?.username || 'root';

  if (os.platform() !== 'linux') {
    console.log(`${TAG_WARN} Your current operating system is ${os.platform()} (not Linux).`);
    console.log(`${TAG_INFO} systemd service units are only natively supported on Linux systems (Ubuntu, Debian, CentOS, AlmaLinux, etc.).`);
    console.log(`${TAG_INFO} However, we can still generate and preview the production service file for your VPS.\n`);
  }

  if (sub === 'generate') {
    const unitContent = buildSystemdUnit({
      user: currentUser,
      cwd: PROJECT_ROOT,
      execPath: runtime.path,
      port,
    });
    const outFile = path.join(PROJECT_ROOT, 'techtink.service');
    fs.writeFileSync(outFile, unitContent, 'utf8');
    console.log(`${TAG_OK} Generated unit file at: ${c.cyan(outFile)}`);
    console.log(`\n${c.bold('--- Preview techtink.service ---')}\n${unitContent}`);
    console.log(`To install on your Linux VPS:`);
    console.log(`  sudo cp techtink.service /etc/systemd/system/`);
    console.log(`  sudo systemctl daemon-reload`);
    console.log(`  sudo systemctl enable --now techtink\n`);
    return;
  }

  if (sub === 'install') {
    const unitContent = buildSystemdUnit({
      user: currentUser,
      cwd: PROJECT_ROOT,
      execPath: runtime.path,
      port,
    });
    const tempFile = path.join(PROJECT_ROOT, 'techtink.service');
    fs.writeFileSync(tempFile, unitContent, 'utf8');

    console.log(`${TAG_INFO} Installing unit file to ${SYSTEMD_FILE_PATH}...`);
    try {
      execSync(`sudo cp "${tempFile}" "${SYSTEMD_FILE_PATH}"`, { stdio: 'inherit' });
      execSync('sudo systemctl daemon-reload', { stdio: 'inherit' });
      execSync('sudo systemctl enable techtink', { stdio: 'inherit' });
      console.log(`${TAG_OK} Successfully installed and enabled ${c.green('techtink.service')}!`);
      console.log(`Start the service anytime with:`);
      console.log(`  sudo systemctl start techtink\n`);
    } catch (err) {
      console.error(`${TAG_ERR} Failed to install systemd service: ${err.message}`);
      console.log(`You can manually copy ${tempFile} to /etc/systemd/system/ using sudo.`);
    }
    return;
  }

  if (['start', 'stop', 'restart', 'reload', 'status'].includes(sub)) {
    console.log(`${TAG_INFO} Executing: sudo systemctl ${sub} techtink`);
    try {
      execSync(`sudo systemctl ${sub} techtink`, { stdio: 'inherit' });
    } catch (err) {
      console.error(`${TAG_ERR} Failed to execute systemctl ${sub}: ${err.message}`);
    }
    return;
  }

  // Interactive Systemd Menu
  const prompter = createPrompter();
  console.log(`\n${c.bold('--- TechTink Systemd (systemctl) Manager ---')}`);
  console.log(`Detected Runtime : ${c.cyan(runtime.name)} (${runtime.path})`);
  console.log(`Working Directory: ${c.cyan(PROJECT_ROOT)}`);
  console.log(`Configured Port  : ${c.cyan(port)}`);
  console.log(`Target User      : ${c.cyan(currentUser)}`);
  console.log(`Service File     : ${fs.existsSync(SYSTEMD_FILE_PATH) ? c.green('Installed at ' + SYSTEMD_FILE_PATH) : c.yellow('Not installed')}`);
  console.log('');
  console.log(`[1] Generate techtink.service file in project root`);
  console.log(`[2] Install & Enable techtink.service (requires sudo)`);
  console.log(`[3] Start Service   (sudo systemctl start techtink)`);
  console.log(`[4] Stop Service    (sudo systemctl stop techtink)`);
  console.log(`[5] Restart Service (sudo systemctl restart techtink)`);
  console.log(`[6] Check Status    (sudo systemctl status techtink)`);
  console.log(`[0] Back to main menu`);

  const choice = await prompter.ask('\nSelect an option [0-6]: ');
  prompter.close();

  switch (choice.trim()) {
    case '1':
      await handleSystemd(['generate']);
      break;
    case '2':
      await handleSystemd(['install']);
      break;
    case '3':
      await handleSystemd(['start']);
      break;
    case '4':
      await handleSystemd(['stop']);
      break;
    case '5':
      await handleSystemd(['restart']);
      break;
    case '6':
      await handleSystemd(['status']);
      break;
    default:
      break;
  }
}

// ==============================================================================
// 3. SSL CERTIFICATE & NGINX REVERSE PROXY
// ==============================================================================
function buildNginxConfig({ domain = '', port = 3000, sslCert = '', sslKey = '', useSSL = false }) {
  const domainStr = domain && domain !== '_' ? `${domain} _` : '_';
  if (!useSSL) {
    return `# TechTink Nginx Reverse Proxy Configuration (HTTP Only)
# Configured with default_server catch-all to prevent default welcome page collisions
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

  return `# TechTink Nginx Reverse Proxy Configuration with HTTPS & SSL
# 1. HTTP to HTTPS Redirection
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name ${domainStr};
    return 301 https://$host$request_uri;
}

# 2. Main HTTPS Server Block
server {
    listen 443 ssl default_server;
    listen [::]:443 ssl default_server;
    server_name ${domainStr};

    # SSL Certificates
    ssl_certificate ${sslCert};
    ssl_certificate_key ${sslKey};

    # Modern SSL Security Protocols & Ciphers
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

async function handleNginxFix(args = []) {
  console.log(`\n${c.bold('============================================================')}`);
  console.log(`  ${c.bold(c.cyan('TechTink Automated Nginx Configuration & Fix'))}`);
  console.log(`${c.bold('============================================================')}`);

  const port = getCurrentPort();
  console.log(`${TAG_INFO} Target Backend Port: ${c.cyan(port)}`);

  // 1. Check if Nginx is installed
  const hasNginx = commandExists('nginx');
  if (!hasNginx) {
    console.log(`${TAG_WARN} Nginx binary was not detected in PATH.`);
    console.log(`To install Nginx on Ubuntu/Debian:`);
    console.log(`  sudo apt update && sudo apt install -y nginx\n`);
  }

  // 2. Remove default site collision
  const defaultEnabled = '/etc/nginx/sites-enabled/default';
  if (fs.existsSync(defaultEnabled)) {
    console.log(`${TAG_INFO} Detected default site symlink: ${c.yellow(defaultEnabled)}`);
    console.log(`${TAG_INFO} Removing default site to eliminate "Welcome to nginx!" collision...`);
    try {
      runCmd(`sudo rm -f "${defaultEnabled}"`);
      console.log(`${TAG_OK} Successfully removed ${defaultEnabled}`);
    } catch (e) {
      console.error(`${TAG_WARN} Could not remove ${defaultEnabled}: ${e.message}`);
    }
  } else {
    console.log(`${TAG_OK} Default site is already removed or disabled.`);
  }

  // 3. Determine domain
  let domain = args[0] || '';
  if (!domain && process.stdin.isTTY && !args.includes('--yes') && !args.includes('-y')) {
    const prompter = createPrompter();
    const answer = await prompter.ask('Enter domain name (press Enter to accept VPS IP and any domain): ');
    prompter.close();
    domain = answer.trim();
  }

  // 4. Generate config
  const conf = buildNginxConfig({
    domain,
    port,
    useSSL: false,
  });

  const rootConf = path.join(PROJECT_ROOT, 'techtink.nginx.conf');
  fs.writeFileSync(rootConf, conf, 'utf8');
  console.log(`${TAG_OK} Generated Nginx configuration file: ${c.cyan(rootConf)}`);

  const targetAvail = '/etc/nginx/sites-available/techtink';
  const targetEnabled = '/etc/nginx/sites-enabled/techtink';

  const isLinux = os.platform() === 'linux';
  if (isLinux && (fs.existsSync('/etc/nginx/sites-available') || fs.existsSync('/etc/nginx'))) {
    console.log(`${TAG_INFO} Installing configuration into Nginx...`);
    try {
      runCmd(`sudo cp "${rootConf}" "${targetAvail}"`);
      console.log(`${TAG_OK} Copied config to ${c.cyan(targetAvail)}`);

      runCmd(`sudo ln -sf "${targetAvail}" "${targetEnabled}"`);
      console.log(`${TAG_OK} Created symlink at ${c.cyan(targetEnabled)}`);

      console.log(`${TAG_INFO} Verifying Nginx syntax with "sudo nginx -t"...`);
      runCmd('sudo nginx -t');
      console.log(`${TAG_OK} Nginx syntax validation successful!`);

      console.log(`${TAG_INFO} Reloading Nginx service...`);
      runCmd('sudo systemctl reload nginx || sudo systemctl restart nginx');
      console.log(`${TAG_OK} Nginx successfully reloaded! Port 80 now proxies to TechTink (127.0.0.1:${port}).`);
    } catch (err) {
      console.error(`${TAG_ERR} Auto-installation failed: ${err.message}`);
      console.log(`Please run the following commands manually with sudo:`);
      console.log(`  sudo cp "${rootConf}" "${targetAvail}"`);
      console.log(`  sudo ln -sf "${targetAvail}" "${targetEnabled}"`);
      console.log(`  sudo rm -f /etc/nginx/sites-enabled/default`);
      console.log(`  sudo nginx -t && sudo systemctl reload nginx\n`);
    }
  } else {
    console.log(`\n${TAG_INFO} Configuration saved to: ${c.cyan(rootConf)}`);
    console.log(`Run the following on your Linux VPS:`);
    console.log(`  sudo rm -f /etc/nginx/sites-enabled/default`);
    console.log(`  sudo cp "${rootConf}" /etc/nginx/sites-available/techtink`);
    console.log(`  sudo ln -sf /etc/nginx/sites-available/techtink /etc/nginx/sites-enabled/`);
    console.log(`  sudo nginx -t && sudo systemctl reload nginx\n`);
  }

  // 5. Backend health check
  const isFree = await checkPortFree(port);
  if (isFree) {
    console.log(`\n${TAG_WARN} NOTICE: TechTink backend is NOT currently listening on port ${port}!`);
    console.log(`Visitors will receive a "502 Bad Gateway" until the backend service is started.`);
    console.log(`To start the backend right now, run:`);
    console.log(`  sudo systemctl restart techtink   (or: bun server.js)\n`);
  } else {
    console.log(`\n${TAG_OK} TechTink backend is running and listening on port ${port}!`);
    console.log(`${TAG_OK} TechTink is now LIVE at:`);
    console.log(`  ${c.cyan(`http://${domain || 'YOUR_VPS_IP'}/`)}\n`);
  }
}

function scanCertDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return { error: `Directory "${dirPath}" does not exist.` };
  }

  let stats;
  try {
    stats = fs.statSync(dirPath);
  } catch (e) {
    return { error: `Cannot access "${dirPath}": ${e.message}` };
  }

  let targetDir = dirPath;
  if (!stats.isDirectory()) {
    targetDir = path.dirname(dirPath);
  }

  let files = [];
  try {
    files = fs.readdirSync(targetDir);
  } catch (e) {
    return { error: `Failed to read directory "${targetDir}": ${e.message}` };
  }

  if (files.length === 0) {
    return { error: `Directory "${targetDir}" is empty.` };
  }

  const isCertFile = (f) => {
    const lower = f.toLowerCase();
    if (lower.includes('key') || lower.includes('priv')) return false;
    return lower.endsWith('.pem') || lower.endsWith('.crt') || lower.endsWith('.cer');
  };

  const isKeyFile = (f) => {
    const lower = f.toLowerCase();
    return lower.endsWith('.key') || (lower.endsWith('.pem') && (lower.includes('key') || lower.includes('priv')));
  };

  // Sort candidate certs by preference
  const certCandidates = [];
  const priorityCertNames = ['fullchain.pem', 'bundle.crt', 'bundle.pem', 'chain.pem', 'cert.pem', 'certificate.crt', 'cert.crt'];
  for (const name of priorityCertNames) {
    if (files.includes(name)) certCandidates.push(name);
  }
  for (const f of files) {
    if (isCertFile(f) && !certCandidates.includes(f)) {
      certCandidates.push(f);
    }
  }

  // Sort candidate keys by preference
  const keyCandidates = [];
  const priorityKeyNames = ['privkey.pem', 'private.key', 'privatekey.key', 'key.pem', 'cert.key'];
  for (const name of priorityKeyNames) {
    if (files.includes(name)) keyCandidates.push(name);
  }
  for (const f of files) {
    if (isKeyFile(f) && !keyCandidates.includes(f)) {
      keyCandidates.push(f);
    }
  }

  return {
    dir: targetDir,
    files,
    certCandidates,
    keyCandidates,
    bestCert: certCandidates[0] ? path.join(targetDir, certCandidates[0]) : null,
    bestKey: keyCandidates[0] ? path.join(targetDir, keyCandidates[0]) : null,
  };
}

function findPossibleCertDirs(nameOrPath) {
  const clean = (nameOrPath || '').trim().replace(/^["']|["']$/g, '');
  const basename = path.basename(clean);
  const candidates = [];

  // Direct paths
  candidates.push(path.resolve(process.cwd(), clean));
  candidates.push(path.resolve(PROJECT_ROOT, clean));

  // Stripped leading slash (e.g. /cert/techtink.ir -> ./cert/techtink.ir or ./certs/techtink.ir)
  if (clean.startsWith('/')) {
    const relativePart = clean.replace(/^\/+/, '');
    candidates.push(path.resolve(process.cwd(), relativePart));
    candidates.push(path.resolve(PROJECT_ROOT, relativePart));
    candidates.push(path.resolve(PROJECT_ROOT, 'certs', basename));
    candidates.push(path.resolve(PROJECT_ROOT, 'cert', basename));
  }

  // Common Linux VPS & Certbot locations
  const systemLocations = [
    `/etc/letsencrypt/live/${basename}`,
    `/etc/letsencrypt/live`,
    `/etc/ssl/${basename}`,
    `/etc/ssl/certs`,
    `/etc/nginx/ssl/${basename}`,
    `/etc/nginx/ssl`,
    `/root/certs/${basename}`,
    `/root/cert/${basename}`,
    `/root/certs`,
    `/root/cert`,
    path.join(PROJECT_ROOT, 'certs'),
    path.join(PROJECT_ROOT, 'cert'),
  ];

  for (const sys of systemLocations) {
    if (!candidates.includes(sys)) {
      candidates.push(sys);
    }
  }

  const existingWithCerts = [];
  for (const cand of candidates) {
    try {
      if (fs.existsSync(cand) && fs.statSync(cand).isDirectory()) {
        const files = fs.readdirSync(cand);
        const hasCert = files.some(
          (f) =>
            f.endsWith('.pem') ||
            f.endsWith('.crt') ||
            f.endsWith('.key') ||
            f.endsWith('.cer')
        );
        if (hasCert && !existingWithCerts.includes(cand)) {
          existingWithCerts.push(cand);
        }
      }
    } catch {}
  }

  return existingWithCerts;
}

async function handleCertDir(args = []) {
  console.log(`\n${c.bold('============================================================')}`);
  console.log(`  ${c.bold(c.cyan('Configure Nginx with SSL Certificate Directory'))}`);
  console.log(`${c.bold('============================================================')}`);

  const positional = args.filter((a) => a !== '-y' && a !== '--yes');
  let inputDir = positional[0] || '';
  let domain = positional[1] || '';

  if (!inputDir && process.stdin.isTTY) {
    const prompter = createPrompter();
    inputDir = (await prompter.ask('Enter path to directory containing certificate files (e.g. /etc/letsencrypt/live/yourdomain or ./certs): ')).trim();
    prompter.close();
  }

  if (!inputDir) {
    console.error(`${TAG_ERR} No certificate directory provided.`);
    console.log(`Usage: node scripts/manage.js ssl cert-dir <directory_path> [domain]\n`);
    return;
  }

  const resolvedDir = path.resolve(process.cwd(), inputDir);
  console.log(`${TAG_INFO} Checking directory: ${c.cyan(resolvedDir)}`);

  let scan = scanCertDirectory(resolvedDir);
  if (scan.error) {
    const discovered = findPossibleCertDirs(inputDir);
    if (discovered.length > 0) {
      console.log(`\n${TAG_WARN} "${c.yellow(resolvedDir)}" was not found directly.`);
      console.log(`${TAG_INFO} Discovered SSL certificate directories on your server:`);
      for (let i = 0; i < discovered.length; i++) {
        console.log(`  [${i + 1}] ${c.green(discovered[i])}`);
      }

      if (process.stdin.isTTY && !args.includes('-y') && !args.includes('--yes')) {
        const prompter = createPrompter();
        const choice = (await prompter.ask(`\nSelect a discovered directory [1-${discovered.length}] (or press Enter to exit): `)).trim();
        prompter.close();
        const idx = parseInt(choice, 10) - 1;
        if (!isNaN(idx) && discovered[idx]) {
          console.log(`\n${TAG_INFO} Using selected directory: ${c.cyan(discovered[idx])}`);
          scan = scanCertDirectory(discovered[idx]);
        }
      } else if (discovered.length === 1) {
        console.log(`\n${TAG_INFO} Auto-selecting discovered directory: ${c.cyan(discovered[0])}`);
        scan = scanCertDirectory(discovered[0]);
      }
    }
  }

  if (scan.error) {
    console.error(`\n${TAG_ERR} ${scan.error}`);
    console.log(`\n${c.bold('Common SSL Certificate Locations on Linux VPS:')}`);
    console.log(`  - Let's Encrypt / Certbot : ${c.cyan('/etc/letsencrypt/live/techtink.ir')}`);
    console.log(`  - Local Project Folder   : ${c.cyan('./certs')}`);
    console.log(`  - Standard SSL Directory : ${c.cyan('/etc/ssl/certs')}`);
    console.log(`\nTo find where your certificates are stored on your VPS, run:`);
    console.log(`  ${c.yellow('sudo ls -la /etc/letsencrypt/live/')}`);
    console.log(`  ${c.yellow('sudo find / -name "*techtink*" 2>/dev/null')}\n`);
    return;
  }

  console.log(`${TAG_INFO} Found ${scan.files.length} file(s) in directory: ${scan.files.join(', ')}`);

  let certPath = scan.bestCert;
  let keyPath = scan.bestKey;

  if (certPath && keyPath && process.stdin.isTTY && !args.includes('-y') && !args.includes('--yes')) {
    console.log(`\nAuto-Detected SSL Files:`);
    console.log(`  Certificate : ${c.green(certPath)}`);
    console.log(`  Private Key : ${c.green(keyPath)}`);

    const prompter = createPrompter();
    const confirm = (await prompter.ask('\nUse these detected certificate files? [Y/n]: ')).trim().toLowerCase();
    prompter.close();
    if (confirm && confirm.startsWith('n')) {
      certPath = null;
      keyPath = null;
    }
  }

  if (!certPath) {
    if (scan.certCandidates.length > 0) {
      console.log(`Available certificate files: ${scan.certCandidates.join(', ')}`);
    } else {
      console.log(`Available files in directory: ${scan.files.join(', ')}`);
    }
    const prompter = createPrompter();
    const cInput = (await prompter.ask('Enter certificate filename (e.g. fullchain.pem or techtink.crt): ')).trim();
    prompter.close();
    if (!cInput) {
      console.error(`${TAG_ERR} Certificate filename is required.`);
      return;
    }
    certPath = path.isAbsolute(cInput) ? cInput : path.join(scan.dir, cInput);
  }

  if (!keyPath) {
    if (scan.keyCandidates.length > 0) {
      console.log(`Available private key files: ${scan.keyCandidates.join(', ')}`);
    } else {
      console.log(`Available files in directory: ${scan.files.join(', ')}`);
    }
    const prompter = createPrompter();
    const kInput = (await prompter.ask('Enter private key filename (e.g. privkey.pem or techtink.key): ')).trim();
    prompter.close();
    if (!kInput) {
      console.error(`${TAG_ERR} Private key filename is required.`);
      return;
    }
    keyPath = path.isAbsolute(kInput) ? kInput : path.join(scan.dir, kInput);
  }

  if (!fs.existsSync(certPath)) {
    console.error(`${TAG_ERR} Certificate file does not exist: ${certPath}`);
    return;
  }
  if (!fs.existsSync(keyPath)) {
    console.error(`${TAG_ERR} Private key file does not exist: ${keyPath}`);
    return;
  }

  if (!domain && process.stdin.isTTY && !args.includes('-y') && !args.includes('--yes')) {
    const prompter = createPrompter();
    domain = (await prompter.ask('Enter domain name (press Enter to accept VPS IP and all domains): ')).trim();
    prompter.close();
  }

  const port = getCurrentPort();
  console.log(`\n${TAG_INFO} Generating Nginx HTTPS reverse proxy configuration:`);
  console.log(`  Backend Port : ${c.cyan(port)}`);
  console.log(`  Certificate  : ${c.cyan(certPath)}`);
  console.log(`  Private Key  : ${c.cyan(keyPath)}`);
  console.log(`  Server Name  : ${c.cyan(domain || 'All Domains / VPS IP (_)')}`);

  const conf = buildNginxConfig({
    domain,
    port,
    sslCert: certPath,
    sslKey: keyPath,
    useSSL: true,
  });

  const rootConf = path.join(PROJECT_ROOT, 'techtink.nginx.conf');
  fs.writeFileSync(rootConf, conf, 'utf8');
  console.log(`${TAG_OK} Saved configuration to: ${c.cyan(rootConf)}`);

  // Remove default site collision
  const defaultEnabled = '/etc/nginx/sites-enabled/default';
  if (fs.existsSync(defaultEnabled)) {
    try {
      runCmd(`sudo rm -f "${defaultEnabled}"`);
      console.log(`${TAG_OK} Removed default Nginx site symlink (${defaultEnabled})`);
    } catch (e) {
      console.warn(`${TAG_WARN} Could not remove ${defaultEnabled}: ${e.message}`);
    }
  }

  const targetAvail = '/etc/nginx/sites-available/techtink';
  const targetEnabled = '/etc/nginx/sites-enabled/techtink';
  const isLinux = os.platform() === 'linux';

  if (isLinux && (fs.existsSync('/etc/nginx/sites-available') || fs.existsSync('/etc/nginx'))) {
    console.log(`${TAG_INFO} Installing configuration into Nginx...`);
    try {
      runCmd(`sudo cp "${rootConf}" "${targetAvail}"`);
      console.log(`${TAG_OK} Copied config to ${c.cyan(targetAvail)}`);

      runCmd(`sudo ln -sf "${targetAvail}" "${targetEnabled}"`);
      console.log(`${TAG_OK} Symlinked to ${c.cyan(targetEnabled)}`);

      console.log(`${TAG_INFO} Verifying Nginx syntax with "sudo nginx -t"...`);
      runCmd('sudo nginx -t');
      console.log(`${TAG_OK} Nginx syntax validation successful!`);

      console.log(`${TAG_INFO} Reloading Nginx service...`);
      runCmd('sudo systemctl reload nginx || sudo systemctl restart nginx');
      console.log(`${TAG_OK} Nginx successfully reloaded! HTTPS is now active on port 443.`);
      console.log(`${TAG_OK} HTTP traffic on port 80 will automatically redirect to HTTPS.`);
    } catch (err) {
      console.error(`${TAG_ERR} Nginx auto-installation failed: ${err.message}`);
      console.log(`Please run the following commands manually with sudo:`);
      console.log(`  sudo cp "${rootConf}" "${targetAvail}"`);
      console.log(`  sudo ln -sf "${targetAvail}" "${targetEnabled}"`);
      console.log(`  sudo rm -f /etc/nginx/sites-enabled/default`);
      console.log(`  sudo nginx -t && sudo systemctl reload nginx\n`);
    }
  } else {
    console.log(`\n${TAG_INFO} Configuration ready at: ${c.cyan(rootConf)}`);
    console.log(`Run the following on your Linux VPS:`);
    console.log(`  sudo rm -f /etc/nginx/sites-enabled/default`);
    console.log(`  sudo cp "${rootConf}" /etc/nginx/sites-available/techtink`);
    console.log(`  sudo ln -sf /etc/nginx/sites-available/techtink /etc/nginx/sites-enabled/`);
    console.log(`  sudo nginx -t && sudo systemctl reload nginx\n`);
  }

  // Backend check
  const isFree = await checkPortFree(port);
  if (isFree) {
    console.log(`\n${TAG_WARN} NOTICE: TechTink backend is NOT currently listening on port ${port}!`);
    console.log(`Visitors will receive a "502 Bad Gateway" until the backend service is started.`);
    console.log(`To start the backend right now, run:`);
    console.log(`  sudo systemctl restart techtink   (or: bun server.js)\n`);
  } else {
    console.log(`\n${TAG_OK} TechTink backend is running and listening on port ${port}!`);
    console.log(`${TAG_OK} Secure website is now LIVE at:`);
    console.log(`  ${c.cyan(`https://${domain || 'YOUR_VPS_IP'}/`)}\n`);
  }
}

async function handleNginx(args) {
  const sub = args[0]?.toLowerCase() || 'fix';
  if (sub === 'fix' || sub === 'setup' || sub === 'install') {
    await handleNginxFix(args.slice(1));
  } else if (sub === 'cert-dir' || sub === 'certs' || sub === 'ssl-dir' || sub === 'ssl') {
    await handleCertDir(args.slice(1));
  } else if (sub === 'reload' || sub === 'restart') {
    try {
      console.log(`${TAG_INFO} Testing Nginx configuration...`);
      runCmd('sudo nginx -t');
      console.log(`${TAG_INFO} Reloading Nginx service...`);
      runCmd('sudo systemctl reload nginx');
      console.log(`${TAG_OK} Nginx reloaded successfully!`);
    } catch (e) {
      console.error(`${TAG_ERR} Reload failed: ${e.message}`);
    }
  } else if (sub === 'status') {
    console.log(`\n${c.bold('--- Nginx Status & Diagnostics ---')}`);
    const defaultExists = fs.existsSync('/etc/nginx/sites-enabled/default');
    const techtinkExists = fs.existsSync('/etc/nginx/sites-enabled/techtink');
    console.log(`Default site enabled : ${defaultExists ? c.yellow('YES (warning: may override TechTink)') : c.green('No (clean)')}`);
    console.log(`TechTink site enabled: ${techtinkExists ? c.green('YES') : c.red('NO')}`);
    try {
      const res = runCmd('sudo nginx -t') || 'ok';
      console.log(`${TAG_OK} Syntax test: ${res}`);
    } catch (e) {
      console.log(`${TAG_ERR} Syntax test error: ${e.message}`);
    }
  } else {
    await handleNginxFix(args);
  }
}


async function handleSSL(args) {
  const sub = args[0] || 'menu';
  const port = getCurrentPort();

  if (sub === 'cert-dir' || sub === 'certs' || sub === 'ssl-dir' || sub === 'dir') {
    await handleCertDir(args.slice(1));
    return;
  }

  if (sub === 'self-signed') {
    const certDir = path.join(PROJECT_ROOT, 'certs');
    fs.mkdirSync(certDir, { recursive: true });
    const crtFile = path.join(certDir, 'techtink.crt');
    const keyFile = path.join(certDir, 'techtink.key');

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
    } catch (e) {
      console.error(`${TAG_ERR} OpenSSL generation failed: ${e.message}`);
    }
    return;
  }

  if (sub === 'letsencrypt') {
    if (!commandExists('certbot')) {
      console.error(`${TAG_ERR} certbot command not found!`);
      console.log(`To install Certbot on Ubuntu/Debian, run:`);
      console.log(`  sudo apt update && sudo apt install -y certbot python3-certbot-nginx\n`);
      return;
    }

    const prompter = createPrompter();
    const domain = (await prompter.ask('Enter your domain name (e.g. techtink.ir): ')).trim();
    if (!domain) {
      console.log(`${TAG_ERR} Domain cannot be empty.`);
      prompter.close();
      return;
    }

    const mode = (await prompter.ask('Use Nginx automatic certbot plugin? [Y/n]: ')).trim().toLowerCase();
    prompter.close();

    const isNginx = !mode || mode.startsWith('y');
    const certbotCmd = isNginx
      ? `sudo certbot --nginx -d ${domain}`
      : `sudo certbot certonly --standalone -d ${domain}`;

    console.log(`${TAG_INFO} Running: ${certbotCmd}`);
    try {
      execSync(certbotCmd, { stdio: 'inherit' });
      console.log(`\n${TAG_OK} Let's Encrypt certificate generated successfully for ${c.cyan(domain)}!`);
    } catch (e) {
      console.error(`${TAG_ERR} Certbot error: ${e.message}`);
    }
    return;
  }

  if (sub === 'test-renew') {
    if (!commandExists('certbot')) {
      console.error(`${TAG_ERR} certbot is not installed.`);
      return;
    }
    console.log(`${TAG_INFO} Testing certificate auto-renewal dry run...`);
    try {
      execSync('sudo certbot renew --dry-run', { stdio: 'inherit' });
      console.log(`\n${TAG_OK} Certificate auto-renewal dry run completed!`);
    } catch (e) {
      console.error(`${TAG_ERR} Auto-renewal test failed: ${e.message}`);
    }
    return;
  }

  if (sub === 'nginx-config') {
    const prompter = createPrompter();
    const domain = (await prompter.ask('Enter server domain or IP [default: techtink.ir]: ')).trim() || 'techtink.ir';
    const sslChoice = (await prompter.ask('Enable HTTPS / SSL block? [Y/n]: ')).trim().toLowerCase();
    const useSSL = !sslChoice || sslChoice.startsWith('y');

    let sslCert = `/etc/letsencrypt/live/${domain}/fullchain.pem`;
    let sslKey = `/etc/letsencrypt/live/${domain}/privkey.pem`;

    if (useSSL) {
      const customCerts = (await prompter.ask(`Use standard Let's Encrypt paths for ${domain}? [Y/n]: `)).trim().toLowerCase();
      if (customCerts && !customCerts.startsWith('y')) {
        sslCert = (await prompter.ask('Enter full path to ssl_certificate: ')).trim();
        sslKey = (await prompter.ask('Enter full path to ssl_certificate_key: ')).trim();
      }
    }
    prompter.close();

    const conf = buildNginxConfig({
      domain,
      port,
      sslCert,
      sslKey,
      useSSL,
    });

    const outFile = path.join(PROJECT_ROOT, 'techtink.nginx.conf');
    fs.writeFileSync(outFile, conf, 'utf8');
    console.log(`\n${TAG_OK} Generated Nginx configuration file: ${c.cyan(outFile)}`);
    console.log(`\n${c.bold('--- Preview techtink.nginx.conf ---')}\n${conf}`);

    console.log(`To activate on your Nginx server:`);
    console.log(`  sudo cp techtink.nginx.conf /etc/nginx/sites-available/techtink`);
    console.log(`  sudo ln -sf /etc/nginx/sites-available/techtink /etc/nginx/sites-enabled/`);
    console.log(`  sudo nginx -t && sudo systemctl reload nginx\n`);
    return;
  }

  // Interactive SSL Menu
  const prompter = createPrompter();
  console.log(`\n${c.bold('--- TechTink SSL & Nginx Reverse Proxy Setup ---')}`);
  console.log(`Current App Port: ${c.cyan(port)}`);
  console.log(`Certbot Installed: ${commandExists('certbot') ? c.green('Yes') : c.yellow('No')}`);
  console.log(`Nginx Installed  : ${commandExists('nginx') ? c.green('Yes') : c.yellow('No')}`);
  console.log('');
  console.log(`[1] Fix Nginx Default Page Collision (Automated One-Click Fix)`);
  console.log(`[2] Configure Nginx with SSL Certificate Directory (Custom SSL / Let's Encrypt dir)`);
  console.log(`[3] Issue Let's Encrypt Free SSL Certificate (Certbot)`);
  console.log(`[4] Generate Self-Signed SSL Certificate (Development / Staging)`);
  console.log(`[5] Generate Production Nginx Reverse Proxy Config (Manual)`);
  console.log(`[6] Test SSL Auto-Renewal (certbot renew --dry-run)`);
  console.log(`[0] Back to main menu`);

  const choice = await prompter.ask('\nSelect an option [0-6]: ');
  prompter.close();

  switch (choice.trim()) {
    case '1':
      await handleNginxFix([]);
      break;
    case '2':
      await handleCertDir([]);
      break;
    case '3':
      await handleSSL(['letsencrypt']);
      break;
    case '4':
      await handleSSL(['self-signed']);
      break;
    case '5':
      await handleSSL(['nginx-config']);
      break;
    case '6':
      await handleSSL(['test-renew']);
      break;
    default:
      break;
  }
}

// ==============================================================================
// 4. BACKEND HEALTH & STATUS
// ==============================================================================
async function handleStatus() {
  console.log(`\n${c.bold('============================================================')}`);
  console.log(`  ${c.bold(c.cyan('TechTink Backend Health & VPS Status Report'))}`);
  console.log(`${c.bold('============================================================')}`);

  const port = getCurrentPort();
  const runtime = detectRuntime();

  console.log(`Operating System : ${c.bold(os.type())} ${os.release()} (${os.arch()})`);
  console.log(`Server Hostname  : ${c.cyan(os.hostname())}`);
  console.log(`Runtime Engine   : ${c.green(runtime.name)} (${runtime.path})`);
  console.log(`Configured Port  : ${c.cyan(port)}`);

  // Port free check
  const isFree = await checkPortFree(port);
  console.log(`Port ${port} Status : ${isFree ? c.yellow('No active listener on this port') : c.green('Listening (Active Process Detected)')}`);

  // HTTP API Health
  process.stdout.write(`HTTP Health Ping : `);
  const ping = await pingServerHealth(port);
  if (ping.ok) {
    console.log(`${c.green('OK 200')} - Latency: ${c.cyan(ping.latency + 'ms')}`);
  } else {
    console.log(`${c.red('FAILED')} (${ping.error || 'Status ' + ping.statusCode})`);
  }

  // Systemd service check
  if (os.platform() === 'linux') {
    try {
      const activeStatus = runCmd('systemctl is-active techtink')?.trim();
      const enabledStatus = runCmd('systemctl is-enabled techtink')?.trim();
      console.log(`Systemd Service  : ${activeStatus === 'active' ? c.green('active (running)') : c.yellow(activeStatus || 'inactive')} | enabled: ${enabledStatus || 'no'}`);
    } catch {
      console.log(`Systemd Service  : ${c.gray('techtink.service not installed or inactive')}`);
    }
  }

  // Database status
  if (fs.existsSync(DB_PATH)) {
    const stats = fs.statSync(DB_PATH);
    const sizeKb = (stats.size / 1024).toFixed(1);
    console.log(`SQLite Database  : ${c.green('OK')} (${DB_PATH}) - Size: ${c.cyan(sizeKb + ' KB')}`);
  } else {
    console.log(`SQLite Database  : ${c.red('Missing')} (${DB_PATH})`);
  }

  // SSL status check
  const certDir = path.join(PROJECT_ROOT, 'certs');
  const hasSelfSigned = fs.existsSync(path.join(certDir, 'techtink.crt'));
  console.log(`SSL Certificates : ${hasSelfSigned ? c.green('Self-signed present in certs/') : c.gray('Standard / Nginx managed')}`);

  console.log(`${c.bold('============================================================')}\n`);
}

// ==============================================================================
// 5. APPLICATION LOG VIEWER
// ==============================================================================
function handleLogs(args) {
  const follow = args.includes('-f') || args.includes('--follow');
  const linesArg = args.find((a, i) => args[i - 1] === '-n') || '50';

  if (os.platform() === 'linux' && commandExists('journalctl')) {
    console.log(`${TAG_INFO} Viewing systemd journal logs for ${c.cyan('techtink.service')}...`);
    const fFlag = follow ? '-f' : '';
    const cmd = `journalctl -u techtink -n ${linesArg} ${fFlag} --no-pager`;
    try {
      execSync(cmd, { stdio: 'inherit' });
    } catch {}
    return;
  }

  const logFile = path.join(PROJECT_ROOT, 'techtink.log');
  if (fs.existsSync(logFile)) {
    console.log(`${TAG_INFO} Viewing file log: ${logFile}`);
    try {
      execSync(`tail -n ${linesArg} ${follow ? '-f' : ''} "${logFile}"`, { stdio: 'inherit' });
    } catch {}
    return;
  }

  console.log(`${TAG_WARN} No systemd journalctl or techtink.log found.`);
  console.log(`If running with Bun/Node directly in terminal, logs appear in that session.`);
}

// ==============================================================================
// 6. DATABASE MAINTENANCE
// ==============================================================================
async function handleDatabase(args) {
  const sub = args[0] || 'menu';

  if (!fs.existsSync(DB_PATH)) {
    console.error(`${TAG_ERR} Database file does not exist at ${DB_PATH}`);
    return;
  }

  // Load SQLite driver
  let dbInstance;
  try {
    if (typeof globalThis.Bun !== 'undefined') {
      const { Database } = await import('bun:sqlite');
      dbInstance = new Database(DB_PATH);
    } else {
      const { DatabaseSync } = await import('node:sqlite');
      dbInstance = new DatabaseSync(DB_PATH);
    }
  } catch (err) {
    console.error(`${TAG_ERR} Failed to open SQLite database: ${err.message}`);
    return;
  }

  if (sub === 'backup') {
    const backupDir = path.join(DATA_DIR, 'backups');
    fs.mkdirSync(backupDir, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `techtink_backup_${timestamp}.db`);

    try {
      fs.copyFileSync(DB_PATH, backupFile);
      const sizeMb = (fs.statSync(backupFile).size / (1024 * 1024)).toFixed(2);
      console.log(`\n${TAG_OK} Database backup created successfully!`);
      console.log(`  Path: ${c.cyan(backupFile)}`);
      console.log(`  Size: ${c.cyan(sizeMb + ' MB')}\n`);
    } catch (e) {
      console.error(`${TAG_ERR} Backup failed: ${e.message}`);
    }
    return;
  }

  if (sub === 'vacuum') {
    console.log(`${TAG_INFO} Running SQLite VACUUM and PRAGMA optimize...`);
    try {
      dbInstance.exec('VACUUM;');
      dbInstance.exec('PRAGMA optimize;');
      console.log(`${TAG_OK} Database defragmented, vacuumed, and optimized!\n`);
    } catch (e) {
      console.error(`${TAG_ERR} Vacuum failed: ${e.message}`);
    }
    return;
  }

  if (sub === 'check') {
    console.log(`${TAG_INFO} Checking SQLite structural integrity (PRAGMA integrity_check)...`);
    try {
      let result;
      if (typeof dbInstance.prepare === 'function') {
        result = dbInstance.prepare('PRAGMA integrity_check;').all();
      }
      console.log(`${TAG_OK} Integrity check result:`);
      console.dir(result, { depth: null });
      console.log('');
    } catch (e) {
      console.error(`${TAG_ERR} Integrity check failed: ${e.message}`);
    }
    return;
  }

  if (sub === 'info') {
    console.log(`\n${c.bold('--- SQLite Database Details ---')}`);
    const stats = fs.statSync(DB_PATH);
    console.log(`File Path : ${c.cyan(DB_PATH)}`);
    console.log(`File Size : ${c.cyan((stats.size / 1024).toFixed(1) + ' KB')}`);
    console.log(`Modified  : ${stats.mtime.toLocaleString()}`);

    try {
      const tables = dbInstance.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';").all();
      console.log(`\nTables (${tables.length}):`);
      for (const t of tables) {
        const countRow = dbInstance.prepare(`SELECT COUNT(*) as count FROM "${t.name}";`).get();
        console.log(`  - ${c.bold(t.name.padEnd(20))} : ${c.cyan(countRow.count)} records`);
      }
      console.log('');
    } catch (e) {
      console.log(`${TAG_WARN} Could not list tables: ${e.message}`);
    }
    return;
  }

  // Interactive DB Menu
  const prompter = createPrompter();
  console.log(`\n${c.bold('--- TechTink Database Maintenance ---')}`);
  console.log(`[1] Create Instant Database Backup (data/backups/)`);
  console.log(`[2] Run VACUUM & Optimize (Defragment & reclaim disk space)`);
  console.log(`[3] Perform Integrity Check (PRAGMA integrity_check)`);
  console.log(`[4] View Database Details & Record Counts`);
  console.log(`[0] Back to main menu`);

  const choice = await prompter.ask('\nSelect an option [0-4]: ');
  prompter.close();

  switch (choice.trim()) {
    case '1':
      await handleDatabase(['backup']);
      break;
    case '2':
      await handleDatabase(['vacuum']);
      break;
    case '3':
      await handleDatabase(['check']);
      break;
    case '4':
      await handleDatabase(['info']);
      break;
    default:
      break;
  }
}

// ==============================================================================
// 7. ADMINISTRATOR USER MANAGEMENT
// ==============================================================================
async function handleAdmin(args) {
  const sub = args[0] || 'menu';

  if (sub === 'create') {
    const adminScript = path.join(PROJECT_ROOT, 'scripts', 'create-admin.js');
    console.log(`${TAG_INFO} Launching TechTink Administrator Creation Tool...\n`);
    const runtime = detectRuntime();
    spawnSync(runtime.path, [adminScript], { stdio: 'inherit' });
    return;
  }

  if (sub === 'list') {
    if (!fs.existsSync(DB_PATH)) {
      console.error(`${TAG_ERR} Database file not found.`);
      return;
    }
    try {
      let dbInstance;
      if (typeof globalThis.Bun !== 'undefined') {
        const { Database } = await import('bun:sqlite');
        dbInstance = new Database(DB_PATH);
      } else {
        const { DatabaseSync } = await import('node:sqlite');
        dbInstance = new DatabaseSync(DB_PATH);
      }

      const rows = dbInstance.prepare("SELECT id, name, email, mobile, role, created_at FROM users WHERE role = 'admin';").all();
      console.log(`\n${c.bold(`Configured Administrator Accounts (${rows.length}):`)}`);
      if (rows.length === 0) {
        console.log(`  ${c.yellow('No administrator accounts found.')}`);
      } else {
        for (const u of rows) {
          console.log(`  - [ID #${u.id}] ${c.bold(u.name || 'Admin')} | Email: ${c.cyan(u.email || '—')} | Mobile: ${c.cyan(u.mobile || '—')}`);
        }
      }
      console.log('');
    } catch (e) {
      console.error(`${TAG_ERR} Failed to list admin accounts: ${e.message}`);
    }
    return;
  }

  // Interactive Admin Menu
  const prompter = createPrompter();
  console.log(`\n${c.bold('--- TechTink Administrator Management ---')}`);
  console.log(`[1] List All Administrator Accounts`);
  console.log(`[2] Create / Update Administrator (Interactive Wizard)`);
  console.log(`[0] Back to main menu`);

  const choice = await prompter.ask('\nSelect an option [0-2]: ');
  prompter.close();

  switch (choice.trim()) {
    case '1':
      await handleAdmin(['list']);
      break;
    case '2':
      await handleAdmin(['create']);
      break;
    default:
      break;
  }
}

// ==============================================================================
// 8. ENVIRONMENT (.ENV) EDITOR
// ==============================================================================
async function handleEnv(args) {
  const sub = args[0] || 'show';

  if (sub === 'show') {
    const env = readEnv();
    console.log(`\n${c.bold(`--- Active .env Variables (${ENV_PATH}) ---`)}`);
    const keys = Object.keys(env);
    if (keys.length === 0) {
      console.log(`${c.yellow('No .env file found or file is empty.')}`);
    } else {
      for (const k of keys) {
        const isSecret = k.toLowerCase().includes('pass') || k.toLowerCase().includes('secret') || k.toLowerCase().includes('key');
        const displayVal = isSecret ? '********' : env[k];
        console.log(`  ${c.bold(k.padEnd(20))} = ${c.cyan(displayVal)}`);
      }
    }
    console.log('');
    return;
  }

  if (sub === 'set') {
    const key = args[1];
    const val = args[2];
    if (!key || val === undefined) {
      console.error(`${TAG_ERR} Usage: manage.js env set <KEY> <VALUE>`);
      return;
    }
    setEnvVar(key, val);
    console.log(`${TAG_OK} Set ${c.bold(key)}=${c.cyan(val)} in ${ENV_PATH}\n`);
    return;
  }
}

// ==============================================================================
// 9. QUICK DEPLOYMENT / RESTART RUNNER
// ==============================================================================
function handleDeploy() {
  const deployScript = path.join(PROJECT_ROOT, 'deploy.sh');
  if (fs.existsSync(deployScript)) {
    console.log(`${TAG_INFO} Launching deploy.sh script...\n`);
    try {
      execSync(`bash "${deployScript}"`, { stdio: 'inherit' });
    } catch (e) {
      console.error(`${TAG_ERR} Deploy failed: ${e.message}`);
    }
  } else {
    console.log(`${TAG_WARN} deploy.sh not found at ${deployScript}`);
  }
}

// ==============================================================================
// MAIN INTERACTIVE MENU (TUI)
// ==============================================================================
async function startInteractiveMenu() {
  while (true) {
    const port = getCurrentPort();
    const runtime = detectRuntime();
    const isFree = await checkPortFree(port);

    console.log(`\n${c.bold('============================================================')}`);
    console.log(`  ${c.bold(c.cyan('TechTink VPS & Backend Management Console'))}`);
    console.log(`${c.bold('============================================================')}`);
    console.log(`  Runtime : ${c.green(runtime.name)} (${runtime.path})`);
    console.log(`  Port    : ${c.cyan(port)} (${isFree ? c.yellow('Idle / Free') : c.green('Listening / In Use')})`);
    console.log(`  Root    : ${c.gray(PROJECT_ROOT)}`);
    console.log(`------------------------------------------------------------`);
    console.log(`  [1] Port Configuration (View / Change / Check Availability)`);
    console.log(`  [2] Systemd Service (Generate / Install / Start / Restart / Status)`);
    console.log(`  [3] Nginx Reverse Proxy & SSL (Fix default page / Reverse Proxy / SSL certs)`);
    console.log(`  [4] Backend Health & Status (Ping / Latency / Diagnostics)`);
    console.log(`  [5] Application Logs (systemd journalctl / file logs)`);
    console.log(`  [6] Database Maintenance (Backup / Vacuum / Integrity Check)`);
    console.log(`  [7] Administrator Accounts (Create Admin / List Admins)`);
    console.log(`  [8] Environment Variables (.env viewer & editor)`);
    console.log(`  [9] Quick Deployment & Pull (deploy.sh)`);
    console.log(`  [0] Exit`);
    console.log(`------------------------------------------------------------`);

    const prompter = createPrompter();
    const choice = (await prompter.ask('Enter your selection [0-9]: ')).trim();
    prompter.close();

    switch (choice) {
      case '1':
        await handlePort([]);
        break;
      case '2':
        await handleSystemd([]);
        break;
      case '3':
        await handleSSL([]);
        break;
      case '4':
        await handleStatus();
        break;
      case '5':
        handleLogs([]);
        break;
      case '6':
        await handleDatabase([]);
        break;
      case '7':
        await handleAdmin([]);
        break;
      case '8':
        await handleEnv(['show']);
        break;
      case '9':
        handleDeploy();
        break;
      case '0':
      case 'q':
      case 'exit':
        console.log(`\nGoodbye!\n`);
        process.exit(0);
      default:
        console.log(`\n${TAG_WARN} Invalid option "${choice}". Please choose 0 to 9.`);
        break;
    }
  }
}

// ==============================================================================
// CLI ARGUMENT PARSER / DISPATCHER
// ==============================================================================
function printHelp() {
  console.log(`
============================================================
  TechTink VPS & Backend Management CLI Tool
============================================================

Usage:
  node scripts/manage.js [command] [options]
  bun scripts/manage.js [command] [options]

Commands:
  port [number]             Check port availability or change active port in .env
  systemd [subcommand]      Manage systemd service:
                              generate  : Create techtink.service unit file
                              install   : Install to /etc/systemd/system/ and enable
                              start     : Start techtink systemd service
                              stop      : Stop techtink systemd service
                              restart   : Restart techtink systemd service
                              status    : View systemctl status
  ssl [subcommand]          SSL & Reverse proxy management:
                              cert-dir <dir> [domain] : Configure Nginx using cert files in directory
                              letsencrypt             : Run certbot for domain
                              self-signed             : Generate 2048-bit dev certificate
                              nginx-config            : Generate production Nginx config
                              test-renew              : Test certbot auto-renewal dry run
  ssl-dir <dir> [domain]    Shortcut: configure Nginx with certificate directory
  nginx [fix|cert-dir|status|reload] Nginx reverse proxy management & default site fix
  status                    Show comprehensive backend health report & diagnostics
  logs [-n <lines>] [-f]    Inspect live service logs (journalctl or file)
  db [subcommand]           SQLite database maintenance:
                              backup    : Create timestamped backup file
                              vacuum    : Defragment & optimize database
                              check     : Run PRAGMA integrity_check
                              info      : View tables and record counts
  admin [list|create]       List admin users or launch admin creation wizard
  env [show|set <K> <V>]    Inspect or modify .env variables
  deploy                    Run deploy.sh script
  help, --help, -h          Show this help message

Running with NO arguments starts the interactive console menu (TUI).

Examples:
  node scripts/manage.js ssl cert-dir /etc/letsencrypt/live/techtink.ir
  node scripts/manage.js ssl-dir ./certs techtink.ir
  node scripts/manage.js nginx fix
  node scripts/manage.js port 8080
  node scripts/manage.js systemd generate
  node scripts/manage.js status
  node scripts/manage.js db backup
  node scripts/manage.js
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
    case 'port':
      await handlePort(subArgs);
      break;
    case 'systemd':
    case 'systemctl':
      await handleSystemd(subArgs);
      break;
    case 'nginx':
      await handleNginx(subArgs);
      break;
    case 'ssl-dir':
    case 'cert-dir':
      await handleCertDir(subArgs);
      break;
    case 'ssl':
    case 'cert':
      await handleSSL(subArgs);
      break;
    case 'status':
    case 'health':
      await handleStatus();
      break;
    case 'logs':
    case 'log':
      handleLogs(subArgs);
      break;
    case 'db':
    case 'database':
      await handleDatabase(subArgs);
      break;
    case 'admin':
      await handleAdmin(subArgs);
      break;
    case 'env':
      await handleEnv(subArgs);
      break;
    case 'deploy':
      handleDeploy();
      break;
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
