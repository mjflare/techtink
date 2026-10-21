// Iranian SMS Service Integration for TechTink
// Supports Kavenegar (کاوه‌نگار), FarazSMS / IPPanel (فراز اس‌ام‌اس), Ghasedak (قاصدک), and Mock fallback.
import { getSetting } from '../db.js';

/**
 * Send an OTP code to a mobile number using the configured SMS provider.
 * @param {Object} options
 * @param {string} options.mobile - Receptor Iranian mobile (e.g. '09123456789')
 * @param {string} options.code - 5 or 6 digit verification code
 * @param {string} [options.template] - Custom template name
 * @returns {Promise<{success: boolean, messageId?: string, error?: string, simulated?: boolean}>}
 */
export async function sendOtp({ mobile, code, template }) {
  const provider = getSetting('sms_provider') || 'kavenegar';
  const apiKey = getSetting('sms_api_key') || process.env.SMS_API_KEY || '';
  const otpTemplate = template || getSetting('sms_template_otp') || 'techtink-verify';
  const senderLine = getSetting('sms_sender_line') || '';

  // If no API key configured or provider is mock, log to console safely
  if (!apiKey || provider === 'mock') {
    console.log('\n======================================================');
    console.log(`[SMS Service - Mock] Verification Code to ${mobile}:`);
    console.log(`   OTP CODE: [ ${code} ]`);
    console.log(`   TEMPLATE: ${otpTemplate}`);
    console.log(`   PROVIDER: ${provider} (No live API key configured)`);
    console.log('======================================================\n');
    return {
      success: true,
      simulated: true,
      message: 'پیامک در حالت شبیه‌ساز با موفقیت پردازش شد (کد در کنسول سرور لاگ شد).'
    };
  }

  try {
    if (provider === 'kavenegar') {
      // Kavenegar Verify Lookup API (Ultra-fast OTP bypasses blacklists via shared service lines)
      const url = `https://api.kavenegar.com/v1/${encodeURIComponent(apiKey)}/verify/lookup.json?receptor=${encodeURIComponent(mobile)}&token=${encodeURIComponent(code)}&template=${encodeURIComponent(otpTemplate)}`;
      const res = await fetch(url, { method: 'GET' });
      const data = await res.json();
      
      if (data?.return?.status === 200) {
        const entry = data.entries?.[0] || {};
        return {
          success: true,
          messageId: String(entry.messageid || ''),
          provider: 'kavenegar'
        };
      } else {
        const errorMsg = data?.return?.message || 'خطا در وب‌سرویس کاوه‌نگار';
        console.error('[SMS Service] Kavenegar error:', data);
        return { success: false, error: errorMsg };
      }
    }

    if (provider === 'farazsms' || provider === 'ippanel') {
      // IPPanel / FarazSMS Pattern API
      const patternCode = otpTemplate;
      const res = await fetch('http://ippanel.com/api/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          op: 'pattern',
          user: apiKey.includes(':') ? apiKey.split(':')[0] : '',
          pass: apiKey.includes(':') ? apiKey.split(':')[1] : '',
          fromNum: senderLine || '3000505',
          toNum: mobile,
          patternCode: patternCode,
          inputData: [{ code: String(code) }]
        })
      });
      const data = await res.json();
      if (Array.isArray(data) && data[0] > 0) {
        return { success: true, messageId: String(data[0]), provider: 'farazsms' };
      }
      return { success: false, error: 'پاسخ ناموفق از سامانه فراز اس‌ام‌اس' };
    }

    if (provider === 'ghasedak') {
      // Ghasedak Verification API
      const res = await fetch('https://api.ghasedak.me/v2/verification/send/simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'apikey': apiKey
        },
        body: new URLSearchParams({
          receptor: mobile,
          type: '1',
          template: otpTemplate,
          param1: String(code)
        })
      });
      const data = await res.json();
      if (data?.result?.code === 200) {
        return { success: true, messageId: String(data.result.message_id || ''), provider: 'ghasedak' };
      }
      return { success: false, error: data?.result?.message || 'خطای سامانه قاصدک' };
    }

    return { success: false, error: `ارائه‌دهنده پیامک ناشناخته است: ${provider}` };
  } catch (err) {
    console.error('[SMS Service] Network error sending SMS:', err);
    return { success: false, error: 'خطای ارتباط با سرور پیامک: ' + err.message };
  }
}

/**
 * Send custom plain text SMS
 */
export async function sendCustomSms({ mobile, message }) {
  const provider = getSetting('sms_provider') || 'kavenegar';
  const apiKey = getSetting('sms_api_key') || process.env.SMS_API_KEY || '';
  const senderLine = getSetting('sms_sender_line') || '';

  if (!apiKey || provider === 'mock') {
    console.log(`[SMS Custom - Mock] To ${mobile}: "${message}"`);
    return { success: true, simulated: true };
  }

  try {
    if (provider === 'kavenegar') {
      const url = `https://api.kavenegar.com/v1/${encodeURIComponent(apiKey)}/sms/send.json?receptor=${encodeURIComponent(mobile)}&sender=${encodeURIComponent(senderLine)}&message=${encodeURIComponent(message)}`;
      const res = await fetch(url, { method: 'POST' });
      const data = await res.json();
      if (data?.return?.status === 200) {
        return { success: true, messageId: String(data.entries?.[0]?.messageid || '') };
      }
      return { success: false, error: data?.return?.message || 'خطای کاوه‌نگار' };
    }

    return { success: false, error: 'ارسال پیامک سفارشی فقط برای کاوه‌نگار فعال است.' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
