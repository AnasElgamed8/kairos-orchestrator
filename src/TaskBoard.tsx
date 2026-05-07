import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { Task, TinyStep } from './types';

const TaskBoard = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [energy, setEnergy] = useState(3);
  const [slicingId, setSlicingId] = useState<string | null>(null);
  const [sliceError, setSliceError] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    try {
      const currentTasks = await invoke<Task[]>('get_tasks');
      setTasks(currentTasks);
    } catch (e) {
      console.error("Failed to load tasks", e);
    }
  }, []);

  useEffect(() => {
    loadTasks();
    const interval = setInterval(loadTasks, 2000);
    return () => clearInterval(interval);
  }, [loadTasks]);

  const addTask = async () => {
    if (!newTaskTitle.trim()) return;
    await invoke('add_task', { title: newTaskTitle.trim(), energy });
    setNewTaskTitle('');
    loadTasks();
  };

  const deleteTask = async (taskId: string) => {
    await invoke('delete_task', { taskId });
    loadTasks();
  };

  const sliceWithAI = async (taskId: string) => {
    setSlicingId(taskId);
    setSliceError(null);
    try {
      await invoke('ai_decompose_task', { taskId });
    } catch (e: any) {
      setSliceError(typeof e === 'string' ? e : e?.toString() || 'Slicing failed');
    } finally {
      setSlicingId(null);
      loadTasks();
    }
  };

  const toggleStep = async (taskId: string, stepId: string) => {
    await invoke('toggle_step', { taskId, stepId });
    loadTasks();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') addTask();
  };

  const getEnergyLabel = (cost: number) => {
    if (cost <= 1) return '⚡ Low';
    if (cost <= 3) return '⚡⚡ Med';
    return '⚡⚡⚡ High';
  };

  const getProgress = (task: Task) => {
    if (task.steps.length === 0) return null;
    const done = task.steps.filter(s => s.completed).length;
    return { done, total: task.steps.length, percent: Math.round((done / task.steps.length) * 100) };
  };

  return (
    <div className="flex flex-col gap-4 w-full h-full p-4 overflow-hidden">
      {/* Input Bar */}
      <div className="glass-panel flex gap-2 items-center">
        <input
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="What needs to be conquered?"
          className="bg-transparent border-b border-border-color outline-none flex-grow p-2 text-text-color placeholder:opacity-40"
        />
        <select
          value={energy}
          onChange={(e) => setEnergy(Number(e.target.value))}
          className="bg-surface-color text-text-color rounded-md p-2 text-xs"
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

      {/* Error Banner */}
      {sliceError && (
        <div className="glass-panel border-danger-color text-danger-color text-xs p-3 flex justify-between items-center">
          <span className="truncate flex-1 mr-2">{sliceError}</span>
          <button onClick={() => setSliceError(null)} className="text-danger-color font-bold px-2">✕</button>
        </div>
      )}

      {/* Task List */}
      <div className="flex flex-col gap-3 overflow-y-auto flex-1 min-h-0">
        {tasks.map(task => {
          const progress = getProgress(task);
          const isSlicing = slicingId === task.id;

          return (
            <div
              key={task.id}
              className={`glass-panel group hover:border-primary-color transition-colors ${task.is_active ? 'border-primary-color' : ''}`}
            >
              {/* Task Header */}
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="font-bold text-lg truncate">{task.title}</span>
                  <span className="text-xs opacity-50 whitespace-nowrap">{getEnergyLabel(task.energy_cost)}</span>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {task.steps.length === 0 && (
                    <button
                      onClick={() => sliceWithAI(task.id)}
                      disabled={isSlicing}
                      className="text-xs bg-accent-color text-bg-color px-3 py-1 rounded-full hover:bg-primary-color transition-colors disabled:opacity-50"
                    >
                      {isSlicing ? 'Slicing...' : '🪄 AI Slice'}
                    </button>
                  )}
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="text-xs text-danger-color opacity-60 hover:opacity-100 px-2 py-1 transition-opacity"
                    title="Delete task"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              {progress && (
                <div className="mb-2">
                  <div className="flex justify-between text-xs opacity-50 mb-1">
                    <span>{progress.done}/{progress.total} steps</span>
                    <span>{progress.percent}%</span>
                  </div>
                  <div className="w-full h-1 bg-border-color rounded-full overflow-hidden">
                    <div
                      className="h-full bg-success-color transition-all duration-300"
                      style={{ width: `${progress.percent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Steps */}
              <div className="flex flex-col gap-1.5 ml-2">
                {task.steps.map((step: TinyStep) => (
                  <div
                    key={step.id}
                    className={`flex items-center gap-2 text-sm cursor-pointer transition-colors ${
                      step.completed ? 'opacity-50 line-through' : 'opacity-80 hover:opacity-100'
                    }`}
                    onClick={() => toggleStep(task.id, step.id)}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                      step.completed ? 'bg-success-color border-success-color' : 'border-border-color'
                    }`}>
                      {step.completed && <span className="text-bg-color text-xs">✓</span>}
                    </div>
                    <span>{step.description}</span>
                  </div>
                ))}
                {task.steps.length === 0 && (
                  <div className="text-xs italic opacity-40 ml-1">
                    No tiny steps yet. Hover and use 🪄 AI Slice.
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {tasks.length === 0 && (
          <div className="flex-1 flex items-center justify-center opacity-30 text-sm">
            No tasks yet. Add your first one above.
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskBoard;
