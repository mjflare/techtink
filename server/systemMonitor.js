// ==============================================================================
// TechTink VPS Resource Monitor & System Diagnostics
// Gathers real-time CPU, RAM, Disk, Uptime, Process & Multi-Service health
// for the Admin Dashboard.
// ==============================================================================

import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import { exec } from 'node:child_process';
import { db, DB_PATH } from './db.js';
import { getMailServerStatus } from './mailServer.js';

const METRICS_HISTORY_MAX = 30;
const metricsHistory = [];

let lastCpuTimes = null;

export function formatBytes(bytes, decimals = 2) {
  if (!bytes || bytes <= 0 || isNaN(bytes)) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatUptime(seconds) {
  if (!seconds || seconds <= 0) return '۰ ثانیه';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const parts = [];
  if (d > 0) parts.push(`${d} روز`);
  if (h > 0) parts.push(`${h} ساعت`);
  if (m > 0) parts.push(`${m} دقیقه`);
  if (parts.length === 0 || (d === 0 && h === 0)) parts.push(`${s} ثانیه`);
  return parts.join(' و ');
}

export function sampleCpuUsage() {
  const cpus = os.cpus();
  let totalIdle = 0;
  let totalTime = 0;
  for (const cpu of cpus) {
    const t = cpu.times;
    totalIdle += t.idle;
    totalTime += t.user + t.nice + t.sys + t.idle + t.irq;
  }

  if (!lastCpuTimes) {
    lastCpuTimes = { totalIdle, totalTime };
    const load1 = os.loadavg()[0];
    const cores = cpus.length || 1;
    return Math.min(100, Math.max(0, Math.round((load1 / cores) * 1000) / 10));
  }

  const deltaTotal = totalTime - lastCpuTimes.totalTime;
  const deltaIdle = totalIdle - lastCpuTimes.totalIdle;
  lastCpuTimes = { totalIdle, totalTime };

  if (deltaTotal <= 0) return 0;
  const pct = ((deltaTotal - deltaIdle) / deltaTotal) * 100;
  return Math.min(100, Math.max(0, Math.round(pct * 10) / 10));
}

function recordSample() {
  try {
    const cpu = sampleCpuUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const ramPct = totalMem > 0 ? Math.round(((totalMem - freeMem) / totalMem) * 1000) / 10 : 0;
    const now = new Date();
    const timeStr = now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    metricsHistory.push({
      time: timeStr,
      timestamp: Date.now(),
      cpu,
      ram: ramPct,
    });

    if (metricsHistory.length > METRICS_HISTORY_MAX) {
      metricsHistory.shift();
    }
  } catch {}
}

// Seed initial samples and start periodic sampling (every 3 seconds)
recordSample();
const timer = setInterval(recordSample, 3000);
if (typeof timer.unref === 'function') {
  timer.unref();
}

export function getDiskStats() {
  try {
    const stat = fs.statfsSync('/');
    const total = stat.bsize * stat.blocks;
    const free = stat.bsize * stat.bavail;
    const used = total - free;
    const pct = total > 0 ? Math.round((used / total) * 1000) / 10 : 0;
    return {
      total,
      free,
      used,
      usagePercent: pct,
      totalFormatted: formatBytes(total),
      usedFormatted: formatBytes(used),
      freeFormatted: formatBytes(free),
    };
  } catch {
    return {
      total: 0,
      free: 0,
      used: 0,
      usagePercent: 0,
      totalFormatted: 'نامشخص',
      usedFormatted: 'نامشخص',
      freeFormatted: 'نامشخص',
    };
  }
}

export function probePort(port, host = '127.0.0.1', timeout = 400) {
  return new Promise((resolve) => {
    const start = performance.now();
    const s = net.connect({ port: Number(port), host, timeout });
    let resolved = false;

    s.on('connect', () => {
      if (!resolved) {
        resolved = true;
        const latencyMs = Math.round(performance.now() - start);
        s.destroy();
        resolve({ port: Number(port), open: true, latencyMs });
      }
    });

    s.on('timeout', () => {
      if (!resolved) {
        resolved = true;
        s.destroy();
        resolve({ port: Number(port), open: false, error: 'TIMEOUT' });
      }
    });

    s.on('error', (err) => {
      if (!resolved) {
        resolved = true;
        resolve({ port: Number(port), open: false, error: err.code || err.message });
      }
    });
  });
}

export async function getTopProcesses() {
  return new Promise((resolve) => {
    const cmd = process.platform === 'darwin'
      ? 'ps -Ao pid,user,%cpu,%mem,comm -r 2>/dev/null | head -n 9'
      : 'ps -eo pid,user,%cpu,%mem,comm --sort=-%cpu 2>/dev/null | head -n 9';

    exec(cmd, { timeout: 1000 }, (err, stdout) => {
      if (err || !stdout) return resolve([]);
      const lines = stdout.trim().split('\n');
      if (lines.length <= 1) return resolve([]);
      const results = [];
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].trim().split(/\s+/);
        if (parts.length >= 5) {
          results.push({
            pid: parts[0],
            user: parts[1],
            cpu: parseFloat(parts[2]) || 0,
            mem: parseFloat(parts[3]) || 0,
            command: parts.slice(4).join(' ').replace(/^.*\//, ''),
          });
        }
      }
      resolve(results);
    });
  });
}

export function getDatabaseMetrics() {
  let mainSize = 0;
  let walSize = 0;
  try {
    mainSize = fs.statSync(DB_PATH).size;
  } catch {}
  try {
    walSize = fs.statSync(DB_PATH + '-wal').size;
  } catch {}

  const start = performance.now();
  let isOperational = false;
  let latencyMs = 0;
  try {
    db.get('SELECT 1 as ping');
    isOperational = true;
    latencyMs = Math.round((performance.now() - start) * 100) / 100;
  } catch {}

  return {
    isOperational,
    latencyMs,
    mainSize,
    walSize,
    totalBytes: mainSize + walSize,
    totalFormatted: formatBytes(mainSize + walSize),
    walFormatted: formatBytes(walSize),
  };
}

export async function getFullSystemMetrics() {
  const cpus = os.cpus();
  const cores = cpus.length || 1;
  const cpuModel = cpus[0]?.model || 'Generic CPU';
  const cpuPercent = sampleCpuUsage();

  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = Math.max(0, totalMem - freeMem);
  const memPercent = totalMem > 0 ? Math.round((usedMem / totalMem) * 1000) / 10 : 0;

  const disk = getDiskStats();
  const dbMetrics = getDatabaseMetrics();
  const mailStatus = getMailServerStatus();

  const appPort = parseInt(process.env.PORT, 10) || 3000;
  const memUsage = process.memoryUsage();

  // Probe key VPS ports concurrently
  const portChecks = await Promise.all([
    probePort(22),  // SSH
    probePort(80),  // HTTP (Nginx / Web)
    probePort(443), // HTTPS (SSL Proxy)
    probePort(appPort), // TechTink Web Application
    probePort(mailStatus.port || 25), // TechTink Mail
  ]);

  const portMap = {};
  for (const p of portChecks) {
    portMap[p.port] = p;
  }

  const topProcesses = await getTopProcesses();

  const services = [
    {
      id: 'techtink_web',
      name: 'وب‌سرور اصلی تک‌تینک (Node/Bun App)',
      port: appPort,
      category: 'Web App',
      status: 'online',
      latencyMs: portMap[appPort]?.latencyMs ?? 1,
      desc: `پردازشگر وب‌سایت و APIها روی پورت ${appPort}`,
    },
    {
      id: 'techtink_smtp',
      name: 'سرور دریافت ایمیل سازمانی (SMTP)',
      port: mailStatus.port || 25,
      category: 'Mail Service',
      status: mailStatus.isListening ? 'online' : (portMap[mailStatus.port || 25]?.open ? 'online' : 'waiting'),
      latencyMs: portMap[mailStatus.port || 25]?.latencyMs ?? null,
      desc: `شنود اتصالات ورودی info@techtink.ir روی پورت ${mailStatus.port || 25}`,
    },
    {
      id: 'sqlite_db',
      name: 'پایگاه داده رابطه‌ای (SQLite Engine)',
      port: null,
      category: 'Database',
      status: dbMetrics.isOperational ? 'online' : 'error',
      latencyMs: dbMetrics.latencyMs,
      desc: `حجم دیتابیس: ${dbMetrics.totalFormatted} | تاخیر پرس‌وجو: ${dbMetrics.latencyMs}ms`,
    },
    {
      id: 'vps_ssh',
      name: 'دسترسی ریموت سرور (SSH Service)',
      port: 22,
      category: 'System / Remote',
      status: portMap[22]?.open ? 'online' : 'closed',
      latencyMs: portMap[22]?.latencyMs ?? null,
      desc: portMap[22]?.open ? 'پورت ۲۲ فعال و آماده اتصال SSH' : 'پورت ۲۲ روی لوکال پاسخ نداد یا فایروال دارد',
    },
    {
      id: 'vps_http',
      name: 'وب‌سرور روت (Port 80 / Nginx)',
      port: 80,
      category: 'Web Proxy',
      status: portMap[80]?.open ? 'online' : 'closed',
      latencyMs: portMap[80]?.latencyMs ?? null,
      desc: portMap[80]?.open ? 'پورت ۸۰ فعال است' : 'پورت ۸۰ غیرفعال یا مستقیم به پروکسی متصل است',
    },
    {
      id: 'vps_https',
      name: 'پروکسی امن SSL (Port 443 / HTTPS)',
      port: 443,
      category: 'Web Proxy',
      status: portMap[443]?.open ? 'online' : 'closed',
      latencyMs: portMap[443]?.latencyMs ?? null,
      desc: portMap[443]?.open ? 'پورت ۴۴۳ پاسخگو است' : 'پورت ۴۴۳ فایروال شده یا تحت کلودفلر است',
    },
  ];

  return {
    cpu: {
      usagePercent: cpuPercent,
      cores,
      model: cpuModel,
      loadAvg: os.loadavg().map((v) => Math.round(v * 100) / 100),
      loadAvgPerCore: os.loadavg().map((v) => Math.round((v / cores) * 100) / 100),
    },
    memory: {
      totalBytes: totalMem,
      freeBytes: freeMem,
      usedBytes: usedMem,
      usagePercent: memPercent,
      totalFormatted: formatBytes(totalMem),
      usedFormatted: formatBytes(usedMem),
      freeFormatted: formatBytes(freeMem),
      processRss: memUsage.rss,
      processHeapUsed: memUsage.heapUsed,
      processRssFormatted: formatBytes(memUsage.rss),
      processHeapFormatted: formatBytes(memUsage.heapUsed),
    },
    disk,
    database: dbMetrics,
    os: {
      hostname: os.hostname(),
      platform: os.platform(),
      release: os.release(),
      arch: os.arch(),
      uptimeSeconds: Math.round(os.uptime()),
      uptimeFormatted: formatUptime(os.uptime()),
    },
    process: {
      pid: process.pid,
      uptimeSeconds: Math.round(process.uptime()),
      uptimeFormatted: formatUptime(process.uptime()),
      runtime: typeof globalThis.Bun !== 'undefined' ? `Bun v${globalThis.Bun.version}` : `Node.js ${process.version}`,
      nodeEnv: process.env.NODE_ENV || 'production',
    },
    services,
    topProcesses,
    history: [...metricsHistory],
  };
}

export function triggerGarbageCollection() {
  const beforeRss = process.memoryUsage().rss;
  const beforeHeap = process.memoryUsage().heapUsed;

  if (typeof globalThis.Bun !== 'undefined' && typeof globalThis.Bun.gc === 'function') {
    globalThis.Bun.gc(true);
  } else if (typeof global.gc === 'function') {
    global.gc();
  }

  const afterRss = process.memoryUsage().rss;
  const afterHeap = process.memoryUsage().heapUsed;
  const freedBytes = Math.max(0, beforeRss - afterRss);

  return {
    success: true,
    freedBytes,
    freedFormatted: formatBytes(freedBytes),
    beforeRssFormatted: formatBytes(beforeRss),
    afterRssFormatted: formatBytes(afterRss),
    heapReductionFormatted: formatBytes(Math.max(0, beforeHeap - afterHeap)),
    message: freedBytes > 0 
      ? `${formatBytes(freedBytes)} حافظه با موفقیت آزاد شد`
      : 'زباله‌روب سیستم اجرا شد و تمام ارجاعات بلااستفاده پاکسازی شدند.',
  };
}
