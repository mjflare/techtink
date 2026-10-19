pub mod schema;
pub use schema::migrate as run_migrations;

use sqlx::{
    sqlite::{SqliteConnectOptions, SqliteJournalMode, SqlitePoolOptions, SqliteSynchronous},
    SqlitePool,
};
use std::path::Path;
use std::time::Duration;

pub async fn init_pool(db_path: &Path) -> Result<SqlitePool, sqlx::Error> {
    if let Some(parent) = db_path.parent() {
        std::fs::create_dir_all(parent).ok();
    }

    let options = SqliteConnectOptions::new()
        .filename(db_path)
        .create_if_missing(true)
        .journal_mode(SqliteJournalMode::Wal)
        .synchronous(SqliteSynchronous::Normal)
        .busy_timeout(Duration::from_secs(10))
        .foreign_keys(true);

    let pool = SqlitePoolOptions::new()
        .max_connections(25)
        .min_connections(2)
        .acquire_timeout(Duration::from_secs(5))
        .connect_with(options)
        .await?;

    schema::migrate(&pool).await?;

    tracing::info!("SQLite connected and migrated at {:?}", db_path);
    Ok(pool)
}
