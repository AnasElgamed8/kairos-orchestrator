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
      <header className="flex items-center justify-between px-6 py-3 border-b" style={{ borderColor: 'rgba(69,71,90,0.4)' }}>
        <div className="flex items-center gap-3">
          <div className="accent-bar w-8" />
          <h1 className="text-lg font-extrabold tracking-tight" style={{ color: 'var(--mauve)' }}>
            KAIROS
          </h1>
          <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            Orchestrator
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-sm" style={{ color: 'var(--text-dim)' }}>
            {clock}
          </span>
          <button
            onClick={() => setShowSettings(true)}
            className="btn px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: 'var(--bg-overlay)', color: 'var(--text-dim)' }}
          >
            ⚙ Settings
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex gap-5 p-5 min-h-0">
        {/* Left: Timer */}
        <div className="w-72 flex-shrink-0 flex flex-col">
          <Timer />
        </div>

        {/* Center: Tasks */}
        <div className="flex-1 flex flex-col min-w-0">
          <TaskBoard />
        </div>

        {/* Right: Schedule */}
        <div className="w-80 flex-shrink-0 flex flex-col">
          <PlanView />
        </div>
      </main>

      {/* Settings Modal */}
      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
    </div>
  );
};

export default App;
