import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { AppConfig, FocusVeilConfig } from './types';

const Settings = ({ onClose }: { onClose: () => void }) => {
  const [config, setConfig] = useState<AppConfig>({
    openai_api_key: null,
    openai_model: 'gpt-4o',
    openai_base_url: 'https://api.openai.com/v1',
    focus_veil: {
      blocked_apps: ['firefox', 'discord', 'steam'],
      focus_wallpaper: null,
      default_wallpaper: null,
      suppress_notifications: true,
      enabled: true,
    },
  });
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [saved, setSaved] = useState(false);
  const [newAppInput, setNewAppInput] = useState('');
  const [activeTab, setActiveTab] = useState<'api' | 'veil'>('api');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const cfg = await invoke<AppConfig>('get_config');
      setConfig(cfg);
      setApiKeyInput(cfg.openai_api_key || '');
    } catch (e) {
      console.error('Failed to load config', e);
    }
  };

  const flashSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const saveApiKey = async () => {
    try {
      await invoke('set_api_key', { key: apiKeyInput.trim() });
      flashSaved();
    } catch (e) {
      console.error('Failed to save API key', e);
    }
  };

  const saveModel = async (model: string) => {
    setConfig((prev) => ({ ...prev, openai_model: model }));
    await invoke('set_model', { model });
    flashSaved();
  };

  const saveBaseUrl = async (url: string) => {
    setConfig((prev) => ({ ...prev, openai_base_url: url }));
    await invoke('set_base_url', { url });
    flashSaved();
  };

  const updateVeil = async (updates: Partial<FocusVeilConfig>) => {
    const newVeil = { ...config.focus_veil, ...updates };
    setConfig((prev) => ({ ...prev, focus_veil: newVeil }));
    await invoke('set_focus_veil', { veil: newVeil });
    flashSaved();
  };

  const addBlockedApp = () => {
    const app = newAppInput.trim().toLowerCase();
    if (!app || config.focus_veil.blocked_apps.includes(app)) return;
    updateVeil({ blocked_apps: [...config.focus_veil.blocked_apps, app] });
    setNewAppInput('');
  };

  const removeBlockedApp = (app: string) => {
    updateVeil({ blocked_apps: config.focus_veil.blocked_apps.filter((a) => a !== app) });
  };

  const maskKey = (key: string | null) => {
    if (!key || key.length < 10) return key || '';
    return key.slice(0, 7) + '...' + key.slice(-4);
  };

  const inputStyle = {
    background: 'var(--bg-overlay)',
    borderColor: 'var(--bg-overlay2)',
    color: 'var(--text)',
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(17,17,27,0.85)' }}
      onClick={onClose}
    >
      <div
        className="glass w-full max-w-lg flex flex-col gap-5 max-h-[85vh] overflow-y-auto p-6 fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-base font-bold" style={{ color: 'var(--mauve)' }}>
            Settings
          </h2>
          <div className="flex items-center gap-3">
            {saved && (
              <span className="text-xs font-medium fade-up" style={{ color: 'var(--green)' }}>
                ✓ Saved
              </span>
            )}
            <button
              onClick={onClose}
              className="btn px-2 py-1 rounded-lg text-sm"
              style={{ color: 'var(--text-muted)' }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tab Bar */}
        <div
          className="flex gap-1 rounded-xl p-1"
          style={{ background: 'var(--bg-overlay)' }}
        >
          {(['api', 'veil'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="btn flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: activeTab === tab ? 'var(--mauve)' : 'transparent',
                color: activeTab === tab ? 'var(--bg-base)' : 'var(--text-muted)',
              }}
            >
              {tab === 'api' ? '🔑 API' : '🛡 Focus Veil'}
            </button>
          ))}
        </div>

        {/* API Tab */}
        {activeTab === 'api' && (
          <div className="flex flex-col gap-5 fade-up">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                API Key
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="sk-..."
                  className="flex-1 rounded-xl px-4 py-2.5 text-sm border"
                  style={inputStyle}
                />
                <button
                  onClick={saveApiKey}
                  className="btn px-4 py-2.5 rounded-xl text-sm font-bold"
                  style={{ background: 'var(--mauve)', color: 'var(--bg-base)' }}
                >
                  Save
                </button>
              </div>
              {config.openai_api_key && (
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Current: {maskKey(config.openai_api_key)}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Model
              </label>
              <select
                value={config.openai_model}
                onChange={(e) => saveModel(e.target.value)}
                className="rounded-xl px-4 py-2.5 text-sm border"
                style={inputStyle}
              >
                <option value="gpt-4o">GPT-4o</option>
                <option value="gpt-4o-mini">GPT-4o Mini</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                <option value="deepseek-chat">DeepSeek Chat</option>
                <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Base URL
              </label>
              <input
                type="text"
                value={config.openai_base_url}
                onChange={(e) => saveBaseUrl(e.target.value)}
                placeholder="https://api.openai.com/v1"
                className="rounded-xl px-4 py-2.5 text-sm border"
                style={inputStyle}
              />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Change for OpenRouter, local LLMs, or other providers
              </span>
            </div>
          </div>
        )}

        {/* Focus Veil Tab */}
        {activeTab === 'veil' && (
          <div className="flex flex-col gap-5 fade-up">
            {/* Master Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">Enable Focus Veil</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Block distractions when timer starts
                </div>
              </div>
              <button
                onClick={() => updateVeil({ enabled: !config.focus_veil.enabled })}
                className="btn w-12 h-6 rounded-full relative transition-all"
                style={{
                  background: config.focus_veil.enabled ? 'var(--green)' : 'var(--bg-overlay2)',
                }}
              >
                <div
                  className="absolute top-0.5 w-5 h-5 rounded-full transition-all"
                  style={{
                    background: 'var(--bg-base)',
                    left: config.focus_veil.enabled ? '26px' : '2px',
                  }}
                />
              </button>
            </div>

            {/* Blocked Apps */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Blocked Applications
              </label>
              <div className="flex flex-wrap gap-2">
                {config.focus_veil.blocked_apps.map((app) => (
                  <span
                    key={app}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                    style={{ background: 'var(--bg-overlay)', color: 'var(--text-dim)' }}
                  >
                    {app}
                    <button
                      onClick={() => removeBlockedApp(app)}
                      className="font-bold"
                      style={{ color: 'var(--red)' }}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={newAppInput}
                  onChange={(e) => setNewAppInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addBlockedApp()}
                  placeholder="App class name (e.g., firefox)"
                  className="flex-1 rounded-xl px-4 py-2.5 text-sm border"
                  style={inputStyle}
                />
                <button
                  onClick={addBlockedApp}
                  className="btn px-4 py-2.5 rounded-xl text-sm font-bold"
                  style={{ background: 'var(--pink)', color: 'var(--bg-base)' }}
                >
                  + Add
                </button>
              </div>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Use <code className="font-mono" style={{ color: 'var(--sapphire)' }}>hyprctl clients</code> to find app class names
              </span>
            </div>

            {/* Notification Suppression */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">Suppress Notifications</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Pause dunst during focus
                </div>
              </div>
              <button
                onClick={() =>
                  updateVeil({ suppress_notifications: !config.focus_veil.suppress_notifications })
                }
                className="btn w-12 h-6 rounded-full relative transition-all"
                style={{
                  background: config.focus_veil.suppress_notifications
                    ? 'var(--green)'
                    : 'var(--bg-overlay2)',
                }}
              >
                <div
                  className="absolute top-0.5 w-5 h-5 rounded-full transition-all"
                  style={{
                    background: 'var(--bg-base)',
                    left: config.focus_veil.suppress_notifications ? '26px' : '2px',
                  }}
                />
              </button>
            </div>

            {/* Wallpaper */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Focus Wallpaper
              </label>
              <input
                type="text"
                value={config.focus_veil.focus_wallpaper || ''}
                onChange={(e) => updateVeil({ focus_wallpaper: e.target.value || null })}
                placeholder="/path/to/focus-wallpaper.png"
                className="rounded-xl px-4 py-2.5 text-sm border"
                style={inputStyle}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Default Wallpaper
              </label>
              <input
                type="text"
                value={config.focus_veil.default_wallpaper || ''}
                onChange={(e) => updateVeil({ default_wallpaper: e.target.value || null })}
                placeholder="/path/to/default-wallpaper.png"
                className="rounded-xl px-4 py-2.5 text-sm border"
                style={inputStyle}
              />
            </div>
          </div>
        )}

        <div className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
          Keys stored locally in <code className="font-mono" style={{ color: 'var(--sapphire)' }}>~/.config/kairos/config.json</code>
        </div>
      </div>
    </div>
  );
};

export default Settings;
