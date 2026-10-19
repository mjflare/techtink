use crate::error::AppError;
use crate::models::{CommentRow, ProductRow, SerializedProduct};
use crate::services::pricing::serialize_product;
use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Json,
};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use sqlx::SqlitePool;

#[derive(Clone)]
pub struct AppState {
    pub pool: SqlitePool,
    pub jwt_secret: String,
    pub dist_dir: std::path::PathBuf,
    pub config: crate::config::Config,
}

#[derive(Debug, Deserialize)]
pub struct ProductQuery {
    pub category: Option<String>,
    pub brand: Option<String>,
    pub search: Option<String>,
    pub active_only: Option<bool>,
}

pub async fn list_products(
    State(state): State<AppState>,
    Query(query): Query<ProductQuery>,
) -> Result<Json<Vec<SerializedProduct>>, AppError> {
    let mut sql = "SELECT * FROM products WHERE 1=1".to_string();
    if query.active_only.unwrap_or(true) {
        sql.push_str(" AND active = 1");
    }
    if let Some(ref cat) = query.category {
        if !cat.is_empty() && cat != "all" {
            sql.push_str(" AND category = '");
            sql.push_str(&cat.replace('\'', "''"));
            sql.push('\'');
        }
    }
    if let Some(ref brand) = query.brand {
        if !brand.is_empty() && brand != "all" {
            sql.push_str(" AND (brand = '");
            sql.push_str(&brand.replace('\'', "''"));
            sql.push_str("' OR name LIKE '%");
            sql.push_str(&brand.replace('\'', "''"));
            sql.push_str("%')");
        }
    }
    if let Some(ref s) = query.search {
        if !s.is_empty() {
            sql.push_str(" AND (name LIKE '%");
            let clean = s.replace('\'', "''");
            sql.push_str(&clean);
            sql.push_str("%' OR tagline LIKE '%");
            sql.push_str(&clean);
            sql.push_str("%')");
        }
    }
    sql.push_str(" ORDER BY base_price DESC");

    let rows: Vec<ProductRow> = sqlx::query_as(&sql).fetch_all(&state.pool).await?;

    let mut out = Vec::new();
    for p in rows {
        out.push(serialize_product(&state.pool, &p, false).await);
    }

    Ok(Json(out))
}

pub async fn get_product(
    State(state): State<AppState>,
    Path(slug): Path<String>,
) -> Result<Json<SerializedProduct>, AppError> {
    let row: Option<ProductRow> =
        sqlx::query_as("SELECT * FROM products WHERE slug = ? OR id = ?")
            .bind(&slug)
            .bind(slug.parse::<i64>().unwrap_or(-1))
            .fetch_optional(&state.pool)
            .await?;

    match row {
        Some(p) => {
            let serialized = serialize_product(&state.pool, &p, true).await;
            Ok(Json(serialized))
        }
        None => Err(AppError::NotFound("محصول مورد نظر یافت نشد.".to_string())),
    }
}

pub async fn get_product_drivers(
    State(state): State<AppState>,
    Path(slug): Path<String>,
) -> Result<Json<Value>, AppError> {
    let rows: Vec<(i64, Option<String>, Option<String>, Option<String>, Option<String>, Option<String>, Option<String>, Option<String>, Option<String>)> = sqlx::query_as(
        "SELECT id, product_slug, model_name, name, date, size, version, category, download_url FROM drivers WHERE product_slug = ?"
    )
    .bind(&slug)
    .fetch_all(&state.pool)
    .await?;

    let list: Vec<Value> = rows
        .into_iter()
        .map(|r| {
            json!({
                "id": r.0,
                "productSlug": r.1,
                "modelName": r.2,
                "name": r.3,
                "date": r.4,
                "size": r.5,
                "version": r.6,
                "category": r.7,
                "downloadUrl": r.8
            })
        })
        .collect();

    Ok(Json(json!(list)))
}

pub async fn get_product_comments(
    State(state): State<AppState>,
    Path(slug): Path<String>,
) -> Result<Json<Value>, AppError> {
    let product_id: Option<i64> =
        sqlx::query_scalar("SELECT id FROM products WHERE slug = ? OR id = ?")
            .bind(&slug)
            .bind(slug.parse::<i64>().unwrap_or(-1))
            .fetch_optional(&state.pool)
            .await?;

    let pid = match product_id {
        Some(id) => id,
        None => return Ok(Json(json!([]))),
    };

    let rows: Vec<(i64, i64, String, String, String)> = sqlx::query_as(
        r#"SELECT c.id, c.rating, c.body, c.created_at, u.name 
           FROM comments c 
           JOIN users u ON c.user_id = u.id 
           WHERE c.product_id = ? AND c.status = 'approved' 
           ORDER BY c.id DESC"#,
    )
    .bind(pid)
    .fetch_all(&state.pool)
    .await?;

    let list: Vec<Value> = rows
        .into_iter()
        .map(|r| {
            json!({
                "id": r.0,
                "rating": r.1,
                "body": r.2,
                "createdAt": r.3,
                "authorName": r.4
            })
        })
        .collect();

    Ok(Json(json!(list)))
}

pub async fn get_categories(
    State(state): State<AppState>,
) -> Result<Json<Value>, AppError> {
    let rows: Vec<(Option<String>, i64)> = sqlx::query_as(
        "SELECT category, COUNT(*) FROM products WHERE active = 1 GROUP BY category",
    )
    .fetch_all(&state.pool)
    .await?;

    let list: Vec<Value> = rows
        .into_iter()
        .filter_map(|r| {
            r.0.map(|cat| {
                json!({
                    "name": cat,
                    "count": r.1
                })
            })
        })
        .collect();

    Ok(Json(json!(list)))
}

pub async fn get_settings(
    State(state): State<AppState>,
) -> Result<Json<Value>, AppError> {
    let rows: Vec<(String, String)> =
        sqlx::query_as("SELECT key, value FROM settings WHERE key NOT LIKE '%secret%'")
            .fetch_all(&state.pool)
            .await?;

    let mut map = serde_json::Map::new();
    for (k, v) in rows {
        map.insert(k, Value::String(v));
    }

    Ok(Json(Value::Object(map)))
}

pub async fn get_homepage(
    State(state): State<AppState>,
) -> Result<Json<Value>, AppError> {
    let announcement: Option<String> =
        sqlx::query_scalar("SELECT value FROM settings WHERE key = 'homepage_announcement'")
            .fetch_optional(&state.pool)
            .await?;

    let hero: Option<String> =
        sqlx::query_scalar("SELECT value FROM settings WHERE key = 'homepage_hero'")
            .fetch_optional(&state.pool)
            .await?;

    let promotion: Option<String> =
        sqlx::query_scalar("SELECT value FROM settings WHERE key = 'homepage_promotion'")
            .fetch_optional(&state.pool)
            .await?;

    let showcase: Option<String> =
        sqlx::query_scalar("SELECT value FROM settings WHERE key = 'homepage_showcase'")
            .fetch_optional(&state.pool)
            .await?;

    let parse_or_default = |opt: Option<String>, default: Value| -> Value {
        opt.and_then(|s| serde_json::from_str(&s).ok())
            .unwrap_or(default)
    };

    Ok(Json(json!({
        "announcement": parse_or_default(announcement, json!({ "active": true, "badge": "خبر ویژه", "text": "تخفیف آغاز فصل برای لپ‌تاپ‌های مهندسی" })),
        "hero": parse_or_default(hero, json!({ "active": true, "title": "آینده پردازش را تجربه کنید." })),
        "promotion": parse_or_default(promotion, json!({ "active": true, "title": "جشنواره ورک‌استیشن‌های رندرینگ" })),
        "showcase": parse_or_default(showcase, json!({ "active": true, "bannerText": "تحویل اکسپرس در اصفهان و ارسال سریع به سراسر کشور" }))
    })))
}

#[derive(Debug, Deserialize)]
pub struct ValidateCouponInput {
    pub code: String,
    pub subtotal: Option<f64>,
}

pub async fn validate_coupon(
    State(state): State<AppState>,
    Json(input): Json<ValidateCouponInput>,
) -> Result<Json<Value>, AppError> {
    let code = input.code.trim().to_uppercase();
    let coupon: Option<crate::models::CouponRow> =
        sqlx::query_as("SELECT * FROM coupons WHERE UPPER(code) = ? AND is_active = 1")
            .bind(&code)
            .fetch_optional(&state.pool)
            .await?;

    let c = match coupon {
        Some(c) => c,
        None => return Err(AppError::BadRequest("کد تخفیف واردشده نامعتبر است.".to_string())),
    };

    let subtotal = input.subtotal.unwrap_or(0.0);
    if let Some(min_val) = c.min_order_value {
        if subtotal < min_val {
            return Err(AppError::BadRequest(format!(
                "حداقل مبلغ سفارش برای این کد تخفیف {} تومان می‌باشد.",
                min_val as i64
            )));
        }
    }

    let discount_amount = if c.discount_type == "percentage" {
        let calc = subtotal * (c.discount_value / 100.0);
        if let Some(max_disc) = c.max_discount {
            if max_disc > 0.0 && calc > max_disc {
                max_disc
            } else {
                calc
            }
        } else {
            calc
        }
    } else {
        c.discount_value
    };

    Ok(Json(json!({
        "valid": true,
        "code": c.code,
        "title": c.title,
        "discountType": c.discount_type,
        "discountValue": c.discount_value,
        "discountAmount": discount_amount.round() as i64
    })))
}

pub async fn get_seo_info(
    State(state): State<AppState>,
) -> Result<Json<Value>, AppError> {
    let base_url: String = sqlx::query_scalar("SELECT value FROM settings WHERE key = 'site_url'")
        .fetch_optional(&state.pool)
        .await?
        .flatten()
        .unwrap_or_else(|| "https://techtink.ir".to_string());
    let clean_url = base_url.trim_end_matches('/').to_string();

    let google_site_verification: String = sqlx::query_scalar("SELECT value FROM settings WHERE key = 'google_site_verification'")
        .fetch_optional(&state.pool)
        .await?
        .flatten()
        .unwrap_or_default();

    let google_analytics_id: String = sqlx::query_scalar("SELECT value FROM settings WHERE key = 'google_analytics_id'")
        .fetch_optional(&state.pool)
        .await?
        .flatten()
        .unwrap_or_default();

    let meta_title: String = sqlx::query_scalar("SELECT value FROM settings WHERE key = 'seo_meta_title'")
        .fetch_optional(&state.pool)
        .await?
        .flatten()
        .unwrap_or_default();

    let meta_description: String = sqlx::query_scalar("SELECT value FROM settings WHERE key = 'seo_meta_description'")
        .fetch_optional(&state.pool)
        .await?
        .flatten()
        .unwrap_or_default();

    let meta_keywords: String = sqlx::query_scalar("SELECT value FROM settings WHERE key = 'seo_meta_keywords'")
        .fetch_optional(&state.pool)
        .await?
        .flatten()
        .unwrap_or_default();

    let products_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM products WHERE active = 1")
        .fetch_one(&state.pool)
        .await
        .unwrap_or(0);

    Ok(Json(json!({
        "siteUrl": clean_url,
        "sitemapUrl": format!("{}/sitemap.xml", clean_url),
        "robotsUrl": format!("{}/robots.txt", clean_url),
        "googleSiteVerification": google_site_verification,
        "googleAnalyticsId": google_analytics_id,
        "metaTitle": meta_title,
        "metaDescription": meta_description,
        "metaKeywords": meta_keywords,
        "productsCount": products_count
    })))
}

#[derive(Debug, Deserialize)]
pub struct PageviewInput {
    pub path: Option<String>,
    pub title: Option<String>,
    pub referrer: Option<String>,
    #[serde(rename = "deviceType")]
    pub device_type: Option<String>,
    pub browser: Option<String>,
    pub os: Option<String>,
}

pub async fn record_pageview(
    State(state): State<AppState>,
    Json(input): Json<PageviewInput>,
) -> Result<Json<Value>, AppError> {
    let p = input.path.unwrap_or_else(|| "/".to_string());
    let t = input.title.unwrap_or_default();
    let r = input.referrer.unwrap_or_default();
    let dev = input.device_type.unwrap_or_else(|| "desktop".to_string());
    let browser = input.browser.unwrap_or_else(|| "Other".to_string());
    let os = input.os.unwrap_or_else(|| "Other".to_string());

    let mut referrer_domain = "مستقیم (Direct)".to_string();
    if !r.is_empty() {
        if r.contains("google.") {
            referrer_domain = "Google Search".to_string();
        } else if r.contains("torob.") {
            referrer_domain = "موتور ترب (Torob)".to_string();
        } else if r.contains("instagram.") {
            referrer_domain = "اینستاگرام".to_string();
        } else if r.contains("t.me") || r.contains("telegram.") {
            referrer_domain = "تلگرام".to_string();
        } else if r.contains("emalls.") {
            referrer_domain = "ایمالز (Emalls)".to_string();
        } else {
            referrer_domain = r.clone();
        }
    }

    let ip_hash = format!("anon-{}", chrono::Utc::now().format("%Y%m%d"));

    let _ = sqlx::query(
        "INSERT INTO pageviews (path, title, referrer, referrer_domain, ip_hash, user_agent, device_type, browser, os)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&p)
    .bind(&t)
    .bind(&r)
    .bind(&referrer_domain)
    .bind(&ip_hash)
    .bind("TechTink Agent")
    .bind(&dev)
    .bind(&browser)
    .bind(&os)
    .execute(&state.pool)
    .await;

    Ok(Json(json!({ "ok": true })))
}

fn escape_xml(s: &str) -> String {
    s.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&apos;")
}

pub async fn generate_sitemap_xml(pool: &SqlitePool, custom_base: Option<&str>) -> String {
    let base_url: String = match custom_base {
        Some(b) => b.to_string(),
        None => sqlx::query_scalar("SELECT value FROM settings WHERE key = 'site_url'")
            .fetch_optional(pool)
            .await
            .ok()
            .flatten()
            .unwrap_or_else(|| "https://techtink.ir".to_string()),
    };
    let clean_base = base_url.trim_end_matches('/');
    let now = chrono::Utc::now().format("%Y-%m-%d").to_string();

    let mut xml = String::from("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
    xml.push_str("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\"\n");
    xml.push_str("        xmlns:image=\"http://www.google.com/schemas/sitemap-image/1.1\">\n");

    let static_routes = [
        ("/", "1.0", "daily"),
        ("/catalog", "0.9", "daily"),
        ("/compare", "0.8", "weekly"),
        ("/blog", "0.8", "weekly"),
        ("/support", "0.7", "monthly"),
    ];

    for (route, priority, freq) in static_routes {
        xml.push_str("  <url>\n");
        xml.push_str(&format!("    <loc>{}{}</loc>\n", clean_base, route));
        xml.push_str(&format!("    <lastmod>{}</lastmod>\n", now));
        xml.push_str(&format!("    <changefreq>{}</changefreq>\n", freq));
        xml.push_str(&format!("    <priority>{}</priority>\n", priority));
        xml.push_str("  </url>\n");
    }

    let products: Vec<(String, Option<String>, Option<String>, String)> = sqlx::query_as(
        "SELECT slug, updated_at, image, name FROM products WHERE active = 1 ORDER BY id DESC"
    )
    .fetch_all(pool)
    .await
    .unwrap_or_default();

    for (slug, updated_at, image, name) in products {
        let lastmod = updated_at.as_deref().and_then(|u| u.get(..10)).unwrap_or(&now);
        xml.push_str("  <url>\n");
        xml.push_str(&format!("    <loc>{}/product/{}</loc>\n", clean_base, escape_xml(&slug)));
        xml.push_str(&format!("    <lastmod>{}</lastmod>\n", lastmod));
        xml.push_str("    <changefreq>daily</changefreq>\n");
        xml.push_str("    <priority>0.9</priority>\n");
        if let Some(ref img) = image {
            if !img.is_empty() {
                xml.push_str("    <image:image>\n");
                xml.push_str(&format!("      <image:loc>{}</image:loc>\n", escape_xml(img)));
                xml.push_str(&format!("      <image:title><![CDATA[{}]]></image:title>\n", name));
                xml.push_str("    </image:image>\n");
            }
        }
        xml.push_str("  </url>\n");
    }

    xml.push_str("</urlset>");
    xml
}

pub async fn generate_robots_txt(pool: &SqlitePool, custom_base: Option<&str>) -> String {
    let base_url: String = match custom_base {
        Some(b) => b.to_string(),
        None => sqlx::query_scalar("SELECT value FROM settings WHERE key = 'site_url'")
            .fetch_optional(pool)
            .await
            .ok()
            .flatten()
            .unwrap_or_else(|| "https://techtink.ir".to_string()),
    };
    let clean_base = base_url.trim_end_matches('/');

    format!(
        "# TechTink Robots.txt for Googlebot, Bingbot & Search Engine Crawlers\n\
User-agent: *\n\
Allow: /\n\
Allow: /catalog\n\
Allow: /product/\n\
Allow: /compare\n\
Allow: /blog\n\
Allow: /support\n\
Disallow: /api/admin/\n\
Disallow: /api/torob/\n\
Disallow: /account\n\
Disallow: /cart\n\n\
Crawl-delay: 1\n\n\
Sitemap: {}/sitemap.xml\n",
        clean_base
    )
}

