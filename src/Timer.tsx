import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

const Timer = () => {
  const [state, setState] = useState({ remaining_seconds: 0, is_running: false, current_task: 'Idle' });

  useEffect(() => {
    const updateTimer = async () => {
      const newState = await invoke('get_timer_state');
      setState(newState);
    };

    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggle = async () => {
    await invoke('toggle_timer');
  };

  const reset = async (mins: number) => {
    await invoke('reset_timer', { minutes: mins });
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-bg-color text-text-color">
      <div className="glass-panel flex flex-col items-center gap-6 w-80">
        <h1 className="text-2xl font-bold text-primary-color">Kairos</h1>
        
        <div className="text-6xl font-mono font-black tracking-tighter">
          {formatTime(state.remaining_seconds)}
        </div>

        <div className="text-sm opacity-70 italic">
          {state.current_task}
        </div>

        <div className="flex gap-4">
          <button 
            onClick={toggle}
            className={`px-6 py-2 rounded-full font-bold transition-all ${state.is_running ? 'bg-danger-color text-bg-color' : 'bg-success-color text-bg-color'}`}
          >
            {state.is_running ? 'Pause' : 'Start'}
          </button>
          
          <button 
            onClick={() => reset(25)}
            className="px-6 py-2 rounded-full bg-surface-color border border-border-color hover:bg-border-color transition-all"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export default Timer;
