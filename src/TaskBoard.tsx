import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { Task } from './types'; // Assuming types are defined

const TaskBoard = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [energy, setEnergy] = useState(3);

  useEffect(() => {
    loadTasks();
    const interval = setInterval(loadTasks, 2000);
    return () => clearInterval(interval);
  }, []);

  const loadTasks = async () => {
    const currentTasks = await invoke('get_tasks');
    setTasks(currentTasks);
  };

  const addTask = async () => {
    if (!newTaskTitle) return;
    await invoke('add_task', { title: newTaskTitle, energy });
    setNewTaskTitle('');
    loadTasks();
  };

  const decomposeTask = async (taskId: string) => {
    // In a real app, this would call an LLM. 
    // For the prototype, we simulate the "AI Slicing" effect.
    const mockSteps = [
      "Open the required documents",
      "Read the first two pages",
      "Summarize the core concept in one sentence",
      "Solve one example problem"
    ];
    await invoke('decompose_task', { taskId, steps: mockSteps });
    loadTasks();
  };

  return (
    <div className="flex flex-col gap-4 w-full h-full p-4">
      <div className="glass-panel flex gap-2">
        <input 
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          placeholder="What needs to be conquered?"
          className="bg-transparent border-b border-border-color outline-none flex-grow p-2 text-text-color"
        />
        <select 
          value={energy} 
          onChange={(e) => setEnergy(Number(e.target.value))}
          className="bg-surface-color text-text-color rounded-md p-1 text-xs"
        >
          <option value={1}>Low Energy</option>
          <option value={3}>Med Energy</option>
          <option value={5}>High Energy</option>
        </select>
        <button 
          onClick={addTask}
          className="bg-primary-color text-bg-color px-4 py-2 rounded-lg font-bold hover:scale-105 transition-transform"
        >
          Add
        </button>
      </div>

      <div className="flex flex-col gap-3 overflow-y-auto">
        {tasks.map(task => (
          <div key={task.id} className="glass-panel group hover:border-primary-color transition-colors">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-lg">{task.title}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs opacity-50">Energy: {task.energy_cost}</span>
                <button 
                  onClick={() => decomposeTask(task.id)}
                  className="text-xs bg-accent-color text-bg-color px-2 py-1 rounded hover:bg-primary-color transition-colors"
                >
                  Slice 🪄
                </button>
              </div>
            </div>
            
            <div className="flex flex-col gap-2 ml-4">
              {task.steps.map(step => (
                <div key={step.id} className="flex items-center gap-2 text-sm opacity-80">
                  <input type="checkbox" checked={step.completed} className="accent-primary-color" />
                  <span>{step.description}</span>
                </div>
              ))}
              {task.steps.length === 0 && (
                <div className="text-xs italic opacity-40">No tiny steps yet. Use the Slicer.</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskBoard;
