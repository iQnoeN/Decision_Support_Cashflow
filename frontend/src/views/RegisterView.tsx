import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { UserRole } from '../api/types';
import { GoogleAuthButton } from '../components/GoogleAuthButton';
import { ShieldCheck, TrendingUp, UserCheck, User, Mail, Lock, AlertCircle, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';

interface RegisterViewProps {
  onNavigateToLogin: () => void;
}

export const RegisterView: React.FC<RegisterViewProps> = ({ onNavigateToLogin }) => {
  const { register, isLoading, error, clearError } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('finance_manager');
  const [registeredSuccessMsg, setRegisteredSuccessMsg] = useState<string | null>(null);

  React.useEffect(() => {
    clearError();
  }, [clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await register(name, email, password, role);
      setRegisteredSuccessMsg(res.message);
    } catch (err) {
      // handled by useAuthStore error state
    }
  };

  if (registeredSuccessMsg) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="glass-card rounded-3xl p-8 sm:p-12 max-w-md w-full relative overflow-hidden shadow-2xl border border-slate-700/80 text-center">
          <div className="w-16 h-16 bg-teal-500/10 border border-teal-500/30 rounded-2xl flex items-center justify-center text-teal-400 mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-100 mb-2">Registration Successful</h2>
          <p className="text-sm text-slate-300 mb-6">{registeredSuccessMsg}</p>
          <button
            onClick={onNavigateToLogin}
            className="w-full py-3.5 px-6 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm rounded-xl transition-all"
          >
            Return to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="glass-card rounded-3xl p-8 sm:p-12 max-w-md w-full relative overflow-hidden shadow-2xl border border-slate-700/80">
        <div className="absolute -top-12 -right-12 w-44 h-44 bg-teal-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <button
          onClick={onNavigateToLogin}
          className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Sign In
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
            <TrendingUp className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-slate-100">Create Account</h2>
            <p className="text-xs text-slate-400">Join Cashflow Decision Support</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold">Registration Notice</span>
              <p className="mt-0.5 text-rose-300/90">{error}</p>
              {error.toLowerCase().includes('already exists') && (
                <button
                  type="button"
                  onClick={onNavigateToLogin}
                  className="mt-2 text-teal-400 font-semibold underline hover:text-teal-300 block text-xs"
                >
                  Click here to Sign In with this email →
                </button>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => {
                  if (error) clearError();
                  setName(e.target.value);
                }}
                placeholder="Alexandra Vance"
                className="w-full bg-slate-900/90 text-sm text-slate-100 pl-10 pr-4 py-3 rounded-xl border border-slate-700 focus:border-teal-400 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
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
                placeholder="alexandra@acme-corp.com"
                className="w-full bg-slate-900/90 text-sm text-slate-100 pl-10 pr-4 py-3 rounded-xl border border-slate-700 focus:border-teal-400 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => {
                  if (error) clearError();
                  setPassword(e.target.value);
                }}
                placeholder="At least 8 characters"
                className="w-full bg-slate-900/90 text-sm text-slate-100 pl-10 pr-4 py-3 rounded-xl border border-slate-700 focus:border-teal-400 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Select Financial Persona / Role (Fixed)
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
                  className={`p-2.5 rounded-xl border text-left transition-all flex items-start justify-between ${
                    role === r.id
                      ? 'bg-teal-500/15 border-teal-500 text-teal-300'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-slate-200">{r.label}</div>
                    <div className="text-[11px] text-slate-400">{r.desc}</div>
                  </div>
                  {role === r.id && <UserCheck className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-6 bg-teal-500 hover:bg-teal-400 disabled:bg-slate-700 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-teal-500/25 transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Registering...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-700/60"></div>
          </div>
          <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
            <span className="bg-slate-900/90 px-3 text-slate-400 rounded-md">Or sign up with</span>
          </div>
        </div>

        <GoogleAuthButton role={role} text="signup_with" />

        <div className="mt-4 pt-4 border-t border-slate-800 text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          SOC2 Type II Compliant • Bank-Grade 256-bit Encryption
        </div>
      </div>
    </div>
  );
};
