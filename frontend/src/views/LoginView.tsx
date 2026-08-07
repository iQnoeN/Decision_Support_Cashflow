import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { UserRole } from '../api/types';
import { ShieldCheck, TrendingUp, Lock, ArrowRight, UserCheck } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login } = useAuthStore();
  const [email, setEmail] = useState('alexandra.vance@acme-corp.com');
  const [role, setRole] = useState<UserRole>('finance_manager');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email, role);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="glass-card rounded-3xl p-8 sm:p-12 max-w-md w-full relative overflow-hidden shadow-2xl border border-slate-700/80">
        <div className="absolute -top-12 -right-12 w-44 h-44 bg-teal-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
            <TrendingUp className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-slate-100">Cashflow Decision Support</h2>
            <p className="text-xs text-slate-400">AI-Powered Liquidity & Forecast Platform</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Work Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900/90 text-sm text-slate-100 px-4 py-3 rounded-xl border border-slate-700 focus:border-teal-400 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Select Financial Persona / Role
            </label>
            <div className="grid grid-cols-1 gap-2">
              {[
                { id: 'financial_analyst', label: 'Financial Analyst', desc: 'Full upload, model testing & raw CSV export rights' },
                { id: 'finance_manager', label: 'Finance Manager', desc: 'Forecast execution, scenario simulations & alerts' },
                { id: 'cfo_executive', label: 'CFO / Executive', desc: 'High-level dashboard KPIs & risk summary' },
              ].map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id as UserRole)}
                  className={`p-3 rounded-xl border text-left transition-all flex items-start justify-between ${
                    role === r.id
                      ? 'bg-teal-500/15 border-teal-500 text-teal-300'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-slate-200">{r.label}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{r.desc}</div>
                  </div>
                  {role === r.id && <UserCheck className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 px-6 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-teal-500/25 transition-all flex items-center justify-center gap-2 mt-4"
          >
            Launch Decision Workspace <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-800 text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          SOC2 Type II Compliant • Bank-Grade 256-bit Encryption
        </div>
      </div>
    </div>
  );
};
