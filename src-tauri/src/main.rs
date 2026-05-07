mod timer;
mod tasks;
mod schedule;
mod hyprland;
mod config;

use timer::{TimerManager, TimerState};
use tasks::{TaskManager, Task};
use schedule::{ScheduleManager, ScheduledTask};
use hyprland::HyprlandManager;
use config::{ConfigManager, AppConfig, FocusVeilConfig};
use tauri::State;
use std::sync::Arc;
use uuid::Uuid;
use std::fs;
use chrono::Local;

// ── Timer Commands ──────────────────────────────────────────────

#[tauri::command]
fn toggle_timer(
    state: State<'_, Arc<TimerManager>>,
    hypr: State<'_, Arc<HyprlandManager>>,
    cfg: State<'_, Arc<ConfigManager>>,
) {
    state.toggle();
    let is_running = state.state.lock().unwrap().is_running;
    let veil_config = cfg.get_config().focus_veil;
    hypr.trigger_focus_mode(is_running, &veil_config);
}

#[tauri::command]
fn reset_timer(state: State<'_, Arc<TimerManager>>, minutes: u32) {
    state.reset(minutes);
}

#[tauri::command]
fn get_timer_state(state: State<'_, Arc<TimerManager>>) -> TimerState {
    state.state.lock().unwrap().clone()
}

// ── Task Commands ───────────────────────────────────────────────

#[tauri::command]
fn get_tasks(state: State<'_, Arc<TaskManager>>) -> Vec<Task> {
    state.tasks.lock().unwrap().clone()
}

#[tauri::command]
fn add_task(state: State<'_, Arc<TaskManager>>, title: String, energy: u8) {
    state.add_task(title, energy);
}

#[tauri::command]
fn delete_task(state: State<'_, Arc<TaskManager>>, task_id: Uuid) {
    state.delete_task(task_id);
}

#[tauri::command]
fn decompose_task(state: State<'_, Arc<TaskManager>>, task_id: Uuid, steps: Vec<String>) {
    state.apply_steps(task_id, steps);
}

#[tauri::command]
async fn ai_decompose_task(
    task_manager: State<'_, Arc<TaskManager>>,
    config_manager: State<'_, Arc<ConfigManager>>,
    task_id: Uuid,
) -> Result<(), String> {
    let (api_key, model, base_url) = {
        let cfg = config_manager.get_config();
        let key = cfg.openai_api_key.ok_or("No API key configured. Go to Settings.")?;
        (key, cfg.openai_model, cfg.openai_base_url)
    };

    task_manager
        .decompose_with_ai(task_id, &api_key, &model, &base_url)
        .await
}

#[tauri::command]
fn toggle_step(state: State<'_, Arc<TaskManager>>, task_id: Uuid, step_id: Uuid) {
    state.toggle_step(task_id, step_id);
}

#[tauri::command]
fn set_active_task(state: State<'_, Arc<TaskManager>>, task_id: Uuid) {
    state.set_active_task(task_id);
}

// ── Schedule Commands ───────────────────────────────────────────

#[tauri::command]
fn get_schedule(state: State<'_, Arc<ScheduleManager>>) -> Vec<ScheduledTask> {
    state.daily_plan.lock().unwrap().clone()
}

#[tauri::command]
fn add_to_schedule(state: State<'_, Arc<ScheduleManager>>, task_id: Uuid, time: String, duration: u32, energy: u8) {
    state.add_to_schedule(task_id, time, duration, energy);
}

#[tauri::command]
fn clear_schedule(state: State<'_, Arc<ScheduleManager>>) {
    state.clear_day();
}

#[tauri::command]
fn auto_trigger_now(
    timer: State<'_, Arc<TimerManager>>,
    tasks: State<'_, Arc<TaskManager>>,
    schedule: State<'_, Arc<ScheduleManager>>,
    hypr: State<'_, Arc<HyprlandManager>>,
    cfg: State<'_, Arc<ConfigManager>>,
) {
    let now = Local::now().format("%H:%M").to_string();

    let mut timer_state = timer.state.lock().unwrap();
    if timer_state.is_running {
        return;
    }
    drop(timer_state);

    if let Some(block) = schedule.take_due_task(&now) {
        let task_title = {
            let all_tasks = tasks.tasks.lock().unwrap();
            all_tasks
                .iter()
                .find(|t| t.id == block.task_id)
                .map(|t| t.title.clone())
                .unwrap_or_else(|| "Scheduled Focus Block".to_string())
        };

        let mut timer_state = timer.state.lock().unwrap();
        timer_state.current_task = task_title;
        timer_state.remaining_seconds = block.duration_mins * 60;
        timer_state.is_running = true;
        drop(timer_state);

        let veil_config = cfg.get_config().focus_veil;
        hypr.trigger_focus_mode(true, &veil_config);
    }
}

// ── Config Commands ─────────────────────────────────────────────

#[tauri::command]
fn get_config(state: State<'_, Arc<ConfigManager>>) -> AppConfig {
    state.get_config()
}

#[tauri::command]
fn set_api_key(state: State<'_, Arc<ConfigManager>>, key: String) {
    state.set_api_key(key);
}

#[tauri::command]
fn set_model(state: State<'_, Arc<ConfigManager>>, model: String) {
    state.set_model(model);
}

#[tauri::command]
fn set_base_url(state: State<'_, Arc<ConfigManager>>, url: String) {
    state.set_base_url(url);
}

#[tauri::command]
fn set_focus_veil(state: State<'_, Arc<ConfigManager>>, veil: FocusVeilConfig) {
    state.set_focus_veil(veil);
}

// ── App Entry ───────────────────────────────────────────────────

#[tokio::main]
async fn main() {
    let timer_manager = Arc::new(TimerManager::new(25));
    
    let config_dir = dirs::config_dir()
        .expect("Could not find config directory")
        .join("kairos");
    
    if !config_dir.exists() {
        fs::create_dir_all(&config_dir).expect("Could not create config directory");
    }

    let tasks_path = config_dir.join("tasks.json").to_string_lossy().into_owned();
    let schedule_path = config_dir.join("schedule.json").to_string_lossy().into_owned();
    let config_path = config_dir.join("config.json").to_string_lossy().into_owned();

    let task_manager = Arc::new(TaskManager::new(&tasks_path));
    let schedule_manager = Arc::new(ScheduleManager::new(&schedule_path));
    let config_manager = Arc::new(ConfigManager::new(&config_path));
    let hyprland_manager = Arc::new(HyprlandManager::new());

    let tm_clone = Arc::clone(&timer_manager);
    tokio::spawn(async move {
        tm_clone.tick().await;
    });

    tauri::Builder::default()
        .manage(timer_manager)
        .manage(task_manager)
        .manage(schedule_manager)
        .manage(config_manager)
        .manage(hyprland_manager)
        .invoke_handler(tauri::generate_handler![
            // Timer
            toggle_timer,
            reset_timer,
            get_timer_state,
            // Tasks
            get_tasks,
            add_task,
            delete_task,
            decompose_task,
            ai_decompose_task,
            toggle_step,
            set_active_task,
            // Schedule
            get_schedule,
            add_to_schedule,
            clear_schedule,
            auto_trigger_now,
            // Config
            get_config,
            set_api_key,
            set_model,
            set_base_url,
            set_focus_veil,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
