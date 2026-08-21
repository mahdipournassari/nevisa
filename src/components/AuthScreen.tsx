'use client';

import { useState } from 'react';
import { Sparkles, Mail, Lock, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setError(null);
    setLoading(true);
    const fn = mode === 'signup' ? signUp : signIn;
    const { error } = await fn(email.trim(), password);
    if (error) setError(error);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center px-5">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-xl shadow-primary-500/30 mb-4">
            <Sparkles className="w-8 h-8 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">نویسا</h1>
          <p className="text-sm text-slate-400">هوش مصنوعی تولید محتوا</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-3xl p-6 shadow-xl">
          <div className="flex gap-1 p-1 bg-slate-900/60 rounded-xl mb-5">
            <button
              onClick={() => { setMode('signup'); setError(null); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                mode === 'signup' ? 'bg-primary-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ثبت‌نام
            </button>
            <button
              onClick={() => { setMode('signin'); setError(null); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                mode === 'signin' ? 'bg-primary-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ورود
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block font-medium">ایمیل</label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  dir="ltr"
                  className="w-full pr-10 pl-4 py-3 rounded-xl bg-slate-900/60 border border-slate-700/50 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 transition-all text-sm text-left"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1.5 block font-medium">رمز عبور</label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  dir="ltr"
                  className="w-full pr-10 pl-4 py-3 rounded-xl bg-slate-900/60 border border-slate-700/50 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 transition-all text-sm text-left"
                />
              </div>
            </div>

            {error && (
              <div className="px-3.5 py-2.5 rounded-xl bg-error-500/10 border border-error-500/20 text-error-400 text-xs animate-scale-in">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold text-sm shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {mode === 'signup' ? 'ایجاد حساب' : 'ورود'}
                  <ArrowLeft className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-[11px] text-slate-500 text-center mt-4 leading-relaxed">
            {mode === 'signup'
              ? 'با ثبت‌نام، متنی که تولید می‌کنید در حساب شما ذخیره می‌شود'
              : 'ایمیل و رمز عبور خود را وارد کنید'}
          </p>
        </div>
      </div>
    </div>
  );
}
