use std::path::PathBuf;

#[derive(Clone, Debug)]
pub struct Config {
    pub host: String,
    pub port: u16,
    pub db_path: String,
    pub data_dir: PathBuf,
    pub dist_dir: PathBuf,
    pub smtp_port: u16,
    pub jwt_secret: String,
    pub token_secret: String,
}

impl Config {
    pub fn from_env() -> Self {
        let host = std::env::var("HOST").unwrap_or_else(|_| "0.0.0.0".to_string());
        let port = std::env::var("PORT")
            .ok()
            .and_then(|p| p.parse().ok())
            .unwrap_or(3000);

        let data_dir_str = std::env::var("DATA_DIR").unwrap_or_else(|_| "data".to_string());
        let data_dir = PathBuf::from(&data_dir_str);
        let db_path = std::env::var("DB_PATH").unwrap_or_else(|_| format!("{}/techtink.db", data_dir_str));

        let dist_dir_str = std::env::var("DIST_DIR").unwrap_or_else(|_| "dist".to_string());
        let dist_dir = PathBuf::from(dist_dir_str);

        let smtp_port = std::env::var("SMTP_PORT")
            .ok()
            .and_then(|p| p.parse().ok())
            .unwrap_or(25);

        let jwt_secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| {
            "techtink_default_secret_key_change_in_production".to_string()
        });

        let token_secret = std::env::var("TOKEN_SECRET").unwrap_or_else(|_| jwt_secret.clone());

        Self {
            host,
            port,
            db_path,
            data_dir,
            dist_dir,
            smtp_port,
            jwt_secret,
            token_secret,
        }
    }
}
