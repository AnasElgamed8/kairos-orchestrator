# Kairos: The Cognitive Orchestrator

## Vision
Kairos is not a timer. It is a system designed to mitigate executive dysfunction and maximize cognitive throughput for students with burnout/ADHD patterns. It treats "Focus" as a biological state, not a willpower struggle.

## Core Philosophy
1. **Reduce Friction:** The hardest part is starting. Kairos focuses on the "First Physical Movement."
2. **Cognitive Load Management:** Schedules are based on energy, not just time.
3. **Environmental Synergy:** Integration with Hyprland to create a physical "Focus Zone."
4. **AI-Driven Decomposition:** Transforming overwhelming tasks into Tiny Steps.

## Technical Stack
- **Backend:** Rust (Tauri)
- **Frontend:** React + TypeScript + Tailwind CSS
- **State Management:** Zustand
- **Integrations:**
    - `discord-rpc` for presence.
    - `hyprctl` for environment control.
    - `libnotify` / `dbus` for notifications.
    - Local/API LLM for task decomposition.

## Feature Roadmap
### Phase 1: Foundation (The "Functional" App)
- [ ] Basic Pomodoro/Stopwatch logic.
- [ ] Task list with persistence.
- [ ] Discord Rich Presence.
- [ ] Basic Hyprland notifications.

### Phase 2: Cognitive Orchestration (The "Smart" App)
- [ ] AI Task Decomposition (Tiny Steps).
- [ ] Morning Scheduling Module.
- [ ] Energy-based task weighting.
- [ ] "First Physical Movement" prompts.

### Phase 3: Environmental Mastery (The "Proud" App)
- [ ] Hyprland Workspace switching via IPC.
- [ ] Automatic wallpaper/theme switching.
- [ ] Distraction blocking (Process killing/DNS).
- [ ] Windows compatibility build.

## The Evolution Loop
A cron job will run every 10 minutes to research productivity improvements, analyze logs, and propose feature updates via Telegram.
