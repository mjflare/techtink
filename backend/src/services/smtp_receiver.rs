use mail_parser::Message;
use regex::Regex;
use sqlx::SqlitePool;
use std::net::SocketAddr;
use std::sync::Arc;
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::net::{TcpListener, TcpStream};

pub async fn start_smtp_listener(pool: SqlitePool, requested_port: u16) {
    if requested_port == 0 {
        tracing::info!("SMTP Receiver is disabled (SMTP_PORT=0)");
        return;
    }

    let candidate_ports = if requested_port == 25 {
        vec![25, 2525]
    } else {
        vec![requested_port, 25, 2525]
    };

    let mut active_listener = None;

    for p in candidate_ports {
        let addr = SocketAddr::from(([0, 0, 0, 0], p));
        match TcpListener::bind(addr).await {
            Ok(l) => {
                tracing::info!("🚀 Native SMTP Server successfully listening on port {} (0.0.0.0:{})", p, p);
                active_listener = Some(l);
                break;
            }
            Err(e) => {
                tracing::warn!(
                    "Could not bind SMTP on port {}: {} (trying fallback...)",
                    p,
                    e
                );
            }
        }
    }

    let listener = match active_listener {
        Some(l) => l,
        None => {
            tracing::error!("SMTP Receiver failed: could not bind to port 25 or fallback port 2525.");
            return;
        }
    };

    let pool = Arc::new(pool);

    tokio::spawn(async move {
        loop {
            match listener.accept().await {
                Ok((socket, peer_addr)) => {
                    let pool_clone = pool.clone();
                    tokio::spawn(async move {
                        if let Err(e) = handle_smtp_connection(socket, peer_addr, pool_clone).await
                        {
                            tracing::debug!("SMTP session error with {}: {}", peer_addr, e);
                        }
                    });
                }
                Err(e) => {
                    tracing::error!("SMTP accept error: {}", e);
                }
            }
        }
    });
}

async fn handle_smtp_connection(
    mut stream: TcpStream,
    peer_addr: SocketAddr,
    pool: Arc<SqlitePool>,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let (reader, mut writer) = stream.split();
    let mut reader = BufReader::new(reader);

    // Initial 220 Greeting
    writer
        .write_all(b"220 techtink.ir ESMTP TechTink Mail Gateway Ready\r\n")
        .await?;

    let mut line = String::new();
    let mut from_addr = String::new();
    let mut to_addr = String::new();
    let mut is_data_mode = false;
    let mut raw_data = String::new();

    let otp_regex = Regex::new(r"(?i)(?:کد|code|otp|رمز|تایید)[:\s\-\.]*([0-9]{4,8})\b")?;
    let fallback_digit_regex = Regex::new(r"\b([0-9]{5,7})\b")?;

    loop {
        line.clear();
        let bytes_read = reader.read_line(&mut line).await?;
        if bytes_read == 0 {
            break; // Connection closed
        }

        if is_data_mode {
            if line.trim_end() == "." {
                // End of DATA received
                is_data_mode = false;

                // Parse with mail_parser
                let parsed = mail_parser::MessageParser::default().parse(raw_data.as_bytes());

                let subject = parsed
                    .as_ref()
                    .and_then(|m| m.subject())
                    .map(|s| s.to_string())
                    .unwrap_or_else(|| "بدون موضوع".to_string());

                let body_text = parsed
                    .as_ref()
                    .and_then(|m| m.body_text(0))
                    .map(|s| s.to_string())
                    .unwrap_or_default();

                let body_html = parsed
                    .as_ref()
                    .and_then(|m| m.body_html(0))
                    .map(|s| s.to_string())
                    .unwrap_or_default();

                // Extract verification code for eNamad / Torob OTP
                let content_to_search = format!("{} {}", subject, body_text);
                let verification_code = otp_regex
                    .captures(&content_to_search)
                    .and_then(|c| c.get(1).map(|m| m.as_str().to_string()))
                    .or_else(|| {
                        fallback_digit_regex
                            .captures(&content_to_search)
                            .and_then(|c| c.get(1).map(|m| m.as_str().to_string()))
                    });

                // Persist to inbox_emails table
                let _ = sqlx::query(
                    r#"INSERT INTO inbox_emails 
                    (from_address, to_address, subject, body_text, body_html, raw_message, verification_code, is_read, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 0, datetime('now'))"#,
                )
                .bind(if from_addr.is_empty() { "unknown@external.com" } else { &from_addr })
                .bind(if to_addr.is_empty() { "info@techtink.ir" } else { &to_addr })
                .bind(&subject)
                .bind(&body_text)
                .bind(&body_html)
                .bind(&raw_data)
                .bind(&verification_code)
                .execute(&*pool)
                .await;

                tracing::info!(
                    "📥 [SMTP] Received email for {} from {} | Subject: '{}' | Code: {:?}",
                    to_addr,
                    from_addr,
                    subject,
                    verification_code
                );

                writer
                    .write_all(b"250 2.0.0 Ok: message queued successfully\r\n")
                    .await?;
                raw_data.clear();
            } else {
                raw_data.push_str(&line);
            }
            continue;
        }

        let cmd = line.trim();
        let cmd_upper = cmd.to_uppercase();

        if cmd_upper.starts_with("EHLO") || cmd_upper.starts_with("HELO") {
            writer
                .write_all(b"250-techtink.ir at your service\r\n250-SIZE 20971520\r\n250-8BITMIME\r\n250-SMTPUTF8\r\n250 OK\r\n")
                .await?;
        } else if cmd_upper.starts_with("MAIL FROM:") {
            from_addr = cmd[10..]
                .trim()
                .trim_matches(|c| c == '<' || c == '>')
                .to_string();
            writer.write_all(b"250 2.1.0 Ok sender accepted\r\n").await?;
        } else if cmd_upper.starts_with("RCPT TO:") {
            to_addr = cmd[8..]
                .trim()
                .trim_matches(|c| c == '<' || c == '>')
                .to_string();
            writer
                .write_all(b"250 2.1.5 Ok recipient accepted\r\n")
                .await?;
        } else if cmd_upper == "DATA" {
            is_data_mode = true;
            raw_data.clear();
            writer
                .write_all(b"354 Start mail input; end with <CRLF>.<CRLF>\r\n")
                .await?;
        } else if cmd_upper == "RSET" {
            from_addr.clear();
            to_addr.clear();
            raw_data.clear();
            is_data_mode = false;
            writer.write_all(b"250 2.0.0 Ok reset state\r\n").await?;
        } else if cmd_upper == "NOOP" {
            writer.write_all(b"250 2.0.0 Ok\r\n").await?;
        } else if cmd_upper == "VRFY" {
            writer
                .write_all(b"252 2.0.0 Cannot VRFY user; message will be accepted\r\n")
                .await?;
        } else if cmd_upper == "QUIT" {
            writer.write_all(b"221 2.0.0 Bye\r\n").await?;
            break;
        } else if cmd_upper == "STARTTLS" {
            writer
                .write_all(b"454 4.7.0 TLS not supported on this plain port\r\n")
                .await?;
        } else {
            writer
                .write_all(b"500 5.5.1 Command unrecognized\r\n")
                .await?;
        }
    }

    Ok(())
}
