import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { TimerState } from './types';

const PRESETS = [
  { label: '15m', minutes: 15 },
  { label: '25m', minutes: 25 },
  { label: '45m', minutes: 45 },
  { label: '60m', minutes: 60 },
];

const Timer = () => {
  const [state, setState] = useState<TimerState>({
    remaining_seconds: 1500,
    is_running: false,
    current_task: 'Idle',
  });
  const [selectedPreset, setSelectedPreset] = useState(25);

  const updateTimer = useCallback(async () => {
    try {
      const newState = await invoke<TimerState>('get_timer_state');
      setState(newState);
    } catch (e) {
      console.error("Failed to get timer state", e);
    }
  }, []);

  useEffect(() => {
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [updateTimer]);

  const toggle = async () => {
    await invoke('toggle_timer');
  };

  const reset = async (mins: number) => {
    setSelectedPreset(mins);
    await invoke('reset_timer', { minutes: mins });
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = state.is_running
    ? ((selectedPreset * 60 - state.remaining_seconds) / (selectedPreset * 60)) * 100
    : 0;

  return (
    <div className="flex flex-col items-center justify-center flex-1">
      <div className={`glass-panel flex flex-col items-center gap-5 w-full ${state.is_running ? 'timer-active' : ''}`}>
        {/* Title */}
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-black text-primary-color tracking-tight">KAIROS</h1>
          <div className={`w-2 h-2 rounded-full ${state.is_running ? 'bg-success-color' : 'bg-border-color'}`} />
        </div>

        {/* Timer Display */}
        <div className="relative">
          <div className="text-7xl font-mono font-black tracking-tighter text-text-color">
            {formatTime(state.remaining_seconds)}
          </div>
          {/* Progress ring background */}
          {state.is_running && (
            <div className="absolute -inset-3 rounded-full border-2 border-border-color">
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50" cy="50" r="48"
                  fill="none"
                  stroke="var(--primary-color)"
                  strokeWidth="2"
                  strokeDasharray={`${progress * 3.01} 301`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Current Task */}
        <div className="text-sm opacity-60 italic text-center truncate max-w-full px-2">
          {state.is_running ? state.current_task : 'Ready to focus'}
        </div>

        {/* Preset Buttons */}
        <div className="flex gap-2">
          {PRESETS.map(p => (
            <button
              key={p.minutes}
              onClick={() => reset(p.minutes)}
              className={`text-xs px-3 py-1.5 rounded-full transition-all ${
                selectedPreset === p.minutes
                  ? 'bg-primary-color text-bg-color font-bold'
                  : 'bg-surface-color text-text-color opacity-60 hover:opacity-100'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 w-full">
          <button
            onClick={toggle}
            className={`flex-1 py-3 rounded-xl font-bold text-lg transition-all active:scale-95 ${
              state.is_running
                ? 'bg-danger-color text-bg-color hover:brightness-110'
                : 'bg-success-color text-bg-color hover:brightness-110'
            }`}
          >
            {state.is_running ? '⏸ Pause' : '▶ Start'}
          </button>
          <button
            onClick={() => reset(selectedPreset)}
            className="px-5 py-3 rounded-xl bg-surface-color border border-border-color hover:bg-border-color transition-all text-sm"
          >
            ↺
          </button>
        </div>
      </div>
    </div>
  );
};

export default Timer;
