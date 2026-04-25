use serde::{Serialize, Deserialize};
use std::sync::{Arc, Mutex};
use std::fs;

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
    pub energy_cost: u8, // 1-5 (1: Low, 5: High)
    pub steps: Vec<TinyStep>,
    pub is_active: bool,
}

pub struct TaskManager {
    pub tasks: Arc<Mutex<Vec<Task>>>,
    pub storage_path: String,
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

    pub fn decompose(&self, task_id: uuid::Uuid, steps: Vec<String>) {
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
