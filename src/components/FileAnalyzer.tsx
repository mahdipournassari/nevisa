'use client';

import { useState } from 'react';
import { AlertCircle, FileSearch, Loader2, Upload, X } from 'lucide-react';

interface FileAnalyzerProps {
  authToken?: string | null;
  onUsageChanged?: () => void;
  canAnalyze?: boolean;
}

type Mode = 'summary' | 'key-points' | 'questions' | 'custom';

const MODES: { value: Mode; label: string }[] = [
  { value: 'summary', label: 'خلاصه‌سازی' },
  { value: 'key-points', label: 'نکات مهم' },
  { value: 'questions', label: 'پاسخ به سؤال' },
  { value: 'custom', label: 'تحلیل دلخواه' },
];

export function FileAnalyzer({ authToken, onUsageChanged, canAnalyze = true }: FileAnalyzerProps) {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<Mode>('summary');
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!file || loading || !canAnalyze) return;
    setLoading(true);
    setError(null);
    setResult('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mode', mode);
      formData.append('question', question);

      const headers: Record<string, string> = {};
      if (authToken) headers.Authorization = `Bearer ${authToken}`;

      const response = await fetch('/api/analyze-file', {
        method: 'POST',
        headers,
        body: formData,
      });
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(body?.error ?? 'تحلیل فایل ناموفق بود.');
        return;
      }

      setResult(body.text ?? '');
      onUsageChanged?.();
    } catch {
      setError('ارتباط با سرور برقرار نشد. دوباره تلاش کنید.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 mb-3">
          <FileSearch className="w-3.5 h-3.5 text-primary-400" />
          <span className="text-xs text-primary-300 font-medium">تحلیل فایل نویسا</span>
        </div>
        <h2 className="text-xl font-bold text-white mb-1.5">فایل خود را به نویسا بسپارید</h2>
        <p className="text-sm text-slate-400 leading-relaxed">PDF، Word، Excel، CSV، TXT و JSON را تحلیل کنید.</p>
      </div>

      <label className="block cursor-pointer">
        <input
          type="file"
          className="hidden"
          accept=".pdf,.docx,.xlsx,.xls,.csv,.txt,.json,application/pdf,application/json,text/plain,text/csv"
          onChange={(event) => {
            const selected = event.target.files?.[0] ?? null;
            setFile(selected);
            setResult('');
            setError(null);
          }}
        />
        <div className="min-h-36 rounded-2xl border border-dashed border-slate-700 bg-slate-800/40 hover:bg-slate-800/70 hover:border-primary-500/50 transition-all flex flex-col items-center justify-center gap-2 px-5 text-center">
          <Upload className="w-7 h-7 text-primary-400" />
          <span className="text-sm font-semibold text-slate-200">انتخاب فایل</span>
          <span className="text-xs text-slate-500">حداکثر ۱۰ مگابایت — فایل پس از پردازش دائمی ذخیره نمی‌شود</span>
        </div>
      </label>

      {file && (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-800/60 border border-slate-700/50 px-3 py-2.5">
          <div className="min-w-0">
            <p className="text-sm text-slate-200 truncate">{file.name}</p>
            <p className="text-[11px] text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
          <button
            type="button"
            onClick={() => { setFile(null); setResult(''); setError(null); }}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-700/70"
            aria-label="حذف فایل"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div>
        <label className="text-sm font-semibold text-slate-300 mb-2 block">نوع تحلیل</label>
        <div className="grid grid-cols-2 gap-2">
          {MODES.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setMode(item.value)}
              className={`px-3 py-2.5 rounded-xl text-sm border transition-all ${mode === item.value ? 'bg-primary-500/15 border-primary-500/50 text-primary-300' : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:text-slate-200'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {(mode === 'questions' || mode === 'custom') && (
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder={mode === 'questions' ? 'مثلاً: مهم‌ترین نکات گزارش چیست؟' : 'مثلاً: عملکرد فروش را بررسی کن و سه پیشنهاد عملی بده.'}
          rows={4}
          className="w-full px-4 py-3 rounded-2xl bg-slate-800/60 border border-slate-700/50 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 resize-none text-sm leading-6"
        />
      )}

      <button
        type="button"
        onClick={handleAnalyze}
        disabled={!file || loading || !canAnalyze}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold text-base shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40 disabled:scale-100 disabled:shadow-none"
      >
        {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> در حال تحلیل فایل...</> : <><FileSearch className="w-5 h-5" /> {canAnalyze ? 'تحلیل فایل' : 'سقف مصرف تمام شده'}</>}
      </button>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-error-500/10 border border-error-500/20 text-error-400 text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className="rounded-2xl bg-slate-800/60 border border-slate-700/50 p-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h3 className="text-sm font-bold text-slate-200">نتیجه تحلیل</h3>
            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText(result)}
              className="text-xs text-primary-400 hover:text-primary-300"
            >کپی نتیجه</button>
          </div>
          <div className="whitespace-pre-wrap text-sm leading-7 text-slate-300">{result}</div>
        </div>
      )}
    </div>
  );
}
