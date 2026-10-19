#[path = "../src/config.rs"]
mod config;
#[path = "../src/db/mod.rs"]
mod db;
#[path = "../src/error.rs"]
mod error;
#[path = "../src/models/mod.rs"]
mod models;
#[path = "../src/routes/mod.rs"]
mod routes;
#[path = "../src/services/mod.rs"]
mod services;

use axum::body::{to_bytes, Body};
use axum::http::{Request, StatusCode};
use config::Config;
use db::init_pool;
use routes::public::AppState;
use std::path::Path;
use tower::ServiceExt;

#[tokio::test]
async fn test_public_api_endpoints() {
    let mut config = Config::from_env();
    config.db_path = "data/techtink.db".to_string();

    let pool = match init_pool(Path::new(&config.db_path)).await {
        Ok(p) => p,
        Err(e) => {
            println!("Skipping integration test if DB not found: {}", e);
            return;
        }
    };

    let state = AppState {
        pool: pool.clone(),
        jwt_secret: config.jwt_secret.clone(),
        dist_dir: config.dist_dir.clone(),
        config: config.clone(),
    };

    let app = axum::Router::new()
        .nest("/api", routes::create_api_router())
        .with_state(state);

    // 1. Test /api/settings
    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .uri("/api/settings")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(res.status(), StatusCode::OK);
    let body_bytes = to_bytes(res.into_body(), usize::MAX).await.unwrap();
    let body_str = String::from_utf8(body_bytes.to_vec()).unwrap();
    assert!(body_str.contains("store_name") || body_str.contains("site_url"));
    println!("✓ /api/settings: OK");

    // 2. Test /api/products
    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .uri("/api/products")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(res.status(), StatusCode::OK);
    let body_bytes = to_bytes(res.into_body(), usize::MAX).await.unwrap();
    let body_str = String::from_utf8(body_bytes.to_vec()).unwrap();
    assert!(body_str.starts_with('['));
    println!("✓ /api/products: OK (received array)");

    // 3. Test /api/categories
    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .uri("/api/categories")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(res.status(), StatusCode::OK);
    println!("✓ /api/categories: OK");

    // 4. Test /api/homepage
    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .uri("/api/homepage")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(res.status(), StatusCode::OK);
    println!("✓ /api/homepage: OK");

    // 5. Test /api/torob/products
    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .uri("/api/torob/products")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(res.status(), StatusCode::OK);
    println!("✓ /api/torob/products: OK");
}
