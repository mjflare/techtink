#!/usr/bin/env node
// TechTink Administrator CLI Setup Tool
// Runtime: Node.js (>= 22.5) or Bun
//
// Usage:
//   Interactive Mode:
//     bun scripts/create-admin.js
//     node scripts/create-admin.js
//
//   Command-Line Arguments:
//     bun scripts/create-admin.js --email admin@techtink.ir --password MySecretPass123 --name "Site Admin"
//     bun scripts/create-admin.js --mobile 09121234567 --password MySecretPass123
//     node scripts/create-admin.js admin@techtink.ir MySecretPass123 "Site Admin"
//
//   Help:
//     node scripts/create-admin.js --help

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

function printHelp() {
  console.log(`
============================================================
  TechTink Administrator Setup CLI
============================================================

Usage:
  node scripts/create-admin.js [options]
  bun scripts/create-admin.js [options]

Options:
  --email <email>        Admin email address
  --mobile <mobile>      Admin Iranian mobile number (e.g. 09121234567)
  --password <password>  Admin password (minimum 6 characters)
  --name <name>          Admin display name (default: "Site Admin")
  --help, -h             Show this help message

Positional shorthand:
  node scripts/create-admin.js <email|mobile> <password> [name]

Examples:
  node scripts/create-admin.js --email admin@techtink.ir --password Secret123
  bun scripts/create-admin.js 09121234567 Secret123 "Main Admin"
  node scripts/create-admin.js  (starts interactive prompt)
`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};
  const positional = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      options.help = true;
      return options;
    }
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

  // Handle positional shorthand: <identifier> <password> [name]
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
    const query = defaultValue ? `${question} [${defaultValue}]: ` : `${question}: `;
    rl.question(query, (ans) => {
      resolve(ans.trim() || defaultValue);
    });
  });
}

async function main() {
  const options = parseArgs();

  if (options.help) {
    printHelp();
    process.exit(0);
  }

  await initDb();

  let email = options.email ? String(options.email).trim().toLowerCase() : null;
  let mobile = options.mobile ? normalizeMobile(options.mobile) : null;
  let password = options.password ? String(options.password) : null;
  let name = options.name ? String(options.name).trim() : null;

  // Interactive mode if no credentials were provided
  if (!email && !mobile && !password) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    console.log('\n============================================================');
    console.log('       TechTink - Administrator Account Setup (CLI)         ');
    console.log('============================================================\n');

    const inputId = await prompt(rl, 'Enter admin Email or Mobile number');
    if (!inputId) {
      console.error('\n[ERROR] Email or mobile number is required.');
      rl.close();
      process.exit(1);
    }

    if (inputId.includes('@')) {
      email = inputId.toLowerCase();
    } else {
      mobile = normalizeMobile(inputId);
      if (!mobile) {
        console.error('\n[ERROR] Invalid mobile number format (e.g. 09121234567 or +989121234567).');
        rl.close();
        process.exit(1);
      }
    }

    name = await prompt(rl, 'Enter admin display name', 'Site Admin');
    password = await prompt(rl, 'Enter password (min 6 characters)');
    rl.close();
  }

  if (!email && !mobile) {
    console.error('[ERROR] Neither email nor mobile was specified.');
    console.error('Run with --help for usage instructions.');
    process.exit(1);
  }

  if (!password || password.length < 6) {
    console.error('[ERROR] Password must be at least 6 characters long.');
    process.exit(1);
  }

  name = name || 'Site Admin';

  // Check if user already exists
  let existing = null;
  if (email && mobile) {
    existing = db.get('SELECT * FROM users WHERE email = ? OR mobile = ?', email, mobile);
  } else if (email) {
    existing = db.get('SELECT * FROM users WHERE email = ?', email);
  } else if (mobile) {
    existing = db.get('SELECT * FROM users WHERE mobile = ?', mobile);
  }

  const hashed = typeof globalThis.Bun !== 'undefined'
    ? await Bun.password.hash(password, { algorithm: 'argon2id' })
    : hashPassword(password);

  if (existing) {
    // Promote and update existing account
    db.run(
      "UPDATE users SET name = COALESCE(?, name), password_hash = ?, role = 'admin', blocked = 0, must_change_password = 0 WHERE id = ?",
      name,
      hashed,
      existing.id
    );

    console.log('\n============================================================');
    console.log(' [SUCCESS] Existing user promoted to Administrator!');
    console.log('============================================================');
    console.log(`   User ID:   ${existing.id}`);
    console.log(`   Name:      ${name || existing.name}`);
    console.log(`   Email:     ${existing.email || email || 'N/A'}`);
    console.log(`   Mobile:    ${existing.mobile || mobile || 'N/A'}`);
    console.log(`   Role:      admin`);
    console.log(`   Status:    Active (Unblocked)`);
    console.log('\nYou can now log in at the web portal using these credentials.\n');
  } else {
    // Insert new administrator
    const { lastId } = db.run(
      "INSERT INTO users (name, email, mobile, password_hash, role, blocked, must_change_password) VALUES (?, ?, ?, ?, 'admin', 0, 0)",
      name,
      email,
      mobile,
      hashed
    );

    console.log('\n============================================================');
    console.log(' [SUCCESS] New Administrator created successfully!');
    console.log('============================================================');
    console.log(`   User ID:   ${lastId}`);
    console.log(`   Name:      ${name}`);
    console.log(`   Email:     ${email || 'N/A'}`);
    console.log(`   Mobile:    ${mobile || 'N/A'}`);
    console.log(`   Role:      admin`);
    console.log(`   Status:    Active`);
    console.log('\nYou can now log in at the web portal using these credentials.\n');
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('\n[FATAL ERROR] Failed to create or update administrator:', err.message || err);
  process.exit(1);
});
