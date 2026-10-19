use lettre::message::header::ContentType;
use lettre::transport::smtp::authentication::Credentials;
use lettre::{AsyncSmtpTransport, AsyncTransport, Message, Tokio1Executor};
use sqlx::SqlitePool;

pub struct OutgoingEmailInput {
    pub from: String,
    pub to: String,
    pub subject: String,
    pub body_text: String,
    pub body_html: Option<String>,
}

pub async fn send_outgoing_email(
    pool: &SqlitePool,
    input: OutgoingEmailInput,
) -> Result<(), String> {
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

    // Check if admin configured custom SMTP relay in settings
    let relay_host: Option<String> = sqlx::query_scalar("SELECT value FROM settings WHERE key = 'smtp_relay_host'")
        .fetch_optional(pool)
        .await
        .ok()
        .flatten();

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
        .flatten();

    let relay_pass: Option<String> = sqlx::query_scalar("SELECT value FROM settings WHERE key = 'smtp_relay_pass'")
        .fetch_optional(pool)
        .await
        .ok()
        .flatten();

    let send_result = if let Some(ref host) = relay_host {
        let mut transport_builder = AsyncSmtpTransport::<Tokio1Executor>::starttls_relay(host)
            .map_err(|e| format!("SMTP relay init error: {}", e))?
            .port(relay_port);

        if let (Some(u), Some(p)) = (relay_user, relay_pass) {
            transport_builder = transport_builder.credentials(Credentials::new(u, p));
        }

        let transport = transport_builder.build();
        transport.send(email_msg).await
    } else {
        // Direct MX transport fallback or localhost delivery
        let transport = AsyncSmtpTransport::<Tokio1Executor>::builder_dangerous("127.0.0.1")
            .port(25)
            .build();
        transport.send(email_msg).await
    };

    match send_result {
        Ok(_) => {
            let _ = sqlx::query(
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
            Ok(())
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
