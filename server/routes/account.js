// Customer accounts, comments, OTP/2FA verification and orders.
import { Router } from 'express';
import crypto from 'node:crypto';
import { db, getSetting, logSecurityEvent } from '../db.js';
import { 
  hashPassword, verifyPassword, issueToken, publicUser, 
  requireUser, requireAdmin, normalizeMobile, issueTemp2FAToken, 
  readTemp2FAToken, getAdminTimeoutMinutes 
} from '../auth.js';
import { priceCart } from '../products.js';
import { sendOtp } from '../services/smsService.js';
import { buildMimeMessage, sendViaSmtpSocket } from '../mailServer.js';
import { 
  generateSecret, generateTOTP, verifyTOTP, 
  generateBackupCodes, getOtpAuthUri 
} from '../services/totpService.js';

const r = Router();
const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || ''));

r.post('/auth/register', (req, res) => {
  const { name, mobile, phone, email, password } = req.body || {};
  const rawPhone = mobile || phone;
  const m = rawPhone ? normalizeMobile(rawPhone) : null;
  if (!name || String(name).trim().length < 2) return res.status(400).json({ error: 'نام را وارد کنید.' });
  if (rawPhone && !m) return res.status(400).json({ error: 'شماره موبایل معتبر نیست (مثال: ۰۹۱۲۱۲۳۴۵۶۷).' });
  if (email && !isEmail(email)) return res.status(400).json({ error: 'ایمیل معتبر نیست.' });
  if (!m && !email) return res.status(400).json({ error: 'موبایل یا ایمیل الزامی است.' });
  if (!password || String(password).length < 6) return res.status(400).json({ error: 'رمز عبور باید حداقل ۶ کاراکتر باشد.' });
  const e = email ? String(email).toLowerCase().trim() : null;
  if (db.get('SELECT id FROM users WHERE (mobile IS NOT NULL AND mobile = ?) OR (email IS NOT NULL AND email = ?)', m, e)) {
    return res.status(409).json({ error: 'کاربری با این موبایل یا ایمیل قبلاً ثبت‌نام کرده است.' });
  }
  const { lastId } = db.run('INSERT INTO users (name, mobile, email, password_hash) VALUES (?, ?, ?, ?)', String(name).trim(), m, e, hashPassword(password));
  const user = db.get('SELECT * FROM users WHERE id = ?', lastId);
  res.json({ success: true, token: issueToken(user), user: publicUser(user) });
});

r.post('/auth/login', (req, res) => {
  const { login, email, mobile, phone, password } = req.body || {};
  const identifier = String(login || email || mobile || phone || '').trim();
  const m = normalizeMobile(identifier);
  const user = m
    ? db.get('SELECT * FROM users WHERE mobile = ?', m)
    : db.get('SELECT * FROM users WHERE email = ?', identifier.toLowerCase());
  if (!user || !verifyPassword(String(password || ''), user.password_hash)) {
    logSecurityEvent(user?.id || null, identifier, 'login_fail', req.ip, 'تلاش ناموفق برای ورود: کلمه عبور نادرست');
    return res.status(401).json({ error: 'نام کاربری یا رمز عبور اشتباه است.' });
  }
  if (user.blocked) {
    logSecurityEvent(user.id, user.email || user.mobile, 'blocked_attempt', req.ip, 'تلاش ورود به حساب مسدود شده');
    return res.status(403).json({ error: 'حساب کاربری شما مسدود شده است.' });
  }

  // If user has Google Authenticator / TOTP 2FA enabled, issue challenge token
  if (user.totp_enabled) {
    logSecurityEvent(user.id, user.email || user.mobile, '2fa_challenge', req.ip, 'صدور چالش ورود دومرحله‌ای Google Authenticator');
    const tempToken = issueTemp2FAToken(user);
    return res.json({
      success: true,
      requires2FA: true,
      twoFactorType: 'totp',
      tempToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role
      }
    });
  }

  // Update activity timestamp and issue full session token
  db.run("UPDATE users SET last_active_at = datetime('now') WHERE id = ?", user.id);
  logSecurityEvent(user.id, user.email || user.mobile, 'login_success', req.ip, 'ورود موفق به حساب کاربری');
  res.json({ success: true, token: issueToken(user), user: publicUser(user) });
});

// Verify Google Authenticator TOTP during login
r.post('/auth/2fa/verify-totp', (req, res) => {
  const { tempToken, code } = req.body || {};
  if (!tempToken || !code) {
    return res.status(400).json({ error: 'کد ۶ رقمی و شناسه احراز الزامی است.' });
  }

  const tokenData = readTemp2FAToken(tempToken);
  if (!tokenData) {
    return res.status(401).json({ error: 'اعتبار جلسه تایید دومرحله‌ای منقضی شده است. لطفاً دوباره وارد شوید.' });
  }

  const user = db.get('SELECT * FROM users WHERE id = ?', tokenData.uid);
  if (!user || user.blocked) {
    return res.status(403).json({ error: 'حساب کاربری یافت نشد یا مسدود است.' });
  }

  const cleanCode = String(code).trim().replace(/\s+/g, '');

  // 1. Check standard 6-digit TOTP
  let isValid = verifyTOTP(cleanCode, user.totp_secret);

  // 2. If invalid, check backup recovery codes
  if (!isValid && user.totp_backup_codes) {
    try {
      const backupCodes = JSON.parse(user.totp_backup_codes);
      const codeUpper = cleanCode.toUpperCase();
      const codeIndex = backupCodes.findIndex(c => c === codeUpper || c.replace('-', '') === codeUpper.replace('-', ''));
      if (codeIndex !== -1) {
        isValid = true;
        backupCodes.splice(codeIndex, 1);
        db.run('UPDATE users SET totp_backup_codes = ? WHERE id = ?', JSON.stringify(backupCodes), user.id);
        logSecurityEvent(user.id, user.email || user.mobile, 'backup_code_used', req.ip, 'ورود با استفاده از کد بازیابی اضطراری ۲FA');
      }
    } catch {}
  }

  if (!isValid) {
    logSecurityEvent(user.id, user.email || user.mobile, '2fa_verify_fail', req.ip, 'کد ۲FA وارد شده نامعتبر بود');
    return res.status(400).json({ error: 'کد تایید Google Authenticator یا کد پشتیبان اشتباه است.' });
  }

  // Session keepalive & issue permanent token
  db.run("UPDATE users SET last_active_at = datetime('now') WHERE id = ?", user.id);
  logSecurityEvent(user.id, user.email || user.mobile, '2fa_verify_success', req.ip, 'تایید موفقیت‌آمیز ورود دومرحله‌ای Google Authenticator');
  const fullToken = issueToken(user);
  res.json({
    success: true,
    token: fullToken,
    user: publicUser(user)
  });
});

// Refresh session / Keep-Alive (updates last_active_at)
r.post('/auth/refresh-session', requireUser, (req, res) => {
  if (req.user.role === 'admin' && req.adminSessionExpired) {
    return res.status(401).json({ 
      error: 'نشست مدیریتی شما به دلیل عدم فعالیت منقضی شده است. لطفاً مجدداً وارد شوید.',
      code: 'ADMIN_SESSION_EXPIRED'
    });
  }

  db.run("UPDATE users SET last_active_at = datetime('now') WHERE id = ?", req.user.id);
  const updatedUser = db.get('SELECT * FROM users WHERE id = ?', req.user.id);
  res.json({
    success: true,
    user: publicUser(updatedUser),
    timeoutMinutes: getAdminTimeoutMinutes()
  });
});

// Generate new TOTP setup data for Google Authenticator
r.post('/auth/totp/setup', requireUser, (req, res) => {
  const secret = generateSecret();
  const backupCodes = generateBackupCodes(8);
  const qrUri = getOtpAuthUri(req.user.email || req.user.mobile || req.user.name, secret, 'TechTink');

  res.json({
    success: true,
    secret,
    qrUri,
    backupCodes
  });
});

// Confirm & Enable TOTP with the first 6-digit verification code
r.post('/auth/totp/enable', requireUser, (req, res) => {
  const { secret, code, backupCodes } = req.body || {};
  if (!secret || !code) {
    return res.status(400).json({ error: 'کلید و کد تایید الزامی است.' });
  }

  const isValid = verifyTOTP(code, secret);
  if (!isValid) {
    return res.status(400).json({ error: 'کد ۶ رقمی وارد شده صحیح نیست. لطفاً ساعت تلفن همراه خود را چک کرده و مجدداً امتحان کنید.' });
  }

  const bCodesJson = Array.isArray(backupCodes) ? JSON.stringify(backupCodes) : JSON.stringify(generateBackupCodes(8));
  db.run('UPDATE users SET totp_secret = ?, totp_enabled = 1, totp_backup_codes = ? WHERE id = ?', secret, bCodesJson, req.user.id);

  const updated = db.get('SELECT * FROM users WHERE id = ?', req.user.id);
  res.json({
    success: true,
    message: 'احراز هویت دومرحله‌ای Google Authenticator با موفقیت فعال گردید.',
    user: publicUser(updated)
  });
});

// Disable TOTP
r.post('/auth/totp/disable', requireUser, (req, res) => {
  const { password, code } = req.body || {};
  if (!password && !code) {
    return res.status(400).json({ error: 'رمز عبور یا کد ۶ رقمی جهت غیرفعال‌سازی الزامی است.' });
  }

  let authorized = false;
  if (password && verifyPassword(String(password), req.user.password_hash)) {
    authorized = true;
  } else if (code && verifyTOTP(code, req.user.totp_secret)) {
    authorized = true;
  }

  if (!authorized) {
    return res.status(400).json({ error: 'رمز عبور یا کد تایید وارد شده معتبر نیست.' });
  }

  db.run('UPDATE users SET totp_secret = NULL, totp_enabled = 0, totp_backup_codes = NULL WHERE id = ?', req.user.id);
  const updated = db.get('SELECT * FROM users WHERE id = ?', req.user.id);
  res.json({
    success: true,
    message: 'احراز هویت دومرحله‌ای غیرفعال گردید.',
    user: publicUser(updated)
  });
});

// Get TOTP Status
r.get('/auth/totp/status', requireUser, (req, res) => {
  let backupCount = 0;
  if (req.user.totp_backup_codes) {
    try {
      backupCount = JSON.parse(req.user.totp_backup_codes).length;
    } catch {}
  }
  res.json({
    enabled: !!req.user.totp_enabled,
    backupCodesRemaining: backupCount,
    lastActiveAt: req.user.last_active_at,
    timeoutMinutes: getAdminTimeoutMinutes()
  });
});

// Admin Security Settings (Inactivity Timeout)
r.get('/admin/security/settings', requireAdmin, (req, res) => {
  res.json({
    timeoutMinutes: getAdminTimeoutMinutes(),
    totpEnabled: !!req.user.totp_enabled
  });
});

r.put('/admin/security/settings', requireAdmin, (req, res) => {
  const { timeoutMinutes } = req.body || {};
  const mins = parseInt(timeoutMinutes, 10);
  if (isNaN(mins) || mins < 5 || mins > 240) {
    return res.status(400).json({ error: 'زمان انقضای نشست باید بین ۵ تا ۲۴۰ دقیقه باشد.' });
  }

  db.run("INSERT OR REPLACE INTO settings (key, value) VALUES ('admin_session_timeout_minutes', ?)", String(mins));
  res.json({
    success: true,
    timeoutMinutes: mins,
    message: `زمان انقضای نشست عدم فعالیت مدیر بر روی ${mins} دقیقه تنظیم شد.`
  });
});

r.get('/auth/me', requireUser, (req, res) => res.json({ user: publicUser(req.user) }));

r.put('/auth/profile', requireUser, (req, res) => {
  const { name, mobile, email } = req.body || {};
  const m = mobile ? normalizeMobile(mobile) : null;
  if (mobile && !m) return res.status(400).json({ error: 'شماره موبایل معتبر نیست.' });
  if (email && !isEmail(email)) return res.status(400).json({ error: 'ایمیل معتبر نیست.' });
  const e = email ? String(email).toLowerCase().trim() : null;
  if (!m && !e) return res.status(400).json({ error: 'موبایل یا ایمیل الزامی است.' });
  const clash = db.get('SELECT id FROM users WHERE id != ? AND ((mobile IS NOT NULL AND mobile = ?) OR (email IS NOT NULL AND email = ?))', req.user.id, m, e);
  if (clash) return res.status(409).json({ error: 'این موبایل یا ایمیل متعلق به کاربر دیگری است.' });
  db.run('UPDATE users SET name = ?, mobile = ?, email = ? WHERE id = ?', name || req.user.name, m, e, req.user.id);
  res.json({ user: publicUser(db.get('SELECT * FROM users WHERE id = ?', req.user.id)) });
});

r.put('/auth/address', requireUser, (req, res) => {
  const addressData = req.body || {};
  const addrJson = JSON.stringify(addressData);
  db.run('UPDATE users SET saved_address = ? WHERE id = ?', addrJson, req.user.id);
  const updated = db.get('SELECT * FROM users WHERE id = ?', req.user.id);
  res.json({ success: true, user: publicUser(updated) });
});

r.put('/auth/password', requireUser, (req, res) => {
  const { current, next } = req.body || {};
  if (!verifyPassword(String(current || ''), req.user.password_hash)) return res.status(400).json({ error: 'رمز فعلی اشتباه است.' });
  if (!next || String(next).length < 8) return res.status(400).json({ error: 'رمز جدید باید حداقل ۸ کاراکتر باشد.' });
  db.run('UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?', hashPassword(next), req.user.id);
  res.json({ user: publicUser(db.get('SELECT * FROM users WHERE id = ?', req.user.id)) });
});

// ---- OTP & 2FA Mobile Verification ----
r.post('/auth/otp/send', async (req, res) => {
  const { mobile, purpose = 'login' } = req.body || {};
  const m = normalizeMobile(mobile);
  if (!m) return res.status(400).json({ error: 'شماره موبایل نامعتبر است (مثال: ۰۹۱۲۳۴۵۶۷۸۹).' });

  if (purpose === 'recovery') {
    const existing = db.get('SELECT id FROM users WHERE mobile = ?', m);
    if (!existing) return res.status(404).json({ error: 'کاربری با این شماره موبایل یافت نشد.' });
  }

  // Rate limiting: 1 request per 60 seconds per mobile
  const lastToken = db.get(
    "SELECT created_at FROM verification_tokens WHERE target = ? AND type = 'mobile_otp' ORDER BY id DESC LIMIT 1",
    m
  );
  if (lastToken) {
    const elapsed = Date.now() - new Date(lastToken.created_at + 'Z').getTime();
    if (elapsed < 60000) {
      const waitSec = Math.max(1, Math.ceil((60000 - elapsed) / 1000));
      return res.status(429).json({ error: `لطفاً ${waitSec} ثانیه پیش از درخواست مجدد کد شکیبا باشید.` });
    }
  }

  const code = String(crypto.randomInt(10000, 99999));
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

  db.run("UPDATE verification_tokens SET used = 1 WHERE target = ? AND type = 'mobile_otp' AND used = 0", m);
  db.run(
    "INSERT INTO verification_tokens (target, type, code, expires_at) VALUES (?, 'mobile_otp', ?, ?)",
    m, code, expiresAt
  );

  const template = getSetting('sms_template_otp') || 'techtink-verify';
  const smsResult = await sendOtp({ mobile: m, code, template });

  try {
    db.run(
      "INSERT INTO sms_logs (mobile, provider, template, message, status, message_id, error) VALUES (?, ?, ?, ?, ?, ?, ?)",
      m,
      smsResult.provider || getSetting('sms_provider') || 'mock',
      template,
      `کد اعتبارسنجی تک‌تینک: ${code}`,
      smsResult.success ? 'sent' : 'failed',
      smsResult.messageId || null,
      smsResult.error || null
    );
  } catch {}

  res.json({
    success: true,
    message: smsResult.simulated
      ? 'کد اعتبارسنجی (حالت آزمایشی) در کنسول سرور ثبت شد.'
      : 'کد اعتبارسنجی ۵ رقمی با موفقیت پیامک شد.',
    expiresIn: 300
  });
});

r.post('/auth/otp/verify', (req, res) => {
  const { mobile, code, purpose = 'login', name } = req.body || {};
  const m = normalizeMobile(mobile);
  const cleanCode = String(code || '').replace(/\D/g, '').trim();

  if (!m || !cleanCode) {
    return res.status(400).json({ error: 'شماره موبایل و کد ۵ رقمی الزامی است.' });
  }

  const tokenRow = db.get(
    "SELECT * FROM verification_tokens WHERE target = ? AND type = 'mobile_otp' AND used = 0 ORDER BY id DESC LIMIT 1",
    m
  );

  if (!tokenRow || tokenRow.expires_at < Date.now()) {
    return res.status(400).json({ error: 'کد منقضی شده یا نامعتبر است. لطفاً کد جدید دریافت کنید.' });
  }

  if (tokenRow.attempts >= 5) {
    db.run("UPDATE verification_tokens SET used = 1 WHERE id = ?", tokenRow.id);
    return res.status(400).json({ error: 'تعداد دفعات اشتباه بیش از حد مجاز است. لطفاً کد جدید دریافت کنید.' });
  }

  if (tokenRow.code !== cleanCode) {
    db.run("UPDATE verification_tokens SET attempts = attempts + 1 WHERE id = ?", tokenRow.id);
    return res.status(400).json({ error: 'کد واردشده اشتباه است.' });
  }

  // Code is verified
  db.run("UPDATE verification_tokens SET used = 1 WHERE id = ?", tokenRow.id);

  if (purpose === 'recovery') {
    const recoveryToken = crypto.randomBytes(32).toString('hex');
    const recoveryExpires = Date.now() + 15 * 60 * 1000;
    db.run(
      "INSERT INTO verification_tokens (target, type, code, token, expires_at) VALUES (?, 'password_recovery_session', 'OK', ?, ?)",
      m, recoveryToken, recoveryExpires
    );
    return res.json({
      success: true,
      recoveryToken,
      message: 'شماره موبایل تأیید شد. اکنون می‌توانید رمز عبور جدید را تعیین کنید.'
    });
  }

  // Login or Register flow
  let user = db.get("SELECT * FROM users WHERE mobile = ?", m);
  if (!user) {
    const tempPass = crypto.randomBytes(8).toString('hex');
    const cleanName = String(name || '').trim() || `کاربر ${m.slice(-4)}`;
    const { lastId } = db.run(
      "INSERT INTO users (name, mobile, password_hash, role, phone_verified) VALUES (?, ?, ?, 'customer', 1)",
      cleanName, m, hashPassword(tempPass)
    );
    user = db.get("SELECT * FROM users WHERE id = ?", lastId);
  } else {
    db.run("UPDATE users SET phone_verified = 1 WHERE id = ?", user.id);
  }

  if (user.blocked) {
    return res.status(403).json({ error: 'حساب کاربری شما مسدود شده است.' });
  }

  res.json({ success: true, token: issueToken(user), user: publicUser(user) });
});

// ---- Password Reset (Email & Phone) ----
r.post('/auth/password/reset-request', async (req, res) => {
  const { identifier } = req.body || {};
  const raw = String(identifier || '').trim();
  const m = normalizeMobile(raw);

  if (m) {
    const existing = db.get('SELECT id FROM users WHERE mobile = ?', m);
    if (!existing) {
      return res.status(404).json({ error: 'کاربری با این شماره موبایل در سیستم یافت نشد.' });
    }
    const code = String(crypto.randomInt(10000, 99999));
    const expiresAt = Date.now() + 5 * 60 * 1000;

    db.run("UPDATE verification_tokens SET used = 1 WHERE target = ? AND type = 'mobile_otp' AND used = 0", m);
    db.run(
      "INSERT INTO verification_tokens (target, type, code, expires_at) VALUES (?, 'mobile_otp', ?, ?)",
      m, code, expiresAt
    );

    const template = getSetting('sms_template_otp') || 'techtink-verify';
    await sendOtp({ mobile: m, code, template });

    return res.json({
      success: true,
      method: 'mobile',
      mobile: m,
      message: 'کد ۵ رقمی بازیابی به شماره موبایل شما ارسال شد.'
    });
  }

  if (isEmail(raw)) {
    const email = raw.toLowerCase();
    const user = db.get('SELECT id, name FROM users WHERE email = ?', email);

    if (user) {
      const code = String(crypto.randomInt(100000, 999999));
      const token = crypto.randomBytes(24).toString('hex');
      const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

      db.run("UPDATE verification_tokens SET used = 1 WHERE target = ? AND type = 'email_reset' AND used = 0", email);
      db.run(
        "INSERT INTO verification_tokens (target, type, code, token, expires_at) VALUES (?, 'email_reset', ?, ?, ?)",
        email, code, token, expiresAt
      );

      const siteUrl = getSetting('site_url') || 'https://techtink.ir';
      const fromAddr = getSetting('smtp_from') || 'تک‌تینک <info@techtink.ir>';
      const subject = 'درخواست بازیابی رمز عبور تک‌تینک (TechTink)';
      const bodyText = `سلام ${user.name || 'کاربر گرامی'}\n\nکد تأیید بازیابی رمز عبور شما در تک‌تینک:\n${code}\n\nاین کد تا ۱۵ دقیقه معتبر است.\nدر صورتی که شما این درخواست را نداده‌اید، لطفاً این پیام را نادیده بگیرید.\n\nتک‌تینک - فروشگاه تخصصی لپ‌تاپ\n${siteUrl}`;
      const bodyHtml = `
        <div dir="rtl" style="font-family: Tahoma, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background: #ffffff;">
          <h2 style="color: #0284c7; margin-top: 0;">بازیابی رمز عبور حساب تک‌تینک</h2>
          <p style="color: #475569; font-size: 14px;">سلام ${user.name || 'کاربر گرامی'}،</p>
          <p style="color: #475569; font-size: 14px;">کد اعتبارسنجی زیر جهت تغییر و بازنشانی رمز عبور برای شما صادر شده است:</p>
          <div style="background: #f1f5f9; padding: 16px; text-align: center; border-radius: 12px; font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #0f172a; margin: 20px 0;">
            ${code}
          </div>
          <p style="color: #64748b; font-size: 12px; line-height: 1.6;">این کد تا ۱۵ دقیقه معتبر است. در صورتی که این درخواست توسط شما ثبت نشده است، نیازی به انجام اقدامی نیست و حساب شما امن است.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <div style="font-size: 12px; color: #94a3b8; text-align: center;">فروشگاه تخصصی تک‌تینک | مرجع لپ‌تاپ‌های مهندسی و گیمینگ</div>
        </div>
      `;

      try {
        const mime = buildMimeMessage({ from: fromAddr, to: email, subject, bodyText, bodyHtml });
        const smtpHost = getSetting('smtp_host') || 'localhost';
        const smtpPort = Number(getSetting('smtp_port')) || 25;
        const smtpUser = getSetting('smtp_user') || '';
        const smtpPass = getSetting('smtp_pass') || '';
        const auth = (smtpUser && smtpPass) ? { user: smtpUser, pass: smtpPass } : null;

        await sendViaSmtpSocket({
          host: smtpHost,
          port: smtpPort,
          useTls: smtpPort === 465,
          auth,
          from: 'info@techtink.ir',
          to: email,
          rawData: mime
        });
      } catch (mailErr) {
        console.log(`[PasswordReset] SMTP notice: ${mailErr.message} (Code: ${code})`);
      }
    }

    // Always return success for user privacy
    return res.json({
      success: true,
      method: 'email',
      email,
      message: 'در صورت وجود حساب کاربری با این آدرس، دستورالعمل و کد بازیابی به ایمیل شما ارسال شد.'
    });
  }

  return res.status(400).json({ error: 'شماره موبایل یا ایمیل معتبر وارد کنید.' });
});

r.post('/auth/password/reset-confirm', (req, res) => {
  const { identifier, code, recoveryToken, newPassword } = req.body || {};
  if (!newPassword || String(newPassword).length < 8) {
    return res.status(400).json({ error: 'رمز عبور جدید باید حداقل ۸ کاراکتر باشد.' });
  }

  // Case 1: Verified via recoveryToken (from mobile OTP)
  if (recoveryToken) {
    const tokenRow = db.get(
      "SELECT * FROM verification_tokens WHERE token = ? AND type = 'password_recovery_session' AND used = 0 ORDER BY id DESC LIMIT 1",
      recoveryToken
    );
    if (!tokenRow || tokenRow.expires_at < Date.now()) {
      return res.status(400).json({ error: 'جلسه بازیابی منقضی شده است. لطفاً مجدداً اقدام نمایید.' });
    }
    const user = db.get("SELECT id FROM users WHERE mobile = ?", tokenRow.target);
    if (!user) return res.status(404).json({ error: 'کاربر یافت نشد.' });

    db.run("UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?", hashPassword(newPassword), user.id);
    db.run("UPDATE verification_tokens SET used = 1 WHERE id = ?", tokenRow.id);
    return res.json({ success: true, message: 'رمز عبور با موفقیت به‌روزرسانی شد. اکنون می‌توانید وارد شوید.' });
  }

  // Case 2: Verified via email 6-digit code or hex token
  if (identifier && (code || recoveryToken)) {
    const cleanId = String(identifier).trim().toLowerCase();
    const cleanCode = String(code || '').replace(/\D/g, '').trim();

    const tokenRow = db.get(
      "SELECT * FROM verification_tokens WHERE target = ? AND type = 'email_reset' AND used = 0 ORDER BY id DESC LIMIT 1",
      cleanId
    );

    if (!tokenRow || tokenRow.expires_at < Date.now()) {
      return res.status(400).json({ error: 'کد بازیابی منقضی شده است. لطفاً مجدداً درخواست دهید.' });
    }

    if (cleanCode && tokenRow.code !== cleanCode) {
      db.run("UPDATE verification_tokens SET attempts = attempts + 1 WHERE id = ?", tokenRow.id);
      return res.status(400).json({ error: 'کد واردشده اشتباه است.' });
    }

    const user = db.get("SELECT id FROM users WHERE email = ?", cleanId);
    if (!user) return res.status(404).json({ error: 'کاربر یافت نشد.' });

    db.run("UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?", hashPassword(newPassword), user.id);
    db.run("UPDATE verification_tokens SET used = 1 WHERE id = ?", tokenRow.id);
    return res.json({ success: true, message: 'رمز عبور با موفقیت به‌روزرسانی شد. اکنون می‌توانید وارد شوید.' });
  }

  return res.status(400).json({ error: 'اطلاعات بازیابی ناقص است.' });
});

// ---- Comments ----
r.post('/products/:slug/comments', requireUser, (req, res) => {
  const p = db.get('SELECT id FROM products WHERE slug = ?', req.params.slug);
  if (!p) return res.status(404).json({ error: 'محصول یافت نشد.' });
  const body = String(req.body?.body || '').trim();
  const rating = Math.max(1, Math.min(5, parseInt(req.body?.rating, 10) || 5));
  if (body.length < 5) return res.status(400).json({ error: 'متن نظر خیلی کوتاه است.' });
  if (body.length > 2000) return res.status(400).json({ error: 'متن نظر حداکثر ۲۰۰۰ کاراکتر است.' });
  db.run('INSERT INTO comments (product_id, user_id, rating, body) VALUES (?, ?, ?, ?)', p.id, req.user.id, rating, body);
  res.json({ success: true, message: 'نظر شما ثبت شد و پس از تأیید مدیر نمایش داده می‌شود.' });
});

// ---- Orders ----
r.post('/orders', requireUser, (req, res) => {
  const { items, shipping } = req.body || {};
  const s = shipping || {};
  const mobile = normalizeMobile(s.mobile);
  if (!s.fullName || !s.province || !s.city || !s.address) return res.status(400).json({ error: 'اطلاعات ارسال را کامل کنید.' });
  if (!mobile) return res.status(400).json({ error: 'شماره موبایل گیرنده معتبر نیست.' });
  if (!/^\d{10}$/.test(String(s.postalCode || '').replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))) {
    return res.status(400).json({ error: 'کد پستی باید ۱۰ رقم باشد.' });
  }
  try {
    const { lines, subtotal } = priceCart(items);
    const shippingFee = Number(getSetting('shipping_fee')) || 0;
    const orderId = db.tx(() => {
      const { lastId } = db.run(
        'INSERT INTO orders (user_id, subtotal, shipping, total, shipping_info) VALUES (?, ?, ?, ?, ?)',
        req.user.id, subtotal, shippingFee, subtotal + shippingFee, JSON.stringify({ ...s, mobile })
      );
      for (const l of lines) {
        db.run('INSERT INTO order_items (order_id, product_id, name, config, unit_price, qty) VALUES (?, ?, ?, ?, ?, ?)', lastId, l.productId, l.name, JSON.stringify(l.config), l.unitPrice, l.qty);
      }
      db.run('UPDATE users SET saved_address = ? WHERE id = ?', JSON.stringify({ ...s, mobile }), req.user.id);
      return lastId;
    });
    res.json({ orderId, total: subtotal + shippingFee });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

export function orderWithItems(o) {
  return {
    id: o.id, status: o.status, subtotal: o.subtotal, shipping: o.shipping, total: o.total, trackingCode: o.tracking_code,
    shippingInfo: JSON.parse(o.shipping_info || '{}'), createdAt: o.created_at,
    items: db.all('SELECT product_id AS productId, name, config, unit_price AS unitPrice, qty FROM order_items WHERE order_id = ?', o.id).map((i) => ({ ...i, config: JSON.parse(i.config) })),
    payment: db.get('SELECT status, ref_id AS refId, card_pan AS cardPan, message, gateway FROM payments WHERE order_id = ? ORDER BY id DESC LIMIT 1', o.id),
  };
}

r.get('/orders', requireUser, (req, res) => {
  res.json(db.all('SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC', req.user.id).map(orderWithItems));
});

r.get('/orders/:id', requireUser, (req, res) => {
  const o = db.get('SELECT * FROM orders WHERE id = ? AND user_id = ?', req.params.id, req.user.id);
  o ? res.json(orderWithItems(o)) : res.status(404).json({ error: 'سفارش یافت نشد.' });
});

r.get('/appointments/my', requireUser, (req, res) => {
  const u = req.user;
  const m = u.mobile || '';
  const e = u.email || '';
  const rows = db.all(
    `SELECT * FROM appointments 
     WHERE (user_id IS NOT NULL AND user_id = ?) 
        OR (customer_phone IS NOT NULL AND customer_phone = ?) 
        OR (customer_email IS NOT NULL AND customer_email = ?) 
     ORDER BY id DESC LIMIT 100`,
    u.id, m, e
  );
  res.json(rows.map(a => ({
    ...a,
    trackingCode: a.tracking_code,
    services: JSON.parse(a.services || '[]')
  })));
});

export default r;
