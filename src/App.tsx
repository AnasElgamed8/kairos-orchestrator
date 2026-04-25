import React from 'react';
import Timer from './Timer';
import TaskBoard from './TaskBoard';

const App = () => {
  return (
    <div className="flex h-screen w-screen bg-bg-color text-text-color p-8 gap-8 items-center justify-center">
      {/* Left Column: Focus Core */}
      <div className="flex flex-col gap-6 w-1/3 max-w-md">
        <Timer />
        <div className="glass-panel p-6 text-center">
          <h3 className="text-xs font-bold opacity-50 uppercase tracking-widest mb-2">Session Status</h3>
          <div className="text-primary-color font-mono text-lg font-medium">FLOW STATE: ACTIVE</div>
        </div>
      </div>

      {/* Right Column: The Orchestrator */}
      <div className="w-2/3 max-w-4xl h-full overflow-hidden">
        <TaskBoard />
      </div>
    </div>
  );
};

export default App;
