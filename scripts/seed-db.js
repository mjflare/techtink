#!/usr/bin/env bun
// ==============================================================================
// TechTink Standalone Database Seeder & Sync CLI
// Creates or updates data/techtink.db with all Iranian stock laptops,
// multi-angle gallery photos, hardware upgrades, and default store settings.
// ==============================================================================

import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Import DB layer
const { initDb, db, DB_PATH } = await import(path.join(PROJECT_ROOT, 'server', 'db.js'));
const { serializeProduct } = await import(path.join(PROJECT_ROOT, 'server', 'products.js'));

console.log('🔄 Initializing and synchronizing TechTink SQLite database...');
await initDb();

const products = db.all('SELECT id, slug, name, base_price, stock FROM products WHERE active = 1 ORDER BY id');
console.log(`\n✅ Database successfully synchronized at: ${DB_PATH}`);
console.log(`📦 Loaded ${products.length} Iranian stock laptops:\n`);

for (const p of products) {
  const full = db.get('SELECT * FROM products WHERE id = ?', p.id);
  const s = serializeProduct(full, { full: true });
  console.log(` • [${s.slug}] ${s.name}`);
  console.log(`   Price: ${s.basePrice?.toLocaleString()} Toman | TechTink Score: ${s.techTinkScore?.overall}/100 | Images: ${s.images?.length} angles`);
}

console.log('\n✨ Database is ready to use! No manual file upload needed.');
process.exit(0);
