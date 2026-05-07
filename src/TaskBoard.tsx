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
      console.error('Failed to load tasks', e);
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

  const getEnergyDots = (cost: number) => {
    const dots = [];
    const level = cost <= 1 ? 1 : cost <= 3 ? 2 : 3;
    const colors = { 1: 'var(--teal)', 2: 'var(--peach)', 3: 'var(--red)' };
    for (let i = 0; i < level; i++) {
      dots.push(
        <div
          key={i}
          className="energy-dot"
          style={{ background: colors[level as keyof typeof colors] }}
        />
      );
    }
    return dots;
  };

  const getProgress = (task: Task) => {
    if (task.steps.length === 0) return null;
    const done = task.steps.filter(s => s.completed).length;
    return { done, total: task.steps.length, percent: Math.round((done / task.steps.length) * 100) };
  };

  return (
    <div className="glass flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <h2 className="text-sm font-bold tracking-wide uppercase" style={{ color: 'var(--text-muted)' }}>
          Tasks
        </h2>
        <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
          {tasks.length} total
        </span>
      </div>

      {/* Input Bar */}
      <div className="px-5 pb-4">
        <div className="flex gap-2 items-center">
          <input
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What needs to be conquered?"
            className="flex-1 bg-transparent rounded-xl px-4 py-2.5 text-sm border"
            style={{ borderColor: 'var(--bg-overlay2)', color: 'var(--text)' }}
          />
          <select
            value={energy}
            onChange={(e) => setEnergy(Number(e.target.value))}
            className="rounded-xl px-3 py-2.5 text-xs border"
            style={{
              background: 'var(--bg-overlay)',
              borderColor: 'var(--bg-overlay2)',
              color: 'var(--text-dim)',
            }}
          >
            <option value={1}>Low</option>
            <option value={3}>Med</option>
            <option value={5}>High</option>
          </select>
          <button
            onClick={addTask}
            className="btn px-5 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: 'var(--mauve)', color: 'var(--bg-base)' }}
          >
            Add
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {sliceError && (
        <div
          className="mx-5 mb-3 px-4 py-2.5 rounded-xl flex justify-between items-center text-xs"
          style={{ background: 'rgba(243,139,168,0.1)', border: '1px solid var(--red)', color: 'var(--red)' }}
        >
          <span className="truncate flex-1 mr-2">{sliceError}</span>
          <button onClick={() => setSliceError(null)} className="font-bold px-1">✕</button>
        </div>
      )}

      {/* Task List */}
      <div className="flex-1 overflow-y-auto px-5 pb-5 flex flex-col gap-2.5 min-h-0">
        {tasks.map((task, idx) => {
          const progress = getProgress(task);
          const isSlicing = slicingId === task.id;

          return (
            <div
              key={task.id}
              className="rounded-xl p-4 transition-all group fade-up"
              style={{
                background: task.is_active ? 'rgba(203,166,247,0.08)' : 'var(--bg-mantle)',
                border: `1px solid ${task.is_active ? 'var(--mauve)' : 'rgba(69,71,90,0.3)'}`,
                animationDelay: `${idx * 30}ms`,
              }}
            >
              {/* Task Header */}
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="font-semibold text-sm truncate">{task.title}</span>
                  <div className="flex gap-1">{getEnergyDots(task.energy_cost)}</div>
                </div>
                <div className="flex items-center gap-1.5 task-actions">
                  {task.steps.length === 0 && (
                    <button
                      onClick={() => sliceWithAI(task.id)}
                      disabled={isSlicing}
                      className="btn px-3 py-1 rounded-lg text-xs font-medium"
                      style={{
                        background: 'var(--pink)',
                        color: 'var(--bg-base)',
                        opacity: isSlicing ? 0.5 : 1,
                      }}
                    >
                      {isSlicing ? 'Slicing...' : '🪄 AI Slice'}
                    </button>
                  )}
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="btn px-2 py-1 rounded-lg text-xs"
                    style={{ color: 'var(--text-muted)' }}
                    title="Delete task"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              {progress && (
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>
                    <span>{progress.done}/{progress.total} steps</span>
                    <span className="font-mono">{progress.percent}%</span>
                  </div>
                  <div
                    className="w-full h-1.5 rounded-full overflow-hidden"
                    style={{ background: 'var(--bg-overlay)' }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${progress.percent}%`,
                        background: progress.percent === 100 ? 'var(--green)' : 'var(--mauve)',
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Steps */}
              <div className="flex flex-col gap-2 ml-1">
                {task.steps.map((step: TinyStep) => (
                  <div
                    key={step.id}
                    className="flex items-center gap-2.5 cursor-pointer transition-all"
                    style={{
                      opacity: step.completed ? 0.45 : 0.85,
                    }}
                    onClick={() => toggleStep(task.id, step.id)}
                  >
                    <div className={`checkbox ${step.completed ? 'checked' : ''}`}>
                      {step.completed && (
                        <span style={{ color: 'var(--bg-base)', fontSize: '11px', fontWeight: 'bold' }}>✓</span>
                      )}
                    </div>
                    <span
                      className="text-sm"
                      style={{
                        textDecoration: step.completed ? 'line-through' : 'none',
                        color: 'var(--text)',
                      }}
                    >
                      {step.description}
                    </span>
                  </div>
                ))}
                {task.steps.length === 0 && (
                  <div className="text-xs italic pl-1" style={{ color: 'var(--text-muted)' }}>
                    No tiny steps yet — hover and hit 🪄 AI Slice
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {tasks.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center gap-2" style={{ color: 'var(--text-muted)' }}>
            <span className="text-3xl">🎯</span>
            <span className="text-sm">No tasks yet. Add your first one above.</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskBoard;
