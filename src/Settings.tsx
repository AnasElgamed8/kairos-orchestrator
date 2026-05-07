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
    setConfig(prev => ({ ...prev, openai_model: model }));
    await invoke('set_model', { model });
    flashSaved();
  };

  const saveBaseUrl = async (url: string) => {
    setConfig(prev => ({ ...prev, openai_base_url: url }));
    await invoke('set_base_url', { url });
    flashSaved();
  };

  const updateVeil = async (updates: Partial<FocusVeilConfig>) => {
    const newVeil = { ...config.focus_veil, ...updates };
    setConfig(prev => ({ ...prev, focus_veil: newVeil }));
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
    updateVeil({ blocked_apps: config.focus_veil.blocked_apps.filter(a => a !== app) });
  };

  const maskKey = (key: string | null) => {
    if (!key || key.length < 10) return key || '';
    return key.slice(0, 7) + '...' + key.slice(-4);
  };

  return (
    <div className="fixed inset-0 bg-bg-color/80 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="glass-panel w-full max-w-lg flex flex-col gap-5 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-primary-color">Settings</h2>
          <div className="flex items-center gap-3">
            {saved && <span className="text-xs text-success-color fade-in">✓ Saved</span>}
            <button onClick={onClose} className="text-text-color opacity-50 hover:opacity-100 text-lg">✕</button>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex gap-1 bg-surface-color rounded-lg p-1">
          <button
            onClick={() => setActiveTab('api')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
              activeTab === 'api' ? 'bg-primary-color text-bg-color' : 'text-text-color opacity-50 hover:opacity-80'
            }`}
          >
            🔑 API
          </button>
          <button
            onClick={() => setActiveTab('veil')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
              activeTab === 'veil' ? 'bg-primary-color text-bg-color' : 'text-text-color opacity-50 hover:opacity-80'
            }`}
          >
            🛡 Focus Veil
          </button>
        </div>

        {/* API Tab */}
        {activeTab === 'api' && (
          <div className="flex flex-col gap-5 fade-in">
            {/* API Key */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold opacity-60 uppercase tracking-wider">OpenAI API Key</label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="sk-..."
                  className="bg-surface-color text-text-color rounded-lg p-3 text-sm flex-1 outline-none border border-border-color focus:border-primary-color transition-colors"
                />
                <button
                  onClick={saveApiKey}
                  className="bg-primary-color text-bg-color px-4 py-2 rounded-lg font-bold text-sm hover:scale-105 transition-transform"
                >
                  Save
                </button>
              </div>
              {config.openai_api_key && (
                <span className="text-xs opacity-40">Current: {maskKey(config.openai_api_key)}</span>
              )}
            </div>

            {/* Model */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold opacity-60 uppercase tracking-wider">Model</label>
              <select
                value={config.openai_model}
                onChange={(e) => saveModel(e.target.value)}
                className="bg-surface-color text-text-color rounded-lg p-3 text-sm outline-none border border-border-color focus:border-primary-color transition-colors"
              >
                <option value="gpt-4o">GPT-4o</option>
                <option value="gpt-4o-mini">GPT-4o Mini</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                <option value="deepseek-chat">DeepSeek Chat</option>
                <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
              </select>
            </div>

            {/* Base URL */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold opacity-60 uppercase tracking-wider">API Base URL</label>
              <input
                type="text"
                value={config.openai_base_url}
                onChange={(e) => saveBaseUrl(e.target.value)}
                placeholder="https://api.openai.com/v1"
                className="bg-surface-color text-text-color rounded-lg p-3 text-sm outline-none border border-border-color focus:border-primary-color transition-colors"
              />
              <span className="text-xs opacity-40">Change this for OpenRouter, local LLMs, or other providers</span>
            </div>
          </div>
        )}

        {/* Focus Veil Tab */}
        {activeTab === 'veil' && (
          <div className="flex flex-col gap-5 fade-in">
            {/* Master Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold">Enable Focus Veil</div>
                <div className="text-xs opacity-40">Block distractions when timer starts</div>
              </div>
              <button
                onClick={() => updateVeil({ enabled: !config.focus_veil.enabled })}
                className={`w-12 h-6 rounded-full transition-all relative ${
                  config.focus_veil.enabled ? 'bg-success-color' : 'bg-border-color'
                }`}
              >
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-bg-color transition-all ${
                  config.focus_veil.enabled ? 'left-6' : 'left-0.5'
                }`} />
              </button>
            </div>

            {/* Blocked Apps */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold opacity-60 uppercase tracking-wider">Blocked Applications</label>
              <div className="flex flex-wrap gap-2">
                {config.focus_veil.blocked_apps.map(app => (
                  <span
                    key={app}
                    className="flex items-center gap-1.5 bg-surface-color text-text-color px-3 py-1.5 rounded-full text-xs"
                  >
                    {app}
                    <button
                      onClick={() => removeBlockedApp(app)}
                      className="text-danger-color hover:text-danger-color/80 font-bold"
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
                  className="bg-surface-color text-text-color rounded-lg p-2.5 text-sm flex-1 outline-none border border-border-color focus:border-primary-color transition-colors"
                />
                <button
                  onClick={addBlockedApp}
                  className="bg-accent-color text-bg-color px-3 py-2 rounded-lg font-bold text-sm hover:scale-105 transition-transform"
                >
                  + Add
                </button>
              </div>
              <span className="text-xs opacity-40">Use hyprctl clients to find app class names</span>
            </div>

            {/* Notification Suppression */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold">Suppress Notifications</div>
                <div className="text-xs opacity-40">Pause dunst during focus</div>
              </div>
              <button
                onClick={() => updateVeil({ suppress_notifications: !config.focus_veil.suppress_notifications })}
                className={`w-12 h-6 rounded-full transition-all relative ${
                  config.focus_veil.suppress_notifications ? 'bg-success-color' : 'bg-border-color'
                }`}
              >
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-bg-color transition-all ${
                  config.focus_veil.suppress_notifications ? 'left-6' : 'left-0.5'
                }`} />
              </button>
            </div>

            {/* Wallpaper */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold opacity-60 uppercase tracking-wider">Focus Wallpaper</label>
              <input
                type="text"
                value={config.focus_veil.focus_wallpaper || ''}
                onChange={(e) => updateVeil({ focus_wallpaper: e.target.value || null })}
                placeholder="/path/to/focus-wallpaper.png"
                className="bg-surface-color text-text-color rounded-lg p-2.5 text-sm outline-none border border-border-color focus:border-primary-color transition-colors"
              />
              <span className="text-xs opacity-40">Changed automatically when focus starts (swww or hyprpaper)</span>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold opacity-60 uppercase tracking-wider">Default Wallpaper</label>
              <input
                type="text"
                value={config.focus_veil.default_wallpaper || ''}
                onChange={(e) => updateVeil({ default_wallpaper: e.target.value || null })}
                placeholder="/path/to/default-wallpaper.png"
                className="bg-surface-color text-text-color rounded-lg p-2.5 text-sm outline-none border border-border-color focus:border-primary-color transition-colors"
              />
              <span className="text-xs opacity-40">Restored when focus ends</span>
            </div>
          </div>
        )}

        <div className="text-xs opacity-30 text-center mt-2">
          Keys are stored locally in ~/.config/kairos/config.json
        </div>
      </div>
    </div>
  );
};

export default Settings;
