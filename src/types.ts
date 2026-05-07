export interface TinyStep {
  id: string;
  description: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  energy_cost: number;
  steps: TinyStep[];
  is_active: boolean;
}

export interface TimerState {
  remaining_seconds: number;
  is_running: boolean;
  current_task: string;
}

export interface ScheduledTask {
  task_id: string;
  scheduled_time: string;
  duration_mins: number;
  energy_cost: number;
}

export interface FocusVeilConfig {
  blocked_apps: string[];
  focus_wallpaper: string | null;
  default_wallpaper: string | null;
  suppress_notifications: boolean;
  enabled: boolean;
}

export interface AppConfig {
  openai_api_key: string | null;
  openai_model: string;
  openai_base_url: string;
  focus_veil: FocusVeilConfig;
}
