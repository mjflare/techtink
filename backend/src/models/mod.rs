use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct User {
    pub id: i64,
    pub name: String,
    pub mobile: Option<String>,
    pub email: Option<String>,
    pub password_hash: String,
    pub role: String,
    pub saved_address: Option<String>,
    pub blocked: i64,
    pub must_change_password: i64,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserProfileResponse {
    pub id: i64,
    pub name: String,
    pub mobile: Option<String>,
    pub email: Option<String>,
    pub role: String,
    pub saved_address: Option<serde_json::Value>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ProductRow {
    pub id: i64,
    pub slug: String,
    pub name: String,
    pub tagline: Option<String>,
    pub category: Option<String>,
    pub series: Option<String>,
    pub badge: Option<String>,
    pub description: Option<String>,
    pub base_price: i64,
    pub old_price: Option<i64>,
    pub stock: i64,
    pub active: i64,
    pub guarantee: Option<String>,
    pub image: Option<String>,
    pub specs: String,
    pub highlights: String,
    pub chassis: Option<String>,
    pub cpu_brand: Option<String>,
    pub gpu_brand: Option<String>,
    pub brand: Option<String>,
    pub model: Option<String>,
    pub grade: Option<String>,
    pub model3d_url: Option<String>,
    pub expert_review: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct VariantRow {
    pub id: i64,
    pub product_id: i64,
    pub r#type: String,
    pub name: String,
    pub price: i64,
    pub sort: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpgradesMap {
    pub ram: Vec<UpgradeItem>,
    pub storage: Vec<UpgradeItem>,
    pub display: Vec<UpgradeItem>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpgradeItem {
    pub id: i64,
    pub name: String,
    pub price: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ShortSpecs {
    pub cpu: String,
    pub gpu: String,
    pub ram: String,
    pub storage: String,
    pub display: String,
    pub battery: String,
    pub chassis: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SerializedProduct {
    pub id: i64,
    pub slug: String,
    pub name: String,
    pub brand: String,
    pub model: String,
    pub grade: String,
    pub tagline: Option<String>,
    pub category: Option<String>,
    pub series: Option<String>,
    pub badge: Option<String>,
    pub base_price: i64,
    #[serde(rename = "basePrice")]
    pub base_price_camel: i64,
    pub old_price: Option<i64>,
    #[serde(rename = "oldPrice")]
    pub old_price_camel: Option<i64>,
    pub stock: i64,
    #[serde(rename = "stockCount")]
    pub stock_count: i64,
    #[serde(rename = "inStock")]
    pub in_stock: bool,
    pub active: bool,
    pub image: Option<String>,
    pub images: Vec<String>,
    pub guarantee: Option<String>,
    pub chassis: String,
    pub specs: serde_json::Value,
    #[serde(rename = "shortSpecs")]
    pub short_specs: ShortSpecs,
    #[serde(rename = "cpuBrand")]
    pub cpu_brand: String,
    #[serde(rename = "gpuBrand")]
    pub gpu_brand: String,
    #[serde(rename = "model3d_url")]
    pub model3d_url: Option<String>,
    #[serde(rename = "enable_3d_viewer")]
    pub enable_3d_viewer: Option<bool>,
    #[serde(rename = "techTinkScore")]
    pub tech_tink_score: serde_json::Value,
    pub benchmarks: serde_json::Value,
    #[serde(rename = "expertReview")]
    pub expert_review: serde_json::Value,
    pub rating: Option<f64>,
    #[serde(rename = "reviewsCount")]
    pub reviews_count: i64,
    pub upgrades: UpgradesMap,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub highlights: Option<serde_json::Value>,
    #[serde(rename = "updatedAt")]
    pub updated_at: String,
    #[serde(rename = "createdAt")]
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct OrderRow {
    pub id: i64,
    pub user_id: i64,
    pub status: String,
    pub subtotal: i64,
    pub shipping: i64,
    pub total: i64,
    pub shipping_info: String,
    pub tracking_code: Option<String>,
    pub discount: Option<i64>,
    pub coupon_code: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct OrderItemRow {
    pub id: i64,
    pub order_id: i64,
    pub product_id: Option<i64>,
    pub name: String,
    pub config: String,
    pub unit_price: i64,
    pub qty: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct CommentRow {
    pub id: i64,
    pub product_id: i64,
    pub user_id: i64,
    pub rating: i64,
    pub body: String,
    pub status: String,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct WarrantyRow {
    pub serial: String,
    pub model: Option<String>,
    pub purchase_date: Option<String>,
    pub expiry: Option<String>,
    pub status: Option<String>,
    pub care_plus: Option<i64>,
    pub owner: Option<String>,
    pub phone: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct CouponRow {
    pub id: i64,
    pub code: String,
    pub title: String,
    pub discount_type: String,
    pub discount_value: f64,
    pub min_order_value: Option<f64>,
    pub max_discount: Option<f64>,
    pub usage_limit: Option<i64>,
    pub usage_count: Option<i64>,
    pub valid_from: Option<String>,
    pub valid_until: Option<String>,
    pub is_active: i64,
    pub is_promoted: i64,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct InboxEmailRow {
    pub id: i64,
    pub from_address: String,
    pub to_address: String,
    pub subject: Option<String>,
    pub body_text: Option<String>,
    pub body_html: Option<String>,
    pub raw_message: Option<String>,
    pub verification_code: Option<String>,
    pub is_read: i64,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct SentEmailRow {
    pub id: i64,
    pub from_address: String,
    pub to_address: String,
    pub subject: Option<String>,
    pub body_text: Option<String>,
    pub body_html: Option<String>,
    pub status: Option<String>,
    pub error_message: Option<String>,
    pub created_at: String,
}
