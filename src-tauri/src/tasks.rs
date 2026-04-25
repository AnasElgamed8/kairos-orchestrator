use serde::{Serialize, Deserialize};
use std::sync::{Arc, Mutex};
use std::fs;
use reqwest::Client;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct TinyStep {
    pub id: uuid::Uuid,
    pub description: String,
    pub completed: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Task {
    pub id: uuid::Uuid,
    pub title: String,
    pub energy_cost: u8,
    pub steps: Vec<TinyStep>,
    pub is_active: bool,
}

pub struct TaskManager {
    pub tasks: Arc<Mutex<Vec<Task>>>,
    pub storage_path: String,
    pub http_client: Client,
}

impl TaskManager {
    pub fn new(storage_path: &str) -> Self {
        let tasks = if let Ok(data) = fs::read_to_string(storage_path) {
            serde_json::from_str(&data).unwrap_or_else(|_| vec![])
        } else {
            vec![]
        };

        Self {
            tasks: Arc::new(Mutex::new(tasks)),
            storage_path: storage_path.to_string(),
            http_client: Client::new(),
        }
    }

    pub fn save(&self) {
        let tasks = self.tasks.lock().unwrap();
        let data = serde_json::to_string_pretty(&*tasks).expect("Failed to serialize tasks");
        fs::write(&self.storage_path, data).expect("Failed to write tasks to disk");
    }

    pub fn add_task(&self, title: String, energy: u8) {
        let mut tasks = self.tasks.lock().unwrap();
        tasks.push(Task {
            id: uuid::Uuid::new_v4(),
            title,
            energy_cost: energy,
            steps: vec![],
            is_active: false,
        });
        drop(tasks);
        self.save();
    }

    pub async fn decompose_with_ai(&self, task_id: uuid::Uuid, api_key: &str) -> Result<(), String> {
        let task_title = {
            let tasks = self.tasks.lock().unwrap();
            tasks.iter().find(|t| t.id == task_id)
                .map(|t| t.title.clone())
                .ok_or("Task not found")?
        };

        // AI Prompt for "Tiny Steps"
        let prompt = format!(
            "Break down the task '{}' into 4-6 extremely small, concrete, physical first steps. \
            Each step should be a simple action. Return ONLY a JSON array of strings. \
            Example: [\"Open the book\", \"Read page 1\"]", 
            task_title
        );

        // This is a generic implementation; in production, we'd use the specific provider's API
        let response = self.http_client.post("https://api.openai.com/v1/chat/completions")
            .bearer_auth(api_key)
            .json(&serde_json::json!({
                "model": "gpt-4o",
                "messages": [{"role": "user", "content": prompt}],
                "response_format": { "type": "json_object" }
            }))
            .send()
            .await
            .map_err(|e| e.to_string())?;

        let json: serde_json::Value = response.json().await.map_err(|e| e.to_string())?;
        let content = json["choices"][0]["message"]["content"].as_str().ok_or("Invalid AI response")?;
        let steps: Vec<String> = serde_json::from_str(content).map_err(|e| e.to_string())?;

        self.apply_steps(task_id, steps);
        Ok(())
    }

    fn apply_steps(&self, task_id: uuid::Uuid, steps: Vec<String>) {
        let mut tasks = self.tasks.lock().unwrap();
        if let Some(task) = tasks.iter_mut().find(|t| t.id == task_id) {
            task.steps = steps.into_iter().map(|s| TinyStep {
                id: uuid::Uuid::new_v4(),
                description: s,
                completed: false,
            }).collect();
        }
        drop(tasks);
        self.save();
    }
}
