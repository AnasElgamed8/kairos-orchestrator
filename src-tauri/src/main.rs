mod timer;
mod tasks;
mod schedule;
mod hyprland;
use timer::{TimerManager, TimerState};
use tasks::{TaskManager, Task};
use schedule::{ScheduleManager, ScheduledTask};
use hyprland::HyprlandManager;
use tauri::{State, Manager};
use std::sync::Arc;
use uuid::Uuid;
use std::fs;

#[tauri::command]
fn toggle_timer(state: State<'_, Arc<TimerManager>>, hypr: State<'_, Arc<HyprlandManager>>) {
    state.toggle();
    let is_running = state.state.lock().unwrap().is_running;
    hypr.trigger_focus_mode(is_running);
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
    // We call the AI decomposition logic internally
    // In a real app, this would be an async call to decompose_with_ai
    // For the prototype, we just apply the steps passed from frontend
    state.apply_steps(task_id, steps);
}

#[tauri::command]
fn get_schedule(state: State<'_, Arc<ScheduleManager>>) -> Vec<ScheduledTask> {
    state.daily_plan.lock().unwrap().clone()
}

#[tauri::command]
fn add_to_schedule(state: State<'_, Arc<ScheduleManager>>, task_id: Uuid, time: String, duration: u32, energy: u8) {
    state.add_to_schedule(task_id, time, duration, energy);
}

fn main() {
    let app_id = "1497640735304974396".to_string();
    
    let config_dir = dirs::config_dir()
        .expect("Could not find config directory")
        .join("kairos");
    
    if !config_dir.exists() {
        fs::create_dir_all(&config_dir).expect("Could not create config directory");
    }

    let tasks_path = config_dir.join("tasks.json").to_string_lossy().into_owned();
    let schedule_path = config_dir.join("schedule.json").to_string_lossy().into_owned();

    let timer_manager = Arc::new(TimerManager::new(25));
    let task_manager = Arc::new(TaskManager::new(&tasks_path));
    let schedule_manager = Arc::new(ScheduleManager::new(&schedule_path));
    let hyprland_manager = Arc::new(HyprlandManager::new());

    let tm_clone = Arc::clone(&timer_manager);
    tokio::spawn(async move {
        tm_clone.tick().await;
    });

    tauri::Builder::default()
        .manage(timer_manager)
        .manage(task_manager)
        .manage(schedule_manager)
        .manage(hyprland_manager)
        .invoke_handler(tauri::generate_handler![
            toggle_timer, 
            reset_timer, 
            get_timer_state, 
            get_tasks, 
            add_task, 
            decompose_task,
            get_schedule,
            add_to_schedule
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
