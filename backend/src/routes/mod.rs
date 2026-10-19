pub mod account;
pub mod admin;
pub mod dbtools;
pub mod payment;
pub mod public;
pub mod torob;

use crate::error::AppError;
use crate::routes::public::AppState;
use axum::{
    body::Bytes,
    extract::State,
    http::{header, HeaderMap, StatusCode},
    response::{Html, IntoResponse, Response},
    routing::{delete, get, patch, post, put},
    Json, Router,
};
use regex::Regex;
use serde_json::{json, Value};

// Cloudflare Email Routing Webhook: /api/webhook/email
async fn email_webhook_handler(
    State(state): State<AppState>,
    body_bytes: Bytes,
) -> Result<Json<Value>, AppError> {
    let raw_str = String::from_utf8_lossy(&body_bytes).to_string();

    let mut parsed_from = String::new();
    let mut parsed_to = "info@techtink.ir".to_string();
    let mut parsed_subject = String::new();
    let mut parsed_text = String::new();
    let mut parsed_html = String::new();

    if let Ok(json_body) = serde_json::from_str::<Value>(&raw_str) {
        if let Some(f) = json_body.get("from").and_then(|v| v.as_str()) {
            parsed_from = f.to_string();
        }
        if let Some(t) = json_body.get("to").and_then(|v| v.as_str()) {
            parsed_to = t.to_string();
        }
        if let Some(s) = json_body.get("subject").and_then(|v| v.as_str()) {
            parsed_subject = s.to_string();
        }
        if let Some(txt) = json_body.get("text").and_then(|v| v.as_str()) {
            parsed_text = txt.to_string();
        }
        if let Some(h) = json_body.get("html").and_then(|v| v.as_str()) {
            parsed_html = h.to_string();
        }
    } else {
        parsed_text = raw_str.clone();
    }

    let otp_re = Regex::new(r"(?i)(?:کد|code|otp|رمز|تایید)[:\s\-\.]*([0-9]{4,8})\b").unwrap();
    let digit_re = Regex::new(r"\b([0-9]{5,7})\b").unwrap();
    let search_content = format!("{} {} {}", parsed_subject, parsed_text, parsed_html);

    let code = otp_re
        .captures(&search_content)
        .and_then(|c| c.get(1).map(|m| m.as_str().to_string()))
        .or_else(|| {
            digit_re
                .captures(&search_content)
                .and_then(|c| c.get(1).map(|m| m.as_str().to_string()))
        });

    let res = sqlx::query(
        "INSERT INTO inbox_emails (from_address, to_address, subject, body_text, body_html, raw_message, verification_code, is_read, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0, datetime('now'))"
    )
    .bind(if parsed_from.is_empty() { "webhook@external.com" } else { &parsed_from })
    .bind(&parsed_to)
    .bind(&parsed_subject)
    .bind(&parsed_text)
    .bind(&parsed_html)
    .bind(&raw_str)
    .bind(&code)
    .execute(&state.pool)
    .await
    .map_err(|e| AppError::Database(e.to_string()))?;

    let email_id = res.last_insert_rowid();

    tracing::info!(
        "📥 [Cloudflare Email Webhook] Saved email ID: {} | From: {} | Code: {:?}",
        email_id,
        parsed_from,
        code
    );

    Ok(Json(json!({
        "success": true,
        "emailId": email_id,
        "verificationCode": code
    })))
}

pub fn create_api_router() -> Router<AppState> {
    Router::new()
        // Public store routes
        .route("/products", get(public::list_products))
        .route("/products/:slug", get(public::get_product))
        .route("/products/:slug/drivers", get(public::get_product_drivers))
        .route("/products/:slug/comments", get(public::get_product_comments))
        .route("/categories", get(public::get_categories))
        .route("/settings", get(public::get_settings))
        .route("/homepage", get(public::get_homepage))
        .route("/coupons/validate", post(public::validate_coupon))
        .route("/seo/info", get(public::get_seo_info))
        .route("/analytics/pageview", post(public::record_pageview))
        // Account routes
        .route("/account/register", post(account::register))
        .route("/account/login", post(account::login))
        .route("/account/profile", get(account::get_profile).put(account::update_profile))
        .route("/account/address", put(account::update_address))
        .route("/account/password", put(account::update_password))
        .route("/account/orders", get(account::get_user_orders))
        // Auth aliases (matching Node.js endpoints)
        .route("/auth/register", post(account::register))
        .route("/auth/login", post(account::login))
        .route("/auth/me", get(account::get_profile))
        .route("/auth/profile", get(account::get_profile).put(account::update_profile))
        .route("/auth/address", put(account::update_address))
        .route("/auth/password", put(account::update_password))
        // Payment & Checkout
        .route("/payment/checkout", post(payment::initiate_checkout))
        .route("/payment/verify", get(payment::verify_payment))
        // Torob integration
        .route("/torob/products", get(torob::torob_handler).post(torob::torob_handler))
        // Cloudflare Inbound Email Webhook
        .route("/webhook/email", post(email_webhook_handler))
        // Database Tools
        .route("/admin/db/tables", get(dbtools::list_tables))
        .route("/admin/db/tables/:name", get(dbtools::get_table_data))
        .route("/admin/db/tables/:name/:rowid", delete(dbtools::delete_table_row))
        .route("/admin/db/info", get(dbtools::get_db_info))
        .route("/admin/db/download", get(dbtools::download_db))
        .route("/admin/db/export-file", get(dbtools::download_db))
        .route("/admin/db/backups", get(dbtools::list_backups).post(dbtools::create_backup_endpoint))
        .route("/admin/db/query", post(dbtools::execute_query))
        .route("/admin/db/maintenance/:op", post(dbtools::run_maintenance))
        // Admin Operations
        .route("/admin/dashboard", get(admin::dashboard_handler))
        .route("/admin/stats", get(admin::dashboard_handler))
        .route("/admin/products", get(admin::list_admin_products).post(admin::create_product))
        .route("/admin/products/:id", put(admin::update_product).patch(admin::patch_product).delete(admin::delete_product))
        .route("/admin/products/:id/stock", post(admin::adjust_product_stock))
        .route("/admin/stock-log", get(admin::get_stock_log))
        .route("/admin/orders", get(admin::list_admin_orders))
        .route("/admin/orders/:id", put(admin::update_order))
        .route("/admin/comments", get(admin::list_admin_comments))
        .route("/admin/comments/:id", put(admin::moderate_comment).delete(admin::delete_comment))
        .route("/admin/users", get(admin::list_admin_users))
        .route("/admin/users/:id", put(admin::update_user))
        .route("/admin/blog", get(admin::list_admin_blog).post(admin::save_blog_post))
        .route("/admin/blog/:id", delete(admin::delete_blog_post))
        .route("/admin/faqs", get(admin::list_admin_faqs).post(admin::save_faq))
        .route("/admin/faqs/:id", delete(admin::delete_faq))
        .route("/admin/tickets", get(admin::list_admin_tickets))
        .route("/admin/tickets/:id", put(admin::update_ticket))
        .route("/admin/appointments", get(admin::list_admin_appointments))
        .route("/admin/appointments/:id", put(admin::update_appointment).delete(admin::delete_appointment))
        .route("/admin/inventory/shipments", get(admin::list_admin_shipments).post(admin::create_shipment))
        .route("/admin/inventory/stock-log", get(admin::list_inventory_stock_log))
        .route("/admin/settings", get(admin::get_admin_settings).patch(admin::patch_admin_settings))
        .route("/admin/homepage", get(admin::get_admin_homepage).put(admin::put_admin_homepage))
        .route("/admin/products/:slug/drivers", get(admin::list_product_drivers).post(admin::create_product_driver))
        .route("/admin/drivers/:id", delete(admin::delete_driver))
        .route("/admin/warranties", get(admin::list_admin_warranties).post(admin::create_warranty))
        .route("/admin/warranties/:serial", put(admin::update_warranty).delete(admin::delete_warranty))
        .route("/admin/coupons", get(admin::list_admin_coupons).post(admin::create_coupon))
        .route("/admin/coupons/:id", put(admin::update_coupon).delete(admin::delete_coupon))
        .route("/admin/coupons/:id/promote", post(admin::promote_coupon))
        .route("/admin/analytics", get(admin::get_admin_analytics))
        .route("/admin/analytics/clear", post(admin::clear_admin_analytics))
        .route("/admin/emails", get(admin::list_admin_emails))
        .route("/admin/emails/status", get(admin::get_admin_mail_server_status))
        .route("/admin/emails/send", post(admin::send_admin_email))
        .route("/admin/emails/sent", get(admin::list_admin_sent_emails))
        .route("/admin/emails/sent/:id", get(admin::get_admin_sent_email_by_id).delete(admin::delete_admin_sent_email))
        .route("/admin/emails/clear/inbox", delete(admin::clear_inbox_emails))
        .route("/admin/emails/clear/sent", delete(admin::clear_sent_emails))
        .route("/admin/emails/bulk-delete", post(admin::bulk_delete_emails))
        .route("/admin/emails/:id", get(admin::get_admin_inbox_email_by_id).delete(admin::delete_admin_inbox_email))
        .route("/admin/emails/:id/read", patch(admin::mark_admin_email_read))
        .route("/admin/system/metrics", get(admin::get_admin_system_metrics))
        .route("/admin/system/probe-port", post(admin::probe_system_port))
        .route("/admin/system/gc", post(admin::trigger_system_gc))
}
