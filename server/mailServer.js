// ==============================================================================
// TechTink Inbound Mail Server (SMTP Receiver & Webmail Layer)
// Listens on standard SMTP Port 25 (or SMTP_PORT in .env)
// Automatically receives incoming emails for info@techtink.ir, support@techtink.ir, etc.
// Parses RFC 5322 MIME messages, extracts verification codes (eNamad, Torob, etc.)
// and persists them into the SQLite database.
// ==============================================================================

import net from 'node:net';
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

    const send = (code, msg) => {
      try {
        socket.write(`${code} ${msg}\r\n`);
      } catch {}
    };

    // Greeting
    send(220, 'techtink.ir ESMTP TechTink Mail Service Ready');

    let buffer = '';
    socket.on('data', (chunk) => {
      buffer += chunk.toString('utf8');

      if (state === 'DATA') {
        // Collect raw email until ending sequence \r\n.\r\n or \n.\n
        dataBuffer += chunk.toString('utf8');
        if (dataBuffer.includes('\r\n.\r\n') || dataBuffer.includes('\n.\n')) {
          state = 'COMMAND';

          // Clean end marker
          const cleanRaw = dataBuffer.replace(/\r\n\.\r\n$/, '').replace(/\n\.\n$/, '');
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

          console.log(`[MailServer] ✓ New Email Received! ID: ${emailId} | From: ${parsed.from} | To: ${parsed.to} | Subject: "${parsed.subject}" ${parsed.verificationCode ? `| Code: [${parsed.verificationCode}]` : ''}`);

          send(250, `2.0.0 Ok: queued as tt-${Date.now()}`);
          dataBuffer = '';
          mailFrom = '';
          rcptTo = [];
        }
        return;
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
            send(250, `techtink.ir Hello ${arg || 'client'}, pleased to meet you\r\n250-8BITMIME\r\n250-SIZE 20971520\r\n250 OK`);
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

    socket.on('error', () => {});
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
  const lastEmail = db.get('SELECT * FROM inbox_emails ORDER BY id DESC LIMIT 1');

  return {
    isListening,
    port: serverPort,
    lastError,
    totalEmails: emailStats.total || 0,
    unreadEmails: emailStats.unread || 0,
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
