// TechTink API server. Runs on Node.js (>= 22.5, uses node:sqlite) or Bun (uses bun:sqlite).
//   node server.js   |   bun server.js
import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { initDb } from './server/db.js';
import { attachUser, ensureAdmin } from './server/auth.js';
import publicRoutes, { generateSitemapXml, generateRobotsTxt } from './server/routes/public.js';
import accountRoutes from './server/routes/account.js';
import paymentRoutes from './server/routes/payment.js';
import adminRoutes from './server/routes/admin.js';
import dbToolRoutes from './server/routes/dbtools.js';
import torobRoutes from './server/routes/torob.js';

// Auto-load .env configuration if present
const envPath = path.resolve('.env');
if (fs.existsSync(envPath)) {
  try {
    const raw = fs.readFileSync(envPath, 'utf8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
        if (process.env[key] === undefined) {
          process.env[key] = val;
        }
      }
    }
  } catch {}
}

await initDb();
ensureAdmin();

const app = express();
app.disable('x-powered-by');
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(attachUser);

app.use('/api', publicRoutes);
app.use('/api', accountRoutes);
app.use('/api', paymentRoutes);
app.use('/api', torobRoutes);
app.use('/api/admin/db', dbToolRoutes);
app.use('/api/admin', adminRoutes);

// Root Search Engine Endpoints (Googlebot, Bing, Torob crawlers)
app.get('/sitemap.xml', (req, res) => {
  res.header('Content-Type', 'application/xml; charset=utf-8');
  const host = req.get('host');
  const proto = req.get('x-forwarded-proto') || req.protocol || 'https';
  const dynamicBase = host ? `${proto}://${host}` : null;
  res.send(generateSitemapXml(dynamicBase));
});
app.get('/robots.txt', (req, res) => {
  res.header('Content-Type', 'text/plain; charset=utf-8');
  const host = req.get('host');
  const proto = req.get('x-forwarded-proto') || req.protocol || 'https';
  const dynamicBase = host ? `${proto}://${host}` : null;
  res.send(generateRobotsTxt(dynamicBase));
});

// eNamad (Electronic Trust Symbol) Verification Endpoint
app.get('/24125751.txt', (_req, res) => {
  res.header('Content-Type', 'text/plain; charset=utf-8');
  res.send('');
});

app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

// Production: serve the built SPA and fall back to index.html for client-side routes (e.g. /product/:slug).
const dist = path.resolve('dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'خطای داخلی سرور' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`TechTink running on http://localhost:${PORT}`));
