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
      invoke<Task[]>('get_tasks')
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
    await invoke('add_to_schedule', {
      taskId: selectedTaskId,
      time,
      duration,
      energy
    });
    await load();
  };

  const clearSchedule = async () => {
    await invoke('clear_schedule');
    await load();
  };

  return (
    <div className="glass-panel h-full p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold opacity-50 uppercase tracking-widest">Morning Plan</h3>
        <button onClick={clearSchedule} className="text-xs px-2 py-1 rounded bg-danger-color text-bg-color">Clear</button>
      </div>

      <div className="flex gap-2 items-center">
        <select
          value={selectedTaskId}
          onChange={(e) => setSelectedTaskId(e.target.value)}
          className="bg-surface-color text-text-color rounded-md p-2 text-xs flex-1"
        >
          {tasks.map((task) => (
            <option key={task.id} value={task.id}>{task.title}</option>
          ))}
        </select>
        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="bg-surface-color text-text-color rounded-md p-2 text-xs" />
        <input
          type="number"
          min={5}
          max={120}
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          className="w-16 bg-surface-color text-text-color rounded-md p-2 text-xs"
        />
        <button onClick={addScheduledTask} className="bg-primary-color text-bg-color px-3 py-2 rounded-md text-xs font-bold">Add</button>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col gap-2">
        {schedule.map((item, idx) => {
          const task = taskMap.get(item.task_id);
          return (
            <div key={`${item.task_id}-${idx}`} className="border border-border-color rounded-md p-2 text-sm">
              <div className="font-semibold">{item.scheduled_time} • {item.duration_mins}m</div>
              <div className="opacity-80">{task ? task.title : 'Unknown task'}</div>
            </div>
          );
        })}
        {schedule.length === 0 && <div className="text-xs italic opacity-40">No scheduled blocks yet.</div>}
      </div>
    </div>
  );
};

export default PlanView;
