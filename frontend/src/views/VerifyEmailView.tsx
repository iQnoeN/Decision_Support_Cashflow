import React, { useEffect, useState } from 'react';
import { verifyEmailApi } from '../api/authClient';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface VerifyEmailViewProps {
  token: string;
  onNavigateToLogin: () => void;
}

export const VerifyEmailView: React.FC<VerifyEmailViewProps> = ({ token, onNavigateToLogin }) => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function verify() {
      try {
        const res = await verifyEmailApi(token);
        setMessage(res.message);
        setStatus('success');
      } catch (err: any) {
        setMessage(err?.response?.data?.detail || err?.message || 'Verification failed.');
        setStatus('error');
      }
    }
    if (token) {
      verify();
    } else {
      setStatus('error');
      setMessage('Missing verification token.');
    }
  }, [token]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="glass-card rounded-3xl p-8 sm:p-12 max-w-md w-full relative overflow-hidden shadow-2xl border border-slate-700/80 text-center">
        {status === 'loading' && (
          <div className="py-8">
            <Loader2 className="w-12 h-12 animate-spin text-teal-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-100">Verifying your email...</h3>
            <p className="text-xs text-slate-400 mt-1">Please wait a moment while we validate your token.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="py-4">
            <div className="w-16 h-16 bg-teal-500/10 border border-teal-500/30 rounded-2xl flex items-center justify-center text-teal-400 mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-100 mb-2">Email Verified</h2>
            <p className="text-sm text-slate-300 mb-6">{message}</p>
            <button
              onClick={onNavigateToLogin}
              className="w-full py-3.5 px-6 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm rounded-xl transition-all"
            >
              Sign In to Your Account
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="py-4">
            <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-center text-rose-400 mx-auto mb-6">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-100 mb-2">Verification Failed</h2>
            <p className="text-sm text-rose-300 mb-6">{message}</p>
            <button
              onClick={onNavigateToLogin}
              className="w-full py-3.5 px-6 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm rounded-xl transition-all"
            >
              Return to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
