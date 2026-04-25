use std::sync::{Arc, Mutex};
use tokio::sync::broadcast;
use std::time::Duration;
use serde::{Serialize, Deserialize};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct TimerState {
    pub remaining_seconds: u32,
    pub is_running: bool,
    pub current_task: String,
}

pub struct TimerManager {
    pub state: Arc<Mutex<TimerState>>,
    pub tx: broadcast::Sender<TimerState>,
}

impl TimerManager {
    pub fn new(initial_minutes: u32) -> Self {
        let state = TimerState {
            remaining_seconds: initial_minutes * 60,
            is_running: false,
            current_task: "Idle".to_string(),
        };
        let (tx, _) = broadcast::channel(10);
        
        Self {
            state: Arc::new(Mutex::new(state)),
            tx,
        }
    }

    pub async fn tick(&self) {
        loop {
            tokio::time::sleep(Duration::from_secs(1)).await;
            let mut state = self.state.lock().unwrap();
            
            if state.is_running && state.remaining_seconds > 0 {
                state.remaining_seconds -= 1;
                let _ = self.tx.send(state.clone());
            } else if state.remaining_seconds == 0 {
                state.is_running = false;
                let _ = self.tx.send(state.clone());
            }
        }
    }

    pub fn toggle(&self) {
        let mut state = self.state.lock().unwrap();
        state.is_running = !state.is_running;
        let _ = self.tx.send(state.clone());
    }

    pub fn reset(&self, minutes: u32) {
        let mut state = self.state.lock().unwrap();
        state.remaining_seconds = minutes * 60;
        state.is_running = false;
        let _ = self.tx.send(state.clone());
    }
}
