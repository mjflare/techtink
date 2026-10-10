// ==============================================================================
// TechTink Inbound Mail Server (SMTP Receiver & Webmail Layer)
// Listens on standard SMTP Port 25 (or SMTP_PORT in .env)
// Automatically receives incoming emails for info@techtink.ir, support@techtink.ir, etc.
// Parses RFC 5322 MIME messages, extracts verification codes (eNamad, Torob, etc.)
// and persists them into the SQLite database.
// ==============================================================================

import net from 'node:net';
import tls from 'node:tls';
import dns from 'node:dns';
import crypto from 'node:crypto';
import { db } from './db.js';

let smtpServerInstance = null;
let serverPort = 25;
let isListening = false;
let lastError = null;

// --- MIME & Header Helpers ---
export function decodeMimeHeader(header) {
  if (!header) return '';
  return header.replace(/=\?([^?]+)\?([BQbq])\?([^?]+)\?=/g, (_, charset, encoding, text) => {
    try {
      if (encoding.toUpperCase() === 'B') {
        return Buffer.from(text, 'base64').toString('utf8');
      } else if (encoding.toUpperCase() === 'Q') {
        const qp = text.replace(/_/g, ' ').replace(/=([0-9A-Fa-f]{2})/g, (__, hex) => String.fromCharCode(parseInt(hex, 16)));
        return Buffer.from(qp, 'binary').toString('utf8');
      }
    } catch {}
    return text;
  });
}

function decodeQuotedPrintable(str) {
  if (!str) return '';
  return str
    .replace(/=\r?\n/g, '') // Soft line breaks
    .replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => {
      try {
        return String.fromCharCode(parseInt(hex, 16));
      } catch {
        return _;
      }
    });
}

export function extractVerificationCode(text) {
  if (!text) return null;
  // Look for explicit Persian/English keywords: کد تایید: 123456 or code: 123456
  const explicitMatch = text.match(/(?:کد\s*تایید|کد\s*فعالسازی|کد|کد\s*ورود|code|verification\s*code|pin|token)\s*[:：=-]?\s*([0-9]{4,8})/i);
  if (explicitMatch && explicitMatch[1]) {
    return explicitMatch[1];
  }
  // Fallback: look for 5 to 8 digit numbers surrounded by boundaries
  const digitsMatch = text.match(/\b([0-9]{5,8})\b/);
  return digitsMatch ? digitsMatch[1] : null;
}

// Simple RFC 5322 MIME Parser
export function parseRawEmail(raw) {
  const normalized = raw.replace(/\r\n/g, '\n');
  const headerEnd = normalized.indexOf('\n\n');

  let headersPart = '';
  let bodyPart = '';

  if (headerEnd !== -1) {
    headersPart = normalized.slice(0, headerEnd);
    bodyPart = normalized.slice(headerEnd + 2);
  } else {
    headersPart = normalized;
  }

  // Parse Header Lines (including folded lines)
  const headers = {};
  const headerLines = headersPart.split('\n');
  let currentKey = '';

  for (const line of headerLines) {
    if ((line.startsWith(' ') || line.startsWith('\t')) && currentKey) {
      headers[currentKey] += ' ' + line.trim();
    } else {
      const colonIdx = line.indexOf(':');
      if (colonIdx > 0) {
        currentKey = line.slice(0, colonIdx).trim().toLowerCase();
        headers[currentKey] = line.slice(colonIdx + 1).trim();
      }
    }
  }

  const subject = decodeMimeHeader(headers['subject'] || '(بدون عنوان)');
  const from = decodeMimeHeader(headers['from'] || '');
  const to = decodeMimeHeader(headers['to'] || 'info@techtink.ir');
  const contentType = headers['content-type'] || 'text/plain';
  const transferEncoding = (headers['content-transfer-encoding'] || '').toLowerCase();

  let bodyText = '';
  let bodyHtml = '';

  // Handle Multipart or Single part
  if (contentType.toLowerCase().includes('multipart')) {
    const boundaryMatch = contentType.match(/boundary=["']?([^"';\s]+)["']?/i);
    if (boundaryMatch) {
      const boundary = boundaryMatch[1];
      const parts = bodyPart.split('--' + boundary);

      for (const part of parts) {
        if (part.trim() === '--' || !part.trim()) continue;
        const subHeaderEnd = part.indexOf('\n\n');
        if (subHeaderEnd !== -1) {
          const subHeaders = part.slice(0, subHeaderEnd).toLowerCase();
          let subBody = part.slice(subHeaderEnd + 2);

          if (subHeaders.includes('base64')) {
            try { subBody = Buffer.from(subBody.replace(/\s+/g, ''), 'base64').toString('utf8'); } catch {}
          } else if (subHeaders.includes('quoted-printable')) {
            subBody = decodeQuotedPrintable(subBody);
          }

          if (subHeaders.includes('text/html')) {
            bodyHtml = subBody.trim();
          } else if (subHeaders.includes('text/plain')) {
            bodyText = subBody.trim();
          }
        }
      }
    }
  }

  // If single part
  if (!bodyText && !bodyHtml) {
    let decoded = bodyPart;
    if (transferEncoding.includes('base64')) {
      try { decoded = Buffer.from(decoded.replace(/\s+/g, ''), 'base64').toString('utf8'); } catch {}
    } else if (transferEncoding.includes('quoted-printable')) {
      decoded = decodeQuotedPrintable(decoded);
    }

    if (contentType.toLowerCase().includes('text/html')) {
      bodyHtml = decoded.trim();
      bodyText = decoded.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    } else {
      bodyText = decoded.trim();
      bodyHtml = `<pre style="font-family: inherit; white-space: pre-wrap;">${bodyText}</pre>`;
    }
  }

  const verificationCode = extractVerificationCode(`${subject}\n${bodyText}`);

  return {
    from,
    to,
    subject,
    bodyText,
    bodyHtml: bodyHtml || `<p>${bodyText}</p>`,
    verificationCode,
    raw,
  };
}

// --- Database Operations ---
export function saveIncomingEmail({ from, to, subject, bodyText, bodyHtml, rawMessage, verificationCode }) {
  try {
    const res = db.run(
      `INSERT INTO inbox_emails (from_address, to_address, subject, body_text, body_html, raw_message, verification_code)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      from || 'unknown',
      to || 'info@techtink.ir',
      subject || '(بدون عنوان)',
      bodyText || '',
      bodyHtml || '',
      rawMessage || '',
      verificationCode || null
    );
    return res.lastId;
  } catch (err) {
    console.error('[MailServer] Error saving email to database:', err);
    return null;
  }
}

export function listEmails({ limit = 50, offset = 0, search = '', unreadOnly = false } = {}) {
  try {
    let sql = 'SELECT id, from_address, to_address, subject, verification_code, is_read, created_at FROM inbox_emails WHERE 1=1';
    const params = [];

    if (unreadOnly) {
      sql += ' AND is_read = 0';
    }

    if (search) {
      sql += ' AND (subject LIKE ? OR from_address LIKE ? OR to_address LIKE ? OR body_text LIKE ? OR verification_code LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s, s);
    }

    sql += ' ORDER BY id DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const items = db.all(sql, ...params);
    const totalCount = db.get('SELECT COUNT(*) as c FROM inbox_emails')?.c || 0;
    const unreadCount = db.get('SELECT COUNT(*) as c FROM inbox_emails WHERE is_read = 0')?.c || 0;

    return {
      items,
      totalCount,
      unreadCount,
    };
  } catch (e) {
    console.error('[MailServer] listEmails error:', e);
    return { items: [], totalCount: 0, unreadCount: 0 };
  }
}

export function getEmailById(id) {
  try {
    return db.get('SELECT * FROM inbox_emails WHERE id = ?', id);
  } catch {
    return null;
  }
}

export function markEmailRead(id) {
  try {
    return db.run('UPDATE inbox_emails SET is_read = 1 WHERE id = ?', id);
  } catch {
    return null;
  }
}

export function deleteEmail(id) {
  try {
    return db.run('DELETE FROM inbox_emails WHERE id = ?', id);
  } catch {
    return null;
  }
}

export function deleteAllInboxEmails() {
  try {
    return db.run('DELETE FROM inbox_emails');
  } catch {
    return null;
  }
}

export function listSentEmails({ limit = 50, offset = 0, search = '' } = {}) {
  try {
    let sql = 'SELECT id, from_address, to_address, subject, body_text, status, error_message, created_at FROM sent_emails WHERE 1=1';
    const params = [];
    if (search) {
      sql += ' AND (subject LIKE ? OR to_address LIKE ? OR from_address LIKE ? OR body_text LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }
    sql += ' ORDER BY id DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const items = db.all(sql, ...params);
    const totalCount = db.get('SELECT COUNT(*) as c FROM sent_emails')?.c || 0;
    return { items, totalCount };
  } catch (e) {
    console.error('[MailServer] listSentEmails error:', e);
    return { items: [], totalCount: 0 };
  }
}

export function getSentEmailById(id) {
  try {
    return db.get('SELECT * FROM sent_emails WHERE id = ?', id);
  } catch {
    return null;
  }
}

export function deleteSentEmail(id) {
  try {
    return db.run('DELETE FROM sent_emails WHERE id = ?', id);
  } catch {
    return null;
  }
}

export function deleteAllSentEmails() {
  try {
    return db.run('DELETE FROM sent_emails');
  } catch {
    return null;
  }
}

// --- Outbound Email (RFC 5322 MIME & SMTP Client) ---
export function buildMimeMessage({ from, to, subject, bodyText = '', bodyHtml = '' }) {
  const boundary = `----=_Part_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
  const messageId = `<tt.${Date.now()}.${crypto.randomBytes(4).toString('hex')}@techtink.ir>`;
  const dateStr = new Date().toUTCString();
  const encodedSubject = `=?UTF-8?B?${Buffer.from(subject || '').toString('base64')}?=`;

  const headers = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${encodedSubject}`,
    `Date: ${dateStr}`,
    `Message-ID: ${messageId}`,
    `MIME-Version: 1.0`,
  ];

  if (bodyHtml && bodyText) {
    headers.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
    const parts = [
      headers.join('\r\n'),
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset=utf-8',
      'Content-Transfer-Encoding: base64',
      '',
      Buffer.from(bodyText).toString('base64').replace(/(.{76})/g, '$1\r\n'),
      `--${boundary}`,
      'Content-Type: text/html; charset=utf-8',
      'Content-Transfer-Encoding: base64',
      '',
      Buffer.from(bodyHtml).toString('base64').replace(/(.{76})/g, '$1\r\n'),
      `--${boundary}--`,
      ''
    ];
    return parts.join('\r\n');
  } else if (bodyHtml) {
    headers.push('Content-Type: text/html; charset=utf-8');
    headers.push('Content-Transfer-Encoding: base64');
    return `${headers.join('\r\n')}\r\n\r\n${Buffer.from(bodyHtml).toString('base64').replace(/(.{76})/g, '$1\r\n')}\r\n`;
  } else {
    headers.push('Content-Type: text/plain; charset=utf-8');
    headers.push('Content-Transfer-Encoding: base64');
    return `${headers.join('\r\n')}\r\n\r\n${Buffer.from(bodyText || '').toString('base64').replace(/(.{76})/g, '$1\r\n')}\r\n`;
  }
}

export function sendViaSmtpSocket({ host, port = 25, useTls = false, auth = null, from, to, rawData, timeout = 25000 }) {
  return new Promise((resolve, reject) => {
    let socket;
    let timer = null;
    let settled = false;

    const cleanup = () => {
      if (timer) clearTimeout(timer);
      try { socket?.destroy(); } catch {}
    };

    const done = (err, result) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (err) reject(err);
      else resolve(result);
    };

    timer = setTimeout(() => {
      done(new Error(`پاسخی از سرور مقصد ${host}:${port} دریافت نشد (Timeout)`));
    }, timeout);

    const onConnect = () => {
      // Socket connected, waiting for banner
    };

    try {
      if (useTls) {
        socket = tls.connect({ host, port, rejectUnauthorized: false }, onConnect);
      } else {
        socket = net.createConnection({ host, port }, onConnect);
      }
    } catch (e) {
      return done(e);
    }

    socket.on('error', (err) => {
      done(new Error(`خطای ارتباط سوکت با ${host}:${port} - ${err.message}`));
    });

    let buffer = '';
    let step = 'BANNER';

    socket.on('data', (chunk) => {
      buffer += chunk.toString('utf8');

      const lines = buffer.split('\r\n');
      if (lines.length < 2) return;

      const completeLines = lines.slice(0, lines.length - 1);
      const lastLine = completeLines[completeLines.length - 1];
      const match = lastLine.match(/^(\d{3})([ -])(.*)$/);
      if (!match) return;

      // Continuation line (e.g. 250-SIZE) - keep reading until terminating line (250 OK)
      if (match[2] === '-') return;

      const code = parseInt(match[1], 10);
      const text = match[3];
      buffer = lines[lines.length - 1];

      if (code >= 400) {
        return done(new Error(`پاسخ سرور ایمیل (${code}): ${text || lastLine}`));
      }

      switch (step) {
        case 'BANNER':
          if (code === 220) {
            step = 'EHLO';
            socket.write('EHLO mail.techtink.ir\r\n');
          }
          break;

        case 'EHLO':
          if (code === 250) {
            if (auth && auth.user && auth.pass) {
              step = 'AUTH_LOGIN';
              socket.write('AUTH LOGIN\r\n');
            } else {
              step = 'MAIL_FROM';
              socket.write(`MAIL FROM:<${from}>\r\n`);
            }
          }
          break;

        case 'AUTH_LOGIN':
          if (code === 334) {
            step = 'AUTH_PASS';
            socket.write(`${Buffer.from(auth.user).toString('base64')}\r\n`);
          }
          break;

        case 'AUTH_PASS':
          if (code === 334) {
            step = 'AUTH_VERIFY';
            socket.write(`${Buffer.from(auth.pass).toString('base64')}\r\n`);
          }
          break;

        case 'AUTH_VERIFY':
          if (code === 235) {
            step = 'MAIL_FROM';
            socket.write(`MAIL FROM:<${from}>\r\n`);
          } else {
            done(new Error(`احراز هویت سرور ناموفق بود (${code}): ${text}`));
          }
          break;

        case 'MAIL_FROM':
          if (code === 250) {
            step = 'RCPT_TO';
            socket.write(`RCPT TO:<${to}>\r\n`);
          }
          break;

        case 'RCPT_TO':
          if (code === 250) {
            step = 'DATA_INIT';
            socket.write('DATA\r\n');
          }
          break;

        case 'DATA_INIT':
          if (code === 354) {
            step = 'DATA_SEND';
            socket.write(`${rawData}\r\n.\r\n`);
          }
          break;

        case 'DATA_SEND':
          if (code === 250) {
            step = 'QUIT';
            socket.write('QUIT\r\n');
          }
          break;

        case 'QUIT':
          done(null, { success: true, message: 'ایمیل با موفقیت تحویل داده شد', response: text });
          break;

        default:
          break;
      }
    });
  });
}

export async function sendOutgoingEmail({ from = 'info@techtink.ir', to, subject, bodyText = '', bodyHtml = '', relayConfig = null }) {
  if (!to || !to.includes('@')) {
    throw new Error('آدرس ایمیل گیرنده نامعتبر است.');
  }

  const senderAddress = (from || 'info@techtink.ir').trim();
  const recipientAddress = to.trim();

  let sentRecordId = null;
  try {
    const r = db.run(
      'INSERT INTO sent_emails (from_address, to_address, subject, body_text, body_html, status) VALUES (?, ?, ?, ?, ?, ?)',
      senderAddress, recipientAddress, subject || '(بدون عنوان)', bodyText, bodyHtml, 'sending'
    );
    sentRecordId = r.lastId;
  } catch (e) {
    console.error('[MailServer] Error saving sent_emails record:', e);
  }

  const rawData = buildMimeMessage({
    from: senderAddress,
    to: recipientAddress,
    subject: subject || '',
    bodyText,
    bodyHtml
  });

  try {
    const relayHost = relayConfig?.host || process.env.SMTP_RELAY_HOST;
    const relayPort = parseInt(relayConfig?.port || process.env.SMTP_RELAY_PORT || '587', 10);
    const relayUser = relayConfig?.user || process.env.SMTP_RELAY_USER;
    const relayPass = relayConfig?.pass || process.env.SMTP_RELAY_PASS;
    const relaySecure = relayConfig?.secure || process.env.SMTP_RELAY_SECURE === 'true' || relayPort === 465;

    if (relayHost) {
      await sendViaSmtpSocket({
        host: relayHost,
        port: relayPort,
        useTls: relaySecure,
        auth: relayUser && relayPass ? { user: relayUser, pass: relayPass } : null,
        from: senderAddress,
        to: recipientAddress,
        rawData
      });
    } else {
      const domain = recipientAddress.split('@')[1];
      let mxHosts = [];
      try {
        const records = await dns.promises.resolveMx(domain);
        if (records && records.length > 0) {
          records.sort((a, b) => a.priority - b.priority);
          mxHosts = records.map(r => r.exchange);
        }
      } catch (err) {
        console.warn(`[MailServer] MX lookup failed for ${domain}: ${err.message}. Trying direct A record.`);
      }

      if (mxHosts.length === 0) {
        mxHosts = [domain];
      }

      let delivered = false;
      let lastDeliveryError = null;

      for (const host of mxHosts) {
        try {
          await sendViaSmtpSocket({
            host,
            port: 25,
            useTls: false,
            from: senderAddress,
            to: recipientAddress,
            rawData,
            timeout: 20000
          });
          delivered = true;
          break;
        } catch (err) {
          lastDeliveryError = err;
          console.warn(`[MailServer] Delivery attempt to ${host} failed: ${err.message}`);
        }
      }

      if (!delivered) {
        throw new Error(lastDeliveryError?.message || `امکان تحویل مستقیم ایمیل به ${domain} روی پورت ۲۵ وجود نداشت.`);
      }
    }

    if (sentRecordId) {
      db.run('UPDATE sent_emails SET status = ?, error_message = NULL WHERE id = ?', 'sent', sentRecordId);
    }

    return {
      success: true,
      emailId: sentRecordId,
      message: 'ایمیل با موفقیت ارسال شد.'
    };
  } catch (err) {
    if (sentRecordId) {
      db.run('UPDATE sent_emails SET status = ?, error_message = ? WHERE id = ?', 'failed', err.message, sentRecordId);
    }
    throw err;
  }
}

// --- SMTP Server Implementation (RFC 5321) ---
export function startSmtpServer(portToUse = null) {
  if (smtpServerInstance) {
    return { success: true, message: `SMTP Server already running on port ${serverPort}` };
  }

  const preferredPort = portToUse || parseInt(process.env.SMTP_PORT, 10) || 25;
  serverPort = preferredPort;

  const server = net.createServer((socket) => {
    let state = 'INIT';
    let mailFrom = '';
    let rcptTo = [];
    let dataBuffer = '';

    socket.setTimeout(60000); // 1 minute timeout

    const clientInfo = `${socket.remoteAddress || 'unknown'}:${socket.remotePort || ''}`;
    console.log(`[MailServer] Incoming SMTP connection from ${clientInfo}`);

    const send = (code, msg) => {
      try {
        socket.write(`${code} ${msg}\r\n`);
      } catch {}
    };

    // Greeting
    send(220, 'techtink.ir ESMTP TechTink Mail Service Ready');

    let buffer = '';
    socket.on('data', (chunk) => {
      if (state === 'DATA') {
        dataBuffer += chunk.toString('utf8');
        const endIdx = dataBuffer.indexOf('\r\n.\r\n');
        const altEndIdx = dataBuffer.indexOf('\n.\n');
        const markerIdx = endIdx !== -1 ? endIdx : altEndIdx;
        const markerLen = endIdx !== -1 ? 5 : 3;

        if (markerIdx !== -1) {
          const cleanRaw = dataBuffer.slice(0, markerIdx);
          const remainder = dataBuffer.slice(markerIdx + markerLen);
          state = 'COMMAND';
          buffer = remainder;
          dataBuffer = '';

          const parsed = parseRawEmail(cleanRaw);

          if (!parsed.from && mailFrom) parsed.from = mailFrom;
          if (!parsed.to && rcptTo.length > 0) parsed.to = rcptTo.join(', ');

          const emailId = saveIncomingEmail({
            from: parsed.from,
            to: parsed.to,
            subject: parsed.subject,
            bodyText: parsed.bodyText,
            bodyHtml: parsed.bodyHtml,
            rawMessage: cleanRaw,
            verificationCode: parsed.verificationCode,
          });

          console.log(`[MailServer] ✓ New Email Received from ${clientInfo}! ID: ${emailId} | From: ${parsed.from} | To: ${parsed.to} | Subject: "${parsed.subject}" ${parsed.verificationCode ? `| Code: [${parsed.verificationCode}]` : ''}`);

          send(250, `2.0.0 Ok: queued as tt-${Date.now()}`);
          mailFrom = '';
          rcptTo = [];
        } else {
          return;
        }
      } else {
        buffer += chunk.toString('utf8');
      }

      // Process command lines
      while (buffer.includes('\n')) {
        const lineEnd = buffer.indexOf('\n');
        const rawLine = buffer.slice(0, lineEnd).trim();
        buffer = buffer.slice(lineEnd + 1);

        if (!rawLine) continue;

        const spaceIdx = rawLine.indexOf(' ');
        const verb = (spaceIdx !== -1 ? rawLine.slice(0, spaceIdx) : rawLine).toUpperCase();
        const arg = spaceIdx !== -1 ? rawLine.slice(spaceIdx + 1).trim() : '';

        switch (verb) {
          case 'HELO':
          case 'EHLO':
            send(250, `techtink.ir Hello ${arg || 'client'}, pleased to meet you\r\n250-8BITMIME\r\n250-SIZE 20971520\r\n250-VRFY\r\n250 OK`);
            state = 'COMMAND';
            break;

          case 'MAIL':
            if (arg.toUpperCase().startsWith('FROM:')) {
              mailFrom = arg.slice(5).replace(/[<>]/g, '').trim();
              send(250, '2.1.0 Sender Ok');
            } else {
              send(501, '5.5.4 Syntax: MAIL FROM:<address>');
            }
            break;

          case 'RCPT':
            if (arg.toUpperCase().startsWith('TO:')) {
              const recipient = arg.slice(3).replace(/[<>]/g, '').trim();
              rcptTo.push(recipient);
              send(250, '2.1.5 Recipient Ok');
            } else {
              send(501, '5.5.4 Syntax: RCPT TO:<address>');
            }
            break;

          case 'DATA':
            if (rcptTo.length === 0) {
              send(503, '5.5.1 Error: need RCPT command');
            } else {
              send(354, 'End data with <CR><LF>.<CR><LF>');
              state = 'DATA';
              dataBuffer = '';
            }
            break;

          case 'STARTTLS':
            send(454, '4.7.0 TLS not available, please proceed in plain text');
            break;

          case 'VRFY':
            send(252, '2.0.0 Cannot VRFY user, but will accept message and attempt delivery');
            break;

          case 'EXPN':
            send(502, '5.5.2 EXPN not supported');
            break;

          case 'HELP':
            send(214, '2.0.0 TechTink Mail Commands: HELO, EHLO, MAIL, RCPT, DATA, RSET, NOOP, QUIT, VRFY');
            break;

          case 'RSET':
            mailFrom = '';
            rcptTo = [];
            dataBuffer = '';
            state = 'COMMAND';
            send(250, '2.0.0 Reset state');
            break;

          case 'NOOP':
            send(250, '2.0.0 Ok');
            break;

          case 'QUIT':
            send(221, '2.0.0 techtink.ir Service closing transmission channel');
            socket.end();
            break;

          default:
            send(502, '5.5.2 Command not implemented');
            break;
        }
      }
    });

    socket.on('error', (err) => {
      console.log(`[MailServer] Socket error from ${clientInfo}: ${err.message}`);
    });
    socket.on('timeout', () => {
      send(421, '4.4.2 Timeout connection');
      socket.destroy();
    });
  });

  server.on('error', (err) => {
    lastError = err.message;
    isListening = false;
    console.error(`[MailServer] Failed to bind SMTP on port ${serverPort}: ${err.message}`);

    // If port 25 fails (e.g. non-root on local dev), fallback to 2525
    if (serverPort === 25 && (err.code === 'EACCES' || err.code === 'EADDRINUSE')) {
      console.log(`[MailServer] Retrying SMTP server on fallback port 2525...`);
      serverPort = 2525;
      try {
        server.listen(2525, '0.0.0.0');
      } catch {}
    }
  });

  server.on('listening', () => {
    isListening = true;
    lastError = null;
    console.log(`[MailServer] ✓ TechTink SMTP Receiver is listening on port ${serverPort} (0.0.0.0:${serverPort})`);
  });

  try {
    server.listen(serverPort, '0.0.0.0');
    smtpServerInstance = server;
  } catch (e) {
    lastError = e.message;
  }

  return { success: true, port: serverPort };
}

export function getMailServerStatus() {
  const emailStats = db.get('SELECT COUNT(*) as total, SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) as unread FROM inbox_emails') || { total: 0, unread: 0 };
  const sentStats = db.get('SELECT COUNT(*) as total FROM sent_emails') || { total: 0 };
  const lastEmail = db.get('SELECT * FROM inbox_emails ORDER BY id DESC LIMIT 1');

  return {
    isListening,
    port: serverPort,
    lastError,
    totalEmails: emailStats.total || 0,
    unreadEmails: emailStats.unread || 0,
    totalSent: sentStats.total || 0,
    mailbox: 'info@techtink.ir',
    lastEmail: lastEmail ? {
      id: lastEmail.id,
      from: lastEmail.from_address,
      subject: lastEmail.subject,
      verificationCode: lastEmail.verification_code,
      receivedAt: lastEmail.created_at,
    } : null,
    dnsInstructions: {
      mxType: 'MX',
      mxHost: '@ (techtink.ir)',
      mxTarget: 'mail.techtink.ir',
      mxPriority: 10,
      aType: 'A',
      aHost: 'mail',
      proxyStatus: 'DNS only (Grey Cloud in Cloudflare)',
    },
  };
}
