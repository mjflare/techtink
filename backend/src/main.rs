mod config;
mod db;
mod error;
mod models;
mod routes;
mod services;

use crate::config::Config;
use crate::db::{init_pool, run_migrations};
use crate::routes::public::{generate_robots_txt, generate_sitemap_xml, AppState};
use crate::services::auth::ensure_admin;
use crate::services::smtp_receiver::start_smtp_listener;
use axum::{
    extract::State,
    http::{header, HeaderMap, StatusCode},
    response::{Html, IntoResponse, Response},
    routing::get,
    Router,
};
use std::path::Path;
use tower_http::cors::{Any, CorsLayer};
use tower_http::services::{ServeDir, ServeFile};
use tower_http::trace::TraceLayer;

async fn sitemap_handler(State(state): State<AppState>, headers: HeaderMap) -> impl IntoResponse {
    let host = headers.get("host").and_then(|v| v.to_str().ok());
    let proto = headers
        .get("x-forwarded-proto")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("https");
    let dynamic_base = host.map(|h| format!("{}://{}", proto, h));
    let xml = generate_sitemap_xml(&state.pool, dynamic_base.as_deref()).await;
    ([(header::CONTENT_TYPE, "application/xml; charset=utf-8")], xml)
}

async fn robots_handler(State(state): State<AppState>, headers: HeaderMap) -> impl IntoResponse {
    let host = headers.get("host").and_then(|v| v.to_str().ok());
    let proto = headers
        .get("x-forwarded-proto")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("https");
    let dynamic_base = host.map(|h| format!("{}://{}", proto, h));
    let text = generate_robots_txt(&state.pool, dynamic_base.as_deref()).await;
    ([(header::CONTENT_TYPE, "text/plain; charset=utf-8")], text)
}

async fn enamad_handler() -> impl IntoResponse {
    ([(header::CONTENT_TYPE, "text/plain; charset=utf-8")], "")
}

async fn fallback_not_found(State(state): State<AppState>) -> Response {
    let index_file = state.dist_dir.join("index.html");
    if index_file.exists() {
        if let Ok(content) = tokio::fs::read_to_string(&index_file).await {
            return ([(header::CONTENT_TYPE, "text/html; charset=utf-8")], Html(content))
                .into_response();
        }
    }

    (
        StatusCode::NOT_FOUND,
        [(header::CONTENT_TYPE, "application/json; charset=utf-8")],
        axum::Json(serde_json::json!({
            "error": "Not found",
            "message": "TechTink Modern Rust Backend is running. Frontend static build not found in dist/."
        })),
    )
        .into_response()
}

fn load_env_file() {
    let candidates = [".env", "../.env"];
    for path in &candidates {
        if Path::new(path).exists() {
            if let Ok(contents) = std::fs::read_to_string(path) {
                for line in contents.lines() {
                    let trimmed = line.trim();
                    if trimmed.is_empty() || trimmed.starts_with('#') {
                        continue;
                    }
                    if let Some(eq_idx) = trimmed.find('=') {
                        let key = trimmed[..eq_idx].trim();
                        let val = trimmed[eq_idx + 1..].trim().trim_matches('"').trim_matches('\'');
                        if std::env::var(key).is_err() {
                            std::env::set_var(key, val);
                        }
                    }
                }
            }
            break;
        }
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    load_env_file();

    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "info,techtink_server=debug,tower_http=info".into()),
        )
        .init();

    tracing::info!("🦀 Starting TechTink Rust Backend Engine...");

    let config = Config::from_env();

    let pool = init_pool(Path::new(&config.db_path)).await?;
    tracing::info!("✓ SQLite connection established: {}", config.db_path);

    run_migrations(&pool).await?;
    tracing::info!("✓ Database migrations up to date");

    if let Err(e) = ensure_admin(&pool).await {
        tracing::warn!("Admin check error: {}", e);
    }

    // Spawn native Inbound SMTP Mail Receiver
    let smtp_pool = pool.clone();
    let smtp_port = config.smtp_port;
    tokio::spawn(async move {
        start_smtp_listener(smtp_pool, smtp_port).await;
    });

    let state = AppState {
        pool: pool.clone(),
        jwt_secret: config.jwt_secret.clone(),
        dist_dir: config.dist_dir.clone(),
        config: config.clone(),
    };

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let api_router = routes::create_api_router();

    let mut app = Router::new()
        .nest("/api", api_router)
        .route("/sitemap.xml", get(sitemap_handler))
        .route("/robots.txt", get(robots_handler))
        .route("/24125751.txt", get(enamad_handler));

    // Serve static frontend assets from dist/ if directory exists
    if config.dist_dir.exists() {
        let index_path = config.dist_dir.join("index.html");
        let serve_dir = ServeDir::new(&config.dist_dir)
            .fallback(ServeFile::new(index_path));
        app = app.fallback_service(serve_dir);
    } else {
        app = app.fallback(fallback_not_found);
    }

    let app = app
        .with_state(state)
        .layer(cors)
        .layer(TraceLayer::new_for_http());

    let bind_addr = format!("{}:{}", config.host, config.port);
    let listener = tokio::net::TcpListener::bind(&bind_addr).await?;
    tracing::info!("⚡ TechTink Server listening on http://{}", bind_addr);

    axum::serve(listener, app).await?;

    Ok(())
}
