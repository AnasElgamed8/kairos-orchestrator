# Kairos: The Cognitive Orchestrator

## Vision
Kairos is a system designed to mitigate executive dysfunction and maximize cognitive throughput. It treats "Focus" as a biological state, not a willpower struggle.

## Core Philosophy
1. **Reduce Friction:** Focus on the "First Physical Movement."
2. **Cognitive Load Management:** Energy-based scheduling.
3. **Environmental Synergy:** Integration with Hyprland to create a physical "Focus Zone."
4. **AI-Driven Decomposition:** Transforming overwhelming tasks into Tiny Steps.

## Technical Architecture
### Backend (Rust / Tauri)
- **TimerManager:** Asynchronous countdown engine using `tokio` and `broadcast` channels.
- **TaskManager:** Hierarchical task system (Tasks $\rightarrow$ TinySteps) with JSON persistence.
- **ScheduleManager:** Daily planning module for energy-aware time-blocking.
- **HyprlandManager:** IPC bridge to `hyprctl` and `notify-send` for environment control.
- **DiscordRPC:** Real-time presence updates based on timer state.

### Frontend (React / TypeScript / Tailwind)
- **Cognitive Dashboard:** Split-pane layout (Focus Core vs. Orchestrator).
- **The Slicer:** UI for triggering task decomposition.
- **Theme System:** CSS-variable based system (Baseline: Catppuccin Mocha).

## Feature Roadmap
### Phase 1: Foundation (Completed)
- [x] Core Timer, Task Management, and Discord Sync.
- [x] Native Hyprland Integration.
- [x] Basic Dashboard UI.

### Phase 2: Cognitive Orchestration (Current)
- [ ] Morning Planning Interface.
- [ ] LLM-integrated Task Slicing.
- [ ] Automatic Schedule Triggering.

### Phase 3: Environmental Mastery (Pending)
- [ ] Dynamic Workspace Warping.
- [ ] Distraction Blocking (Process Management).
- [ ] Community Theme Support.
- [ ] Windows Compatibility Build.
