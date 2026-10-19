use crate::error::AppError;
use crate::models::{
    CouponRow, InboxEmailRow, OrderItemRow, OrderRow, ProductRow, SentEmailRow, User, WarrantyRow,
};
use crate::routes::dbtools::check_admin;
use crate::routes::public::AppState;
use crate::services::auth::{hash_password, Claims};
use crate::services::mail_sender::{send_outgoing_email, OutgoingEmailInput, SmtpRelayConfig};
use crate::services::pricing::serialize_product;
use crate::services::smtp_receiver::sanitize_mojibake;
use crate::services::system::{get_full_system_metrics, probe_tcp_port};
use axum::{
    extract::{Path, Query, State},
    http::HeaderMap,
    Json,
};
use regex::Regex;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use sqlx::{Column, Row};
use std::collections::HashMap;

#[derive(Debug, Deserialize)]
pub struct AdminQuery {
    pub token: Option<String>,
    pub status: Option<String>,
    pub q: Option<String>,
    pub product: Option<i64>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
    pub search: Option<String>,
    #[serde(rename = "unreadOnly")]
    pub unread_only: Option<String>,
}

fn slugify(s: &str) -> String {
    let re = Regex::new(r"[^a-zA-Z0-9\u{0600}-\u{06FF}]+").unwrap();
    let replaced = re.replace_all(s.trim(), "-");
    replaced.trim_matches('-').to_lowercase()
}

// ---------- 1. Dashboard & Stats ----------
pub async fn get_dashboard_data(state: &AppState) -> Result<Value, AppError> {
    let low_stock_threshold: i64 = sqlx::query_scalar("SELECT value FROM settings WHERE key = 'low_stock_threshold'")
        .fetch_optional(&state.pool)
        .await
        .ok()
        .flatten()
        .and_then(|s: String| s.parse().ok())
        .unwrap_or(5);

    let revenue: i64 = sqlx::query_scalar("SELECT COALESCE(SUM(total), 0) FROM orders WHERE status IN ('paid','paid_backorder','processing','shipped','delivered')")
        .fetch_one(&state.pool)
        .await
        .unwrap_or(0);

    let orders_total: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM orders")
        .fetch_one(&state.pool)
        .await
        .unwrap_or(0);

    let orders_paid: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM orders WHERE status IN ('paid','paid_backorder')")
        .fetch_one(&state.pool)
        .await
        .unwrap_or(0);

    let customers: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM users WHERE role = 'customer'")
        .fetch_one(&state.pool)
        .await
        .unwrap_or(0);

    let pending_comments: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM comments WHERE status = 'pending'")
        .fetch_one(&state.pool)
        .await
        .unwrap_or(0);

    let open_tickets: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM tickets WHERE status = 'open'")
        .fetch_one(&state.pool)
        .await
        .unwrap_or(0);

    let low_stock_rows = sqlx::query("SELECT id, name, slug, stock FROM products WHERE active = 1 AND stock <= ? ORDER BY stock")
        .bind(low_stock_threshold)
        .fetch_all(&state.pool)
        .await
        .unwrap_or_default();

    let low_stock: Vec<Value> = low_stock_rows
        .into_iter()
        .map(|r| {
            json!({
                "id": r.get::<i64, _>("id"),
                "name": r.get::<String, _>("name"),
                "slug": r.get::<String, _>("slug"),
                "stock": r.get::<i64, _>("stock"),
            })
        })
        .collect();

    let recent_orders_rows = sqlx::query(
        "SELECT o.id, o.total, o.status, o.created_at AS createdAt, u.name AS customer
         FROM orders o JOIN users u ON u.id = o.user_id ORDER BY o.id DESC LIMIT 8"
    )
    .fetch_all(&state.pool)
    .await
    .unwrap_or_default();

    let recent_orders: Vec<Value> = recent_orders_rows
        .into_iter()
        .map(|r| {
            json!({
                "id": r.get::<i64, _>("id"),
                "total": r.get::<i64, _>("total"),
                "status": r.get::<String, _>("status"),
                "createdAt": r.get::<String, _>("createdAt"),
                "customer": r.get::<String, _>("customer"),
            })
        })
        .collect();

    let total_products: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM products").fetch_one(&state.pool).await.unwrap_or(0);
    let total_stock: i64 = sqlx::query_scalar("SELECT COALESCE(SUM(stock), 0) FROM products").fetch_one(&state.pool).await.unwrap_or(0);
    let total_users: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM users").fetch_one(&state.pool).await.unwrap_or(0);
    let appointments_total: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM appointments").fetch_one(&state.pool).await.unwrap_or(0);
    let pending_appointments: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM appointments WHERE status = 'pending'").fetch_one(&state.pool).await.unwrap_or(0);
    let confirmed_appointments: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM appointments WHERE status = 'confirmed'").fetch_one(&state.pool).await.unwrap_or(0);
    let inbound_shipments: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM inventory_shipments WHERE type = 'inbound'").fetch_one(&state.pool).await.unwrap_or(0);
    let outbound_shipments: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM inventory_shipments WHERE type = 'outbound'").fetch_one(&state.pool).await.unwrap_or(0);
    let total_blog_posts: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM blog_posts").fetch_one(&state.pool).await.unwrap_or(0);

    let status_paid: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM orders WHERE status = 'paid'").fetch_one(&state.pool).await.unwrap_or(0);
    let status_processing: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM orders WHERE status = 'processing'").fetch_one(&state.pool).await.unwrap_or(0);
    let status_shipped: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM orders WHERE status = 'shipped'").fetch_one(&state.pool).await.unwrap_or(0);
    let status_delivered: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM orders WHERE status = 'delivered'").fetch_one(&state.pool).await.unwrap_or(0);
    let status_pending: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM orders WHERE status = 'pending_payment'").fetch_one(&state.pool).await.unwrap_or(0);

    Ok(json!({
        "revenue": revenue,
        "ordersTotal": orders_total,
        "ordersPaid": orders_paid,
        "customers": customers,
        "pendingComments": pending_comments,
        "openTickets": open_tickets,
        "lowStock": low_stock,
        "recentOrders": recent_orders,
        "totalProducts": total_products,
        "totalStock": total_stock,
        "totalOrders": orders_total,
        "totalRevenue": revenue,
        "totalUsers": total_users,
        "paidOrdersCount": orders_paid,
        "appointmentsTotal": appointments_total,
        "pendingAppointments": pending_appointments,
        "confirmedAppointments": confirmed_appointments,
        "inboundShipments": inbound_shipments,
        "outboundShipments": outbound_shipments,
        "totalBlogPosts": total_blog_posts,
        "statusBreakdown": {
            "paid": status_paid,
            "processing": status_processing,
            "shipped": status_shipped,
            "delivered": status_delivered,
            "pending": status_pending
        }
    }))
}

pub async fn dashboard_handler(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(query): Query<AdminQuery>,
) -> Result<Json<Value>, AppError> {
    check_admin(&headers, query.token.as_deref(), &state.config.token_secret)?;
    let data = get_dashboard_data(&state).await?;
    Ok(Json(data))
}

// ---------- 2. Products Management ----------
pub async fn list_admin_products(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(query): Query<AdminQuery>,
) -> Result<Json<Vec<crate::models::SerializedProduct>>, AppError> {
    check_admin(&headers, query.token.as_deref(), &state.config.token_secret)?;

    let rows: Vec<ProductRow> = sqlx::query_as::<_, ProductRow>("SELECT * FROM products ORDER BY id DESC")
        .fetch_all(&state.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

    let mut result = Vec::new();
    for p in rows {
        result.push(serialize_product(&state.pool, &p, true).await);
    }

    Ok(Json(result))
}

#[derive(Debug, Deserialize)]
pub struct ProductInput {
    pub slug: Option<String>,
    pub name: Option<String>,
    pub tagline: Option<String>,
    pub category: Option<String>,
    pub series: Option<String>,
    pub badge: Option<String>,
    pub description: Option<String>,
    #[serde(rename = "basePrice")]
    pub base_price: Option<i64>,
    #[serde(rename = "oldPrice")]
    pub old_price: Option<i64>,
    pub stock: Option<i64>,
    #[serde(rename = "stockCount")]
    pub stock_count: Option<i64>,
    pub active: Option<bool>,
    pub guarantee: Option<String>,
    pub image: Option<String>,
    pub images: Option<Vec<String>>,
    pub specs: Option<Value>,
    pub highlights: Option<Value>,
    #[serde(rename = "expertReview")]
    pub expert_review: Option<Value>,
    #[serde(rename = "cpuBrand")]
    pub cpu_brand: Option<String>,
    #[serde(rename = "gpuBrand")]
    pub gpu_brand: Option<String>,
    pub chassis: Option<String>,
    #[serde(rename = "model3d_url")]
    pub model3d_url: Option<String>,
    pub upgrades: Option<Value>,
}

async fn save_product(
    pool: &sqlx::SqlitePool,
    id: Option<i64>,
    b: ProductInput,
    user_id: Option<i64>,
) -> Result<i64, AppError> {
    let name = b.name.unwrap_or_default();
    let initial_slug = b.slug.unwrap_or_else(|| name.clone());
    let slug = slugify(&initial_slug);

    if name.is_empty() || slug.is_empty() {
        return Err(AppError::BadRequest("نام و نامک (slug) محصول الزامی است.".to_string()));
    }

    let clash: Option<i64> = sqlx::query_scalar("SELECT id FROM products WHERE slug = ? AND id != ?")
        .bind(&slug)
        .bind(id.unwrap_or(0))
        .fetch_optional(pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

    if clash.is_some() {
        return Err(AppError::BadRequest("این نامک قبلاً استفاده شده است.".to_string()));
    }

    let specs_json = b.specs.unwrap_or_else(|| json!({}));
    let specs_str = specs_json.to_string();

    let cpu_brand = b.cpu_brand.unwrap_or_else(|| {
        let cpu_str = specs_json.get("cpu").and_then(|v| v.as_str()).unwrap_or("").to_lowercase();
        if cpu_str.contains("amd") { "AMD".to_string() } else { "Intel".to_string() }
    });

    let gpu_brand = b.gpu_brand.unwrap_or_else(|| {
        let gpu_str = specs_json.get("gpu").and_then(|v| v.as_str()).unwrap_or("").to_lowercase();
        if gpu_str.contains("nvidia") || gpu_str.contains("rtx") {
            "NVIDIA".to_string()
        } else if gpu_str.contains("amd") {
            "AMD".to_string()
        } else {
            "Intel".to_string()
        }
    });

    let expert_review_str = b.expert_review.map(|v| v.to_string()).unwrap_or_else(|| "{}".to_string());
    let chassis = b.chassis.unwrap_or_else(|| {
        specs_json.get("chassis").and_then(|v| v.as_str()).unwrap_or("All-Aluminum CNC Machined").to_string()
    });
    let model3d_url = b.model3d_url.or_else(|| specs_json.get("model3d_url").and_then(|v| v.as_str()).map(|s| s.to_string()));

    let image_primary = b.images.as_ref().and_then(|imgs| imgs.first()).cloned().or(b.image.clone()).unwrap_or_default();
    let highlights_str = b.highlights.map(|v| v.to_string()).unwrap_or_else(|| "[]".to_string());
    let active_int: i64 = if b.active == Some(false) { 0 } else { 1 };
    let stock_val: i64 = b.stock_count.or(b.stock).unwrap_or(0);
    let base_price = b.base_price.unwrap_or(0);
    let old_price = b.old_price;

    let target_pid = if let Some(existing_id) = id {
        sqlx::query(
            "UPDATE products SET slug=?, name=?, tagline=?, category=?, series=?, badge=?, description=?,
             base_price=?, old_price=?, active=?, guarantee=?, image=?, specs=?, highlights=?, expert_review=?,
             cpu_brand=?, gpu_brand=?, chassis=?, model3d_url=?, updated_at=datetime('now') WHERE id=?"
        )
        .bind(&slug)
        .bind(&name)
        .bind(b.tagline.as_deref().unwrap_or(""))
        .bind(b.category.as_deref().unwrap_or(""))
        .bind(b.series.as_deref().unwrap_or(""))
        .bind(b.badge.as_deref().unwrap_or(""))
        .bind(b.description.as_deref().unwrap_or(""))
        .bind(base_price)
        .bind(old_price)
        .bind(active_int)
        .bind(b.guarantee.as_deref().unwrap_or(""))
        .bind(&image_primary)
        .bind(&specs_str)
        .bind(&highlights_str)
        .bind(&expert_review_str)
        .bind(&cpu_brand)
        .bind(&gpu_brand)
        .bind(&chassis)
        .bind(model3d_url.as_deref())
        .bind(existing_id)
        .execute(pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

        if b.stock.is_some() || b.stock_count.is_some() {
            let cur_stock: i64 = sqlx::query_scalar("SELECT stock FROM products WHERE id = ?")
                .bind(existing_id)
                .fetch_one(pool)
                .await
                .unwrap_or(0);

            if cur_stock != stock_val {
                let _ = sqlx::query("UPDATE products SET stock = ? WHERE id = ?")
                    .bind(stock_val)
                    .bind(existing_id)
                    .execute(pool)
                    .await;

                let _ = sqlx::query("INSERT INTO stock_log (product_id, delta, reason, user_id) VALUES (?, ?, ?, ?)")
                    .bind(existing_id)
                    .bind(stock_val - cur_stock)
                    .bind("ویرایش موجودی توسط مدیر")
                    .bind(user_id)
                    .execute(pool)
                    .await;
            }
        }
        existing_id
    } else {
        let res = sqlx::query(
            "INSERT INTO products (slug, name, tagline, category, series, badge, description, base_price,
             old_price, active, guarantee, image, specs, highlights, expert_review, cpu_brand, gpu_brand,
             chassis, model3d_url, stock) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)"
        )
        .bind(&slug)
        .bind(&name)
        .bind(b.tagline.as_deref().unwrap_or(""))
        .bind(b.category.as_deref().unwrap_or(""))
        .bind(b.series.as_deref().unwrap_or(""))
        .bind(b.badge.as_deref().unwrap_or(""))
        .bind(b.description.as_deref().unwrap_or(""))
        .bind(base_price)
        .bind(old_price)
        .bind(active_int)
        .bind(b.guarantee.as_deref().unwrap_or(""))
        .bind(&image_primary)
        .bind(&specs_str)
        .bind(&highlights_str)
        .bind(&expert_review_str)
        .bind(&cpu_brand)
        .bind(&gpu_brand)
        .bind(&chassis)
        .bind(model3d_url.as_deref())
        .bind(stock_val)
        .execute(pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

        let new_id = res.last_insert_rowid();
        if stock_val > 0 {
            let _ = sqlx::query("INSERT INTO stock_log (product_id, delta, reason, user_id) VALUES (?, ?, ?, ?)")
                .bind(new_id)
                .bind(stock_val)
                .bind("موجودی اولیه")
                .bind(user_id)
                .execute(pool)
                .await;
        }
        new_id
    };

    if let Some(upgrades_obj) = b.upgrades {
        let _ = sqlx::query("DELETE FROM product_variants WHERE product_id = ?")
            .bind(target_pid)
            .execute(pool)
            .await;

        for vtype in ["ram", "storage", "display"] {
            if let Some(arr) = upgrades_obj.get(vtype).and_then(|v| v.as_array()) {
                for (i, item) in arr.iter().enumerate() {
                    let vname = item.get("name").and_then(|n| n.as_str()).unwrap_or("");
                    let vprice = item.get("price").and_then(|p| p.as_i64()).unwrap_or(0);
                    if !vname.is_empty() {
                        let _ = sqlx::query("INSERT INTO product_variants (product_id, type, name, price, sort) VALUES (?, ?, ?, ?, ?)")
                            .bind(target_pid)
                            .bind(vtype)
                            .bind(vname)
                            .bind(vprice)
                            .bind(i as i64)
                            .execute(pool)
                            .await;
                    }
                }
            }
        }
    }

    if let Some(images_arr) = b.images {
        let _ = sqlx::query("DELETE FROM product_images WHERE product_id = ?")
            .bind(target_pid)
            .execute(pool)
            .await;

        for (i, url) in images_arr.into_iter().enumerate() {
            if !url.trim().is_empty() {
                let _ = sqlx::query("INSERT INTO product_images (product_id, url, sort) VALUES (?, ?, ?)")
                    .bind(target_pid)
                    .bind(url.trim())
                    .bind(i as i64)
                    .execute(pool)
                    .await;
            }
        }
    }

    Ok(target_pid)
}

pub async fn create_product(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(query): Query<AdminQuery>,
    Json(input): Json<ProductInput>,
) -> Result<Json<crate::models::SerializedProduct>, AppError> {
    let claims = check_admin(&headers, query.token.as_deref(), &state.config.token_secret)?;
    let user_id = claims.sub.parse::<i64>().ok();

    let pid = save_product(&state.pool, None, input, user_id).await?;
    let p: ProductRow = sqlx::query_as::<_, ProductRow>("SELECT * FROM products WHERE id = ?")
        .bind(pid)
        .fetch_one(&state.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

    Ok(Json(serialize_product(&state.pool, &p, true).await))
}

pub async fn update_product(
    State(state): State<AppState>,
    Path(id): Path<i64>,
    headers: HeaderMap,
    Query(query): Query<AdminQuery>,
    Json(input): Json<ProductInput>,
) -> Result<Json<crate::models::SerializedProduct>, AppError> {
    let claims = check_admin(&headers, query.token.as_deref(), &state.config.token_secret)?;
    let user_id = claims.sub.parse::<i64>().ok();

    save_product(&state.pool, Some(id), input, user_id).await?;
    let p: ProductRow = sqlx::query_as::<_, ProductRow>("SELECT * FROM products WHERE id = ?")
        .bind(id)
        .fetch_one(&state.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

    Ok(Json(serialize_product(&state.pool, &p, true).await))
}

#[derive(Debug, Deserialize)]
pub struct PatchProductInput {
    pub stock: Option<i64>,
    #[serde(rename = "stockCount")]
    pub stock_count: Option<i64>,
    #[serde(rename = "basePrice")]
    pub base_price: Option<i64>,
    pub badge: Option<String>,
    pub active: Option<bool>,
}

pub async fn patch_product(
    State(state): State<AppState>,
    Path(id): Path<i64>,
    headers: HeaderMap,
    Query(query): Query<AdminQuery>,
    Json(input): Json<PatchProductInput>,
) -> Result<Json<crate::models::SerializedProduct>, AppError> {
    let claims = check_admin(&headers, query.token.as_deref(), &state.config.token_secret)?;
    let user_id = claims.sub.parse::<i64>().ok();

    let p: ProductRow = sqlx::query_as::<_, ProductRow>("SELECT * FROM products WHERE id = ?")
        .bind(id)
        .fetch_optional(&state.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?
        .ok_or_else(|| AppError::NotFound("محصول یافت نشد.".to_string()))?;

    let stock = input.stock_count.or(input.stock).unwrap_or(p.stock);
    let price = input.base_price.unwrap_or(p.base_price);
    let badge = input.badge.or(p.badge.clone());
    let active = input.active.map(|a| if a { 1 } else { 0 }).unwrap_or(p.active);

    sqlx::query("UPDATE products SET stock = ?, base_price = ?, badge = ?, active = ?, updated_at = datetime('now') WHERE id = ?")
        .bind(stock)
        .bind(price)
        .bind(badge)
        .bind(active)
        .bind(p.id)
        .execute(&state.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

    if stock != p.stock {
        let _ = sqlx::query("INSERT INTO stock_log (product_id, delta, reason, user_id) VALUES (?, ?, ?, ?)")
            .bind(p.id)
            .bind(stock - p.stock)
            .bind("ویرایش موجودی توسط مدیر")
            .bind(user_id)
            .execute(&state.pool)
            .await;
    }

    let updated: ProductRow = sqlx::query_as::<_, ProductRow>("SELECT * FROM products WHERE id = ?")
        .bind(p.id)
        .fetch_one(&state.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

    Ok(Json(serialize_product(&state.pool, &updated, true).await))
}

pub async fn delete_product(
    State(state): State<AppState>,
    Path(id): Path<i64>,
    headers: HeaderMap,
    Query(query): Query<AdminQuery>,
) -> Result<Json<Value>, AppError> {
    check_admin(&headers, query.token.as_deref(), &state.config.token_secret)?;

    let used_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM order_items WHERE product_id = ?")
        .bind(id)
        .fetch_one(&state.pool)
        .await
        .unwrap_or(0);

    if used_count > 0 {
        sqlx::query("UPDATE products SET active = 0 WHERE id = ?")
            .bind(id)
            .execute(&state.pool)
            .await
            .map_err(|e| AppError::Database(e.to_string()))?;
        return Ok(Json(json!({ "success": true, "message": "این محصول در سفارش‌ها استفاده شده و به‌جای حذف، غیرفعال شد." })));
    }

    sqlx::query("DELETE FROM products WHERE id = ?")
        .bind(id)
        .execute(&state.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

    Ok(Json(json!({ "success": true })))
}

#[derive(Debug, Deserialize)]
pub struct AdjustStockInput {
    pub mode: Option<String>,
    pub value: i64,
    pub reason: Option<String>,
}

pub async fn adjust_product_stock(
    State(state): State<AppState>,
    Path(id): Path<i64>,
    headers: HeaderMap,
    Query(query): Query<AdminQuery>,
    Json(input): Json<AdjustStockInput>,
) -> Result<Json<Value>, AppError> {
    let claims = check_admin(&headers, query.token.as_deref(), &state.config.token_secret)?;
    let user_id = claims.sub.parse::<i64>().ok();

    let cur_stock: i64 = sqlx::query_scalar("SELECT stock FROM products WHERE id = ?")
        .bind(id)
        .fetch_optional(&state.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?
        .ok_or_else(|| AppError::NotFound("محصول یافت نشد.".to_string()))?;

    let delta = if input.mode.as_deref() == Some("set") {
        input.value - cur_stock
    } else {
        input.value
    };

    if cur_stock + delta < 0 {
        return Err(AppError::BadRequest("موجودی نمی‌تواند منفی شود.".to_string()));
    }

    let new_stock = cur_stock + delta;
    sqlx::query("UPDATE products SET stock = ?, updated_at = datetime('now') WHERE id = ?")
        .bind(new_stock)
        .bind(id)
        .execute(&state.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

    let reason = input.reason.unwrap_or_else(|| {
        if delta >= 0 { "ورود کالا".to_string() } else { "اصلاح موجودی".to_string() }
    });

    let _ = sqlx::query("INSERT INTO stock_log (product_id, delta, reason, user_id) VALUES (?, ?, ?, ?)")
        .bind(id)
        .bind(delta)
        .bind(reason)
        .bind(user_id)
        .execute(&state.pool)
        .await;

    Ok(Json(json!({ "stock": new_stock })))
}

pub async fn get_stock_log(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(query): Query<AdminQuery>,
) -> Result<Json<Value>, AppError> {
    check_admin(&headers, query.token.as_deref(), &state.config.token_secret)?;

    let rows = if let Some(pid) = query.product {
        sqlx::query(
            "SELECT l.id, l.delta, l.reason, l.created_at AS createdAt, p.name AS product, u.name AS user
             FROM stock_log l JOIN products p ON p.id = l.product_id LEFT JOIN users u ON u.id = l.user_id
             WHERE l.product_id = ? ORDER BY l.id DESC LIMIT 200"
        )
        .bind(pid)
        .fetch_all(&state.pool)
        .await
        .unwrap_or_default()
    } else {
        sqlx::query(
            "SELECT l.id, l.delta, l.reason, l.created_at AS createdAt, p.name AS product, u.name AS user
             FROM stock_log l JOIN products p ON p.id = l.product_id LEFT JOIN users u ON u.id = l.user_id
             ORDER BY l.id DESC LIMIT 200"
        )
        .fetch_all(&state.pool)
        .await
        .unwrap_or_default()
    };

    let list: Vec<Value> = rows
        .into_iter()
        .map(|r| {
            json!({
                "id": r.get::<i64, _>("id"),
                "delta": r.get::<i64, _>("delta"),
                "reason": r.get::<String, _>("reason"),
                "createdAt": r.get::<String, _>("createdAt"),
                "product": r.get::<String, _>("product"),
                "user": r.get::<Option<String>, _>("user"),
            })
        })
        .collect();

    Ok(Json(json!(list)))
}

// ---------- 3. Orders Management ----------
pub async fn list_admin_orders(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(query): Query<AdminQuery>,
) -> Result<Json<Value>, AppError> {
    check_admin(&headers, query.token.as_deref(), &state.config.token_secret)?;

    let query_sql = if let Some(ref st) = query.status {
        format!(
            "SELECT o.*, u.name AS customer, u.mobile AS customer_mobile, u.email AS customer_email
             FROM orders o JOIN users u ON u.id = o.user_id WHERE o.status = '{}' ORDER BY o.id DESC LIMIT 300",
            st.replace('\'', "''")
        )
    } else {
        "SELECT o.*, u.name AS customer, u.mobile AS customer_mobile, u.email AS customer_email
         FROM orders o JOIN users u ON u.id = o.user_id ORDER BY o.id DESC LIMIT 300"
            .to_string()
    };

    let rows = sqlx::query(&query_sql)
        .fetch_all(&state.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

    let mut result = Vec::new();
    for r in rows {
        let order_id: i64 = r.get("id");
        let items: Vec<OrderItemRow> = sqlx::query_as::<_, OrderItemRow>("SELECT * FROM order_items WHERE order_id = ?")
            .bind(order_id)
            .fetch_all(&state.pool)
            .await
            .unwrap_or_default();

        let shipping_info_str: String = r.get("shipping_info");
        let shipping_info: Value = serde_json::from_str(&shipping_info_str).unwrap_or(json!({}));

        result.push(json!({
            "id": order_id,
            "userId": r.get::<i64, _>("user_id"),
            "status": r.get::<String, _>("status"),
            "subtotal": r.get::<i64, _>("subtotal"),
            "shipping": r.get::<i64, _>("shipping"),
            "total": r.get::<i64, _>("total"),
            "trackingCode": r.get::<Option<String>, _>("tracking_code"),
            "discount": r.get::<Option<i64>, _>("discount"),
            "couponCode": r.get::<Option<String>, _>("coupon_code"),
            "createdAt": r.get::<String, _>("created_at"),
            "shippingInfo": shipping_info,
            "items": items,
            "customer": r.get::<String, _>("customer"),
            "customerMobile": r.get::<Option<String>, _>("customer_mobile"),
            "customerEmail": r.get::<Option<String>, _>("customer_email"),
        }));
    }

    Ok(Json(json!(result)))
}

#[derive(Debug, Deserialize)]
pub struct UpdateOrderInput {
    pub status: Option<String>,
    #[serde(rename = "trackingCode")]
    pub tracking_code: Option<String>,
}

pub async fn update_order(
    State(state): State<AppState>,
    Path(id): Path<i64>,
    headers: HeaderMap,
    Query(query): Query<AdminQuery>,
    Json(input): Json<UpdateOrderInput>,
) -> Result<Json<Value>, AppError> {
    check_admin(&headers, query.token.as_deref(), &state.config.token_secret)?;

    let existing: Option<OrderRow> = sqlx::query_as::<_, OrderRow>("SELECT * FROM orders WHERE id = ?")
        .bind(id)
        .fetch_optional(&state.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

    let o = match existing {
        Some(row) => row,
        None => return Err(AppError::NotFound("سفارش یافت نشد.".to_string())),
    };

    let allowed_statuses = ["pending_payment", "paid", "paid_backorder", "processing", "shipped", "delivered", "canceled", "refunded"];
    if let Some(ref st) = input.status {
        if !allowed_statuses.contains(&st.as_str()) {
            return Err(AppError::BadRequest("وضعیت نامعتبر است.".to_string()));
        }
    }

    let status = input.status.unwrap_or(o.status);
    let tracking = input.tracking_code.or(o.tracking_code);

    sqlx::query("UPDATE orders SET status = ?, tracking_code = ? WHERE id = ?")
        .bind(status)
        .bind(tracking)
        .bind(id)
        .execute(&state.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

    Ok(Json(json!({ "success": true })))
}

// ---------- 4. Comments Moderation ----------
pub async fn list_admin_comments(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(query): Query<AdminQuery>,
) -> Result<Json<Value>, AppError> {
    check_admin(&headers, query.token.as_deref(), &state.config.token_secret)?;

    let status = query.status.unwrap_or_else(|| "pending".to_string());
    let sql = if status == "all" {
        "SELECT c.id, c.rating, c.body, c.status, c.created_at AS createdAt, u.name AS author, p.name AS product, p.slug
         FROM comments c JOIN users u ON u.id = c.user_id JOIN products p ON p.id = c.product_id
         ORDER BY c.id DESC LIMIT 300".to_string()
    } else {
        format!(
            "SELECT c.id, c.rating, c.body, c.status, c.created_at AS createdAt, u.name AS author, p.name AS product, p.slug
             FROM comments c JOIN users u ON u.id = c.user_id JOIN products p ON p.id = c.product_id
             WHERE c.status = '{}' ORDER BY c.id DESC LIMIT 300",
            status.replace('\'', "''")
        )
    };

    let rows = sqlx::query(&sql)
        .fetch_all(&state.pool)
        .await
        .unwrap_or_default();

    let list: Vec<Value> = rows
        .into_iter()
        .map(|r| {
            json!({
                "id": r.get::<i64, _>("id"),
                "rating": r.get::<i64, _>("rating"),
                "body": r.get::<String, _>("body"),
                "status": r.get::<String, _>("status"),
                "createdAt": r.get::<String, _>("createdAt"),
                "author": r.get::<String, _>("author"),
                "product": r.get::<String, _>("product"),
                "slug": r.get::<String, _>("slug"),
            })
        })
        .collect();

    Ok(Json(json!(list)))
}

#[derive(Debug, Deserialize)]
pub struct ModerateCommentInput {
    pub status: String,
}

pub async fn moderate_comment(
    State(state): State<AppState>,
    Path(id): Path<i64>,
    headers: HeaderMap,
    Query(query): Query<AdminQuery>,
    Json(input): Json<ModerateCommentInput>,
) -> Result<Json<Value>, AppError> {
    check_admin(&headers, query.token.as_deref(), &state.config.token_secret)?;

    if !["approved", "rejected", "pending"].contains(&input.status.as_str()) {
        return Err(AppError::BadRequest("وضعیت نامعتبر است.".to_string()));
    }

    sqlx::query("UPDATE comments SET status = ? WHERE id = ?")
        .bind(&input.status)
        .bind(id)
        .execute(&state.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

    Ok(Json(json!({ "success": true })))
}

pub async fn delete_comment(
    State(state): State<AppState>,
    Path(id): Path<i64>,
    headers: HeaderMap,
    Query(query): Query<AdminQuery>,
) -> Result<Json<Value>, AppError> {
    check_admin(&headers, query.token.as_deref(), &state.config.token_secret)?;

    sqlx::query("DELETE FROM comments WHERE id = ?")
        .bind(id)
        .execute(&state.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

    Ok(Json(json!({ "success": true })))
}

// ---------- 5. Users Management ----------
pub async fn list_admin_users(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(query): Query<AdminQuery>,
) -> Result<Json<Value>, AppError> {
    check_admin(&headers, query.token.as_deref(), &state.config.token_secret)?;

    let rows = sqlx::query(
        "SELECT u.*, (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) AS orders_count
         FROM users u ORDER BY u.id DESC"
    )
    .fetch_all(&state.pool)
    .await
    .unwrap_or_default();

    let list: Vec<Value> = rows
        .into_iter()
        .map(|r| {
            let saved_address_str: Option<String> = r.get("saved_address");
            let saved_address: Option<Value> = saved_address_str.and_then(|s| serde_json::from_str(&s).ok());
            json!({
                "id": r.get::<i64, _>("id"),
                "name": r.get::<String, _>("name"),
                "mobile": r.get::<Option<String>, _>("mobile"),
                "phone": r.get::<Option<String>, _>("mobile"),
                "email": r.get::<Option<String>, _>("email"),
                "role": r.get::<String, _>("role"),
                "savedAddress": saved_address,
                "blocked": r.get::<i64, _>("blocked") != 0,
                "mustChangePassword": r.get::<i64, _>("must_change_password") != 0,
                "createdAt": r.get::<String, _>("created_at"),
                "orders": r.get::<i64, _>("orders_count"),
            })
        })
        .collect();

    Ok(Json(json!(list)))
}

#[derive(Debug, Deserialize)]
pub struct UpdateUserInput {
    pub role: Option<String>,
    pub blocked: Option<bool>,
    #[serde(rename = "newPassword")]
    pub new_password: Option<String>,
}

pub async fn update_user(
    State(state): State<AppState>,
    Path(id): Path<i64>,
    headers: HeaderMap,
    Query(query): Query<AdminQuery>,
    Json(input): Json<UpdateUserInput>,
) -> Result<Json<Value>, AppError> {
    let claims = check_admin(&headers, query.token.as_deref(), &state.config.token_secret)?;
    let self_id = claims.sub.parse::<i64>().unwrap_or(0);

    let user: Option<User> = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = ?")
        .bind(id)
        .fetch_optional(&state.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

    let u = match user {
        Some(row) => row,
        None => return Err(AppError::NotFound("کاربر یافت نشد.".to_string())),
    };

    if u.id == self_id && (input.role.as_deref() == Some("customer") || input.blocked == Some(true)) {
        return Err(AppError::BadRequest("نمی‌توانید دسترسی خودتان را محدود کنید.".to_string()));
    }

    let role = input.role.filter(|r| r == "admin" || r == "customer").unwrap_or(u.role);
    let blocked = input.blocked.map(|b| if b { 1 } else { 0 }).unwrap_or(u.blocked);

    sqlx::query("UPDATE users SET role = ?, blocked = ? WHERE id = ?")
        .bind(role)
        .bind(blocked)
        .bind(id)
        .execute(&state.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

    if let Some(pw) = input.new_password {
        if pw.len() < 8 {
            return Err(AppError::BadRequest("رمز باید حداقل ۸ کاراکتر باشد.".to_string()));
        }
        let hash = hash_password(&pw).map_err(AppError::Internal)?;
        let _ = sqlx::query("UPDATE users SET password_hash = ?, must_change_password = 1 WHERE id = ?")
            .bind(hash)
            .bind(id)
            .execute(&state.pool)
            .await;
    }

    Ok(Json(json!({ "success": true })))
}

// ---------- 6. Blog, FAQ, Tickets ----------
pub async fn list_admin_blog(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(query): Query<AdminQuery>,
) -> Result<Json<Value>, AppError> {
    check_admin(&headers, query.token.as_deref(), &state.config.token_secret)?;
    let rows = sqlx::query("SELECT * FROM blog_posts ORDER BY rowid DESC")
        .fetch_all(&state.pool)
        .await
        .unwrap_or_default();

    let mut list = Vec::new();
    for r in rows {
        let mut obj = serde_json::Map::new();
        for col in r.columns() {
            let col_name = col.name();
            let val: Value = if let Ok(v) = r.try_get::<i64, _>(col_name) {
                json!(v)
            } else if let Ok(v) = r.try_get::<String, _>(col_name) {
                json!(v)
            } else if let Ok(v) = r.try_get::<Option<String>, _>(col_name) {
                match v {
                    Some(s) => json!(s),
                    None => Value::Null,
                }
            } else {
                Value::Null
            };
            obj.insert(col_name.to_string(), val);
        }
        list.push(Value::Object(obj));
    }

    Ok(Json(json!(list)))
}

pub async fn save_blog_post(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(query): Query<AdminQuery>,
    Json(b): Json<Value>,
) -> Result<Json<Value>, AppError> {
    check_admin(&headers, query.token.as_deref(), &state.config.token_secret)?;

    let raw_title = b.get("title").and_then(|v| v.as_str()).unwrap_or("");
    let raw_id = b.get("id").and_then(|v| v.as_str()).unwrap_or(raw_title);
    let id = slugify(raw_id);
    let post_id = if id.is_empty() { format!("post-{}", chrono::Utc::now().timestamp_millis()) } else { id };

    let product_slug = b.get("product_slug").or_else(|| b.get("productSlug")).and_then(|v| v.as_str());
    let published = if b.get("published") == Some(&Value::Bool(false)) || b.get("published") == Some(&json!(0)) { 0 } else { 1 };

    sqlx::query(
        "INSERT INTO blog_posts (id, title, excerpt, category, author, author_role, author_avatar, date, read_time, image, content, published, product_slug)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
         ON CONFLICT(id) DO UPDATE SET title=excluded.title, excerpt=excluded.excerpt, category=excluded.category,
         author=excluded.author, author_role=excluded.author_role, author_avatar=excluded.author_avatar, date=excluded.date,
         read_time=excluded.read_time, image=excluded.image, content=excluded.content, published=excluded.published, product_slug=excluded.product_slug"
    )
    .bind(&post_id)
    .bind(b.get("title").and_then(|v| v.as_str()).unwrap_or(""))
    .bind(b.get("excerpt").and_then(|v| v.as_str()).unwrap_or(""))
    .bind(b.get("category").and_then(|v| v.as_str()).unwrap_or("راهنما"))
    .bind(b.get("author").and_then(|v| v.as_str()).unwrap_or("تیم فنی تک‌تینک"))
    .bind(b.get("author_role").and_then(|v| v.as_str()).unwrap_or("کارشناس سخت‌افزار"))
    .bind(b.get("author_avatar").and_then(|v| v.as_str()).unwrap_or(""))
    .bind(b.get("date").and_then(|v| v.as_str()).unwrap_or("۱۴۰۴/۱۲"))
    .bind(b.get("read_time").and_then(|v| v.as_str()).unwrap_or("۵ دقیقه"))
    .bind(b.get("image").and_then(|v| v.as_str()).unwrap_or(""))
    .bind(b.get("content").and_then(|v| v.as_str()).unwrap_or(""))
    .bind(published)
    .bind(product_slug)
    .execute(&state.pool)
    .await
    .map_err(|e| AppError::Database(e.to_string()))?;

    Ok(Json(json!({ "success": true, "id": post_id })))
}

pub async fn delete_blog_post(
    State(state): State<AppState>,
    Path(id): Path<String>,
    headers: HeaderMap,
    Query(query): Query<AdminQuery>,
) -> Result<Json<Value>, AppError> {
    check_admin(&headers, query.token.as_deref(), &state.config.token_secret)?;
    sqlx::query("DELETE FROM blog_posts WHERE id = ?")
        .bind(id)
        .execute(&state.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;
    Ok(Json(json!({ "success": true })))
}

pub async fn list_admin_faqs(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(query): Query<AdminQuery>,
) -> Result<Json<Value>, AppError> {
    check_admin(&headers, query.token.as_deref(), &state.config.token_secret)?;
    let rows = sqlx::query("SELECT * FROM faqs ORDER BY category, sort, id")
        .fetch_all(&state.pool)
        .await
        .unwrap_or_default();

    let list: Vec<Value> = rows
        .into_iter()
        .map(|r| {
            json!({
                "id": r.get::<i64, _>("id"),
                "category": r.get::<String, _>("category"),
                "q": r.get::<String, _>("q"),
                "a": r.get::<String, _>("a"),
                "sort": r.get::<i64, _>("sort"),
            })
        })
        .collect();

    Ok(Json(json!(list)))
}

#[derive(Debug, Deserialize)]
pub struct FaqInput {
    pub id: Option<i64>,
    pub category: String,
    pub q: String,
    pub a: String,
    pub sort: Option<i64>,
}

pub async fn save_faq(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(query): Query<AdminQuery>,
    Json(input): Json<FaqInput>,
) -> Result<Json<Value>, AppError> {
    check_admin(&headers, query.token.as_deref(), &state.config.token_secret)?;

    if input.category.is_empty() || input.q.is_empty() || input.a.is_empty() {
        return Err(AppError::BadRequest("همه فیلدها الزامی است.".to_string()));
    }

    if let Some(id) = input.id {
        sqlx::query("UPDATE faqs SET category=?, q=?, a=?, sort=? WHERE id=?")
            .bind(&input.category)
            .bind(&input.q)
            .bind(&input.a)
            .bind(input.sort.unwrap_or(0))
            .bind(id)
            .execute(&state.pool)
            .await
            .map_err(|e| AppError::Database(e.to_string()))?;
    } else {
        sqlx::query("INSERT INTO faqs (category, q, a, sort) VALUES (?,?,?,?)")
            .bind(&input.category)
            .bind(&input.q)
            .bind(&input.a)
            .bind(input.sort.unwrap_or(0))
            .execute(&state.pool)
            .await
            .map_err(|e| AppError::Database(e.to_string()))?;
    }

    Ok(Json(json!({ "success": true })))
}

pub async fn delete_faq(
    State(state): State<AppState>,
    Path(id): Path<i64>,
    headers: HeaderMap,
    Query(query): Query<AdminQuery>,
) -> Result<Json<Value>, AppError> {
    check_admin(&headers, query.token.as_deref(), &state.config.token_secret)?;
    sqlx::query("DELETE FROM faqs WHERE id = ?").bind(id).execute(&state.pool).await.map_err(|e| AppError::Database(e.to_string()))?;
    Ok(Json(json!({ "success": true })))
}

pub async fn list_admin_tickets(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(query): Query<AdminQuery>,
) -> Result<Json<Value>, AppError> {
    check_admin(&headers, query.token.as_deref(), &state.config.token_secret)?;
    let rows = sqlx::query("SELECT * FROM tickets ORDER BY id DESC LIMIT 300")
        .fetch_all(&state.pool)
        .await
        .unwrap_or_default();

    let list: Vec<Value> = rows
        .into_iter()
        .map(|r| {
            json!({
                "id": r.get::<i64, _>("id"),
                "name": r.get::<String, _>("name"),
                "contact": r.get::<String, _>("contact"),
                "subject": r.get::<Option<String>, _>("subject"),
                "message": r.get::<String, _>("message"),
                "status": r.get::<String, _>("status"),
                "createdAt": r.get::<String, _>("created_at"),
            })
        })
        .collect();

    Ok(Json(json!(list)))
}

#[derive(Debug, Deserialize)]
pub struct TicketUpdateInput {
    pub status: Option<String>,
}

pub async fn update_ticket(
    State(state): State<AppState>,
    Path(id): Path<i64>,
    headers: HeaderMap,
    Query(query): Query<AdminQuery>,
    Json(input): Json<TicketUpdateInput>,
) -> Result<Json<Value>, AppError> {
    check_admin(&headers, query.token.as_deref(), &state.config.token_secret)?;
    let st = if input.status.as_deref() == Some("closed") { "closed" } else { "open" };
    sqlx::query("UPDATE tickets SET status = ? WHERE id = ?")
        .bind(st)
        .bind(id)
        .execute(&state.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;
    Ok(Json(json!({ "success": true })))
}

// ---------- 7. Appointments & Shipments ----------
pub async fn list_admin_appointments(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(query): Query<AdminQuery>,
) -> Result<Json<Value>, AppError> {
    check_admin(&headers, query.token.as_deref(), &state.config.token_secret)?;
    let rows = sqlx::query("SELECT * FROM appointments ORDER BY id DESC LIMIT 500")
        .fetch_all(&state.pool)
        .await
        .unwrap_or_default();

    let list: Vec<Value> = rows
        .into_iter()
        .map(|r| {
            let services_str: String = r.get::<Option<String>, _>("services").unwrap_or_else(|| "[]".to_string());
            let services: Value = serde_json::from_str(&services_str).unwrap_or(json!([]));
            json!({
                "id": r.get::<i64, _>("id"),
                "tracking_code": r.get::<String, _>("tracking_code"),
                "type": r.get::<String, _>("type"),
                "client_name": r.get::<String, _>("client_name"),
                "client_phone": r.get::<String, _>("client_phone"),
                "requested_date": r.get::<Option<String>, _>("requested_date"),
                "requested_time": r.get::<Option<String>, _>("requested_time"),
                "device_model": r.get::<Option<String>, _>("device_model"),
                "services": services,
                "notes": r.get::<Option<String>, _>("notes"),
                "status": r.get::<String, _>("status"),
                "admin_notes": r.get::<Option<String>, _>("admin_notes"),
                "created_at": r.get::<String, _>("created_at"),
            })
        })
        .collect();

    Ok(Json(json!(list)))
}

#[derive(Debug, Deserialize)]
pub struct UpdateAppointmentInput {
    pub status: Option<String>,
    #[serde(rename = "adminNotes")]
    pub admin_notes: Option<String>,
}

pub async fn update_appointment(
    State(state): State<AppState>,
    Path(id): Path<i64>,
    headers: HeaderMap,
    Query(query): Query<AdminQuery>,
    Json(input): Json<UpdateAppointmentInput>,
) -> Result<Json<Value>, AppError> {
    check_admin(&headers, query.token.as_deref(), &state.config.token_secret)?;
    sqlx::query("UPDATE appointments SET status = COALESCE(?, status), admin_notes = COALESCE(?, admin_notes) WHERE id = ?")
        .bind(input.status)
        .bind(input.admin_notes)
        .bind(id)
        .execute(&state.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;
    Ok(Json(json!({ "success": true })))
}

pub async fn delete_appointment(
    State(state): State<AppState>,
    Path(id): Path<i64>,
    headers: HeaderMap,
    Query(query): Query<AdminQuery>,
) -> Result<Json<Value>, AppError> {
    check_admin(&headers, query.token.as_deref(), &state.config.token_secret)?;
    sqlx::query("DELETE FROM appointments WHERE id = ?").bind(id).execute(&state.pool).await.map_err(|e| AppError::Database(e.to_string()))?;
    Ok(Json(json!({ "success": true })))
}

pub async fn list_admin_shipments(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(query): Query<AdminQuery>,
) -> Result<Json<Value>, AppError> {
    check_admin(&headers, query.token.as_deref(), &state.config.token_secret)?;
    let rows = sqlx::query(
        "SELECT s.*, p.slug AS product_slug, p.image AS product_image
         FROM inventory_shipments s
         LEFT JOIN products p ON p.id = s.product_id
         ORDER BY s.id DESC LIMIT 300"
    )
    .fetch_all(&state.pool)
    .await
    .unwrap_or_default();

    let mut list = Vec::new();
    for r in rows {
        let mut obj = serde_json::Map::new();
        for col in r.columns() {
            let col_name = col.name();
            let val: Value = if let Ok(v) = r.try_get::<i64, _>(col_name) {
                json!(v)
            } else if let Ok(v) = r.try_get::<String, _>(col_name) {
                json!(v)
            } else if let Ok(v) = r.try_get::<Option<String>, _>(col_name) {
                match v {
                    Some(s) => json!(s),
                    None => Value::Null,
                }
            } else {
                Value::Null
            };
            obj.insert(col_name.to_string(), val);
        }
        list.push(Value::Object(obj));
    }

    Ok(Json(json!(list)))
}

#[derive(Debug, Deserialize)]
pub struct CreateShipmentInput {
    pub r#type: String, // 'inbound' | 'outbound'
    #[serde(rename = "productId")]
    pub product_id: Option<i64>,
    #[serde(rename = "productName")]
    pub product_name: Option<String>,
    pub sku: Option<String>,
    pub quantity: i64,
    #[serde(rename = "unitCost")]
    pub unit_cost: Option<i64>,
    #[serde(rename = "batchCode")]
    pub batch_code: Option<String>,
    #[serde(rename = "supplierOrDest")]
    pub supplier_or_dest: Option<String>,
    pub courier: Option<String>,
    #[serde(rename = "shelfLocation")]
    pub shelf_location: Option<String>,
    pub notes: Option<String>,
}

pub async fn create_shipment(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(query): Query<AdminQuery>,
    Json(input): Json<CreateShipmentInput>,
) -> Result<Json<Value>, AppError> {
    let claims = check_admin(&headers, query.token.as_deref(), &state.config.token_secret)?;
    let user_id = claims.sub.parse::<i64>().ok();

    if input.quantity <= 0 {
        return Err(AppError::BadRequest("تعداد باید عددی بزرگتر از صفر باشد.".to_string()));
    }

    let prod = if let Some(pid) = input.product_id {
        sqlx::query_as::<_, ProductRow>("SELECT * FROM products WHERE id = ?").bind(pid).fetch_optional(&state.pool).await.ok().flatten()
    } else {
        None
    };

    let prod_name = prod.as_ref().map(|p| p.name.clone()).unwrap_or_else(|| input.product_name.unwrap_or_else(|| "کالای عمومی انبار".to_string()));
    let prefix = if input.r#type == "inbound" { "IN-" } else { "OUT-" };
    let tracking_number = format!("{}{}", prefix, chrono::Utc::now().timestamp_millis() % 1_000_000);

    sqlx::query(
        "INSERT INTO inventory_shipments (
            tracking_number, type, product_id, product_name, sku, quantity,
            unit_cost, batch_code, supplier_or_dest, courier, shelf_location, notes, created_by
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&tracking_number)
    .bind(&input.r#type)
    .bind(prod.as_ref().map(|p| p.id))
    .bind(&prod_name)
    .bind(input.sku.as_deref().unwrap_or(prod.as_ref().map(|p| p.slug.as_str()).unwrap_or("")))
    .bind(input.quantity)
    .bind(input.unit_cost.unwrap_or(0))
    .bind(input.batch_code.as_deref().unwrap_or(""))
    .bind(input.supplier_or_dest.as_deref().unwrap_or(""))
    .bind(input.courier.as_deref().unwrap_or(""))
    .bind(input.shelf_location.as_deref().unwrap_or(""))
    .bind(input.notes.as_deref().unwrap_or(""))
    .bind("مدیر انبار")
    .execute(&state.pool)
    .await
    .map_err(|e| AppError::Database(e.to_string()))?;

    if let Some(p) = prod {
        let delta = if input.r#type == "inbound" { input.quantity } else { -input.quantity };
        let new_stock = std::cmp::max(0, p.stock + delta);
        let _ = sqlx::query("UPDATE products SET stock = ? WHERE id = ?").bind(new_stock).bind(p.id).execute(&state.pool).await;

        let reason = format!(
            "{} ({}) - {} {}",
            if input.r#type == "inbound" { "ورود به انبار" } else { "خروج کالا" },
            tracking_number,
            input.supplier_or_dest.as_deref().unwrap_or(""),
            input.notes.as_deref().unwrap_or("")
        );

        let _ = sqlx::query("INSERT INTO stock_log (product_id, delta, reason, user_id) VALUES (?, ?, ?, ?)")
            .bind(p.id)
            .bind(delta)
            .bind(reason.trim())
            .bind(user_id)
            .execute(&state.pool)
            .await;
    }

    Ok(Json(json!({ "success": true, "trackingNumber": tracking_number })))
}

pub async fn list_inventory_stock_log(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(query): Query<AdminQuery>,
) -> Result<Json<Value>, AppError> {
    check_admin(&headers, query.token.as_deref(), &state.config.token_secret)?;

    let rows = sqlx::query(
        "SELECT sl.*, p.name AS product_name, p.slug AS product_slug, u.name AS user_name
         FROM stock_log sl
         JOIN products p ON p.id = sl.product_id
         LEFT JOIN users u ON u.id = sl.user_id
         ORDER BY sl.id DESC LIMIT 200"
    )
    .fetch_all(&state.pool)
    .await
    .unwrap_or_default();

    let mut list = Vec::new();
    for r in rows {
        let mut obj = serde_json::Map::new();
        for col in r.columns() {
            let col_name = col.name();
            let val: Value = if let Ok(v) = r.try_get::<i64, _>(col_name) {
                json!(v)
            } else if let Ok(v) = r.try_get::<String, _>(col_name) {
                json!(v)
            } else if let Ok(v) = r.try_get::<Option<String>, _>(col_name) {
                match v {
                    Some(s) => json!(s),
                    None => Value::Null,
                }
            } else {
                Value::Null
            };
            obj.insert(col_name.to_string(), val);
        }
        list.push(Value::Object(obj));
    }

    Ok(Json(json!(list)))
}

// ---------- 8. Settings & Homepage ----------
pub async fn get_admin_settings(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(query): Query<AdminQuery>,
) -> Result<Json<HashMap<String, String>>, AppError> {
    check_admin(&headers, query.token.as_deref(), &state.config.token_secret)?;

    let rows: Vec<(String, String)> = sqlx::query_as("SELECT key, value FROM settings")
        .fetch_all(&state.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

    let mut map = HashMap::new();
    for (k, v) in rows {
        if k != "token_secret" {
            map.insert(k, v);
        }
    }

    Ok(Json(map))
}

pub async fn patch_admin_settings(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(query): Query<AdminQuery>,
    Json(input): Json<HashMap<String, Value>>,
) -> Result<Json<HashMap<String, String>>, AppError> {
    check_admin(&headers, query.token.as_deref(), &state.config.token_secret)?;

    let editable = [
        "store_name", "site_url", "banner_text", "shipping_fee", "zarinpal_merchant_id", "zarinpal_sandbox",
        "torob_token", "low_stock_threshold", "site_mode", "demo_notice_active", "demo_notice_title",
        "demo_notice_badge", "demo_notice_body", "demo_notice_btn", "demo_notice_badge_header",
        "gateway_zarinpal_active", "gateway_mellat_active", "gateway_saman_active", "gateway_parsian_active",
        "gateway_card_active", "gateway_cod_active", "card_number", "card_holder",
        "store_address", "store_phone", "store_mobile", "store_hours", "store_map_link", "store_about",
        "telegram_url", "instagram_url", "bale_url", "aparat_url",
        "google_site_verification", "google_analytics_id", "seo_meta_title", "seo_meta_description", "seo_meta_keywords",
        "homepage_announcement", "homepage_hero", "homepage_promotion", "homepage_showcase",
    ];

    for (k, v) in input {
        if editable.contains(&k.as_str()) {
            let str_val = match v {
                Value::String(s) => s,
                Value::Null => "".to_string(),
                other => other.to_string(),
            };
            let _ = sqlx::query("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
                .bind(&k)
                .bind(&str_val)
                .execute(&state.pool)
                .await;
        }
    }

    let rows: Vec<(String, String)> = sqlx::query_as("SELECT key, value FROM settings")
        .fetch_all(&state.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

    let mut map = HashMap::new();
    for (k, v) in rows {
        if k != "token_secret" {
            map.insert(k, v);
        }
    }

    Ok(Json(map))
}

async fn read_setting_json(pool: &sqlx::SqlitePool, key: &str) -> Value {
    let v: Option<String> = sqlx::query_scalar("SELECT value FROM settings WHERE key = ?")
        .bind(key)
        .fetch_optional(pool)
        .await
        .ok()
        .flatten();
    v.and_then(|s| serde_json::from_str(&s).ok()).unwrap_or(json!({}))
}

async fn write_setting_json(pool: &sqlx::SqlitePool, key: &str, val: Option<Value>) {
    if let Some(v) = val {
        let str_val = if v.is_string() { v.as_str().unwrap().to_string() } else { v.to_string() };
        let _ = sqlx::query("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
            .bind(key)
            .bind(str_val)
            .execute(pool)
            .await;
    }
}

pub async fn get_admin_homepage(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(query): Query<AdminQuery>,
) -> Result<Json<Value>, AppError> {
    check_admin(&headers, query.token.as_deref(), &state.config.token_secret)?;

    let announcement = read_setting_json(&state.pool, "homepage_announcement").await;
    let hero = read_setting_json(&state.pool, "homepage_hero").await;
    let promotion = read_setting_json(&state.pool, "homepage_promotion").await;
    let showcase = read_setting_json(&state.pool, "homepage_showcase").await;

    let products_raw = sqlx::query(
        "SELECT id, slug, name, brand, model, base_price, old_price, image, category, grade, stock
         FROM products WHERE active = 1 ORDER BY id DESC"
    )
    .fetch_all(&state.pool)
    .await
    .unwrap_or_default();

    let mut available_products = Vec::new();
    for r in products_raw {
        available_products.push(json!({
            "id": r.get::<i64, _>("id"),
            "slug": r.get::<String, _>("slug"),
            "name": r.get::<String, _>("name"),
            "brand": r.get::<Option<String>, _>("brand"),
            "model": r.get::<Option<String>, _>("model"),
            "base_price": r.get::<i64, _>("base_price"),
            "old_price": r.get::<Option<i64>, _>("old_price"),
            "image": r.get::<Option<String>, _>("image"),
            "category": r.get::<Option<String>, _>("category"),
            "grade": r.get::<Option<String>, _>("grade"),
            "stock": r.get::<i64, _>("stock"),
        }));
    }

    Ok(Json(json!({
        "announcement": announcement,
        "hero": hero,
        "promotion": promotion,
        "showcase": showcase,
        "availableProducts": available_products
    })))
}

#[derive(Debug, Deserialize)]
pub struct HomepageUpdateInput {
    pub announcement: Option<Value>,
    pub hero: Option<Value>,
    pub promotion: Option<Value>,
    pub showcase: Option<Value>,
}

pub async fn put_admin_homepage(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(query): Query<AdminQuery>,
    Json(input): Json<HomepageUpdateInput>,
) -> Result<Json<Value>, AppError> {
    check_admin(&headers, query.token.as_deref(), &state.config.token_secret)?;

    write_setting_json(&state.pool, "homepage_announcement", input.announcement).await;
    write_setting_json(&state.pool, "homepage_hero", input.hero).await;
    write_setting_json(&state.pool, "homepage_promotion", input.promotion).await;
    write_setting_json(&state.pool, "homepage_showcase", input.showcase).await;

    Ok(Json(json!({ "success": true, "message": "تنظیمات صفحه اصلی با موفقیت ذخیره شد." })))
}

// ---------- 9. Drivers Management ----------
pub async fn list_product_drivers(
    State(state): State<AppState>,
    Path(slug): Path<String>,
    headers: HeaderMap,
    Query(query): Query<AdminQuery>,
) -> Result<Json<Value>, AppError> {
    check_admin(&headers, query.token.as_deref(), &state.config.token_secret)?;

    let rows = sqlx::query("SELECT * FROM drivers WHERE product_slug = ? ORDER BY id DESC")
        .bind(slug)
        .fetch_all(&state.pool)
        .await
        .unwrap_or_default();

    let list: Vec<Value> = rows
        .into_iter()
        .map(|r| {
            json!({
                "id": r.get::<i64, _>("id"),
                "product_slug": r.get::<String, _>("product_slug"),
                "model_name": r.get::<Option<String>, _>("model_name"),
                "name": r.get::<String, _>("name"),
                "date": r.get::<Option<String>, _>("date"),
                "size": r.get::<Option<String>, _>("size"),
                "version": r.get::<Option<String>, _>("version"),
                "category": r.get::<Option<String>, _>("category"),
                "download_url": r.get::<String, _>("download_url"),
            })
        })
        .collect();

    Ok(Json(json!(list)))
}

#[derive(Debug, Deserialize)]
pub struct CreateDriverInput {
    pub name: String,
    pub version: Option<String>,
    pub date: Option<String>,
    pub size: Option<String>,
    pub category: Option<String>,
    #[serde(rename = "downloadUrl")]
    pub download_url: Option<String>,
    #[serde(rename = "modelName")]
    pub model_name: Option<String>,
}

pub async fn create_product_driver(
    State(state): State<AppState>,
    Path(slug): Path<String>,
    headers: HeaderMap,
    Query(query): Query<AdminQuery>,
    Json(input): Json<CreateDriverInput>,
) -> Result<Json<Value>, AppError> {
    check_admin(&headers, query.token.as_deref(), &state.config.token_secret)?;

    if input.name.trim().is_empty() {
        return Err(AppError::BadRequest("نام درایور الزامی است.".to_string()));
    }

    let res = sqlx::query(
        "INSERT INTO drivers (product_slug, model_name, name, date, size, version, category, download_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&slug)
    .bind(input.model_name.unwrap_or_else(|| slug.clone()))
    .bind(input.name.trim())
    .bind(input.date.unwrap_or_else(|| "۱۴۰۴/۱۲".to_string()))
    .bind(input.size.unwrap_or_else(|| "150 MB".to_string()))
    .bind(input.version.unwrap_or_else(|| "1.0.0".to_string()))
    .bind(input.category.unwrap_or_else(|| "نرم‌افزار و بایوس".to_string()))
    .bind(input.download_url.unwrap_or_else(|| "#".to_string()))
    .execute(&state.pool)
    .await
    .map_err(|e| AppError::Database(e.to_string()))?;

    Ok(Json(json!({ "success": true, "id": res.last_insert_rowid() })))
}

pub async fn delete_driver(
    State(state): State<AppState>,
    Path(id): Path<i64>,
    headers: HeaderMap,
    Query(query): Query<AdminQuery>,
) -> Result<Json<Value>, AppError> {
    check_admin(&headers, query.token.as_deref(), &state.config.token_secret)?;
    sqlx::query("DELETE FROM drivers WHERE id = ?").bind(id).execute(&state.pool).await.map_err(|e| AppError::Database(e.to_string()))?;
    Ok(Json(json!({ "success": true })))
}

// ---------- 10. Warranties Management ----------
pub async fn list_admin_warranties(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(query): Query<AdminQuery>,
) -> Result<Json<Value>, AppError> {
    check_admin(&headers, query.token.as_deref(), &state.config.token_secret)?;

    let mut sql = "SELECT * FROM warranties".to_string();
    let mut conditions = Vec::new();

    if let Some(ref q) = query.q {
        let clean = q.trim().replace('\'', "''").to_lowercase();
        if !clean.is_empty() {
            conditions.push(format!(
                "(LOWER(serial) LIKE '%{}%' OR LOWER(model) LIKE '%{}%' OR LOWER(owner) LIKE '%{}%' OR LOWER(COALESCE(phone, '')) LIKE '%{}%')",
                clean, clean, clean, clean
            ));
        }
    }

    if let Some(ref st) = query.status {
        if st == "active" {
            conditions.push("status LIKE '%فعال%'".to_string());
        } else if st == "expired" {
            conditions.push("status LIKE '%منقضی%'".to_string());
        } else if st == "care_plus" {
            conditions.push("care_plus = 1".to_string());
        }
    }

    if !conditions.is_empty() {
        sql.push_str(" WHERE ");
        sql.push_str(&conditions.join(" AND "));
    }
    sql.push_str(" ORDER BY rowid DESC");

    let rows: Vec<WarrantyRow> = sqlx::query_as::<_, WarrantyRow>(&sql)
        .fetch_all(&state.pool)
        .await
        .unwrap_or_default();

    let list: Vec<Value> = rows
        .into_iter()
        .map(|w| {
            json!({
                "serialNumber": w.serial,
                "serial": w.serial,
                "model": w.model,
                "purchaseDate": w.purchase_date,
                "warrantyExpiry": w.expiry,
                "status": w.status,
                "carePlus": w.care_plus.unwrap_or(0) != 0,
                "owner": w.owner,
                "phone": w.phone.unwrap_or_default(),
                "notes": w.notes.unwrap_or_default(),
            })
        })
        .collect();

    Ok(Json(json!(list)))
}

#[derive(Debug, Deserialize)]
pub struct WarrantyInput {
    #[serde(rename = "serialNumber")]
    pub serial_number: Option<String>,
    pub serial: Option<String>,
    pub model: Option<String>,
    #[serde(rename = "purchaseDate")]
    pub purchase_date: Option<String>,
    #[serde(rename = "warrantyExpiry")]
    pub warranty_expiry: Option<String>,
    pub status: Option<String>,
    #[serde(rename = "carePlus")]
    pub care_plus: Option<bool>,
    pub owner: Option<String>,
    pub phone: Option<String>,
    pub notes: Option<String>,
}

pub async fn create_warranty(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(query): Query<AdminQuery>,
    Json(input): Json<WarrantyInput>,
) -> Result<Json<Value>, AppError> {
    check_admin(&headers, query.token.as_deref(), &state.config.token_secret)?;

    let sn = input.serial.or(input.serial_number).unwrap_or_default().trim().to_uppercase();
    let model = input.model.unwrap_or_default().trim().to_string();

    if sn.is_empty() {
        return Err(AppError::BadRequest("شماره سریال گارانتی الزامی است.".to_string()));
    }
    if model.is_empty() {
        return Err(AppError::BadRequest("مدل لپ‌تاپ الزامی است.".to_string()));
    }

    let existing: Option<String> = sqlx::query_scalar("SELECT serial FROM warranties WHERE serial = ?")
        .bind(&sn)
        .fetch_optional(&state.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

    if existing.is_some() {
        return Err(AppError::BadRequest("این شماره سریال گارانتی قبلاً ثبت شده است.".to_string()));
    }

    sqlx::query(
        "INSERT INTO warranties (serial, model, purchase_date, expiry, status, care_plus, owner, phone, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&sn)
    .bind(&model)
    .bind(input.purchase_date.unwrap_or_else(|| "۱۴۰۴/۱۲".to_string()))
    .bind(input.warranty_expiry.unwrap_or_default())
    .bind(input.status.unwrap_or_else(|| "فعال (گارانتی ۶ ماهه طلایی تک‌تینک)".to_string()))
    .bind(if input.care_plus == Some(true) { 1 } else { 0 })
    .bind(input.owner.unwrap_or_default())
    .bind(input.phone.unwrap_or_default())
    .bind(input.notes.unwrap_or_default())
    .execute(&state.pool)
    .await
    .map_err(|e| AppError::Database(e.to_string()))?;

    Ok(Json(json!({ "success": true, "serial": sn })))
}

pub async fn update_warranty(
    State(state): State<AppState>,
    Path(serial): Path<String>,
    headers: HeaderMap,
    Query(query): Query<AdminQuery>,
    Json(input): Json<WarrantyInput>,
) -> Result<Json<Value>, AppError> {
    check_admin(&headers, query.token.as_deref(), &state.config.token_secret)?;
    let sn = serial.trim().to_uppercase();

    let existing: Option<WarrantyRow> = sqlx::query_as::<_, WarrantyRow>("SELECT * FROM warranties WHERE serial = ?")
        .bind(&sn)
        .fetch_optional(&state.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

    let w = match existing {
        Some(row) => row,
        None => return Err(AppError::NotFound("کارت گارانتی با این سریال یافت نشد.".to_string())),
    };

    let care_plus_val = input.care_plus.map(|cp| if cp { 1 } else { 0 }).unwrap_or_else(|| w.care_plus.unwrap_or(0));

    sqlx::query(
        "UPDATE warranties SET model = COALESCE(?, model), purchase_date = COALESCE(?, purchase_date),
         expiry = COALESCE(?, expiry), status = COALESCE(?, status), care_plus = ?,
         owner = COALESCE(?, owner), phone = COALESCE(?, phone), notes = COALESCE(?, notes) WHERE serial = ?"
    )
    .bind(input.model)
    .bind(input.purchase_date)
    .bind(input.warranty_expiry)
    .bind(input.status)
    .bind(care_plus_val)
    .bind(input.owner)
    .bind(input.phone)
    .bind(input.notes)
    .bind(&sn)
    .execute(&state.pool)
    .await
    .map_err(|e| AppError::Database(e.to_string()))?;

    Ok(Json(json!({ "success": true })))
}

pub async fn delete_warranty(
    State(state): State<AppState>,
    Path(serial): Path<String>,
    headers: HeaderMap,
    Query(query): Query<AdminQuery>,
) -> Result<Json<Value>, AppError> {
    check_admin(&headers, query.token.as_deref(), &state.config.token_secret)?;
    let sn = serial.trim().to_uppercase();
    sqlx::query("DELETE FROM warranties WHERE serial = ?")
        .bind(sn)
        .execute(&state.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;
    Ok(Json(json!({ "success": true })))
}

// ---------- 11. Coupons Management ----------
pub async fn list_admin_coupons(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(query): Query<AdminQuery>,
) -> Result<Json<Value>, AppError> {
    check_admin(&headers, query.token.as_deref(), &state.config.token_secret)?;

    let mut sql = "SELECT * FROM coupons".to_string();
    let mut conditions = Vec::new();

    if let Some(ref q) = query.q {
        let clean = q.trim().replace('\'', "''").to_uppercase();
        if !clean.is_empty() {
            conditions.push(format!("(UPPER(code) LIKE '%{}%' OR title LIKE '%{}%')", clean, clean));
        }
    }

    if let Some(ref st) = query.status {
        if st == "active" {
            conditions.push("is_active = 1".to_string());
        } else if st == "inactive" {
            conditions.push("is_active = 0".to_string());
        } else if st == "promoted" {
            conditions.push("is_promoted = 1".to_string());
        }
    }

    if !conditions.is_empty() {
        sql.push_str(" WHERE ");
        sql.push_str(&conditions.join(" AND "));
    }
    sql.push_str(" ORDER BY is_promoted DESC, id DESC");

    let rows: Vec<CouponRow> = sqlx::query_as::<_, CouponRow>(&sql)
        .fetch_all(&state.pool)
        .await
        .unwrap_or_default();

    let list: Vec<Value> = rows
        .into_iter()
        .map(|c| {
            json!({
                "id": c.id,
                "code": c.code,
                "title": c.title,
                "discountType": c.discount_type,
                "discountValue": c.discount_value,
                "minOrderValue": c.min_order_value.unwrap_or(0.0),
                "maxDiscount": c.max_discount.unwrap_or(0.0),
                "usageLimit": c.usage_limit.unwrap_or(0),
                "usageCount": c.usage_count.unwrap_or(0),
                "validFrom": c.valid_from.unwrap_or_default(),
                "validUntil": c.valid_until.unwrap_or_default(),
                "isActive": c.is_active != 0,
                "isPromoted": c.is_promoted != 0,
                "createdAt": c.created_at,
            })
        })
        .collect();

    Ok(Json(json!(list)))
}

#[derive(Debug, Deserialize)]
pub struct CouponInput {
    pub code: Option<String>,
    pub title: Option<String>,
    #[serde(rename = "discountType")]
    pub discount_type: Option<String>,
    #[serde(rename = "discountValue")]
    pub discount_value: Option<f64>,
    #[serde(rename = "minOrderValue")]
    pub min_order_value: Option<f64>,
    #[serde(rename = "maxDiscount")]
    pub max_discount: Option<f64>,
    #[serde(rename = "usageLimit")]
    pub usage_limit: Option<i64>,
    #[serde(rename = "validFrom")]
    pub valid_from: Option<String>,
    #[serde(rename = "validUntil")]
    pub valid_until: Option<String>,
    #[serde(rename = "isActive")]
    pub is_active: Option<bool>,
    #[serde(rename = "isPromoted")]
    pub is_promoted: Option<bool>,
}

pub async fn create_coupon(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(query): Query<AdminQuery>,
    Json(input): Json<CouponInput>,
) -> Result<Json<Value>, AppError> {
    check_admin(&headers, query.token.as_deref(), &state.config.token_secret)?;

    let code = input.code.unwrap_or_default().trim().to_uppercase();
    let title = input.title.unwrap_or_default().trim().to_string();
    let val = input.discount_value.unwrap_or(0.0);

    if code.is_empty() { return Err(AppError::BadRequest("کد تخفیف الزامی است.".to_string())); }
    if title.is_empty() { return Err(AppError::BadRequest("عنوان کمپین یا تخفیف الزامی است.".to_string())); }
    if val <= 0.0 { return Err(AppError::BadRequest("مقدار تخفیف باید بزرگتر از صفر باشد.".to_string())); }

    let clash: Option<i64> = sqlx::query_scalar("SELECT id FROM coupons WHERE UPPER(code) = ?")
        .bind(&code)
        .fetch_optional(&state.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

    if clash.is_some() {
        return Err(AppError::BadRequest("این کد تخفیف قبلاً تعریف شده است.".to_string()));
    }

    let is_prom = if input.is_promoted == Some(true) { 1 } else { 0 };
    if is_prom == 1 {
        let _ = sqlx::query("UPDATE coupons SET is_promoted = 0").execute(&state.pool).await;
    }

    let res = sqlx::query(
        "INSERT INTO coupons (
            code, title, discount_type, discount_value, min_order_value, max_discount,
            usage_limit, valid_from, valid_until, is_active, is_promoted
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&code)
    .bind(&title)
    .bind(if input.discount_type.as_deref() == Some("fixed") { "fixed" } else { "percentage" })
    .bind(val)
    .bind(input.min_order_value.unwrap_or(0.0))
    .bind(input.max_discount.unwrap_or(0.0))
    .bind(input.usage_limit.unwrap_or(0))
    .bind(input.valid_from.unwrap_or_default())
    .bind(input.valid_until.unwrap_or_default())
    .bind(if input.is_active == Some(false) { 0 } else { 1 })
    .bind(is_prom)
    .execute(&state.pool)
    .await
    .map_err(|e| AppError::Database(e.to_string()))?;

    Ok(Json(json!({ "success": true, "id": res.last_insert_rowid() })))
}

pub async fn update_coupon(
    State(state): State<AppState>,
    Path(id): Path<i64>,
    headers: HeaderMap,
    Query(query): Query<AdminQuery>,
    Json(input): Json<CouponInput>,
) -> Result<Json<Value>, AppError> {
    check_admin(&headers, query.token.as_deref(), &state.config.token_secret)?;

    let existing: Option<CouponRow> = sqlx::query_as::<_, CouponRow>("SELECT * FROM coupons WHERE id = ?")
        .bind(id)
        .fetch_optional(&state.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

    let c = match existing {
        Some(row) => row,
        None => return Err(AppError::NotFound("کوپن تخفیف یافت نشد.".to_string())),
    };

    let clean_code = input.code.as_deref().map(|s| s.trim().to_uppercase()).unwrap_or(c.code.clone());
    if clean_code != c.code {
        let dup: Option<i64> = sqlx::query_scalar("SELECT id FROM coupons WHERE UPPER(code) = ? AND id != ?")
            .bind(&clean_code)
            .bind(id)
            .fetch_optional(&state.pool)
            .await
            .map_err(|e| AppError::Database(e.to_string()))?;

        if dup.is_some() {
            return Err(AppError::BadRequest("کد تخفیف دیگری با این نام وجود دارد.".to_string()));
        }
    }

    let is_prom = input.is_promoted.map(|p| if p { 1 } else { 0 }).unwrap_or(c.is_promoted);
    if is_prom == 1 && c.is_promoted == 0 {
        let _ = sqlx::query("UPDATE coupons SET is_promoted = 0").execute(&state.pool).await;
    }

    sqlx::query(
        "UPDATE coupons SET
         code = ?, title = ?, discount_type = ?, discount_value = ?, min_order_value = ?,
         max_discount = ?, usage_limit = ?, valid_from = ?, valid_until = ?,
         is_active = ?, is_promoted = ? WHERE id = ?"
    )
    .bind(clean_code)
    .bind(input.title.unwrap_or(c.title))
    .bind(input.discount_type.unwrap_or(c.discount_type))
    .bind(input.discount_value.unwrap_or(c.discount_value))
    .bind(input.min_order_value.unwrap_or(c.min_order_value.unwrap_or(0.0)))
    .bind(input.max_discount.unwrap_or(c.max_discount.unwrap_or(0.0)))
    .bind(input.usage_limit.unwrap_or(c.usage_limit.unwrap_or(0)))
    .bind(input.valid_from.unwrap_or(c.valid_from.unwrap_or_default()))
    .bind(input.valid_until.unwrap_or(c.valid_until.unwrap_or_default()))
    .bind(input.is_active.map(|a| if a { 1 } else { 0 }).unwrap_or(c.is_active))
    .bind(is_prom)
    .bind(id)
    .execute(&state.pool)
    .await
    .map_err(|e| AppError::Database(e.to_string()))?;

    Ok(Json(json!({ "success": true })))
}

pub async fn promote_coupon(
    State(state): State<AppState>,
    Path(id): Path<i64>,
    headers: HeaderMap,
    Query(query): Query<AdminQuery>,
) -> Result<Json<Value>, AppError> {
    check_admin(&headers, query.token.as_deref(), &state.config.token_secret)?;

    let is_promoted: Option<i64> = sqlx::query_scalar("SELECT is_promoted FROM coupons WHERE id = ?")
        .bind(id)
        .fetch_optional(&state.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

    let cur = match is_promoted {
        Some(p) => p,
        None => return Err(AppError::NotFound("کوپن تخفیف یافت نشد.".to_string())),
    };

    let will_promote = cur == 0;
    let _ = sqlx::query("UPDATE coupons SET is_promoted = 0").execute(&state.pool).await;

    if will_promote {
        let _ = sqlx::query("UPDATE coupons SET is_promoted = 1, is_active = 1 WHERE id = ?")
            .bind(id)
            .execute(&state.pool)
            .await;
    }

    Ok(Json(json!({ "success": true, "isPromoted": will_promote })))
}

pub async fn delete_coupon(
    State(state): State<AppState>,
    Path(id): Path<i64>,
    headers: HeaderMap,
    Query(query): Query<AdminQuery>,
) -> Result<Json<Value>, AppError> {
    check_admin(&headers, query.token.as_deref(), &state.config.token_secret)?;
    sqlx::query("DELETE FROM coupons WHERE id = ?").bind(id).execute(&state.pool).await.map_err(|e| AppError::Database(e.to_string()))?;
    Ok(Json(json!({ "success": true })))
}

// ---------- 12. Analytics ----------
pub async fn get_admin_analytics(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(query): Query<AdminQuery>,
) -> Result<Json<Value>, AppError> {
    check_admin(&headers, query.token.as_deref(), &state.config.token_secret)?;

    let total_pageviews: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM pageviews").fetch_one(&state.pool).await.unwrap_or(0);
    let pageviews_today: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM pageviews WHERE date(created_at) = date('now')").fetch_one(&state.pool).await.unwrap_or(0);
    let unique_visitors_today: i64 = sqlx::query_scalar("SELECT COUNT(DISTINCT ip_hash) FROM pageviews WHERE date(created_at) = date('now')").fetch_one(&state.pool).await.unwrap_or(0);
    let pageviews_7d: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM pageviews WHERE created_at >= datetime('now', '-7 days')").fetch_one(&state.pool).await.unwrap_or(0);
    let unique_visitors_7d: i64 = sqlx::query_scalar("SELECT COUNT(DISTINCT ip_hash) FROM pageviews WHERE created_at >= datetime('now', '-7 days')").fetch_one(&state.pool).await.unwrap_or(0);
    let live_active: i64 = sqlx::query_scalar("SELECT COUNT(DISTINCT ip_hash) FROM pageviews WHERE created_at >= datetime('now', '-15 minutes')").fetch_one(&state.pool).await.unwrap_or(0);
    let google_referrals: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM pageviews WHERE referrer_domain LIKE '%Google%'").fetch_one(&state.pool).await.unwrap_or(0);

    let chart_rows = sqlx::query(
        "SELECT date(created_at) AS date, COUNT(*) AS views, COUNT(DISTINCT ip_hash) AS visitors
         FROM pageviews WHERE created_at >= datetime('now', '-14 days')
         GROUP BY date(created_at) ORDER BY date(created_at) ASC"
    )
    .fetch_all(&state.pool)
    .await
    .unwrap_or_default();

    let chart_data: Vec<Value> = chart_rows
        .into_iter()
        .map(|r| {
            json!({
                "date": r.get::<String, _>("date"),
                "views": r.get::<i64, _>("views"),
                "visitors": r.get::<i64, _>("visitors"),
            })
        })
        .collect();

    let top_pages_rows = sqlx::query(
        "SELECT path, COALESCE(MAX(title), path) AS title, COUNT(*) AS count
         FROM pageviews GROUP BY path ORDER BY count DESC LIMIT 10"
    )
    .fetch_all(&state.pool)
    .await
    .unwrap_or_default();

    let top_pages: Vec<Value> = top_pages_rows
        .into_iter()
        .map(|r| {
            json!({
                "path": r.get::<String, _>("path"),
                "title": r.get::<String, _>("title"),
                "count": r.get::<i64, _>("count"),
            })
        })
        .collect();

    let top_referrers_rows = sqlx::query(
        "SELECT referrer_domain AS domain, COUNT(*) AS count
         FROM pageviews GROUP BY referrer_domain ORDER BY count DESC LIMIT 10"
    )
    .fetch_all(&state.pool)
    .await
    .unwrap_or_default();

    let top_referrers: Vec<Value> = top_referrers_rows
        .into_iter()
        .map(|r| {
            json!({
                "domain": r.get::<Option<String>, _>("domain"),
                "count": r.get::<i64, _>("count"),
            })
        })
        .collect();

    let recent_visits_rows = sqlx::query(
        "SELECT id, path, title, referrer_domain AS referrer, device_type AS device, browser, os, created_at AS createdAt
         FROM pageviews ORDER BY id DESC LIMIT 25"
    )
    .fetch_all(&state.pool)
    .await
    .unwrap_or_default();

    let recent_visits: Vec<Value> = recent_visits_rows
        .into_iter()
        .map(|r| {
            json!({
                "id": r.get::<i64, _>("id"),
                "path": r.get::<String, _>("path"),
                "title": r.get::<Option<String>, _>("title"),
                "referrer": r.get::<Option<String>, _>("referrer"),
                "device": r.get::<Option<String>, _>("device"),
                "browser": r.get::<Option<String>, _>("browser"),
                "os": r.get::<Option<String>, _>("os"),
                "createdAt": r.get::<String, _>("createdAt"),
            })
        })
        .collect();

    Ok(Json(json!({
        "summary": {
            "totalPageviews": total_pageviews,
            "pageviewsToday": pageviews_today,
            "uniqueVisitorsToday": unique_visitors_today,
            "pageviews7d": pageviews_7d,
            "uniqueVisitors7d": unique_visitors_7d,
            "liveActive": std::cmp::max(live_active, 1),
            "googleReferrals": google_referrals,
        },
        "chartData": chart_data,
        "topPages": top_pages,
        "topReferrers": top_referrers,
        "devices": [],
        "browsers": [],
        "recentVisits": recent_visits
    })))
}

pub async fn clear_admin_analytics(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(query): Query<AdminQuery>,
) -> Result<Json<Value>, AppError> {
    check_admin(&headers, query.token.as_deref(), &state.config.token_secret)?;
    sqlx::query("DELETE FROM pageviews WHERE created_at < datetime('now', '-30 days')")
        .execute(&state.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;
    Ok(Json(json!({ "success": true, "message": "لاگ‌های بازدید قدیمی‌تر از ۳۰ روز پاکسازی شدند." })))
}

// ---------- 13. Emails & Webmail ----------
pub async fn list_admin_emails(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(query): Query<AdminQuery>,
) -> Result<Json<Value>, AppError> {
    check_admin(&headers, query.token.as_deref(), &state.config.token_secret)?;

    let limit = query.limit.unwrap_or(50).clamp(1, 200);
    let offset = query.offset.unwrap_or(0).max(0);
    let unread_only = query.unread_only.as_deref() == Some("true");

    let mut sql = "SELECT * FROM inbox_emails".to_string();
    let mut conditions = Vec::new();

    if unread_only {
        conditions.push("is_read = 0".to_string());
    }

    if let Some(ref search) = query.search {
        let clean = search.trim().replace('\'', "''");
        if !clean.is_empty() {
            conditions.push(format!("(subject LIKE '%{}%' OR from_address LIKE '%{}%' OR body_text LIKE '%{}%')", clean, clean, clean));
        }
    }

    if !conditions.is_empty() {
        sql.push_str(" WHERE ");
        sql.push_str(&conditions.join(" AND "));
    }
    sql.push_str(&format!(" ORDER BY id DESC LIMIT {} OFFSET {}", limit, offset));

    let rows: Vec<InboxEmailRow> = sqlx::query_as::<_, InboxEmailRow>(&sql)
        .fetch_all(&state.pool)
        .await
        .unwrap_or_default();

    let total: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM inbox_emails")
        .fetch_one(&state.pool)
        .await
        .unwrap_or(0);

    let unread: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM inbox_emails WHERE is_read = 0")
        .fetch_one(&state.pool)
        .await
        .unwrap_or(0);

    let sanitized_rows: Vec<Value> = rows.into_iter().map(|r| {
        let clean_subj = sanitize_mojibake(&r.subject.unwrap_or_default());
        let clean_from = sanitize_mojibake(&r.from_address);
        let clean_text = sanitize_mojibake(&r.body_text.unwrap_or_default());
        let clean_html = r.body_html.map(|h| sanitize_mojibake(&h));
        let preview = clean_text.chars().take(150).collect::<String>();
        json!({
            "id": r.id,
            "from_address": clean_from,
            "to_address": r.to_address,
            "subject": clean_subj,
            "body_text": clean_text,
            "body_html": clean_html,
            "preview": preview,
            "verification_code": r.verification_code,
            "is_read": r.is_read,
            "created_at": r.created_at,
        })
    }).collect();

    Ok(Json(json!({
        "items": sanitized_rows,
        "emails": sanitized_rows,
        "total": total,
        "totalCount": total,
        "unread": unread,
        "unreadCount": unread
    })))
}

pub async fn get_admin_mail_server_status(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(query): Query<AdminQuery>,
) -> Result<Json<Value>, AppError> {
    check_admin(&headers, query.token.as_deref(), &state.config.token_secret)?;

    let total: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM inbox_emails")
        .fetch_one(&state.pool)
        .await
        .unwrap_or(0);

    let unread: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM inbox_emails WHERE is_read = 0")
        .fetch_one(&state.pool)
        .await
        .unwrap_or(0);

    let total_sent: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM sent_emails")
        .fetch_one(&state.pool)
        .await
        .unwrap_or(0);

    let last_email = sqlx::query_as::<_, InboxEmailRow>(
        "SELECT * FROM inbox_emails ORDER BY id DESC LIMIT 1"
    )
    .fetch_optional(&state.pool)
    .await
    .unwrap_or(None);

    let last_email_json = last_email.map(|m| {
        json!({
            "id": m.id,
            "from": sanitize_mojibake(&m.from_address),
            "subject": sanitize_mojibake(&m.subject.unwrap_or_default()),
            "verificationCode": m.verification_code,
            "receivedAt": m.created_at,
        })
    });

    let port = if state.config.smtp_port > 0 { state.config.smtp_port } else { 25 };

    Ok(Json(json!({
        "status": "online",
        "service": "Rust Axum Native RFC 5321 SMTP Listener",
        "isListening": state.config.smtp_port > 0,
        "port": port,
        "totalEmails": total,
        "unreadEmails": unread,
        "totalSent": total_sent,
        "lastEmail": last_email_json,
        "ports": [port, 2525],
        "domain": "techtink.ir",
        "mailbox": "info@techtink.ir",
        "dnsInstructions": {
            "mxType": "MX",
            "mxHost": "@ (techtink.ir)",
            "mxTarget": "mail.techtink.ir",
            "mxPriority": 10,
            "aType": "A",
            "aHost": "mail",
            "proxyStatus": "DNS only (Grey Cloud in Cloudflare)"
        }
    })))
}

#[derive(Debug, Deserialize)]
pub struct SendEmailInput {
    pub to: String,
    pub from: Option<String>,
    pub subject: Option<String>,
    #[serde(rename = "bodyText")]
    pub body_text: Option<String>,
    #[serde(rename = "bodyHtml")]
    pub body_html: Option<String>,
    #[serde(rename = "relayConfig")]
    pub relay_config: Option<SmtpRelayConfig>,
}

pub async fn send_admin_email(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(query): Query<AdminQuery>,
    Json(input): Json<SendEmailInput>,
) -> Result<Json<Value>, AppError> {
    check_admin(&headers, query.token.as_deref(), &state.config.token_secret)?;

    if input.to.trim().is_empty() {
        return Err(AppError::BadRequest("آدرس ایمیل گیرنده الزامی است.".to_string()));
    }

    let email_id = send_outgoing_email(
        &state.pool,
        OutgoingEmailInput {
            from: input.from.unwrap_or_else(|| "info@techtink.ir".to_string()),
            to: input.to.trim().to_string(),
            subject: input.subject.unwrap_or_else(|| "پیام از فروشگاه تک‌تینک".to_string()),
            body_text: input.body_text.unwrap_or_default(),
            body_html: input.body_html,
            relay_config: input.relay_config,
        },
    )
    .await
    .map_err(AppError::Internal)?;

    Ok(Json(json!({ "success": true, "emailId": email_id, "message": "ایمیل با موفقیت ارسال شد." })))
}

pub async fn list_admin_sent_emails(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(query): Query<AdminQuery>,
) -> Result<Json<Value>, AppError> {
    check_admin(&headers, query.token.as_deref(), &state.config.token_secret)?;

    let limit = query.limit.unwrap_or(50).clamp(1, 200);
    let offset = query.offset.unwrap_or(0).max(0);

    let rows: Vec<SentEmailRow> = sqlx::query_as::<_, SentEmailRow>(
        "SELECT * FROM sent_emails ORDER BY id DESC LIMIT ? OFFSET ?"
    )
    .bind(limit)
    .bind(offset)
    .fetch_all(&state.pool)
    .await
    .unwrap_or_default();

    let total: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM sent_emails")
        .fetch_one(&state.pool)
        .await
        .unwrap_or(0);

    let sanitized_rows: Vec<Value> = rows.into_iter().map(|r| {
        let clean_subj = sanitize_mojibake(&r.subject.unwrap_or_default());
        let clean_text = sanitize_mojibake(&r.body_text.unwrap_or_default());
        let clean_html = r.body_html.map(|h| sanitize_mojibake(&h));
        json!({
            "id": r.id,
            "from_address": r.from_address,
            "to_address": r.to_address,
            "subject": clean_subj,
            "body_text": clean_text,
            "body_html": clean_html,
            "status": r.status,
            "error_message": r.error_message,
            "created_at": r.created_at,
        })
    }).collect();

    Ok(Json(json!({
        "items": sanitized_rows,
        "emails": sanitized_rows,
        "total": total,
        "totalCount": total
    })))
}

pub async fn get_admin_sent_email_by_id(
    State(state): State<AppState>,
    Path(id): Path<i64>,
    headers: HeaderMap,
    Query(query): Query<AdminQuery>,
) -> Result<Json<Value>, AppError> {
    check_admin(&headers, query.token.as_deref(), &state.config.token_secret)?;
    let email: SentEmailRow = sqlx::query_as::<_, SentEmailRow>("SELECT * FROM sent_emails WHERE id = ?")
        .bind(id)
        .fetch_optional(&state.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?
        .ok_or_else(|| AppError::NotFound("ایمیل ارسالی یافت نشد.".to_string()))?;

    let clean_subj = sanitize_mojibake(&email.subject.unwrap_or_default());
    let clean_text = sanitize_mojibake(&email.body_text.unwrap_or_default());
    let clean_html = email.body_html.map(|h| sanitize_mojibake(&h));

    Ok(Json(json!({
        "id": email.id,
        "from_address": email.from_address,
        "to_address": email.to_address,
        "subject": clean_subj,
        "body_text": clean_text,
        "body_html": clean_html,
        "status": email.status,
        "error_message": email.error_message,
        "created_at": email.created_at,
    })))
}

pub async fn delete_admin_sent_email(
    State(state): State<AppState>,
    Path(id): Path<i64>,
    headers: HeaderMap,
    Query(query): Query<AdminQuery>,
) -> Result<Json<Value>, AppError> {
    check_admin(&headers, query.token.as_deref(), &state.config.token_secret)?;
    sqlx::query("DELETE FROM sent_emails WHERE id = ?").bind(id).execute(&state.pool).await.map_err(|e| AppError::Database(e.to_string()))?;
    Ok(Json(json!({ "success": true, "message": "ایمیل ارسالی با موفقیت حذف شد." })))
}

pub async fn clear_inbox_emails(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(query): Query<AdminQuery>,
) -> Result<Json<Value>, AppError> {
    check_admin(&headers, query.token.as_deref(), &state.config.token_secret)?;
    sqlx::query("DELETE FROM inbox_emails").execute(&state.pool).await.map_err(|e| AppError::Database(e.to_string()))?;
    Ok(Json(json!({ "success": true, "message": "صندوق دریافتی کاملاً پاکسازی شد." })))
}

pub async fn clear_sent_emails(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(query): Query<AdminQuery>,
) -> Result<Json<Value>, AppError> {
    check_admin(&headers, query.token.as_deref(), &state.config.token_secret)?;
    sqlx::query("DELETE FROM sent_emails").execute(&state.pool).await.map_err(|e| AppError::Database(e.to_string()))?;
    Ok(Json(json!({ "success": true, "message": "صندوق ارسالی کاملاً پاکسازی شد." })))
}

#[derive(Debug, Deserialize)]
pub struct BulkDeleteInput {
    pub ids: Vec<i64>,
    pub folder: Option<String>,
}

pub async fn bulk_delete_emails(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(query): Query<AdminQuery>,
    Json(input): Json<BulkDeleteInput>,
) -> Result<Json<Value>, AppError> {
    check_admin(&headers, query.token.as_deref(), &state.config.token_secret)?;

    let table = if input.folder.as_deref() == Some("sent") { "sent_emails" } else { "inbox_emails" };
    for id in &input.ids {
        let sql = format!("DELETE FROM {} WHERE id = ?", table);
        let _ = sqlx::query(&sql).bind(id).execute(&state.pool).await;
    }

    Ok(Json(json!({ "success": true, "message": format!("{} ایمیل با موفقیت حذف شدند.", input.ids.len()) })))
}

pub async fn get_admin_inbox_email_by_id(
    State(state): State<AppState>,
    Path(id): Path<i64>,
    headers: HeaderMap,
    Query(query): Query<AdminQuery>,
) -> Result<Json<Value>, AppError> {
    check_admin(&headers, query.token.as_deref(), &state.config.token_secret)?;

    let _ = sqlx::query("UPDATE inbox_emails SET is_read = 1 WHERE id = ?").bind(id).execute(&state.pool).await;

    let email: InboxEmailRow = sqlx::query_as::<_, InboxEmailRow>("SELECT * FROM inbox_emails WHERE id = ?")
        .bind(id)
        .fetch_optional(&state.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?
        .ok_or_else(|| AppError::NotFound("ایمیل یافت نشد.".to_string()))?;

    let clean_subj = sanitize_mojibake(&email.subject.unwrap_or_default());
    let clean_from = sanitize_mojibake(&email.from_address);
    let clean_text = sanitize_mojibake(&email.body_text.unwrap_or_default());
    let clean_html = email.body_html.map(|h| sanitize_mojibake(&h));

    Ok(Json(json!({
        "id": email.id,
        "from_address": clean_from,
        "to_address": email.to_address,
        "subject": clean_subj,
        "body_text": clean_text,
        "body_html": clean_html,
        "raw_message": email.raw_message,
        "verification_code": email.verification_code,
        "is_read": 1,
        "created_at": email.created_at,
    })))
}

pub async fn mark_admin_email_read(
    State(state): State<AppState>,
    Path(id): Path<i64>,
    headers: HeaderMap,
    Query(query): Query<AdminQuery>,
) -> Result<Json<Value>, AppError> {
    check_admin(&headers, query.token.as_deref(), &state.config.token_secret)?;
    sqlx::query("UPDATE inbox_emails SET is_read = 1 WHERE id = ?").bind(id).execute(&state.pool).await.map_err(|e| AppError::Database(e.to_string()))?;
    Ok(Json(json!({ "success": true })))
}

pub async fn delete_admin_inbox_email(
    State(state): State<AppState>,
    Path(id): Path<i64>,
    headers: HeaderMap,
    Query(query): Query<AdminQuery>,
) -> Result<Json<Value>, AppError> {
    check_admin(&headers, query.token.as_deref(), &state.config.token_secret)?;
    sqlx::query("DELETE FROM inbox_emails WHERE id = ?").bind(id).execute(&state.pool).await.map_err(|e| AppError::Database(e.to_string()))?;
    Ok(Json(json!({ "success": true, "message": "ایمیل با موفقیت حذف شد." })))
}

// ---------- 14. System Metrics & Diagnostics ----------
pub async fn get_admin_system_metrics(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(query): Query<AdminQuery>,
) -> Result<Json<Value>, AppError> {
    check_admin(&headers, query.token.as_deref(), &state.config.token_secret)?;
    let metrics = crate::services::system::get_full_system_metrics(&state.pool).await;
    Ok(Json(metrics))
}

#[derive(Debug, Deserialize)]
pub struct ProbePortInput {
    pub port: u16,
    pub host: Option<String>,
}

pub async fn probe_system_port(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(query): Query<AdminQuery>,
    Json(input): Json<ProbePortInput>,
) -> Result<Json<Value>, AppError> {
    check_admin(&headers, query.token.as_deref(), &state.config.token_secret)?;
    let host = input.host.as_deref().unwrap_or("127.0.0.1");
    let result = probe_tcp_port(input.port, host).await;
    Ok(Json(result))
}

pub async fn trigger_system_gc(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(query): Query<AdminQuery>,
) -> Result<Json<Value>, AppError> {
    check_admin(&headers, query.token.as_deref(), &state.config.token_secret)?;
    // In Rust, memory is automatically managed and freed via RAII.
    Ok(Json(json!({
        "success": true,
        "message": "حافظه سیستم به‌صورت خودکار توسط موتور مدرن Rust (بدون نیاز به توقف GC) بهینه است."
    })))
}
