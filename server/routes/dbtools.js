// Database management tools for admins: browse, export, backup, restore, maintenance.
import { Router, raw as rawBody } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { db, DATA_DIR, DB_PATH } from '../db.js';
import { requireAdmin } from '../auth.js';

const r = Router();
r.use(requireAdmin);

const BACKUP_DIR = path.join(DATA_DIR, 'backups');
fs.mkdirSync(BACKUP_DIR, { recursive: true });

const tables = () => db.all("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name").map((t) => t.name);
const SECRET_COLUMNS = new Set(['password_hash']);
const redact = (table, rows) =>
  rows.map((row) => {
    const out = { ...row };
    for (const c of SECRET_COLUMNS) if (c in out) out[c] = '••••••';
    if (table === 'settings' && out.key === 'token_secret') out.value = '••••••';
    return out;
  });
const checkTable = (name) => (tables().includes(name) ? name : null);

r.get('/tables', (_req, res) => {
  const size = fs.statSync(DB_PATH).size;
  res.json({ size, tables: tables().map((name) => ({ name, rows: db.get(`SELECT COUNT(*) AS c FROM "${name}"`).c, columns: db.all(`PRAGMA table_info("${name}")`).map((c) => ({ name: c.name, type: c.type, pk: !!c.pk })) })) });
});

r.get('/tables/:name', (req, res) => {
  const t = checkTable(req.params.name);
  if (!t) return res.status(404).json({ error: 'جدول یافت نشد.' });
  const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 50));
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const total = db.get(`SELECT COUNT(*) AS c FROM "${t}"`).c;
  const rows = db.all(`SELECT rowid AS _rowid, * FROM "${t}" ORDER BY rowid DESC LIMIT ? OFFSET ?`, limit, (page - 1) * limit);
  res.json({ total, page, pages: Math.max(1, Math.ceil(total / limit)), rows: redact(t, rows) });
});

r.delete('/tables/:name/:rowid', (req, res) => {
  const t = checkTable(req.params.name);
  if (!t || t === 'settings') return res.status(400).json({ error: 'حذف از این جدول مجاز نیست.' });
  db.run(`DELETE FROM "${t}" WHERE rowid = ?`, req.params.rowid);
  res.json({ success: true });
});

r.get('/export/:name', (req, res) => {
  const t = checkTable(req.params.name);
  if (!t) return res.status(404).json({ error: 'جدول یافت نشد.' });
  const rows = redact(t, db.all(`SELECT * FROM "${t}"`));
  if (req.query.format === 'csv') {
    const cols = rows.length ? Object.keys(rows[0]) : db.all(`PRAGMA table_info("${t}")`).map((c) => c.name);
    const esc = (v) => (v === null || v === undefined ? '' : `"${String(v).replace(/"/g, '""')}"`);
    const csv = '\uFEFF' + [cols.join(','), ...rows.map((row) => cols.map((c) => esc(row[c])).join(','))].join('\r\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${t}.csv"`);
    return res.send(csv);
  }
  res.setHeader('Content-Disposition', `attachment; filename="${t}.json"`);
  res.json(rows);
});

// Read-only query console (single SELECT statement only).
r.post('/query', (req, res) => {
  const sql = String(req.body?.sql || '').trim().replace(/;+\s*$/, '');
  if (!/^(select|with|pragma\s+table_info)\b/i.test(sql) || sql.includes(';')) {
    return res.status(400).json({ error: 'فقط یک دستور SELECT مجاز است.' });
  }
  if (/\b(insert|update|delete|drop|alter|create|attach|replace|vacuum)\b/i.test(sql)) return res.status(400).json({ error: 'دستورات تغییر داده مجاز نیستند.' });
  try {
    const rows = db.all(sql).slice(0, 500);
    res.json({ rows: rows.map((row) => { const o = { ...row }; if ('password_hash' in o) o.password_hash = '••••••'; return o; }) });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ---- Backups ----
const stamp = () => new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
// ---- Database Info & Diagnostics ----
r.get('/info', (_req, res) => {
  try {
    const stat = fs.statSync(DB_PATH);
    const size = stat.size;
    const sizeFormatted = size > 1024 * 1024 
      ? (size / (1024 * 1024)).toFixed(2) + ' MB' 
      : (size / 1024).toFixed(1) + ' KB';
    const backupList = listBackups();
    const allTables = tables();
    let totalRecords = 0;
    try {
      for (const t of allTables) {
        totalRecords += db.get(`SELECT COUNT(*) as c FROM "${t}"`).c;
      }
    } catch {}
    res.json({
      dbPath: DB_PATH,
      dataDir: DATA_DIR,
      size,
      sizeFormatted,
      driver: typeof globalThis.Bun !== 'undefined' ? 'bun:sqlite' : 'node:sqlite',
      tablesCount: allTables.length,
      totalRecords,
      backupsCount: backupList.length,
      walActive: fs.existsSync(DB_PATH + '-wal'),
      lastModified: stat.mtime
    });
  } catch (err) {
    res.status(500).json({ error: 'خطا در دریافت اطلاعات دیتابیس: ' + err.message });
  }
});

// ---- Backups ----
const listBackups = () =>
  fs.readdirSync(BACKUP_DIR).filter((f) => f.endsWith('.db')).map((f) => ({ name: f, size: fs.statSync(path.join(BACKUP_DIR, f)).size, createdAt: fs.statSync(path.join(BACKUP_DIR, f)).mtime })).sort((a, b) => b.createdAt - a.createdAt);
const safeBackup = (name) => (/^[\w.-]+\.db$/.test(name) && fs.existsSync(path.join(BACKUP_DIR, name)) ? path.join(BACKUP_DIR, name) : null);

function createBackup() {
  const file = path.join(BACKUP_DIR, `techtink-${stamp()}.db`);
  db.exec(`VACUUM INTO '${file.replace(/'/g, "''")}'`);
  return path.basename(file);
}

// 1-Click Export of the current SQLite DB file
r.get('/download', (req, res) => {
  try {
    db.exec('PRAGMA wal_checkpoint(FULL);');
  } catch {}
  const filename = `techtink_${stamp()}.db`;
  const tmpSnapshot = path.join(BACKUP_DIR, filename);
  try {
    db.exec(`VACUUM INTO '${tmpSnapshot.replace(/'/g, "''")}'`);
    res.setHeader('Content-Type', 'application/x-sqlite3');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.download(tmpSnapshot, filename);
  } catch (err) {
    res.setHeader('Content-Type', 'application/x-sqlite3');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.download(DB_PATH, filename);
  }
});

r.get('/export-file', (req, res) => {
  res.redirect('/api/admin/db/download' + (req.query.token ? `?token=${encodeURIComponent(req.query.token)}` : ''));
});

r.get('/backups', (_req, res) => res.json(listBackups()));
r.post('/backups', (_req, res) => res.json({ name: createBackup() }));
r.get('/backups/:name', (req, res) => {
  const f = safeBackup(req.params.name);
  f ? res.download(f) : res.status(404).json({ error: 'فایل یافت نشد.' });
});
r.delete('/backups/:name', (req, res) => {
  const f = safeBackup(req.params.name);
  if (!f) return res.status(404).json({ error: 'فایل یافت نشد.' });
  fs.unlinkSync(f);
  res.json({ success: true });
});
r.post('/backups/:name/restore', (req, res) => {
  const f = safeBackup(req.params.name);
  if (!f) return res.status(404).json({ error: 'فایل یافت نشد.' });
  const safety = createBackup();
  try {
    db.reopen(f);
    res.json({ success: true, message: `بازیابی انجام شد. نسخه پشتیبان قبل از بازیابی: ${safety}` });
  } catch (e) {
    res.status(500).json({ error: 'خطا در بازیابی نسخه پشتیبان: ' + e.message });
  }
});

// Upload and Import a .db file (raw body)
const handleUploadRestore = (req, res) => {
  const buf = req.body;
  if (!Buffer.isBuffer(buf) || buf.length < 100) {
    return res.status(400).json({ error: 'محتوای فایل خالی یا نامعتبر است.' });
  }
  const header = buf.subarray(0, 16).toString('latin1');
  if (header !== 'SQLite format 3\u0000') {
    return res.status(400).json({ error: 'فایل ارسالی یک پایگاه داده SQLite معتبر نیست (هدر استاندارد یافت نشد).' });
  }
  const tmp = path.join(BACKUP_DIR, `uploaded-${stamp()}.db`);
  fs.writeFileSync(tmp, buf);
  const safety = createBackup();
  try {
    db.reopen(tmp);
    const stat = fs.statSync(DB_PATH);
    res.json({ 
      success: true, 
      message: `پایگاه‌داده با موفقیت جایگزین شد. یک نسخه پشتیبان خودکار با نام ${safety} ذخیره گردید.`, 
      safetyBackup: safety,
      size: stat.size
    });
  } catch (e) {
    try {
      db.reopen(path.join(BACKUP_DIR, safety));
    } catch {}
    res.status(400).json({ error: 'بازیابی ناموفق بود و پایگاه داده قبلی برگردانده شد: ' + e.message });
  }
};

r.post('/upload', rawBody({ type: '*/*', limit: '500mb' }), handleUploadRestore);
r.post('/restore-upload', rawBody({ type: '*/*', limit: '500mb' }), handleUploadRestore);

// ---- Maintenance ----
r.post('/maintenance/:op', (req, res) => {
  if (req.params.op === 'integrity') return res.json({ result: db.all('PRAGMA integrity_check').map((x) => Object.values(x)[0]).join('\n') });
  if (req.params.op === 'vacuum') { db.exec('VACUUM'); return res.json({ result: 'VACUUM انجام شد.', size: fs.statSync(DB_PATH).size }); }
  if (req.params.op === 'optimize') { db.exec('PRAGMA optimize'); return res.json({ result: 'بهینه‌سازی انجام شد.' }); }
  res.status(400).json({ error: 'عملیات نامعتبر.' });
});

export default r;
