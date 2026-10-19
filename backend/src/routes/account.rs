use crate::error::AppError;
use crate::models::{OrderRow, User, UserProfileResponse};
use crate::routes::public::AppState;
use crate::services::auth::{create_token, hash_password, verify_password, verify_token, Claims};
use axum::{
    extract::{Path, State},
    http::HeaderMap,
    Json,
};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};

#[derive(Debug, Deserialize)]
pub struct RegisterInput {
    pub name: String,
    pub mobile: Option<String>,
    pub email: Option<String>,
    pub password: String,
}

#[derive(Debug, Deserialize)]
pub struct LoginInput {
    pub identifier: Option<String>,
    pub login: Option<String>,
    pub email: Option<String>,
    pub mobile: Option<String>,
    pub phone: Option<String>,
    pub username: Option<String>,
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct AuthResponse {
    pub token: String,
    pub user: UserProfileResponse,
}

pub fn extract_claims(headers: &HeaderMap, secret: &str) -> Result<Claims, AppError> {
    let auth_header = headers
        .get("Authorization")
        .and_then(|v| v.to_str().ok())
        .ok_or_else(|| AppError::Unauthorized("لطفاً ابتدا وارد حساب کاربری خود شوید.".to_string()))?;

    if !auth_header.starts_with("Bearer ") {
        return Err(AppError::Unauthorized("فرمت توکن نامعتبر است.".to_string()));
    }

    let token = &auth_header[7..];
    verify_token(token, secret).map_err(AppError::Unauthorized)
}

pub async fn register(
    State(state): State<AppState>,
    Json(input): Json<RegisterInput>,
) -> Result<Json<AuthResponse>, AppError> {
    let name = input.name.trim();
    if name.is_empty() || input.password.len() < 6 {
        return Err(AppError::BadRequest(
            "نام و کلمه عبور حداقل ۶ کاراکتری الزامی است.".to_string(),
        ));
    }

    let mobile = input.mobile.as_deref().map(|s| s.trim()).filter(|s| !s.is_empty());
    let email = input.email.as_deref().map(|s| s.trim()).filter(|s| !s.is_empty());

    if mobile.is_none() && email.is_none() {
        return Err(AppError::BadRequest(
            "حداقل یکی از موارد شماره همراه یا ایمیل الزامی است.".to_string(),
        ));
    }

    // Check duplicate
    if let Some(m) = mobile {
        let exists: Option<i64> = sqlx::query_scalar("SELECT id FROM users WHERE mobile = ?")
            .bind(m)
            .fetch_optional(&state.pool)
            .await?;
        if exists.is_some() {
            return Err(AppError::BadRequest(
                "این شماره همراه قبلاً در سیستم ثبت‌نام شده است.".to_string(),
            ));
        }
    }

    if let Some(e) = email {
        let exists: Option<i64> = sqlx::query_scalar("SELECT id FROM users WHERE email = ?")
            .bind(e)
            .fetch_optional(&state.pool)
            .await?;
        if exists.is_some() {
            return Err(AppError::BadRequest(
                "این آدرس ایمیل قبلاً در سیستم ثبت‌نام شده است.".to_string(),
            ));
        }
    }

    let hashed = hash_password(&input.password).map_err(AppError::Internal)?;

    let user_id = sqlx::query(
        "INSERT INTO users (name, mobile, email, password_hash, role, created_at)
         VALUES (?, ?, ?, ?, 'customer', datetime('now'))",
    )
    .bind(name)
    .bind(mobile)
    .bind(email)
    .bind(&hashed)
    .execute(&state.pool)
    .await?
    .last_insert_rowid();

    let identifier = mobile.or(email).unwrap_or("user");
    let token = create_token(user_id, identifier, "customer", &state.jwt_secret)
        .map_err(AppError::Internal)?;

    Ok(Json(AuthResponse {
        token,
        user: UserProfileResponse {
            id: user_id,
            name: name.to_string(),
            mobile: mobile.map(|s| s.to_string()),
            email: email.map(|s| s.to_string()),
            role: "customer".to_string(),
            saved_address: None,
            created_at: chrono::Utc::now().to_rfc3339(),
        },
    }))
}

fn normalize_iranian_mobile(input: &str) -> Option<String> {
    if input.is_empty() {
        return None;
    }
    let mut s = String::new();
    for ch in input.chars() {
        match ch {
            '۰' | '٠' => s.push('0'),
            '۱' | '١' => s.push('1'),
            '۲' | '٢' => s.push('2'),
            '۳' | '٣' => s.push('3'),
            '۴' | '٤' => s.push('4'),
            '۵' | '٥' => s.push('5'),
            '۶' | '٦' => s.push('6'),
            '۷' | '٧' => s.push('7'),
            '۸' | '٨' => s.push('8'),
            '۹' | '٩' => s.push('9'),
            c if c.is_ascii_digit() => s.push(c),
            _ => {}
        }
    }
    if s.starts_with("98") {
        s = format!("0{}", &s[2..]);
    } else if s.len() == 10 && s.starts_with('9') {
        s = format!("0{}", s);
    }
    if s.len() == 11 && s.starts_with("09") {
        Some(s)
    } else {
        None
    }
}

pub async fn login(
    State(state): State<AppState>,
    Json(input): Json<LoginInput>,
) -> Result<Json<AuthResponse>, AppError> {
    let raw_id = input
        .identifier
        .or(input.login)
        .or(input.email)
        .or(input.mobile)
        .or(input.phone)
        .or(input.username)
        .unwrap_or_default();
    let id_clean = raw_id.trim();

    if id_clean.is_empty() || input.password.is_empty() {
        return Err(AppError::BadRequest(
            "شناسه کاربری (شماره همراه یا ایمیل) و کلمه عبور الزامی است.".to_string(),
        ));
    }

    let norm_m = normalize_iranian_mobile(id_clean);
    let id_lower = id_clean.to_lowercase();

    let user: Option<User> = if let Some(ref m) = norm_m {
        sqlx::query_as("SELECT * FROM users WHERE mobile = ? OR email = ? LIMIT 1")
            .bind(m)
            .bind(&id_lower)
            .fetch_optional(&state.pool)
            .await?
    } else {
        sqlx::query_as("SELECT * FROM users WHERE email = ? OR mobile = ? OR name = ? LIMIT 1")
            .bind(&id_lower)
            .bind(id_clean)
            .bind(id_clean)
            .fetch_optional(&state.pool)
            .await?
    };

    let user = match user {
        Some(u) => u,
        None => {
            return Err(AppError::Unauthorized(
                "کاربری با این مشخصات یافت نشد.".to_string(),
            ))
        }
    };

    if user.blocked == 1 {
        return Err(AppError::Forbidden(
            "حساب کاربری شما توسط مدیریت مسدود شده است.".to_string(),
        ));
    }

    if !verify_password(&input.password, &user.password_hash) {
        return Err(AppError::Unauthorized(
            "کلمه عبور وارد شده اشتباه است.".to_string(),
        ));
    }

    let identifier = user.mobile.as_deref().or(user.email.as_deref()).unwrap_or("user");
    let token = create_token(user.id, identifier, &user.role, &state.jwt_secret)
        .map_err(AppError::Internal)?;

    let saved_addr: Option<Value> = user
        .saved_address
        .as_deref()
        .and_then(|s| serde_json::from_str(s).ok());

    Ok(Json(AuthResponse {
        token,
        user: UserProfileResponse {
            id: user.id,
            name: user.name,
            mobile: user.mobile,
            email: user.email,
            role: user.role,
            saved_address: saved_addr,
            created_at: user.created_at,
        },
    }))
}

pub async fn get_me(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<UserProfileResponse>, AppError> {
    let claims = extract_claims(&headers, &state.jwt_secret)?;
    let user_id: i64 = claims.sub.parse().unwrap_or(0);

    let user: Option<User> = sqlx::query_as("SELECT * FROM users WHERE id = ?")
        .bind(user_id)
        .fetch_optional(&state.pool)
        .await?;

    match user {
        Some(u) => {
            let saved_addr = u
                .saved_address
                .as_deref()
                .and_then(|s| serde_json::from_str(s).ok());
            Ok(Json(UserProfileResponse {
                id: u.id,
                name: u.name,
                mobile: u.mobile,
                email: u.email,
                role: u.role,
                saved_address: saved_addr,
                created_at: u.created_at,
            }))
        }
        None => Err(AppError::NotFound("کاربر یافت نشد.".to_string())),
    }
}

pub async fn get_user_orders(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Value>, AppError> {
    let claims = extract_claims(&headers, &state.jwt_secret)?;
    let user_id: i64 = claims.sub.parse().unwrap_or(0);

    let orders: Vec<OrderRow> = sqlx::query_as(
        "SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC",
    )
    .bind(user_id)
    .fetch_all(&state.pool)
    .await?;

    let mut result = Vec::new();
    for o in orders {
        let items: Vec<(String, i64, i64)> = sqlx::query_as(
            "SELECT name, unit_price, qty FROM order_items WHERE order_id = ?",
        )
        .bind(o.id)
        .fetch_all(&state.pool)
        .await
        .unwrap_or_default();

        let items_json: Vec<Value> = items
            .into_iter()
            .map(|(n, p, q)| json!({ "name": n, "unitPrice": p, "qty": q }))
            .collect();

        let shipping_info: Value = serde_json::from_str(&o.shipping_info).unwrap_or_else(|_| json!({}));

        result.push(json!({
            "id": o.id,
            "status": o.status,
            "subtotal": o.subtotal,
            "shipping": o.shipping,
            "total": o.total,
            "discount": o.discount.unwrap_or(0),
            "trackingCode": o.tracking_code,
            "shippingInfo": shipping_info,
            "createdAt": o.created_at,
            "items": items_json
        }));
    }

    Ok(Json(json!(result)))
}

pub async fn get_profile(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<UserProfileResponse>, AppError> {
    get_me(State(state), headers).await
}

#[derive(Debug, Deserialize)]
pub struct UpdateProfileInput {
    pub name: Option<String>,
    pub mobile: Option<String>,
    pub email: Option<String>,
}

pub async fn update_profile(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(input): Json<UpdateProfileInput>,
) -> Result<Json<Value>, AppError> {
    let claims = extract_claims(&headers, &state.jwt_secret)?;
    let user_id: i64 = claims.sub.parse().unwrap_or(0);

    let name = input.name.as_deref().map(|s| s.trim()).filter(|s| !s.is_empty());
    let mobile = input.mobile.as_deref().map(|s| s.trim()).filter(|s| !s.is_empty());
    let email = input.email.as_deref().map(|s| s.trim().to_lowercase()).filter(|s| !s.is_empty());

    if mobile.is_none() && email.is_none() && name.is_none() {
        return Err(AppError::BadRequest("هیچ تغییری ارسال نشده است.".to_string()));
    }

    if let Some(m) = mobile {
        let clash: Option<i64> = sqlx::query_scalar("SELECT id FROM users WHERE mobile = ? AND id != ?")
            .bind(m)
            .bind(user_id)
            .fetch_optional(&state.pool)
            .await?;
        if clash.is_some() {
            return Err(AppError::BadRequest("این شماره موبایل متعلق به کاربر دیگری است.".to_string()));
        }
    }

    if let Some(ref e) = email {
        let clash: Option<i64> = sqlx::query_scalar("SELECT id FROM users WHERE email = ? AND id != ?")
            .bind(e)
            .bind(user_id)
            .fetch_optional(&state.pool)
            .await?;
        if clash.is_some() {
            return Err(AppError::BadRequest("این ایمیل متعلق به کاربر دیگری است.".to_string()));
        }
    }

    sqlx::query("UPDATE users SET name = COALESCE(?, name), mobile = COALESCE(?, mobile), email = COALESCE(?, email) WHERE id = ?")
        .bind(name)
        .bind(mobile)
        .bind(email)
        .bind(user_id)
        .execute(&state.pool)
        .await?;

    let u: User = sqlx::query_as("SELECT * FROM users WHERE id = ?")
        .bind(user_id)
        .fetch_one(&state.pool)
        .await?;

    let saved_addr: Option<Value> = u.saved_address.as_deref().and_then(|s| serde_json::from_str(s).ok());

    Ok(Json(json!({
        "success": true,
        "user": {
            "id": u.id,
            "name": u.name,
            "mobile": u.mobile,
            "phone": u.mobile,
            "email": u.email,
            "role": u.role,
            "savedAddress": saved_addr,
            "createdAt": u.created_at
        }
    })))
}

pub async fn update_address(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(body): Json<Value>,
) -> Result<Json<Value>, AppError> {
    let claims = extract_claims(&headers, &state.jwt_secret)?;
    let user_id: i64 = claims.sub.parse().unwrap_or(0);
    let addr_str = body.to_string();

    sqlx::query("UPDATE users SET saved_address = ? WHERE id = ?")
        .bind(&addr_str)
        .bind(user_id)
        .execute(&state.pool)
        .await?;

    Ok(Json(json!({ "success": true })))
}

#[derive(Debug, Deserialize)]
pub struct UpdatePasswordInput {
    pub current: String,
    pub next: String,
}

pub async fn update_password(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(input): Json<UpdatePasswordInput>,
) -> Result<Json<Value>, AppError> {
    let claims = extract_claims(&headers, &state.jwt_secret)?;
    let user_id: i64 = claims.sub.parse().unwrap_or(0);

    let u: User = sqlx::query_as("SELECT * FROM users WHERE id = ?")
        .bind(user_id)
        .fetch_one(&state.pool)
        .await?;

    if !verify_password(&input.current, &u.password_hash) {
        return Err(AppError::BadRequest("رمز عبور فعلی اشتباه است.".to_string()));
    }

    if input.next.len() < 6 {
        return Err(AppError::BadRequest("رمز عبور جدید باید حداقل ۶ کاراکتر باشد.".to_string()));
    }

    let new_hash = hash_password(&input.next).map_err(AppError::Internal)?;

    sqlx::query("UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?")
        .bind(&new_hash)
        .bind(user_id)
        .execute(&state.pool)
        .await?;

    Ok(Json(json!({ "success": true, "message": "کلمه عبور با موفقیت به‌روزرسانی شد." })))
}

