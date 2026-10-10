#!/usr/bin/env node
// CLI utility to create an admin user or promote/reset an existing user on the VPS.
// Usage:
//   Interactive:
//     bun scripts/create-admin.js
//     node scripts/create-admin.js
//
//   With arguments:
//     bun scripts/create-admin.js --email admin@example.com --password mypass123 --name "مدیر اصلی"
//     bun scripts/create-admin.js --mobile 09121234567 --password mypass123
//     node scripts/create-admin.js admin@example.com mypass123 "مدیر سایت"

import readline from 'node:readline';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
if (!process.env.DATA_DIR) {
  process.env.DATA_DIR = path.join(projectRoot, 'data');
}

import { initDb, db } from '../server/db.js';
import { hashPassword, normalizeMobile } from '../server/auth.js';

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};
  const positional = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--email' && args[i + 1]) {
      options.email = args[++i];
    } else if (arg === '--mobile' && args[i + 1]) {
      options.mobile = args[++i];
    } else if (arg === '--password' && args[i + 1]) {
      options.password = args[++i];
    } else if (arg === '--name' && args[i + 1]) {
      options.name = args[++i];
    } else if (arg.startsWith('--email=')) {
      options.email = arg.split('=')[1];
    } else if (arg.startsWith('--mobile=')) {
      options.mobile = arg.split('=')[1];
    } else if (arg.startsWith('--password=')) {
      options.password = arg.split('=')[1];
    } else if (arg.startsWith('--name=')) {
      options.name = arg.split('=')[1];
    } else if (!arg.startsWith('--')) {
      positional.push(arg);
    }
  }

  // Handle positional: <identifier> <password> [name]
  if (positional.length > 0 && !options.email && !options.mobile) {
    const id = positional[0];
    if (id.includes('@')) options.email = id;
    else options.mobile = id;
  }
  if (positional.length > 1 && !options.password) {
    options.password = positional[1];
  }
  if (positional.length > 2 && !options.name) {
    options.name = positional[2];
  }

  return options;
}

function prompt(rl, question, defaultValue = '') {
  return new Promise((resolve) => {
    rl.question(defaultValue ? `${question} [${defaultValue}]: ` : `${question}: `, (ans) => {
      resolve(ans.trim() || defaultValue);
    });
  });
}

async function main() {
  await initDb();

  const options = parseArgs();
  let email = options.email ? String(options.email).trim().toLowerCase() : null;
  let mobile = options.mobile ? normalizeMobile(options.mobile) : null;
  let password = options.password ? String(options.password) : null;
  let name = options.name ? String(options.name).trim() : null;

  if (!email && !mobile && !password) {
    // Interactive prompt
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    console.log('\n======================================================');
    console.log('   🛠️  TechTink - ساخت یا ارتقای کاربر مدیر (Admin CLI)   ');
    console.log('======================================================\n');

    const inputId = await prompt(rl, '🔹 ایمیل یا شماره موبایل مدیر را وارد کنید');
    if (!inputId) {
      console.error('❌ خطا: ایمیل یا موبایل الزامی است.');
      rl.close();
      process.exit(1);
    }

    if (inputId.includes('@')) {
      email = inputId.toLowerCase();
    } else {
      mobile = normalizeMobile(inputId);
      if (!mobile) {
        console.error('❌ خطا: شماره موبایل نامعتبر است (مثال: 09121234567).');
        rl.close();
        process.exit(1);
      }
    }

    name = await prompt(rl, '🔹 نام مدیر', 'مدیر سیستم');
    password = await prompt(rl, '🔹 رمز عبور (حداقل ۶ کاراکتر)');
    rl.close();
  }

  if (!email && !mobile) {
    console.error('❌ خطا: ایمیل یا شماره موبایل مشخص نشده است.');
    process.exit(1);
  }

  if (!password || password.length < 6) {
    console.error('❌ خطا: رمز عبور باید حداقل ۶ کاراکتر باشد.');
    process.exit(1);
  }

  name = name || 'مدیر سیستم';

  // Check if a user with this email or mobile already exists
  let existing = null;
  if (email && mobile) {
    existing = db.get('SELECT * FROM users WHERE email = ? OR mobile = ?', email, mobile);
  } else if (email) {
    existing = db.get('SELECT * FROM users WHERE email = ?', email);
  } else if (mobile) {
    existing = db.get('SELECT * FROM users WHERE mobile = ?', mobile);
  }

  const hashed = hashPassword(password);

  if (existing) {
    // Promote and update existing user
    db.run(
      "UPDATE users SET name = COALESCE(?, name), password_hash = ?, role = 'admin', blocked = 0, must_change_password = 0 WHERE id = ?",
      name,
      hashed,
      existing.id
    );

    console.log('\n✅ کاربر موجود با موفقیت به سطح «مدیر کل (Admin)» ارتقا یافت و رمز عبور جدید تنظیم شد:');
    console.log(`   👤 شناسه کاربری: ${existing.id}`);
    console.log(`   📝 نام: ${name || existing.name}`);
    console.log(`   📧 ایمیل: ${existing.email || email || 'تنظیم نشده'}`);
    console.log(`   📱 موبایل: ${existing.mobile || mobile || 'تنظیم نشده'}`);
    console.log(`   🛡️ نقش (Role): admin`);
    console.log('\n💡 اکنون می‌توانید در پنل وب با این مشخصات وارد بخش مدیریت شوید.');
  } else {
    // Create new admin user
    const { lastId } = db.run(
      "INSERT INTO users (name, email, mobile, password_hash, role, blocked, must_change_password) VALUES (?, ?, ?, ?, 'admin', 0, 0)",
      name,
      email,
      mobile,
      hashed
    );

    console.log('\n🎉 کاربر مدیر جدید با موفقیت ایجاد شد:');
    console.log(`   👤 شناسه کاربری: ${lastId}`);
    console.log(`   📝 نام: ${name}`);
    console.log(`   📧 ایمیل: ${email || 'تنظیم نشده'}`);
    console.log(`   📱 موبایل: ${mobile || 'تنظیم نشده'}`);
    console.log(`   🛡️ نقش (Role): admin`);
    console.log('\n💡 اکنون می‌توانید در پنل وب با این مشخصات وارد بخش مدیریت شوید.');
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌ خطا در ایجاد کاربر مدیر:', err);
  process.exit(1);
});
