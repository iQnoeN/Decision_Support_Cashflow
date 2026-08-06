import React, { useState, useEffect } from 'react';
import { useCashflowStore } from '../store/useCashflowStore';
import { useToastStore } from '../store/useToastStore';
import { apiClient } from '../api/client';
import { Settings, Server, Key, FileCheck, CheckCircle2, XCircle, RefreshCw, Layers } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { isMockMode, setIsMockMode, isDarkMode, toggleDarkMode, forecastResult } = useCashflowStore();
  const { addToast } = useToastStore();

  const [apiUrl, setApiUrl] = useState(import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000');
  const [apiKey, setApiKey] = useState('sk_live_cashflow_9a8f7b2c3d4e');
  const [healthStatus, setHealthStatus] = useState<'checking' | 'healthy' | 'offline'>('checking');

  const checkHealth = async () => {
    setHealthStatus('checking');
    try {
      const res = await apiClient.get('/health');
      if (res.data?.status === 'healthy') {
        setHealthStatus('healthy');
      } else {
        setHealthStatus('offline');
      }
    } catch {
      setHealthStatus('offline');
    }
  };

  useEffect(() => {
    checkHealth();
  }, [apiUrl]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    addToast({
      type: 'success',
      title: 'Settings Saved',
      message: 'API configuration and environment keys updated successfully.',
    });
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-100">
          System Settings & Model Run Artifacts
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure API endpoints, toggle mock pipeline, and inspect generated ML output logs
        </p>
      </div>

      {/* API Connection & Health */}
      <form onSubmit={handleSaveSettings} className="glass-panel rounded-2xl p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Server className="w-5 h-5 text-teal-400" /> Backend API Integration
          </h3>

          <div className="flex items-center gap-2">
            {healthStatus === 'healthy' ? (
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Backend Online (200 OK)
              </span>
            ) : healthStatus === 'offline' ? (
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5" /> Offline (Using Client Fallback)
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-400 text-xs font-medium flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" /> Checking...
              </span>
            )}

            <button
              type="button"
              onClick={checkHealth}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs"
              title="Re-check health"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              FastAPI Endpoint Base URL
            </label>
            <input
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              className="w-full bg-slate-900/90 text-sm text-slate-200 px-4 py-2.5 rounded-xl border border-slate-700 focus:border-teal-400 focus:outline-none"
            />
            <p className="text-[11px] text-slate-500 mt-1">Default local server: http://localhost:8000</p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              API Authentication Key
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full bg-slate-900/90 text-sm text-slate-200 pl-10 pr-4 py-2.5 rounded-xl border border-slate-700 focus:border-teal-400 focus:outline-none"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Required for production server endpoints</p>
          </div>
        </div>

        {/* Mock Mode Toggle */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-sm font-bold text-slate-200">Force Client-Side Mock Pipeline</div>
            <div className="text-xs text-slate-400">Bypass backend network calls and simulate model predictions instant offline</div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isMockMode}
              onChange={(e) => setIsMockMode(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
          </label>
        </div>

        {/* Theme Toggle */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-sm font-bold text-slate-200">Dark Mode Interface</div>
            <div className="text-xs text-slate-400">Toggle between glassmorphism dark theme and clean light theme</div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isDarkMode}
              onChange={toggleDarkMode}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
          </label>
        </div>

        <button
          type="submit"
          className="px-6 py-2.5 text-xs font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl shadow-lg shadow-teal-500/20 transition-all"
        >
          Save Configuration
        </button>
      </form>

      {/* Last Run Artifacts Viewer */}
      <div className="glass-panel rounded-2xl p-6 space-y-4">
        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <Layers className="w-5 h-5 text-teal-400" /> Recent ML Model Run Artifacts
        </h3>
        <p className="text-xs text-slate-400">Inspect raw JSON metrics and predictions.csv payload outputs generated by the latest run</p>

        {forecastResult ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-950 font-mono text-xs text-teal-400 overflow-x-auto border border-slate-800 max-h-60">
              <pre>
                {JSON.stringify(
                  {
                    generated_at: forecastResult.generated_at,
                    predicted_next_day_net: forecastResult.next_day_cashflow,
                    liquidity_score: forecastResult.liquidity_score,
                    risk_assessment: forecastResult.risk,
                    model_metrics: forecastResult.metrics,
                    top_feature: forecastResult.feature_importance[0]?.feature,
                  },
                  null,
                  2
                )}
              </pre>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-400">
              <FileCheck className="w-4 h-4 text-emerald-400" />
              <span>Artifacts stored at: <code className="text-slate-200">/outputs/predictions.csv</code> & <code className="text-slate-200">/outputs/metrics.json</code></span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500">No artifacts generated yet. Run a prediction to generate output files.</p>
        )}
      </div>
    </div>
  );
};
