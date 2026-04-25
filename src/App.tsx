import React from 'react';
import Timer from './Timer';
import TaskBoard from './TaskBoard';

const App = () => {
  return (
    <div className="flex h-screen w-screen bg-bg-color text-text-color p-6 gap-6">
      {/* Left Column: Focus Core */}
      <div className="w-1/3 flex flex-col gap-6">
        <Timer />
        <div className="glass-panel p-4 text-center">
          <h3 className="text-sm font-bold opacity-50 mb-2">SESSISON STATUS</h3>
          <div className="text-primary-color font-mono">FLOW STATE: ACTIVE</div>
        </div>
      </div>

      {/* Right Column: The Orchestrator */}
      <div className="w-2/3 h-full overflow-hidden">
        <TaskBoard />
      </div>
    </div>
  );
};

export default App;
