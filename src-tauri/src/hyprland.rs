use std::process::Command;
use std::io::Write;

pub struct HyprlandManager;

impl HyprlandManager {
    pub fn new() -> Self {
        Self
    }

    /// Moves the focus to a specific workspace
    pub fn move_to_workspace(&self, workspace: &str) {
        let _ = Command::new("hyprctl")
            .arg("dispatch")
            .arg("workspace")
            .arg(workspace)
            .output();
    }

    /// Sends a system notification via notify-send
    pub fn send_notification(&self, title: &str, message: &str) {
        let _ = Command::new("notify-send")
            .arg("-a")
            .arg("Kairos")
            .arg(title)
            .arg(message)
            .output();
    }

    /// Sets a specific window to be floating/centered (for the "Priming" phase)
    pub fn focus_window(&self) {
        let _ = Command::new("hyprctl")
            .arg("dispatch")
            .arg("centerwindow")
            .output();
    }

    /// Custom function to trigger "Focus Mode" (could be expanded to change themes)
    pub fn trigger_focus_mode(&self, enabled: bool) {
        if enabled {
            self.send_notification("Kairos", "Entering Flow State. Distractions disabled.");
            // Here we could add commands to kill specific processes or change wallpapers
        } else {
            self.send_notification("Kairos", "Flow State ended. Welcome back to reality.");
        }
    }
}
