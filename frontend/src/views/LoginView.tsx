import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { GoogleAuthButton } from '../components/GoogleAuthButton';
import { ShieldCheck, TrendingUp, ArrowRight, Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';

interface LoginViewProps {
  onNavigateToRegister: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onNavigateToRegister }) => {
  const { login, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  React.useEffect(() => {
    clearError();
  }, [clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
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

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold">Authentication Error</span>
              <p className="mt-0.5 text-rose-300/90">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Work Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  if (error) clearError();
                  setEmail(e.target.value);
                }}
                placeholder="name@company.com"
                className="w-full bg-slate-900/90 text-sm text-slate-100 pl-10 pr-4 py-3 rounded-xl border border-slate-700 focus:border-teal-400 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => {
                  if (error) clearError();
                  setPassword(e.target.value);
                }}
                placeholder="••••••••"
                className="w-full bg-slate-900/90 text-sm text-slate-100 pl-10 pr-4 py-3 rounded-xl border border-slate-700 focus:border-teal-400 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-6 bg-teal-500 hover:bg-teal-400 disabled:bg-slate-700 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-teal-500/25 transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Authenticating...
              </>
            ) : (
              <>
                Sign In to Decision Workspace <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-700/60"></div>
          </div>
          <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
            <span className="bg-slate-900/90 px-3 text-slate-400 rounded-md">Or continue with</span>
          </div>
        </div>

        <GoogleAuthButton text="continue_with" />

        <div className="mt-6 text-center text-xs text-slate-400">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={onNavigateToRegister}
            className="text-teal-400 hover:underline font-semibold"
          >
            Register new account
          </button>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          SOC2 Type II Compliant • Bank-Grade 256-bit Encryption
        </div>
      </div>
    </div>
  );
};
