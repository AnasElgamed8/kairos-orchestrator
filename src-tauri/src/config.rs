use serde::{Serialize, Deserialize};
use std::sync::{Arc, Mutex};
use std::fs;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct FocusVeilConfig {
    /// List of app class names to block during focus (e.g., ["firefox", "discord", "steam"])
    pub blocked_apps: Vec<String>,
    /// Path to the focus-mode wallpaper (null = don't change wallpaper)
    pub focus_wallpaper: Option<String>,
    /// Path to the default wallpaper to restore after focus ends
    pub default_wallpaper: Option<String>,
    /// Whether to suppress notifications during focus
    pub suppress_notifications: bool,
    /// Whether to enable the veil at all
    pub enabled: bool,
}

impl Default for FocusVeilConfig {
    fn default() -> Self {
        Self {
            blocked_apps: vec![
                "firefox".to_string(),
                "google-chrome".to_string(),
                "discord".to_string(),
                "steam".to_string(),
                "thunderbird".to_string(),
            ],
            focus_wallpaper: None,
            default_wallpaper: None,
            suppress_notifications: true,
            enabled: true,
        }
    }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct AppConfig {
    pub openai_api_key: Option<String>,
    pub openai_model: String,
    pub openai_base_url: String,
    #[serde(default)]
    pub focus_veil: FocusVeilConfig,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            openai_api_key: None,
            openai_model: "gpt-4o".to_string(),
            openai_base_url: "https://api.openai.com/v1".to_string(),
            focus_veil: FocusVeilConfig::default(),
        }
    }
}

pub struct ConfigManager {
    pub config: Arc<Mutex<AppConfig>>,
    pub storage_path: String,
}

impl ConfigManager {
    pub fn new(storage_path: &str) -> Self {
        let config = if let Ok(data) = fs::read_to_string(storage_path) {
            serde_json::from_str(&data).unwrap_or_default()
        } else {
            AppConfig::default()
        };

        Self {
            config: Arc::new(Mutex::new(config)),
            storage_path: storage_path.to_string(),
        }
    }

    pub fn save(&self) {
        let config = self.config.lock().unwrap();
        let data = serde_json::to_string_pretty(&*config).expect("Failed to serialize config");
        fs::write(&self.storage_path, data).expect("Failed to write config to disk");
    }

    pub fn get_config(&self) -> AppConfig {
        self.config.lock().unwrap().clone()
    }

    pub fn set_api_key(&self, key: String) {
        let mut config = self.config.lock().unwrap();
        config.openai_api_key = Some(key);
        drop(config);
        self.save();
    }

    pub fn set_model(&self, model: String) {
        let mut config = self.config.lock().unwrap();
        config.openai_model = model;
        drop(config);
        self.save();
    }

    pub fn set_base_url(&self, url: String) {
        let mut config = self.config.lock().unwrap();
        config.openai_base_url = url;
        drop(config);
        self.save();
    }

    pub fn set_focus_veil(&self, veil: FocusVeilConfig) {
        let mut config = self.config.lock().unwrap();
        config.focus_veil = veil;
        drop(config);
        self.save();
    }
}
