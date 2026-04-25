use tauri::Manager;
use std::sync::{Arc, Mutex};
use discord_rpc::{ClientId, UserId, UserPresence};

struct AppState {
    timer_running: Arc<Mutex<bool>>,
    current_task: Arc<Mutex<String>>,
}

fn setup_discord_rpc(app_id: &str) {
    let client_id = ClientId::from_str(app_id).expect("Invalid Client ID");
    let mut session = discord_rpc::Session::new(client_id).expect("Failed to create Discord session");
    
    let presence = UserPresence {
        state: "Priming...".to_string(),
        details: "Setting up the Flow State".to_string(),
        start_timestamp: std::time::SystemTime::now(),
        assets: None,
    };
    
    session.set_presence(presence).expect("Failed to set presence");
}

fn main() {
    let app_id = "1497640735304974396";
    
    // We start Discord RPC in a separate thread to avoid blocking the UI
    std::thread::spawn(move || {
        setup_discord_rpc(app_id);
        loop {
            // In a real app, this would update based on AppState
            std::thread::sleep(std::time::Duration::from_secs(15));
        }
    });

    tauri::Builder::default()
        .manage(AppState {
            timer_running: Arc::new(Mutex::new(false)),
            current_task: Arc::new(Mutex::new("Idle".to_string())),
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
