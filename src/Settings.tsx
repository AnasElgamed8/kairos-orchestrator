import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { AppConfig } from './types';

const Settings = ({ onClose }: { onClose: () => void }) => {
  const [config, setConfig] = useState<AppConfig>({
    openai_api_key: null,
    openai_model: 'gpt-4o',
    openai_base_url: 'https://api.openai.com/v1',
  });
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [saved, setSaved] = useState(false);

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

  const saveApiKey = async () => {
    try {
      await invoke('set_api_key', { key: apiKeyInput.trim() });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error('Failed to save API key', e);
    }
  };

  const saveModel = async (model: string) => {
    setConfig(prev => ({ ...prev, openai_model: model }));
    await invoke('set_model', { model });
  };

  const saveBaseUrl = async (url: string) => {
    setConfig(prev => ({ ...prev, openai_base_url: url }));
    await invoke('set_base_url', { url });
  };

  const maskKey = (key: string | null) => {
    if (!key || key.length < 10) return key || '';
    return key.slice(0, 7) + '...' + key.slice(-4);
  };

  return (
    <div className="fixed inset-0 bg-bg-color/80 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="glass-panel w-full max-w-md flex flex-col gap-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-primary-color">Settings</h2>
          <button onClick={onClose} className="text-text-color opacity-50 hover:opacity-100 text-lg">✕</button>
        </div>

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
              {saved ? '✓' : 'Save'}
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

        <div className="text-xs opacity-30 text-center mt-2">
          Keys are stored locally in ~/.config/kairos/config.json
        </div>
      </div>
    </div>
  );
};

export default Settings;
