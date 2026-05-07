use serde::{Serialize, Deserialize};
use std::sync::{Arc, Mutex};
use std::fs;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct AppConfig {
    pub openai_api_key: Option<String>,
    pub openai_model: String,
    pub openai_base_url: String,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            openai_api_key: None,
            openai_model: "gpt-4o".to_string(),
            openai_base_url: "https://api.openai.com/v1".to_string(),
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
}
