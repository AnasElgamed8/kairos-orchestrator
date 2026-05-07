import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { TimerState } from './types';

const PRESETS = [
  { label: '15', minutes: 15 },
  { label: '25', minutes: 25 },
  { label: '45', minutes: 45 },
  { label: '60', minutes: 60 },
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
      console.error('Failed to get timer state', e);
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

  const totalSeconds = selectedPreset * 60;
  const elapsed = totalSeconds - state.remaining_seconds;
  const progress = state.is_running ? (elapsed / totalSeconds) * 100 : 0;

  // SVG circle params
  const radius = 110;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (progress / 100) * circumference;

  return (
    <div className="glass flex flex-col items-center gap-6 p-6 flex-1">
      {/* Circular Timer */}
      <div className="relative flex items-center justify-center">
        <svg width="260" height="260" className="-rotate-90">
          {/* Track */}
          <circle
            cx="130" cy="130" r={radius}
            fill="none"
            stroke="var(--bg-overlay)"
            strokeWidth="6"
          />
          {/* Progress */}
          {state.is_running && (
            <circle
              cx="130" cy="130" r={radius}
              fill="none"
              stroke="var(--mauve)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className="transition-all duration-1000 ease-linear"
            />
          )}
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
          <span
            className="font-mono text-5xl font-bold tracking-tighter"
            style={{ color: state.is_running ? 'var(--mauve)' : 'var(--text)' }}
          >
            {formatTime(state.remaining_seconds)}
          </span>
          <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            {state.is_running ? state.current_task : 'Ready to focus'}
          </span>
          {state.is_running && (
            <div className="flex items-center gap-1.5 mt-1">
              <div
                className="w-1.5 h-1.5 rounded-full timer-pulse"
                style={{ background: 'var(--green)' }}
              />
              <span className="text-xs font-mono" style={{ color: 'var(--green)' }}>
                LIVE
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Preset Buttons */}
      <div className="flex gap-2 w-full justify-center">
        {PRESETS.map(p => (
          <button
            key={p.minutes}
            onClick={() => reset(p.minutes)}
            className="btn px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: selectedPreset === p.minutes ? 'var(--mauve)' : 'var(--bg-overlay)',
              color: selectedPreset === p.minutes ? 'var(--bg-base)' : 'var(--text-dim)',
            }}
          >
            {p.label}m
          </button>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 w-full">
        <button
          onClick={toggle}
          className="btn flex-1 py-3.5 rounded-xl text-sm font-bold"
          style={{
            background: state.is_running ? 'var(--red)' : 'var(--green)',
            color: 'var(--bg-base)',
          }}
        >
          {state.is_running ? '⏸  Pause' : '▶  Start'}
        </button>
        <button
          onClick={() => reset(selectedPreset)}
          className="btn px-5 py-3.5 rounded-xl text-sm font-medium"
          style={{ background: 'var(--bg-overlay)', color: 'var(--text-dim)' }}
        >
          ↺
        </button>
      </div>
    </div>
  );
};

export default Timer;
