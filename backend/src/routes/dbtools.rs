use crate::error::AppError;
use crate::routes::public::AppState;
use crate::services::auth::{verify_token, Claims};
use axum::{
    body::Bytes,
    extract::{Path, Query, State},
    http::{header, HeaderMap, StatusCode},
    response::{IntoResponse, Response},
    Json,
};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use sqlx::{Column, Row};
use std::path::{Path as StdPath, PathBuf};

#[derive(Debug, Deserialize)]
pub struct AuthQuery {
    pub token: Option<String>,
    pub page: Option<i64>,
    pub limit: Option<i64>,
    pub format: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct QueryBody {
    pub sql: Option<String>,
}

pub fn check_admin(
    headers: &HeaderMap,
    query_token: Option<&str>,
    secret: &str,
) -> Result<Claims, AppError> {
    let token = if let Some(auth_h) = headers.get("Authorization").and_then(|v| v.to_str().ok()) {
        if auth_h.starts_with("Bearer ") {
            &auth_h[7..]
        } else {
            auth_h
        }
    } else if let Some(q_tok) = query_token {
        q_tok
    } else {
        return Err(AppError::Unauthorized(
            "لطفاً ابتدا وارد حساب مدیر شوید.".to_string(),
        ));
    };

    let claims = verify_token(token, secret).map_err(AppError::Unauthorized)?;
    if claims.role != "admin" {
        return Err(AppError::Forbidden("دسترسی مدیر لازم است.".to_string()));
    }
    Ok(claims)
}

fn get_backups_dir(db_path: &str) -> PathBuf {
    let parent = StdPath::new(db_path)
        .parent()
        .unwrap_or_else(|| StdPath::new("."));
    let b_dir = parent.join("backups");
    let _ = std::fs::create_dir_all(&b_dir);
    b_dir
}

fn redact_value(key: &str, val: Value) -> Value {
    if key == "password_hash" || key == "token_secret" {
        Value::String("••••••".to_string())
    } else {
        val
    }
}

// GET /api/admin/db/tables
pub async fn list_tables(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(query): Query<AuthQuery>,
) -> Result<Json<Value>, AppError> {
    check_admin(&headers, query.token.as_deref(), &state.config.token_secret)?;

    let size = std::fs::metadata(&state.config.db_path)
        .map(|m| m.len())
        .unwrap_or(0);

    let table_names: Vec<String> = sqlx::query_scalar(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    )
    .fetch_all(&state.pool)
    .await
    .map_err(|e| AppError::Database(e.to_string()))?;

    let mut tables = Vec::new();
    for name in table_names {
        let count_query = format!("SELECT COUNT(*) FROM \"{}\"", name);
        let rows: i64 = sqlx::query_scalar(&count_query)
            .fetch_one(&state.pool)
            .await
            .unwrap_or(0);

        let pragma_query = format!("PRAGMA table_info(\"{}\")", name);
        let columns_raw: Vec<(i64, String, String, i64, Option<String>, i64)> = sqlx::query_as(&pragma_query)
            .fetch_all(&state.pool)
            .await
            .unwrap_or_default();

        let columns: Vec<Value> = columns_raw
            .into_iter()
            .map(|(_, col_name, col_type, _, _, pk)| {
                json!({
                    "name": col_name,
                    "type": col_type,
                    "pk": pk != 0
                })
            })
            .collect();

        tables.push(json!({
            "name": name,
            "rows": rows,
            "columns": columns
        }));
    }

    Ok(Json(json!({
        "size": size,
        "tables": tables
    })))
}

// GET /api/admin/db/tables/:name
pub async fn get_table_data(
    State(state): State<AppState>,
    Path(table_name): Path<String>,
    headers: HeaderMap,
    Query(query): Query<AuthQuery>,
) -> Result<Json<Value>, AppError> {
    check_admin(&headers, query.token.as_deref(), &state.config.token_secret)?;

    let valid_tables: Vec<String> = sqlx::query_scalar(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'"
    )
    .fetch_all(&state.pool)
    .await
    .map_err(|e| AppError::Database(e.to_string()))?;

    if !valid_tables.contains(&table_name) {
        return Err(AppError::NotFound("جدول یافت نشد.".to_string()));
    }

    let limit = query.limit.unwrap_or(50).clamp(1, 200);
    let page = query.page.unwrap_or(1).max(1);
    let offset = (page - 1) * limit;

    let count_query = format!("SELECT COUNT(*) FROM \"{}\"", table_name);
    let total: i64 = sqlx::query_scalar(&count_query)
        .fetch_one(&state.pool)
        .await
        .unwrap_or(0);

    let select_sql = format!(
        "SELECT rowid AS _rowid, * FROM \"{}\" ORDER BY rowid DESC LIMIT {} OFFSET {}",
        table_name, limit, offset
    );

    let rows_raw = sqlx::query(&select_sql)
        .fetch_all(&state.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

    let mut rows = Vec::new();
    for row in rows_raw {
        let mut obj = serde_json::Map::new();
        for col in row.columns() {
            let col_name = col.name();
            let val: Value = if let Ok(v) = row.try_get::<i64, _>(col_name) {
                json!(v)
            } else if let Ok(v) = row.try_get::<f64, _>(col_name) {
                json!(v)
            } else if let Ok(v) = row.try_get::<String, _>(col_name) {
                json!(v)
            } else if let Ok(v) = row.try_get::<Option<String>, _>(col_name) {
                match v {
                    Some(s) => json!(s),
                    None => Value::Null,
                }
            } else {
                Value::Null
            };
            obj.insert(col_name.to_string(), redact_value(col_name, val));
        }
        rows.push(Value::Object(obj));
    }

    let pages = (total + limit - 1) / limit;

    Ok(Json(json!({
        "total": total,
        "page": page,
        "pages": pages.max(1),
        "rows": rows
    })))
}

// DELETE /api/admin/db/tables/:name/:rowid
pub async fn delete_table_row(
    State(state): State<AppState>,
    Path((table_name, rowid)): Path<(String, i64)>,
    headers: HeaderMap,
    Query(query): Query<AuthQuery>,
) -> Result<Json<Value>, AppError> {
    check_admin(&headers, query.token.as_deref(), &state.config.token_secret)?;

    if table_name == "settings" {
        return Err(AppError::BadRequest("حذف از جدول تنظیمات مجاز نیست.".to_string()));
    }

    let delete_sql = format!("DELETE FROM \"{}\" WHERE rowid = ?", table_name);
    sqlx::query(&delete_sql)
        .bind(rowid)
        .execute(&state.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

    Ok(Json(json!({ "success": true })))
}

// GET /api/admin/db/info
pub async fn get_db_info(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(query): Query<AuthQuery>,
) -> Result<Json<Value>, AppError> {
    check_admin(&headers, query.token.as_deref(), &state.config.token_secret)?;

    let stat = std::fs::metadata(&state.config.db_path).ok();
    let size = stat.as_ref().map(|s| s.len()).unwrap_or(0);
    let size_formatted = if size > 1024 * 1024 {
        format!("{:.2} MB", size as f64 / (1024.0 * 1024.0))
    } else {
        format!("{:.1} KB", size as f64 / 1024.0)
    };

    let table_names: Vec<String> = sqlx::query_scalar(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'"
    )
    .fetch_all(&state.pool)
    .await
    .unwrap_or_default();

    let mut total_records: i64 = 0;
    for t in &table_names {
        let count_q = format!("SELECT COUNT(*) FROM \"{}\"", t);
        let c: i64 = sqlx::query_scalar(&count_q)
            .fetch_one(&state.pool)
            .await
            .unwrap_or(0);
        total_records += c;
    }

    let backup_dir = get_backups_dir(&state.config.db_path);
    let backups_count = std::fs::read_dir(backup_dir)
        .map(|entries| {
            entries
                .filter_map(|e| e.ok())
                .filter(|e| e.path().extension().and_then(|s| s.to_str()) == Some("db"))
                .count()
        })
        .unwrap_or(0);

    let wal_path = format!("{}-wal", state.config.db_path);
    let wal_active = StdPath::new(&wal_path).exists();

    Ok(Json(json!({
        "dbPath": state.config.db_path,
        "dataDir": StdPath::new(&state.config.db_path).parent().and_then(|p| p.to_str()).unwrap_or("data"),
        "size": size,
        "sizeFormatted": size_formatted,
        "driver": "sqlx:sqlite (Rust native)",
        "tablesCount": table_names.len(),
        "totalRecords": total_records,
        "backupsCount": backups_count,
        "walActive": wal_active,
        "lastModified": stat.and_then(|s| s.modified().ok()).map(|m| chrono::DateTime::<Utc>::from(m).to_rfc3339()),
    })))
}

// GET /api/admin/db/download
pub async fn download_db(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(query): Query<AuthQuery>,
) -> Result<Response, AppError> {
    check_admin(&headers, query.token.as_deref(), &state.config.token_secret)?;

    let _ = sqlx::query("PRAGMA wal_checkpoint(FULL)").execute(&state.pool).await;

    let backup_dir = get_backups_dir(&state.config.db_path);
    let stamp = Utc::now().format("%Y-%m-%d_%H-%M-%S").to_string();
    let filename = format!("techtink_{}.db", stamp);
    let snapshot_path = backup_dir.join(&filename);
    let snapshot_str = snapshot_path.to_string_lossy().replace('\'', "''");

    let vacuum_sql = format!("VACUUM INTO '{}'", snapshot_str);
    let bytes = match sqlx::query(&vacuum_sql).execute(&state.pool).await {
        Ok(_) => tokio::fs::read(&snapshot_path).await.map_err(|e| AppError::Internal(e.to_string()))?,
        Err(_) => tokio::fs::read(&state.config.db_path).await.map_err(|e| AppError::Internal(e.to_string()))?,
    };

    let res = Response::builder()
        .header(header::CONTENT_TYPE, "application/x-sqlite3")
        .header(
            header::CONTENT_DISPOSITION,
            format!("attachment; filename=\"{}\"", filename),
        )
        .body(axum::body::Body::from(bytes))
        .map_err(|e| AppError::Internal(e.to_string()))?;

    Ok(res)
}

// GET /api/admin/db/backups
pub async fn list_backups(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(query): Query<AuthQuery>,
) -> Result<Json<Value>, AppError> {
    check_admin(&headers, query.token.as_deref(), &state.config.token_secret)?;

    let backup_dir = get_backups_dir(&state.config.db_path);
    let mut backups = Vec::new();

    if let Ok(entries) = std::fs::read_dir(backup_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.extension().and_then(|e| e.to_str()) == Some("db") {
                if let Ok(meta) = entry.metadata() {
                    let name = entry.file_name().to_string_lossy().to_string();
                    let created_at = meta.modified().ok().map(|m| chrono::DateTime::<Utc>::from(m).to_rfc3339());
                    backups.push(json!({
                        "name": name,
                        "size": meta.len(),
                        "createdAt": created_at
                    }));
                }
            }
        }
    }

    Ok(Json(json!(backups)))
}

// POST /api/admin/db/backups
pub async fn create_backup_endpoint(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(query): Query<AuthQuery>,
) -> Result<Json<Value>, AppError> {
    check_admin(&headers, query.token.as_deref(), &state.config.token_secret)?;

    let backup_dir = get_backups_dir(&state.config.db_path);
    let stamp = Utc::now().format("%Y-%m-%d_%H-%M-%S").to_string();
    let filename = format!("techtink-{}.db", stamp);
    let target_path = backup_dir.join(&filename);
    let target_str = target_path.to_string_lossy().replace('\'', "''");

    let vacuum_sql = format!("VACUUM INTO '{}'", target_str);
    sqlx::query(&vacuum_sql)
        .execute(&state.pool)
        .await
        .map_err(|e| AppError::Database(format!("Backup failed: {}", e)))?;

    Ok(Json(json!({ "name": filename })))
}

// POST /api/admin/db/query
pub async fn execute_query(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(query): Query<AuthQuery>,
    Json(body): Json<QueryBody>,
) -> Result<Json<Value>, AppError> {
    check_admin(&headers, query.token.as_deref(), &state.config.token_secret)?;

    let sql = body.sql.unwrap_or_default().trim().trim_end_matches(';').to_string();
    let lower = sql.to_lowercase();

    if (!lower.starts_with("select") && !lower.starts_with("with") && !lower.starts_with("pragma table_info")) || sql.contains(';') {
        return Err(AppError::BadRequest("فقط یک دستور SELECT مجاز است.".to_string()));
    }

    let forbidden = ["insert", "update", "delete", "drop", "alter", "create", "attach", "replace", "vacuum"];
    for keyword in forbidden {
        if lower.contains(keyword) {
            return Err(AppError::BadRequest("دستورات تغییر داده مجاز نیستند.".to_string()));
        }
    }

    let rows_raw = sqlx::query(&sql)
        .fetch_all(&state.pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;

    let mut rows = Vec::new();
    for row in rows_raw.into_iter().take(500) {
        let mut obj = serde_json::Map::new();
        for col in row.columns() {
            let col_name = col.name();
            let val: Value = if let Ok(v) = row.try_get::<i64, _>(col_name) {
                json!(v)
            } else if let Ok(v) = row.try_get::<f64, _>(col_name) {
                json!(v)
            } else if let Ok(v) = row.try_get::<String, _>(col_name) {
                json!(v)
            } else if let Ok(v) = row.try_get::<Option<String>, _>(col_name) {
                match v {
                    Some(s) => json!(s),
                    None => Value::Null,
                }
            } else {
                Value::Null
            };
            obj.insert(col_name.to_string(), redact_value(col_name, val));
        }
        rows.push(Value::Object(obj));
    }

    Ok(Json(json!({ "rows": rows })))
}

// POST /api/admin/db/maintenance/:op
pub async fn run_maintenance(
    State(state): State<AppState>,
    Path(op): Path<String>,
    headers: HeaderMap,
    Query(query): Query<AuthQuery>,
) -> Result<Json<Value>, AppError> {
    check_admin(&headers, query.token.as_deref(), &state.config.token_secret)?;

    match op.as_str() {
        "integrity" => {
            let result: String = sqlx::query_scalar("PRAGMA integrity_check")
                .fetch_one(&state.pool)
                .await
                .map_err(|e| AppError::Database(e.to_string()))?;
            Ok(Json(json!({ "result": result })))
        }
        "vacuum" => {
            sqlx::query("VACUUM")
                .execute(&state.pool)
                .await
                .map_err(|e| AppError::Database(e.to_string()))?;
            let size = std::fs::metadata(&state.config.db_path).map(|m| m.len()).unwrap_or(0);
            Ok(Json(json!({ "result": "VACUUM انجام شد.", "size": size })))
        }
        "optimize" => {
            sqlx::query("PRAGMA optimize")
                .execute(&state.pool)
                .await
                .map_err(|e| AppError::Database(e.to_string()))?;
            Ok(Json(json!({ "result": "بهینه‌سازی انجام شد." })))
        }
        _ => Err(AppError::BadRequest("عملیات نامعتبر است.".to_string())),
    }
}
