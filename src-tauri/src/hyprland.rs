use std::process::Command;
use log::{info, warn};
use crate::config::FocusVeilConfig;

pub struct HyprlandManager {
    /// Stores the original wallpaper path so we can restore it
    original_wallpaper: std::sync::Mutex<Option<String>>,
    /// Whether focus mode is currently active
    is_focused: std::sync::Mutex<bool>,
}

impl HyprlandManager {
    pub fn new() -> Self {
        Self {
            original_wallpaper: std::sync::Mutex::new(None),
            is_focused: std::sync::Mutex::new(false),
        }
    }

    // ── Low-level Hyprland helpers ────────────────────────────────

    fn hyprctl(&self, args: &[&str]) -> Result<String, String> {
        let output = Command::new("hyprctl")
            .args(args)
            .output()
            .map_err(|e| format!("hyprctl failed: {}", e))?;

        if output.status.success() {
            Ok(String::from_utf8_lossy(&output.stdout).to_string())
        } else {
            Err(String::from_utf8_lossy(&output.stderr).to_string())
        }
    }

    fn hyprctl_dispatch(&self, args: &[&str]) -> Result<(), String> {
        let mut full_args = vec!["dispatch"];
        full_args.extend_from_slice(args);
        self.hyprctl(&full_args).map(|_| ())
    }

    fn hyprctl_keyword(&self, key: &str, value: &str) -> Result<(), String> {
        self.hyprctl(&["keyword", key, value]).map(|_| ())
    }

    // ── Notification control ──────────────────────────────────────

    fn set_dunst_paused(&self, paused: bool) {
        let state = if paused { "true" } else { "false" };
        let _ = Command::new("dunstctl")
            .args(["set-paused", state])
            .output();
    }

    // ── Wallpaper control ─────────────────────────────────────────

    fn get_current_wallpaper(&self) -> Option<String> {
        // Try swww first
        if let Ok(output) = Command::new("swww").arg("query").output() {
            let stdout = String::from_utf8_lossy(&output.stdout);
            // swww query output: "image: /path/to/wallpaper\n"
            for line in stdout.lines() {
                if let Some(path) = line.strip_prefix("image: ") {
                    return Some(path.trim().to_string());
                }
            }
        }

        // Fallback: try hyprpaper
        if let Ok(output) = Command::new("hyprctl").args(["hyprpaper", "listactive"]).output() {
            let stdout = String::from_utf8_lossy(&output.stdout);
            if let Some(path) = stdout.strip_prefix("wallpaper=") {
                return Some(path.trim().to_string());
            }
        }

        None
    }

    fn set_wallpaper(&self, path: &str) {
        // Try swww first (most common modern choice)
        let swww_result = Command::new("swww")
            .args(["img", path])
            .output();

        if swww_result.is_err() || !swww_result.unwrap().status.success() {
            // Fallback to hyprpaper
            let _ = Command::new("hyprctl")
                .args(["hyprpaper", "preload", path])
                .output();
            let _ = Command::new("hyprctl")
                .args(["hyprpaper", "wallpaper", &format!(",{}", path)])
                .output();
        }
    }

    // ── App blocking ──────────────────────────────────────────────

    fn close_blocked_apps(&self, apps: &[String]) {
        for app in apps {
            // Get PIDs for this app class
            if let Ok(output) = Command::new("hyprctl")
                .args(["clients", "-j"])
                .output()
            {
                let stdout = String::from_utf8_lossy(&output.stdout);
                if let Ok(clients) = serde_json::from_str::<serde_json::Value>(&stdout) {
                    if let Some(arr) = clients.as_array() {
                        for client in arr {
                            let class = client["class"].as_str().unwrap_or("");
                            let title = client["title"].as_str().unwrap_or("");
                            let pid = client["pid"].as_i64().unwrap_or(0);

                            if class.to_lowercase().contains(&app.to_lowercase())
                                || title.to_lowercase().contains(&app.to_lowercase())
                            {
                                info!("Killing {} (pid {})", class, pid);
                                let _ = Command::new("kill").arg(pid.to_string()).output();
                            }
                        }
                    }
                }
            }
        }
    }

    fn set_window_rules(&self, apps: &[String], block: bool) {
        if block {
            // Add window rules to prevent blocked apps from appearing
            for (i, app) in apps.iter().enumerate() {
                let rule = format!("class:({}),float,size 1 1,move 0 0", app);
                // Use hyprctl keyword to add windowrule2
                let _ = self.hyprctl_keyword(
                    "windowrulev2",
                    &format!("float,size 1 1,move 0 0,class:({})", app),
                );
            }
            info!("Set {} window rules for blocked apps", apps.len());
        } else {
            // Remove all rules we added (we can't selectively remove, so we reload)
            // The restore happens naturally via hyprctl reload
            let _ = self.hyprctl(&["reload"]);
            info!("Reloaded hyprland config to clear focus rules");
        }
    }

    // ── Focus Mode (The Veil) ─────────────────────────────────────

    pub fn trigger_focus_mode(&self, enabled: bool, config: &FocusVeilConfig) {
        let mut is_focused = self.is_focused.lock().unwrap();

        if enabled && !*is_focused {
            self.activate_veil(config);
            *is_focused = true;
        } else if !enabled && *is_focused {
            self.deactivate_veil(config);
            *is_focused = false;
        }
    }

    fn activate_veil(&self, config: &FocusVeilConfig) {
        if !config.enabled {
            self.send_notification("Kairos", "Focus mode started.");
            return;
        }

        info!("Activating the Focus Veil");

        // 1. Suppress notifications
        if config.suppress_notifications {
            self.set_dunst_paused(true);
            info!("Notifications paused");
        }

        // 2. Change wallpaper
        if let (Some(focus_wp), Some(default_wp)) = (&config.focus_wallpaper, &config.default_wallpaper) {
            let current = self.get_current_wallpaper();
            // Store the original so we can restore it
            *self.original_wallpaper.lock().unwrap() = current.or_else(|| Some(default_wp.clone()));
            self.set_wallpaper(focus_wp);
            info!("Wallpaper changed to focus mode");
        } else if let Some(focus_wp) = &config.focus_wallpaper {
            let current = self.get_current_wallpaper();
            *self.original_wallpaper.lock().unwrap() = current;
            self.set_wallpaper(focus_wp);
            info!("Wallpaper changed to focus mode");
        }

        // 3. Close blocked apps
        if !config.blocked_apps.is_empty() {
            self.close_blocked_apps(&config.blocked_apps);
            self.set_window_rules(&config.blocked_apps, true);
            info!("Blocked {} apps", config.blocked_apps.len());
        }

        self.send_notification("Kairos", "The Focus Veil is active. Distractions blocked.");
        info!("Focus Veil activated");
    }

    fn deactivate_veil(&self, config: &FocusVeilConfig) {
        if !config.enabled {
            self.send_notification("Kairos", "Focus mode ended.");
            return;
        }

        info!("Deactivating the Focus Veil");

        // 1. Restore notifications
        if config.suppress_notifications {
            self.set_dunst_paused(false);
            info!("Notifications restored");
        }

        // 2. Restore wallpaper
        if let Some(original) = self.original_wallpaper.lock().unwrap().clone() {
            self.set_wallpaper(&original);
            info!("Wallpaper restored");
        }

        // 3. Remove window rules
        if !config.blocked_apps.is_empty() {
            self.set_window_rules(&config.blocked_apps, false);
        }

        self.send_notification("Kairos", "Focus Veil lifted. Welcome back.");
        info!("Focus Veil deactivated");
    }

    // ── Utility ───────────────────────────────────────────────────

    pub fn send_notification(&self, title: &str, message: &str) {
        let _ = Command::new("notify-send")
            .arg("-a")
            .arg("Kairos")
            .arg(title)
            .arg(message)
            .output();
    }

    pub fn move_to_workspace(&self, workspace: &str) {
        let _ = self.hyprctl_dispatch(&["workspace", workspace]);
    }

    pub fn focus_window(&self) {
        let _ = self.hyprctl_dispatch(&["centerwindow"]);
    }
}
