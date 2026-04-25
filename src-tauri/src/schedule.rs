use serde::{Serialize, Deserialize};
use std::sync::{Arc, Mutex};
use std::fs;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ScheduledTask {
    pub task_id: uuid::Uuid,
    pub scheduled_time: String, // HH:MM
    pub duration_mins: u32,
    pub energy_cost: u8,
}

pub struct ScheduleManager {
    pub daily_plan: Arc<Mutex<Vec<ScheduledTask>>>,
    pub storage_path: String,
}

impl ScheduleManager {
    pub fn new(storage_path: &str) -> Self {
        let plan = if let Ok(data) = fs::read_to_string(storage_path) {
            serde_json::from_str(&data).unwrap_or_else(|_| vec![])
        } else {
            vec![]
        };

        Self {
            daily_plan: Arc::new(Mutex::new(plan)),
            storage_path: storage_path.to_string(),
        }
    }

    pub fn save(&self) {
        let plan = self.daily_plan.lock().unwrap();
        let data = serde_json::to_string_pretty(&*plan).expect("Failed to serialize schedule");
        fs::write(&self.storage_path, data).expect("Failed to write schedule to disk");
    }

    pub fn add_to_schedule(&self, task_id: uuid::Uuid, time: String, duration: u32, energy: u8) {
        let mut plan = self.daily_plan.lock().unwrap();
        plan.push(ScheduledTask {
            task_id,
            scheduled_time: time,
            duration_mins: duration,
            energy_cost: energy,
        });
        // Sort by time automatically
        plan.sort_by(|a, b| a.scheduled_time.cmp(&b.scheduled_time));
        drop(plan);
        self.save();
    }

    pub fn clear_day(&self) {
        let mut plan = self.daily_plan.lock().unwrap();
        plan.clear();
        drop(plan);
        self.save();
    }
}
