use crate::error::AppError;
use crate::routes::account::extract_claims;
use crate::routes::public::AppState;
use crate::services::pricing::{price_cart, CartInputItem};
use axum::{
    extract::{Query, State},
    http::HeaderMap,
    response::{Html, Redirect},
    Json,
};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};

#[derive(Debug, Deserialize)]
pub struct CheckoutInput {
    pub items: Vec<CartInputItem>,
    pub shipping_info: Value,
    pub payment_method: String, // "zarinpal", "card", "cod", etc.
    pub coupon_code: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct CheckoutInitiateResponse {
    pub order_id: i64,
    pub redirect_url: Option<String>,
    pub tracking_code: String,
    pub message: String,
}

pub async fn initiate_checkout(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(input): Json<CheckoutInput>,
) -> Result<Json<CheckoutInitiateResponse>, AppError> {
    let claims = extract_claims(&headers, &state.jwt_secret)?;
    let user_id: i64 = claims.sub.parse().unwrap_or(0);

    // 1. Recalculate price server-side
    let priced = price_cart(&state.pool, &input.items).await?;

    let shipping_fee: i64 = 0; // Free shipping
    let mut total = priced.subtotal + shipping_fee;
    let mut discount: i64 = 0;

    // Apply coupon if present
    if let Some(ref code) = input.coupon_code {
        let coupon: Option<crate::models::CouponRow> = sqlx::query_as(
            "SELECT * FROM coupons WHERE UPPER(code) = ? AND is_active = 1",
        )
        .bind(code.trim().to_uppercase())
        .fetch_optional(&state.pool)
        .await?;

        if let Some(c) = coupon {
            let disc = if c.discount_type == "percentage" {
                (priced.subtotal as f64 * (c.discount_value / 100.0)).round() as i64
            } else {
                c.discount_value as i64
            };
            discount = disc.min(priced.subtotal);
            total = (total - discount).max(0);

            // Increment coupon usage
            let _ = sqlx::query("UPDATE coupons SET usage_count = usage_count + 1 WHERE id = ?")
                .bind(c.id)
                .execute(&state.pool)
                .await;
        }
    }

    let tracking_code = format!("TT-{}", rand::random::<u32>() % 900000 + 100000);
    let shipping_json = serde_json::to_string(&input.shipping_info).unwrap_or_else(|_| "{}".to_string());

    // 2. Create Order in Database
    let mut tx = state.pool.begin().await?;

    let order_id = sqlx::query(
        "INSERT INTO orders (user_id, status, subtotal, shipping, total, discount, coupon_code, shipping_info, tracking_code, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))"
    )
    .bind(user_id)
    .bind(if input.payment_method == "cod" || input.payment_method == "card" { "processing" } else { "pending_payment" })
    .bind(priced.subtotal)
    .bind(shipping_fee)
    .bind(total)
    .bind(discount)
    .bind(&input.coupon_code)
    .bind(&shipping_json)
    .bind(&tracking_code)
    .execute(&mut *tx)
    .await?
    .last_insert_rowid();

    // Insert order items
    for line in &priced.lines {
        let config_str = serde_json::to_string(&line.config).unwrap_or_else(|_| "[]".to_string());
        sqlx::query(
            "INSERT INTO order_items (order_id, product_id, name, config, unit_price, qty)
             VALUES (?, ?, ?, ?, ?, ?)"
        )
        .bind(order_id)
        .bind(line.product_id)
        .bind(&line.name)
        .bind(&config_str)
        .bind(line.unit_price)
        .bind(line.qty)
        .execute(&mut *tx)
        .await?;

        // Decrement stock for COD or Card payment immediately
        if input.payment_method == "cod" || input.payment_method == "card" {
            sqlx::query("UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?")
                .bind(line.qty)
                .bind(line.product_id)
                .execute(&mut *tx)
                .await?;

            sqlx::query(
                "INSERT INTO stock_log (product_id, delta, reason, user_id, created_at)
                 VALUES (?, ?, ?, ?, datetime('now'))"
            )
            .bind(line.product_id)
            .bind(-line.qty)
            .bind(format!("ثبت سفارش #{} ({})", order_id, input.payment_method))
            .bind(user_id)
            .execute(&mut *tx)
            .await?;
        }
    }

    tx.commit().await?;

    if input.payment_method == "card" {
        return Ok(Json(CheckoutInitiateResponse {
            order_id,
            redirect_url: None,
            tracking_code,
            message: "سفارش شما ثبت شد. لطفاً تصویر رسید کارت‌به‌کارت را ارسال فرمایید.".to_string(),
        }));
    }

    if input.payment_method == "cod" {
        return Ok(Json(CheckoutInitiateResponse {
            order_id,
            redirect_url: None,
            tracking_code,
            message: "سفارش با روش پرداخت در محل با موفقیت ثبت گردید.".to_string(),
        }));
    }

    // Default ZarinPal Sandbox simulation URL or redirect
    let redirect_url = format!("/api/payment/verify?order_id={}&Authority=SIMULATED_ZP_AUTH_{}", order_id, tracking_code);

    Ok(Json(CheckoutInitiateResponse {
        order_id,
        redirect_url: Some(redirect_url),
        tracking_code,
        message: "در حال انتقال به درگاه امن شاپرک...".to_string(),
    }))
}

#[derive(Debug, Deserialize)]
pub struct VerifyPaymentQuery {
    pub order_id: Option<i64>,
    #[serde(rename = "Authority")]
    pub authority: Option<String>,
    #[serde(rename = "Status")]
    pub status: Option<String>,
}

pub async fn verify_payment(
    State(state): State<AppState>,
    Query(query): Query<VerifyPaymentQuery>,
) -> Result<Html<String>, AppError> {
    let order_id = query.order_id.unwrap_or(0);

    let order: Option<crate::models::OrderRow> = sqlx::query_as("SELECT * FROM orders WHERE id = ?")
        .bind(order_id)
        .fetch_optional(&state.pool)
        .await?;

    let order = match order {
        Some(o) => o,
        None => return Ok(Html("<h1>سفارش یافت نشد</h1>".to_string())),
    };

    let ref_id = format!("ZP-{}", rand::random::<u32>() % 90000000 + 10000000);

    // Atomically decrement stock and mark order as paid
    let mut tx = state.pool.begin().await?;

    sqlx::query("UPDATE orders SET status = 'paid' WHERE id = ?")
        .bind(order_id)
        .execute(&mut *tx)
        .await?;

    // Decrement stock for order items
    let items: Vec<(Option<i64>, i64)> = sqlx::query_as("SELECT product_id, qty FROM order_items WHERE order_id = ?")
        .bind(order_id)
        .fetch_all(&mut *tx)
        .await?;

    for (prod_id, qty) in items {
        if let Some(pid) = prod_id {
            sqlx::query("UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?")
                .bind(qty)
                .bind(pid)
                .execute(&mut *tx)
                .await?;
        }
    }

    sqlx::query(
        "INSERT INTO payments (order_id, gateway, authority, amount, status, ref_id, created_at)
         VALUES (?, 'zarinpal', ?, ?, 'verified', ?, datetime('now'))"
    )
    .bind(order_id)
    .bind(&query.authority)
    .bind(order.total)
    .bind(&ref_id)
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;

    let html = format!(
        r#"<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>تایید پرداخت | تک‌تینک</title>
  <style>
    body {{ font-family: system-ui, sans-serif; background: #080c14; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }}
    .card {{ background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 40px; text-align: center; max-width: 440px; width: 90%; }}
    .success-icon {{ font-size: 54px; margin-bottom: 16px; color: #10b981; }}
    .btn {{ display: inline-block; background: #06b6d4; color: #fff; padding: 12px 28px; border-radius: 12px; text-decoration: none; font-weight: bold; margin-top: 24px; }}
  </style>
</head>
<body>
  <div class="card">
    <div class="success-icon">✓</div>
    <h2 style="margin: 0 0 10px;">پرداخت با موفقیت انجام شد</h2>
    <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">سفارش شماره <strong>#{}</strong> با کد رهگیری بانکی <strong>{}</strong> با موفقیت در سیستم ثبت گردید.</p>
    <a href="/account" class="btn">مشاهده سفارش در پنل کاربری</a>
  </div>
</body>
</html>"#,
        order_id, ref_id
    );

    Ok(Html(html))
}
