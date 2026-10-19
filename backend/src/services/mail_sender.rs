use lettre::message::header::ContentType;
use lettre::transport::smtp::authentication::Credentials;
use lettre::{AsyncSmtpTransport, AsyncTransport, Message, Tokio1Executor};
use serde::Deserialize;
use sqlx::SqlitePool;

#[derive(Debug, Clone, Deserialize)]
pub struct SmtpRelayConfig {
    pub host: Option<String>,
    pub port: Option<u16>,
    pub user: Option<String>,
    pub pass: Option<String>,
    pub secure: Option<bool>,
}

pub struct OutgoingEmailInput {
    pub from: String,
    pub to: String,
    pub subject: String,
    pub body_text: String,
    pub body_html: Option<String>,
    pub relay_config: Option<SmtpRelayConfig>,
}

async fn get_stored_relay(pool: &SqlitePool) -> (Option<String>, u16, Option<String>, Option<String>, bool) {
    // 1. Try DB settings table
    let relay_host: Option<String> = sqlx::query_scalar("SELECT value FROM settings WHERE key = 'smtp_relay_host'")
        .fetch_optional(pool)
        .await
        .ok()
        .flatten()
        .filter(|s: &String| !s.trim().is_empty());

    let relay_port: u16 = sqlx::query_scalar("SELECT value FROM settings WHERE key = 'smtp_relay_port'")
        .fetch_optional(pool)
        .await
        .ok()
        .flatten()
        .and_then(|s: String| s.parse().ok())
        .unwrap_or(587);

    let relay_user: Option<String> = sqlx::query_scalar("SELECT value FROM settings WHERE key = 'smtp_relay_user'")
        .fetch_optional(pool)
        .await
        .ok()
        .flatten()
        .filter(|s: &String| !s.trim().is_empty());

    let relay_pass: Option<String> = sqlx::query_scalar("SELECT value FROM settings WHERE key = 'smtp_relay_pass'")
        .fetch_optional(pool)
        .await
        .ok()
        .flatten()
        .filter(|s: &String| !s.trim().is_empty());

    let relay_secure: bool = sqlx::query_scalar("SELECT value FROM settings WHERE key = 'smtp_relay_secure'")
        .fetch_optional(pool)
        .await
        .ok()
        .flatten()
        .map(|s: String| s == "true" || s == "1")
        .unwrap_or(false);

    if relay_host.is_some() {
        return (relay_host, relay_port, relay_user, relay_pass, relay_secure);
    }

    // 2. Try environment variables
    let env_host = std::env::var("SMTP_RELAY_HOST").ok().filter(|s| !s.trim().is_empty());
    let env_port: u16 = std::env::var("SMTP_RELAY_PORT").ok().and_then(|s| s.parse().ok()).unwrap_or(587);
    let env_user = std::env::var("SMTP_RELAY_USER").ok().filter(|s| !s.trim().is_empty());
    let env_pass = std::env::var("SMTP_RELAY_PASS").ok().filter(|s| !s.trim().is_empty());
    let env_secure = std::env::var("SMTP_RELAY_SECURE").ok().map(|s| s == "true" || s == "1").unwrap_or(false);

    (env_host, env_port, env_user, env_pass, env_secure)
}

async fn resolve_mx_hosts(domain: &str) -> Vec<String> {
    let mut mx_hosts = Vec::new();

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(5))
        .build();

    if let Ok(client) = client {
        // Query Google DoH for RFC 1035 MX records
        let url = format!("https://dns.google/resolve?name={}&type=MX", domain);
        if let Ok(resp) = client.get(&url).header("accept", "application/json").send().await {
            if let Ok(val) = resp.json::<serde_json::Value>().await {
                if let Some(answers) = val.get("Answer").and_then(|a| a.as_array()) {
                    let mut records: Vec<(u32, String)> = Vec::new();
                    for ans in answers {
                        if let Some(data) = ans.get("data").and_then(|d| d.as_str()) {
                            let parts: Vec<&str> = data.split_whitespace().collect();
                            if parts.len() >= 2 {
                                let prio: u32 = parts[0].parse().unwrap_or(10);
                                let host = parts[1].trim_end_matches('.').to_string();
                                records.push((prio, host));
                            } else if !data.is_empty() {
                                records.push((10, data.trim_end_matches('.').to_string()));
                            }
                        }
                    }
                    records.sort_by_key(|r| r.0);
                    for (_, h) in records {
                        if !mx_hosts.contains(&h) {
                            mx_hosts.push(h);
                        }
                    }
                }
            }
        }
    }

    if mx_hosts.is_empty() {
        // Fallbacks: mail.<domain> and <domain> directly
        mx_hosts.push(format!("mail.{}", domain));
        mx_hosts.push(domain.to_string());
    }

    mx_hosts
}

pub async fn send_outgoing_email(
    pool: &SqlitePool,
    input: OutgoingEmailInput,
) -> Result<i64, String> {
    let email_msg = Message::builder()
        .from(
            input
                .from
                .parse()
                .map_err(|e| format!("Invalid from address: {}", e))?,
        )
        .to(input
            .to
            .parse()
            .map_err(|e| format!("Invalid to address: {}", e))?)
        .subject(&input.subject)
        .header(if input.body_html.is_some() {
            ContentType::TEXT_HTML
        } else {
            ContentType::TEXT_PLAIN
        })
        .body(
            input
                .body_html
                .clone()
                .unwrap_or_else(|| input.body_text.clone()),
        )
        .map_err(|e| format!("Failed to build MIME message: {}", e))?;

    // Determine relay configuration
    let (relay_host, relay_port, relay_user, relay_pass, relay_secure) = {
        if let Some(ref r) = input.relay_config {
            if let Some(ref h) = r.host {
                if !h.trim().is_empty() {
                    (
                        Some(h.trim().to_string()),
                        r.port.unwrap_or(587),
                        r.user.clone().filter(|u| !u.trim().is_empty()),
                        r.pass.clone().filter(|p| !p.trim().is_empty()),
                        r.secure.unwrap_or(false),
                    )
                } else {
                    get_stored_relay(pool).await
                }
            } else {
                get_stored_relay(pool).await
            }
        } else {
            get_stored_relay(pool).await
        }
    };

    let send_result = if let Some(ref host) = relay_host {
        tracing::info!("Sending email via SMTP relay {}:{} (user: {:?})", host, relay_port, relay_user);
        let mut transport_builder = if relay_secure || relay_port == 465 {
            AsyncSmtpTransport::<Tokio1Executor>::relay(host)
                .map_err(|e| format!("SMTP relay init error: {}", e))?
                .port(relay_port)
        } else {
            AsyncSmtpTransport::<Tokio1Executor>::starttls_relay(host)
                .map_err(|e| format!("SMTP relay init error: {}", e))?
                .port(relay_port)
        };

        if let (Some(u), Some(p)) = (relay_user, relay_pass) {
            transport_builder = transport_builder.credentials(Credentials::new(u, p));
        }

        let transport = transport_builder
            .timeout(Some(std::time::Duration::from_secs(25)))
            .build();
        transport.send(email_msg).await.map(|_| ()).map_err(|e| e.to_string())
    } else {
        // Direct MX transport delivery to the recipient's mail exchange
        let recipient_domain = input.to.split('@').last().unwrap_or("").trim();
        let mx_hosts = resolve_mx_hosts(recipient_domain).await;

        let mut last_err = None;
        let mut success = false;

        for host in mx_hosts {
            tracing::info!("Attempting direct MX delivery to {}:25 for {}", host, input.to);
            let transport = AsyncSmtpTransport::<Tokio1Executor>::builder_dangerous(&host)
                .port(25)
                .timeout(Some(std::time::Duration::from_secs(15)))
                .build();

            match transport.send(email_msg.clone()).await {
                Ok(_) => {
                    success = true;
                    break;
                }
                Err(e) => {
                    tracing::warn!("Direct MX delivery to {}:25 failed: {}", host, e);
                    last_err = Some(e);
                }
            }
        }

        if success {
            Ok(())
        } else {
            let err = last_err.map(|e| e.to_string()).unwrap_or_else(|| {
                format!("امکان اتصال مستقیم به سرورهای MX دامنه {} روی پورت ۲۵ وجود نداشت.", recipient_domain)
            });
            Err(format!(
                "خطا در ارسال مستقیم ایمیل (پورت ۲۵ خروجی سرور ممکن است مسدود باشد): {}. پیشنهاد: لطفاً تنظیمات رله SMTP (پورت ۵۸۷ یا ۴۶۵) را در پنجره ارسال وارد فرمایید.",
                err
            ))
        }
    };

    match send_result {
        Ok(_) => {
            let res = sqlx::query(
                "INSERT INTO sent_emails (from_address, to_address, subject, body_text, body_html, status, created_at)
                 VALUES (?, ?, ?, ?, ?, 'sent', datetime('now'))"
            )
            .bind(&input.from)
            .bind(&input.to)
            .bind(&input.subject)
            .bind(&input.body_text)
            .bind(&input.body_html)
            .execute(pool)
            .await;

            let email_id = res.map(|r| r.last_insert_rowid()).unwrap_or(0);
            Ok(email_id)
        }
        Err(e) => {
            let err_msg = e.to_string();
            let _ = sqlx::query(
                "INSERT INTO sent_emails (from_address, to_address, subject, body_text, body_html, status, error_message, created_at)
                 VALUES (?, ?, ?, ?, ?, 'failed', ?, datetime('now'))"
            )
            .bind(&input.from)
            .bind(&input.to)
            .bind(&input.subject)
            .bind(&input.body_text)
            .bind(&input.body_html)
            .bind(&err_msg)
            .execute(pool)
            .await;

            Err(err_msg)
        }
    }
}
