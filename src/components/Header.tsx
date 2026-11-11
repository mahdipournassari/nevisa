'use client';

import Link from 'next/link';
import { Sparkles, LogOut, User, CreditCard } from 'lucide-react';
import { useAuth } from '@/lib/auth';

interface HeaderProps {
  planName?: string;
}

export function Header({ planName }: HeaderProps) {
  const { user, signOut } = useAuth();
  const email = user?.email && !user.email.toLowerCase().endsWith('@accounts.nevissaa.invalid') ? user.email : '';
  const displayName = user?.user_metadata?.username || email || 'حساب کاربری';
  const initial = String(displayName).charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-30 backdrop-blur-xl bg-slate-900/80 border-b border-slate-800/60">
      <div className="max-w-3xl mx-auto px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/30">
            <Sparkles className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white leading-tight">نویسا</h1>
            <p className="text-[11px] text-slate-400 leading-tight">
              {planName ? `پلن ${planName}` : 'هوش مصنوعی تولید محتوا'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/pricing"
            className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-primary-300 hover:bg-primary-500/10 transition-colors"
            title="پلن‌ها"
          >
            <CreditCard className="w-4 h-4" />
          </Link>
          <a
            href="https://cafebazaar.ir/app/com.nevissaa.app"
              target="_blank"
              rel="noopener noreferrer"
            className="hidden sm:inline-flex px-3 py-1.5 rounded-xl bg-primary-500/10 border border-primary-500/20 text-primary-300 text-[11px] font-semibold hover:bg-primary-500/20 transition-colors"
          >
            دانلود اپ
          </a>
          {!user ? (
            <Link
              href="/login?mode=signup"
              className="px-3 py-1.5 rounded-full bg-primary-500/15 border border-primary-500/30 text-primary-300 text-[11px] font-semibold hover:bg-primary-500/25 transition-colors"
            >
              ورود / ثبت‌نام
            </Link>
          ) : (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/60 border border-slate-700/50">
            <div className="w-5 h-5 rounded-full bg-primary-500/20 flex items-center justify-center">
              {initial ? (
                <span className="text-[10px] font-bold text-primary-300">{initial}</span>
              ) : (
                <User className="w-3 h-3 text-primary-300" />
              )}
            </div>
            <span className="text-[11px] text-slate-300 font-medium max-w-[120px] truncate">{displayName}</span>
          </div>
          )}
          {user && <button
            onClick={signOut}
            className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-error-400 hover:bg-error-500/10 transition-colors"
            title="خروج از حساب"
          >
            <LogOut className="w-4 h-4" />
          </button>}
        </div>
      </div>
    </header>
  );
}
