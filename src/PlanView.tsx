import React, { useEffect, useMemo, useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { ScheduledTask, Task } from './types';

const PlanView = () => {
  const [schedule, setSchedule] = useState<ScheduledTask[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [time, setTime] = useState('09:00');
  const [duration, setDuration] = useState(25);

  const taskMap = useMemo(() => {
    const map = new Map<string, Task>();
    tasks.forEach((t) => map.set(t.id, t));
    return map;
  }, [tasks]);

  const load = async () => {
    const [currentSchedule, currentTasks] = await Promise.all([
      invoke<ScheduledTask[]>('get_schedule'),
      invoke<Task[]>('get_tasks'),
    ]);
    setSchedule(currentSchedule);
    setTasks(currentTasks);
    if (!selectedTaskId && currentTasks.length > 0) {
      setSelectedTaskId(currentTasks[0].id);
    }
  };

  useEffect(() => {
    load().catch((e) => console.error('Failed to load schedule', e));
    const syncInterval = setInterval(() => {
      invoke('auto_trigger_now').catch((e) => console.error('Auto trigger failed', e));
      load().catch((e) => console.error('Sync failed', e));
    }, 15000);
    return () => clearInterval(syncInterval);
  }, []);

  const addScheduledTask = async () => {
    if (!selectedTaskId) return;
    const task = taskMap.get(selectedTaskId);
    const energy = task ? task.energy_cost : 3;
    await invoke('add_to_schedule', { taskId: selectedTaskId, time, duration, energy });
    await load();
  };

  const clearSchedule = async () => {
    await invoke('clear_schedule');
    await load();
  };

  return (
    <div className="glass flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <h2 className="text-sm font-bold tracking-wide uppercase" style={{ color: 'var(--text-muted)' }}>
          Schedule
        </h2>
        <button
          onClick={clearSchedule}
          className="btn px-2.5 py-1 rounded-lg text-xs font-medium"
          style={{ background: 'rgba(243,139,168,0.15)', color: 'var(--red)' }}
        >
          Clear
        </button>
      </div>

      {/* Add Form */}
      <div className="px-5 pb-4 flex flex-col gap-2">
        <select
          value={selectedTaskId}
          onChange={(e) => setSelectedTaskId(e.target.value)}
          className="rounded-xl px-3 py-2.5 text-xs border w-full"
          style={{
            background: 'var(--bg-overlay)',
            borderColor: 'var(--bg-overlay2)',
            color: 'var(--text-dim)',
          }}
        >
          {tasks.length === 0 && <option>No tasks available</option>}
          {tasks.map((task) => (
            <option key={task.id} value={task.id}>{task.title}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="flex-1 rounded-xl px-3 py-2.5 text-xs border"
            style={{
              background: 'var(--bg-overlay)',
              borderColor: 'var(--bg-overlay2)',
              color: 'var(--text-dim)',
            }}
          />
          <input
            type="number"
            min={5}
            max={120}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-20 rounded-xl px-3 py-2.5 text-xs border"
            style={{
              background: 'var(--bg-overlay)',
              borderColor: 'var(--bg-overlay2)',
              color: 'var(--text-dim)',
            }}
          />
          <button
            onClick={addScheduledTask}
            className="btn px-4 py-2.5 rounded-xl text-xs font-bold"
            style={{ background: 'var(--mauve)', color: 'var(--bg-base)' }}
          >
            +
          </button>
        </div>
      </div>

      {/* Schedule Items */}
      <div className="flex-1 overflow-y-auto px-5 pb-5 flex flex-col gap-2 min-h-0">
        {schedule.map((item, idx) => {
          const task = taskMap.get(item.task_id);
          return (
            <div
              key={`${item.task_id}-${idx}`}
              className="rounded-xl px-4 py-3 fade-up"
              style={{
                background: 'var(--bg-mantle)',
                border: '1px solid rgba(69,71,90,0.3)',
                animationDelay: `${idx * 30}ms`,
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-xs font-bold" style={{ color: 'var(--sapphire)' }}>
                  {item.scheduled_time}
                </span>
                <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                  {item.duration_mins}m
                </span>
              </div>
              <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                {task ? task.title : 'Unknown task'}
              </div>
            </div>
          );
        })}

        {schedule.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center gap-2" style={{ color: 'var(--text-muted)' }}>
            <span className="text-2xl">📅</span>
            <span className="text-xs">No blocks scheduled yet.</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlanView;
