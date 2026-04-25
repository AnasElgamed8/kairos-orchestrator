mod timer;
mod tasks;
use timer::{TimerManager, TimerState};
use tasks::{TaskManager, Task};
use tauri::{State, Manager};
use std::sync::Arc;
use discord_rpc::{ClientId, UserPresence};
use uuid::Uuid;

#[tauri::command]
fn toggle_timer(state: State<'_, Arc<TimerManager>>) {
    state.toggle();
}

#[tauri::command]
fn reset_timer(state: State<'_, Arc<TimerManager>>, minutes: u32) {
    state.reset(minutes);
}

#[tauri::command]
fn get_timer_state(state: State<'_, Arc<TimerManager>>) -> TimerState {
    state.state.lock().unwrap().clone()
}

#[tauri::command]
fn get_tasks(state: State<'_, Arc<TaskManager>>) -> Vec<Task> {
    state.tasks.lock().unwrap().clone()
}

#[tauri::command]
fn add_task(state: State<'_, Arc<TaskManager>>, title: String, energy: u8) {
    state.add_task(title, energy);
}

#[tauri::command]
fn decompose_task(state: State<'_, Arc<TaskManager>>, task_id: Uuid, steps: Vec<String>) {
    state.decompose(task_id, steps);
}

fn start_discord_thread(timer_manager: Arc<TimerManager>, app_id: String) {
    std::thread::spawn(move || {
        let client_id = ClientId::from_str(&app_id).expect("Invalid Client ID");
        let mut session = discord_rpc::Session::new(client_id).expect("Discord session failed");
        let mut rx = timer_manager.tx.subscribe();

        loop {
            if let Ok(state) = rx.recv().blocking_recv() {
                let presence = UserPresence {
                    state: if state.is_running { 
                        format!("{} - {}s remaining", state.current_task, state.remaining_seconds) 
                    } else { 
                        "Taking a break".to_string() 
                    },
                    details: "Achieving Flow State".to_string(),
                    start_timestamp: std::time::SystemTime::now(),
                    assets: None,
                };
                let _ = session.set_presence(presence);
            }
        }
    });
}

fn main() {
    let app_id = "1497640735304974396".to_string();
    let timer_manager = Arc::new(TimerManager::new(25));
    let task_manager = Arc::new(TaskManager::new("/opt/data/home/kairos/tasks.json"));

    let tm_clone = Arc::clone(&timer_manager);
    tokio::spawn(async move {
        tm_clone.tick().await;
    });

    start_discord_thread(Arc::clone(&timer_manager), app_id);

    tauri::Builder::default()
        .manage(timer_manager)
        .manage(task_manager)
        .invoke_handler(tauri::generate_handler![
            toggle_timer, 
            reset_timer, 
            get_timer_state, 
            get_tasks, 
            add_task, 
            decompose_task
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
