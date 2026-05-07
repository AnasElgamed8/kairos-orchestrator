import React, { useState, useEffect } from 'react';
import Timer from './Timer';
import TaskBoard from './TaskBoard';
import PlanView from './PlanView';
import Settings from './Settings';

const App = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [clock, setClock] = useState('');

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    tick();
    const id = setInterval(tick, 10000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      {/* Top Bar */}
      <header className="app-header">
        <div className="flex items-center gap-3">
          <div className="accent-bar w-8" />
          <h1>KAIROS</h1>
          <span className="subtitle">Orchestrator</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="clock-display">{clock}</span>
          <button
            onClick={() => setShowSettings(true)}
            className="settings-btn"
          >
            ⚙ Settings
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-layout">
        {/* Left: Timer */}
        <div className="timer-column flex flex-col">
          <Timer />
        </div>

        {/* Center: Tasks */}
        <div className="tasks-column flex flex-col min-h-0">
          <TaskBoard />
        </div>

        {/* Right: Schedule */}
        <div className="schedule-column flex flex-col">
          <PlanView />
        </div>
      </main>

      {/* Settings Modal */}
      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
    </div>
  );
};

export default App;
