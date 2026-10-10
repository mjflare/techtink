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

// Launch Inbound SMTP Mail Receiver (port 25 / 2525) for info@techtink.ir
import { startSmtpServer, saveIncomingEmail, parseRawEmail, extractVerificationCode } from './server/mailServer.js';
startSmtpServer();

const app = express();
app.disable('x-powered-by');
app.use(cors());

// Cloudflare Email Routing / Inbound Webhook (receives emails via Cloudflare on root domain)
app.post(
  '/api/webhook/email',
  express.json({ limit: '15mb' }),
  express.text({ limit: '15mb', type: ['text/*', 'message/*'] }),
  (req, res) => {
    try {
      const body = req.body || {};
      let raw = '';
      let parsedFrom = '';
      let parsedTo = 'info@techtink.ir';
      let parsedSubject = '';
      let parsedBodyText = '';
      let parsedBodyHtml = '';
      let code = null;

      if (typeof body === 'string') {
        raw = body;
      } else if (typeof body === 'object') {
        parsedFrom = body.from || '';
        parsedTo = body.to || 'info@techtink.ir';
        parsedSubject = body.subject || '';
        raw = body.raw || '';
        parsedBodyText = body.text || '';
        parsedBodyHtml = body.html || '';
      }

      if (raw) {
        const parsed = parseRawEmail(raw);
        if (!parsedFrom) parsedFrom = parsed.from;
        if (!parsedTo) parsedTo = parsed.to;
        if (!parsedSubject) parsedSubject = parsed.subject;
        parsedBodyText = parsed.bodyText || parsedBodyText;
        parsedBodyHtml = parsed.bodyHtml || parsedBodyHtml;
        code = parsed.verificationCode;
      }

      if (!code) {
        code = extractVerificationCode(`${parsedSubject}\n${parsedBodyText}\n${parsedBodyHtml}`);
      }

      const emailId = saveIncomingEmail({
        from: parsedFrom,
        to: parsedTo,
        subject: parsedSubject,
        bodyText: parsedBodyText,
        bodyHtml: parsedBodyHtml,
        rawMessage: raw || `From: ${parsedFrom}\nTo: ${parsedTo}\nSubject: ${parsedSubject}\n\n${parsedBodyText}`,
        verificationCode: code
      });

      console.log(`[EmailWebhook] ✓ Email received via Cloudflare/Webhook! ID: ${emailId} | From: ${parsedFrom} | Subject: "${parsedSubject}" ${code ? `| Code: [${code}]` : ''}`);
      res.json({ success: true, emailId, verificationCode: code });
    } catch (err) {
      console.error('[EmailWebhook] Error processing incoming webhook email:', err);
      res.status(500).json({ error: 'Failed to process email webhook' });
    }
  }
);
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
