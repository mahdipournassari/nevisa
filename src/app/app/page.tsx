'use client';

import { useEffect, useState, useCallback } from 'react';
import { History as HistoryIcon, Sparkles, Loader2, FileSearch, Wand2 } from 'lucide-react';
import { Header } from '@/components/Header';
import { Generator } from '@/components/Generator';
import { FileAnalyzer } from '@/components/FileAnalyzer';
import { HistoryPanel } from '@/components/HistoryPanel';
import { AuthScreen } from '@/components/AuthScreen';
import { UsageBar } from '@/components/UsageBar';
import { useAuth } from '@/lib/auth';
import { fetchHistory, deleteHistoryItem, clearAllHistory } from '@/lib/history';
import { fetchSubscription, type SubscriptionInfo } from '@/lib/subscription-client';
import { supabase } from '@/lib/supabase';
import type { GenerationResult } from '@/lib/generator';

export default function AppPage() {
  const { session, loading } = useAuth();
  const [history, setHistory] = useState<GenerationResult[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [regenerateItem, setRegenerateItem] = useState<GenerationResult | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [subLoading, setSubLoading] = useState(true);
  const [activeTool, setActiveTool] = useState<'generator' | 'file'>('generator');

  const loadSubscription = useCallback(async (token: string) => {
    setSubLoading(true);
    const info = await fetchSubscription(token);
    setSubscription(info);
    setSubLoading(false);
  }, []);

  useEffect(() => {
    if (!session) {
      setHistory([]);
      setSubscription(null);
      setSubLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data: sess }) => {
      const token = sess.session?.access_token;
      if (!token) return;
      fetchHistory(token).then(setHistory);
      loadSubscription(token);
    });
  }, [session, loadSubscription]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success' && session?.access_token) {
      loadSubscription(session.access_token);
      window.history.replaceState({}, '', '/app');
    }
  }, [session, loadSubscription]);

  const handleGenerated = (result: GenerationResult) => {
    setHistory((prev) => [result, ...prev].slice(0, 50));
  };

  const handleUsageChanged = () => {
    if (!session?.access_token) return;
    loadSubscription(session.access_token);
  };

  const handleDelete = async (createdAt: number) => {
    const item = history.find((i) => i.createdAt === createdAt);
    setHistory((prev) => prev.filter((i) => i.createdAt !== createdAt));
    const { data: sess } = await supabase.auth.getSession();
    const token = sess.session?.access_token;
    if (token && item?.id) {
      await deleteHistoryItem(item.id, token);
    }
  };

  const handleClear = async () => {
    setHistory([]);
    const { data: sess } = await supabase.auth.getSession();
    const token = sess.session?.access_token;
    if (token) {
      await clearAllHistory(token);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      <Header planName={subscription?.planName} />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-5 pb-24 space-y-5">
        <UsageBar subscription={subscription} loading={subLoading} />

        <div className="text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-primary-400" />
            <span className="text-xs text-primary-300 font-medium">هوش مصنوعی نویسا</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-1.5">متن حرفه‌ای در کمتر از ۱۰ ثانیه</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            کپشن اینستاگرام، متن تبلیغاتی، ایمیل، مقاله، تیتر، خلاصه و شعر — فقط موضوع را بنویس
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-800/60 border border-slate-700/50">
          <button
            type="button"
            onClick={() => setActiveTool('generator')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTool === 'generator' ? 'bg-primary-500/15 text-primary-300' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Wand2 className="w-4 h-4" /> تولید محتوا
          </button>
          <button
            type="button"
            onClick={() => setActiveTool('file')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTool === 'file' ? 'bg-primary-500/15 text-primary-300' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <FileSearch className="w-4 h-4" /> تحلیل فایل
          </button>
        </div>

        {activeTool === 'generator' ? (
          <Generator
            onGenerated={handleGenerated}
            regenerateItem={regenerateItem}
            onRegenerateConsumed={() => setRegenerateItem(null)}
            onUsageChanged={handleUsageChanged}
            canGenerate={subscription?.canGenerate ?? true}
          />
        ) : (
          <FileAnalyzer
            authToken={session?.access_token}
            onUsageChanged={handleUsageChanged}
            canAnalyze={subscription?.canGenerate ?? true}
          />
        )}
      </main>

      <button
        onClick={() => setShowHistory(true)}
        className="fixed bottom-5 left-5 z-20 flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-800/90 backdrop-blur-xl border border-slate-700/60 text-slate-200 shadow-xl hover:bg-slate-700/90 active:scale-95 transition-all"
      >
        <HistoryIcon className="w-5 h-5" />
        <span className="text-sm font-medium">تاریخچه</span>
        {history.length > 0 && (
          <span className="min-w-5 h-5 px-1.5 rounded-full bg-primary-500 text-white text-[10px] font-bold flex items-center justify-center">
            {history.length}
          </span>
        )}
      </button>

      {showHistory && (
        <HistoryPanel
          items={history}
          onRegenerate={(item) => {
            setRegenerateItem(item);
            setShowHistory(false);
          }}
          onDelete={handleDelete}
          onClear={handleClear}
          onClose={() => setShowHistory(false)}
        />
      )}

      <footer className="py-4 text-center">
        <p className="text-[11px] text-slate-600">نویسا — تولید محتوا با هوش مصنوعی</p>
      </footer>
    </div>
  );
}
