use crate::error::AppError;
use crate::models::ProductRow;
use crate::routes::public::AppState;
use crate::services::pricing::serialize_product;
use axum::{
    extract::{Query, State},
    http::HeaderMap,
    Json,
};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::collections::HashMap;

const PAGE_SIZE: i64 = 100;

#[derive(Debug, Deserialize)]
pub struct TorobQuery {
    pub page: Option<i64>,
    pub token: Option<String>,
    pub sort: Option<String>,
}

#[derive(Debug, Deserialize, Default)]
pub struct TorobBody {
    pub page: Option<i64>,
    pub token: Option<String>,
    pub sort: Option<String>,
    pub page_urls: Option<Vec<String>>,
    pub page_uniques: Option<Vec<String>>,
}

#[derive(Debug, Serialize)]
pub struct TorobProduct {
    pub page_unique: String,
    pub page_url: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub product_group_id: Option<String>,
    pub title: String,
    pub subtitle: String,
    pub current_price: i64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub old_price: Option<i64>,
    pub availability: String,
    pub category_name: String,
    pub image_links: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_link: Option<String>,
    pub short_desc: String,
    pub spec: HashMap<String, String>,
    pub guarantee: String,
    pub date_added: String,
    pub date_updated: String,
}

#[derive(Debug, Serialize)]
pub struct TorobResponse {
    pub api_version: String,
    pub current_page: i64,
    pub total: i64,
    pub max_pages: i64,
    pub products: Vec<TorobProduct>,
}

fn url_encode(s: &str) -> String {
    let mut encoded = String::new();
    for b in s.bytes() {
        match b {
            b'a'..=b'z' | b'A'..=b'Z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => encoded.push(b as char),
            _ => encoded.push_str(&format!("%{:02X}", b)),
        }
    }
    encoded
}

fn to_torob(p: crate::models::SerializedProduct, site_url: &str) -> TorobProduct {
    let mut spec = HashMap::new();
    spec.insert("پردازنده".to_string(), p.short_specs.cpu.clone());
    spec.insert("کارت گرافیک".to_string(), p.short_specs.gpu.clone());
    spec.insert("حافظه رم".to_string(), p.short_specs.ram.clone());
    spec.insert("حافظه داخلی".to_string(), p.short_specs.storage.clone());
    spec.insert("صفحه نمایش".to_string(), p.short_specs.display.clone());
    spec.insert("باتری".to_string(), p.short_specs.battery.clone());
    spec.insert("شاسی".to_string(), p.short_specs.chassis.clone());

    let old_price = match p.old_price {
        Some(op) if op > p.base_price => Some(op),
        _ => None,
    };

    let site_clean = site_url.trim_end_matches('/');

    TorobProduct {
        page_unique: p.id.to_string(),
        page_url: format!("{}/product/{}", site_clean, url_encode(&p.slug)),
        product_group_id: p.series.clone(),
        title: p.name.clone(),
        subtitle: p.tagline.clone().unwrap_or_default(),
        current_price: if p.in_stock { p.base_price } else { 0 },
        old_price,
        availability: if p.in_stock { "instock".to_string() } else { "outofstock".to_string() },
        category_name: p.category.clone().unwrap_or_else(|| "لپ‌تاپ".to_string()),
        image_links: p.images.clone(),
        image_link: p.image.clone(),
        short_desc: p.tagline.clone().unwrap_or_default(),
        spec,
        guarantee: p.guarantee.clone().unwrap_or_default(),
        date_added: p.created_at,
        date_updated: p.updated_at,
    }
}

pub async fn torob_handler(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(query): Query<TorobQuery>,
    body: Option<Json<TorobBody>>,
) -> Result<Json<TorobResponse>, AppError> {
    let torob_token: Option<String> = sqlx::query_scalar("SELECT value FROM settings WHERE key = 'torob_token'")
        .fetch_optional(&state.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?
        .flatten();

    if let Some(ref required_token) = torob_token {
        if !required_token.is_empty() {
            let header_token = headers.get("X-Torob-Token").and_then(|v| v.to_str().ok());
            let q_token = query.token.as_deref();
            let b_token = body.as_ref().and_then(|b| b.token.as_deref());

            let token_match = header_token == Some(required_token) || q_token == Some(required_token) || b_token == Some(required_token);
            if !token_match {
                return Err(AppError::Unauthorized("invalid token".to_string()));
            }
        }
    }

    let site_url: String = sqlx::query_scalar("SELECT value FROM settings WHERE key = 'site_url'")
        .fetch_optional(&state.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?
        .flatten()
        .unwrap_or_else(|| "https://techtink.ir".to_string());

    let (page_uniques, page_urls, sort) = match body {
        Some(Json(b)) => (b.page_uniques, b.page_urls, b.sort.or(query.sort)),
        None => (None, None, query.sort),
    };

    let has_uniques = page_uniques.as_ref().map(|u| !u.is_empty()).unwrap_or(false);
    let has_urls = page_urls.as_ref().map(|u| !u.is_empty()).unwrap_or(false);

    if has_uniques || has_urls {
        let all_active_products: Vec<ProductRow> = sqlx::query_as::<_, ProductRow>(
            "SELECT * FROM products WHERE active = 1"
        )
        .fetch_all(&state.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

        let mut matched = Vec::new();
        let empty_vec = Vec::new();
        let uniques = page_uniques.as_ref().unwrap_or(&empty_vec);
        let urls = page_urls.as_ref().unwrap_or(&empty_vec);

        for p in all_active_products {
            let id_str = p.id.to_string();
            let is_matched_id = uniques.contains(&id_str);
            let is_matched_url = urls.iter().any(|u| u.contains(&p.slug));

            if is_matched_id || is_matched_url {
                let serialized = serialize_product(&state.pool, &p, true).await;
                matched.push(to_torob(serialized, &site_url));
            }
        }

        let total = matched.len() as i64;
        return Ok(Json(TorobResponse {
            api_version: "torob_api_v3".to_string(),
            current_page: 1,
            total,
            max_pages: 1,
            products: matched,
        }));
    }

    let total: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM products WHERE active = 1")
        .fetch_one(&state.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

    let max_pages = std::cmp::max(1, (total + PAGE_SIZE - 1) / PAGE_SIZE);
    let current_page = std::cmp::min(max_pages, std::cmp::max(1, query.page.unwrap_or(1)));
    let offset = (current_page - 1) * PAGE_SIZE;

    let sort_order = if sort.as_deref() == Some("date_updated_desc") {
        "updated_at DESC, id DESC"
    } else {
        "created_at DESC, id DESC"
    };

    let query_sql = format!(
        "SELECT * FROM products WHERE active = 1 ORDER BY {} LIMIT {} OFFSET {}",
        sort_order, PAGE_SIZE, offset
    );

    let rows: Vec<ProductRow> = sqlx::query_as::<_, ProductRow>(&query_sql)
        .fetch_all(&state.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

    let mut products = Vec::new();
    for p in rows {
        let serialized = serialize_product(&state.pool, &p, true).await;
        products.push(to_torob(serialized, &site_url));
    }

    Ok(Json(TorobResponse {
        api_version: "torob_api_v3".to_string(),
        current_page,
        total,
        max_pages,
        products,
    }))
}
