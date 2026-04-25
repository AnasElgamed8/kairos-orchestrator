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
