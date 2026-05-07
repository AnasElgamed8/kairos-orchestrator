import React, { useState } from 'react';
import Timer from './Timer';
import TaskBoard from './TaskBoard';
import PlanView from './PlanView';
import Settings from './Settings';

const App = () => {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="flex h-screen w-screen bg-bg-color text-text-color p-6 gap-6">
      {/* Left Column: Focus Core */}
      <div className="flex flex-col gap-4 w-80 min-w-[300px]">
        <Timer />
        <button
          onClick={() => setShowSettings(true)}
          className="glass-panel text-center text-xs opacity-40 hover:opacity-80 transition-opacity cursor-pointer py-3"
        >
          ⚙ Settings
        </button>
      </div>

      {/* Right Column: The Orchestrator */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        <div className="flex-1 min-h-0">
          <TaskBoard />
        </div>
        <div className="h-64 min-h-[200px]">
          <PlanView />
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
    </div>
  );
};

export default App;
