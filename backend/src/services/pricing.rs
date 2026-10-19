use crate::error::AppError;
use crate::models::{
    ProductRow, SerializedProduct, ShortSpecs, UpgradeItem, UpgradesMap, VariantRow,
};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use sqlx::SqlitePool;

#[derive(Debug, Deserialize)]
pub struct CartInputItem {
    #[serde(rename = "productId")]
    pub product_id: i64,
    #[serde(default, rename = "variantIds")]
    pub variant_ids: Vec<i64>,
    #[serde(default = "default_qty")]
    pub qty: i64,
}

fn default_qty() -> i64 {
    1
}

#[derive(Debug, Serialize)]
pub struct PricedCartLine {
    #[serde(rename = "productId")]
    pub product_id: i64,
    pub name: String,
    pub config: Vec<ConfigVariant>,
    #[serde(rename = "unitPrice")]
    pub unit_price: i64,
    pub qty: i64,
}

#[derive(Debug, Serialize, Clone)]
pub struct ConfigVariant {
    pub r#type: String,
    pub name: String,
    pub price: i64,
}

#[derive(Debug, Serialize)]
pub struct PricedCartResult {
    pub lines: Vec<PricedCartLine>,
    pub subtotal: i64,
}

pub async fn price_cart(
    pool: &SqlitePool,
    items: &[CartInputItem],
) -> Result<PricedCartResult, AppError> {
    if items.is_empty() {
        return Err(AppError::BadRequest("سبد خرید خالی است.".to_string()));
    }

    let mut lines = Vec::new();
    let mut subtotal: i64 = 0;
    let mut needed_stock: std::collections::HashMap<i64, i64> = std::collections::HashMap::new();

    for it in items {
        let qty = it.qty.clamp(1, 10);

        let product: Option<ProductRow> =
            sqlx::query_as("SELECT * FROM products WHERE id = ? AND active = 1")
                .bind(it.product_id)
                .fetch_optional(pool)
                .await?;

        let product = match product {
            Some(p) => p,
            None => {
                return Err(AppError::BadRequest(
                    "یکی از محصولات انتخابی دیگر موجود نیست یا غیرفعال شده است.".to_string(),
                ))
            }
        };

        // Variant validation
        let mut variant_configs = Vec::new();
        let mut variants_sum: i64 = 0;

        for vid in &it.variant_ids {
            let var: Option<VariantRow> = sqlx::query_as(
                "SELECT * FROM product_variants WHERE id = ? AND product_id = ?",
            )
            .bind(vid)
            .bind(product.id)
            .fetch_optional(pool)
            .await?;

            if let Some(v) = var {
                variants_sum += v.price;
                variant_configs.push(ConfigVariant {
                    r#type: v.r#type,
                    name: v.name,
                    price: v.price,
                });
            }
        }

        let unit_price = product.base_price + variants_sum;

        // Check stock
        let current_needed = needed_stock.entry(product.id).or_insert(0);
        *current_needed += qty;

        if *current_needed > product.stock {
            return Err(AppError::BadRequest(format!(
                "موجودی کالای «{}» کافی نیست (موجودی انبار: {} عدد).",
                product.name, product.stock
            )));
        }

        subtotal += unit_price * qty;
        lines.push(PricedCartLine {
            product_id: product.id,
            name: product.name,
            config: variant_configs,
            unit_price,
            qty,
        });
    }

    Ok(PricedCartResult { lines, subtotal })
}

pub async fn serialize_product(
    pool: &SqlitePool,
    p: &ProductRow,
    full: bool,
) -> SerializedProduct {
    let specs_val: Value = serde_json::from_str(&p.specs).unwrap_or_else(|_| json!({}));

    // CPU / GPU Brand
    let cpu_str = specs_val
        .get("cpu")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_lowercase();
    let gpu_str = specs_val
        .get("gpu")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_lowercase();

    let cpu_brand = p.cpu_brand.clone().unwrap_or_else(|| {
        if cpu_str.contains("amd") {
            "AMD".to_string()
        } else {
            "Intel".to_string()
        }
    });

    let gpu_brand = p.gpu_brand.clone().unwrap_or_else(|| {
        if gpu_str.contains("nvidia") || gpu_str.contains("rtx") {
            "NVIDIA".to_string()
        } else if gpu_str.contains("amd") || gpu_str.contains("radeon") {
            "AMD".to_string()
        } else {
            "Intel".to_string()
        }
    });

    // Brand, Model, Grade
    let brand = p.brand.clone().unwrap_or_else(|| {
        let first = p.name.split_whitespace().next().unwrap_or("TechTink");
        if ["Lenovo", "HP", "Dell", "Asus", "Apple", "Acer", "MSI"].contains(&first) {
            first.to_string()
        } else {
            "TechTink".to_string()
        }
    });

    let model = p.model.clone().unwrap_or_else(|| {
        if p.name.starts_with(&brand) {
            p.name[brand.len()..].trim().to_string()
        } else {
            p.name.clone()
        }
    });

    let grade = p
        .grade
        .clone()
        .unwrap_or_else(|| "گرید ++A اروپایی (تمیز در حد نو)".to_string());

    // Short Specs
    let short_specs = ShortSpecs {
        cpu: specs_val
            .get("cpu")
            .and_then(|v| v.as_str())
            .map(|s| s.split('(').next().unwrap_or("").trim().to_string())
            .unwrap_or_else(|| cpu_brand.clone()),
        gpu: specs_val
            .get("gpu")
            .and_then(|v| v.as_str())
            .map(|s| {
                s.split('(')
                    .next()
                    .unwrap_or("")
                    .replace("GeForce", "")
                    .trim()
                    .to_string()
            })
            .unwrap_or_else(|| gpu_brand.clone()),
        ram: specs_val
            .get("ram")
            .and_then(|v| v.as_str())
            .unwrap_or("16GB")
            .to_string(),
        storage: specs_val
            .get("storage")
            .and_then(|v| v.as_str())
            .unwrap_or("1TB SSD")
            .to_string(),
        display: specs_val
            .get("display")
            .and_then(|v| v.as_str())
            .unwrap_or("Display")
            .to_string(),
        battery: specs_val
            .get("battery")
            .and_then(|v| v.as_str())
            .unwrap_or("50Wh Battery")
            .to_string(),
        chassis: p
            .chassis
            .clone()
            .unwrap_or_else(|| "آلیاژ آلومینیوم و منیزیم".to_string()),
    };

    // Rating & Comments Count
    let rating_row: (Option<f64>, i64) = sqlx::query_as(
        "SELECT AVG(rating), COUNT(*) FROM comments WHERE product_id = ? AND status = 'approved'",
    )
    .bind(p.id)
    .fetch_one(pool)
    .await
    .unwrap_or((None, 0));

    // Images
    let img_rows: Vec<(String,)> = sqlx::query_as(
        "SELECT url FROM product_images WHERE product_id = ? ORDER BY sort, id",
    )
    .bind(p.id)
    .fetch_all(pool)
    .await
    .unwrap_or_default();

    let mut images: Vec<String> = img_rows.into_iter().map(|r| r.0).collect();
    if images.is_empty() {
        if let Some(ref im) = p.image {
            images.push(im.clone());
        }
    }

    // Upgrades
    let variant_rows: Vec<VariantRow> = sqlx::query_as(
        "SELECT * FROM product_variants WHERE product_id = ? ORDER BY type, sort, id",
    )
    .bind(p.id)
    .fetch_all(pool)
    .await
    .unwrap_or_default();

    let mut upgrades = UpgradesMap {
        ram: Vec::new(),
        storage: Vec::new(),
        display: Vec::new(),
    };

    for v in variant_rows {
        let item = UpgradeItem {
            id: v.id,
            name: v.name,
            price: v.price,
        };
        match v.r#type.as_str() {
            "ram" => upgrades.ram.push(item),
            "storage" => upgrades.storage.push(item),
            "display" => upgrades.display.push(item),
            _ => {}
        }
    }

    // TechTink Score & Benchmarks
    let tech_tink_score = specs_val.get("techTinkScore").cloned().unwrap_or_else(|| {
        json!({
            "overall": 92,
            "batteryLife": 88,
            "temperature": 87,
            "processingPower": 91,
            "usability": 91,
            "buildQuality": 92,
            "repairability": 89
        })
    });

    let benchmarks = specs_val.get("benchmarks").cloned().unwrap_or_else(|| {
        json!({
            "cpuScore": 90,
            "gamingScore": 84,
            "displayScore": 92,
            "batteryScore": 86,
            "coolingScore": 88,
            "aiScore": 80
        })
    });

    let expert_review: Value = p
        .expert_review
        .as_deref()
        .and_then(|s| serde_json::from_str(s).ok())
        .unwrap_or_else(|| {
            json!({
                "intro": format!("{} با بهره‌گیری از کیفیت ساخت بالا و تست سخت‌افزاری آزمایشگاهی، انتخابی ایده‌آل است.", p.name),
                "pros": ["سلامت کامل سخت‌افزار", "تست ۳۰ روزه", "نمایشگر کالیبره"],
                "cons": ["محدودیت تعداد واردات"],
                "verdict": "دستگاهی ارزنده و مطمئن برای کاربری مهندسی و حرفه‌ای."
            })
        });

    let highlights = if full {
        Some(
            serde_json::from_str(&p.highlights)
                .unwrap_or_else(|_| json!(["ضمانت طلایی", "تست سلامت قطعات"])),
        )
    } else {
        None
    };

    let description = if full { p.description.clone() } else { None };

    SerializedProduct {
        id: p.id,
        slug: p.slug.clone(),
        name: p.name.clone(),
        brand,
        model,
        grade,
        tagline: p.tagline.clone(),
        category: p.category.clone(),
        series: p.series.clone(),
        badge: p.badge.clone(),
        base_price: p.base_price,
        base_price_camel: p.base_price,
        old_price: p.old_price,
        old_price_camel: p.old_price,
        stock: p.stock,
        stock_count: p.stock,
        in_stock: p.stock > 0,
        active: p.active == 1,
        image: p.image.clone(),
        images,
        guarantee: p.guarantee.clone(),
        chassis: p
            .chassis
            .clone()
            .unwrap_or_else(|| "All-Aluminum CNC Machined".to_string()),
        specs: specs_val,
        short_specs,
        cpu_brand,
        gpu_brand,
        model3d_url: p.model3d_url.clone(),
        tech_tink_score,
        benchmarks,
        expert_review,
        rating: rating_row.0.map(|r| (r * 10.0).round() / 10.0),
        reviews_count: rating_row.1,
        upgrades,
        description,
        highlights,
        updated_at: p.updated_at.clone(),
        created_at: p.created_at.clone(),
    }
}
