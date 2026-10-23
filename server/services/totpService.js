// RFC 6238 TOTP (Time-based One-Time Password) Service for Google Authenticator
// Zero external dependencies, pure node:crypto implementation.
import crypto from 'node:crypto';

const B32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32Encode(buffer) {
  let bits = 0;
  let value = 0;
  let output = '';
  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;
    while (bits >= 5) {
      output += B32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += B32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return output;
}

export function base32Decode(str) {
  const clean = String(str || '').toUpperCase().replace(/[\s\-=]/g, '');
  let bits = 0;
  let value = 0;
  const bytes = [];
  for (let i = 0; i < clean.length; i++) {
    const idx = B32_ALPHABET.indexOf(clean[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

export function generateSecret(byteLength = 20) {
  return base32Encode(crypto.randomBytes(byteLength));
}

export function generateTOTP(secretB32, timeStep = 30, time = Date.now()) {
  const key = base32Decode(secretB32);
  const counter = Math.floor(time / 1000 / timeStep);
  const buf = Buffer.alloc(8);
  buf.writeBigInt64BE(BigInt(counter));
  const hmac = crypto.createHmac('sha1', key).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code = ((hmac[offset] & 0x7f) << 24) |
               ((hmac[offset + 1] & 0xff) << 16) |
               ((hmac[offset + 2] & 0xff) << 8) |
               (hmac[offset + 3] & 0xff);
  return (code % 1000000).toString().padStart(6, '0');
}

export function verifyTOTP(token, secretB32, window = 1) {
  if (!token || !secretB32) return false;
  const cleanToken = String(token).trim().replace(/\s+/g, '');
  if (!/^\d{6}$/.test(cleanToken)) return false;

  const now = Date.now();
  for (let errorWindow = -window; errorWindow <= window; errorWindow++) {
    const checkTime = now + (errorWindow * 30 * 1000);
    if (generateTOTP(secretB32, 30, checkTime) === cleanToken) {
      return true;
    }
  }
  return false;
}

export function generateBackupCodes(count = 8) {
  const codes = [];
  for (let i = 0; i < count; i++) {
    const part1 = crypto.randomBytes(2).toString('hex').toUpperCase();
    const part2 = crypto.randomBytes(2).toString('hex').toUpperCase();
    codes.push(`${part1}-${part2}`);
  }
  return codes;
}

export function getOtpAuthUri(accountName, secretB32, issuer = 'TechTink') {
  const cleanAccount = encodeURIComponent(accountName || 'admin@techtink.ir');
  const cleanIssuer = encodeURIComponent(issuer);
  return `otpauth://totp/${cleanIssuer}:${cleanAccount}?secret=${secretB32}&issuer=${cleanIssuer}&algorithm=SHA1&digits=6&period=30`;
}
