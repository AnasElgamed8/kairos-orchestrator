# 🛠 Installing Kairos

Kairos is a high-performance cognitive orchestrator built with Rust and Tauri. This guide will help you get it running on Arch Linux (Hyprland).

## 📋 Prerequisites

### System Dependencies
You need the following installed on your system:
- `rustup` (Rust toolchain)
- `nodejs` & `npm` / `yarn`
- `hyprland` (for environmental synergy)
- `libnotify` (for system notifications)
- `webkit2gtk` (required by Tauri)

Run this on Arch:
```bash
sudo pacman -S base-devel curl wget git webkit2gtk
```

### Discord Setup
To enable Rich Presence:
1. Go to the [Discord Developer Portal](https://discord.com/developers/applications).
2. Create a new application named "Kairos".
3. Copy the **Application ID**.
4. Currently, the ID is hardcoded in `main.rs`. Change it to your own ID before building.

## 🚀 Building from Source

1. **Clone the repository:**
   ```bash
   git clone https://github.com/AnasElgamed8/kairos-orchestrator.git
   cd kairos-orchestrator
   ```

2. **Install frontend dependencies:**
   ```bash
   npm install
   ```

3. **Run in development mode:**
   ```bash
   npm run tauri dev
   ```

4. **Build for production:**
   ```bash
   npm run tauri build
   ```

## ⚙️ Configuration
Kairos stores its data in your system's config directory:
- Linux: `~/.config/kairos/`
- Windows: `%APPDATA%\kairos\`
- Files: `tasks.json` and `schedule.json`.

---
*Built by Lexius for the burned-out and the brilliant.*
