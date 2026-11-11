'use client';

import { useMemo, useState } from 'react';
import { trackEvent } from '@/lib/analytics';
import { AlertCircle, Download, FilePenLine, FileSearch, Loader2, MessageCircle, Upload, X } from 'lucide-react';

interface Props {
  authToken?: string | null;
  onUsageChanged?: () => void;
  canUse?: boolean;
}

type Mode = 'analyze' | 'chat' | 'edit';
type AnalyzeMode = 'summary' | 'key-points' | 'questions' | 'custom';
type Message = { role: 'user' | 'assistant'; text: string };

const ACCEPT = '.pdf,.docx,.xlsx,.xls,.csv,.txt,.json';
const ANALYZE_MODES: { value: AnalyzeMode; label: string }[] = [
  { value: 'summary', label: 'خلاصه‌سازی' },
  { value: 'key-points', label: 'نکات مهم' },
  { value: 'questions', label: 'پاسخ به سؤال' },
  { value: 'custom', label: 'تحلیل دلخواه' },
];

export function FileWorkspace({ authToken, onUsageChanged, canUse = true }: Props) {
  const [mode, setMode] = useState<Mode>('analyze');
  const [file, setFile] = useState<File | null>(null);
  const [analyzeMode, setAnalyzeMode] = useState<AnalyzeMode>('summary');
  const [instruction, setInstruction] = useState('');
  const [result, setResult] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [outputName, setOutputName] = useState('');

  const headers = useMemo<Headers>(() => {
    const value = new Headers();
    if (authToken) value.set('Authorization', `Bearer ${authToken}`);
    return value;
  }, [authToken]);

  const chooseFile = (next: File | null) => {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setFile(next);
    setResult(''); setMessages([]); setError(null); setDownloadUrl(null); setOutputName('');
  };

  const runAnalyze = async () => {
    if (!file || loading || !canUse) return;
    setLoading(true); setError(null); setResult('');
    try {
      const form = new FormData(); form.append('file', file); form.append('mode', analyzeMode); form.append('question', instruction.trim());
      const res = await fetch('/api/analyze-file', { method: 'POST', headers, body: form });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error ?? 'تحلیل فایل ناموفق بود.');
      setResult(body.result ?? body.answer ?? ''); trackEvent('file_analyze', { file_type: file.name.split('.').pop() ?? '' }); onUsageChanged?.();
    } catch (e) { setError(e instanceof Error ? e.message : 'ارتباط با سرور برقرار نشد.'); }
    finally { setLoading(false); }
  };

  const sendChat = async () => {
    const q = question.trim();
    if (!file || !q || loading || !canUse) return;
    setLoading(true); setError(null); setQuestion('');
    try {
      const form = new FormData(); form.append('file', file); form.append('question', q);
      const res = await fetch('/api/chat-file', { method: 'POST', headers, body: form });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error ?? 'پاسخ‌گویی ناموفق بود.');
      setMessages(prev => [...prev, { role: 'user', text: q }, { role: 'assistant', text: body.answer ?? '' }]);
      trackEvent('file_chat', { file_type: file.name.split('.').pop() ?? '' });
      onUsageChanged?.();
    } catch (e) { setError(e instanceof Error ? e.message : 'ارتباط با سرور برقرار نشد.'); setQuestion(q); }
    finally { setLoading(false); }
  };

  const editFile = async () => {
    if (!file || !instruction.trim() || loading || !canUse) return;
    setLoading(true); setError(null);
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setDownloadUrl(null);
    try {
      const form = new FormData(); form.append('file', file); form.append('instruction', instruction.trim());
      const res = await fetch('/api/edit-file', { method: 'POST', headers, body: form });
      if (!res.ok) { const body = await res.json().catch(() => ({})); throw new Error(body?.error ?? 'ویرایش فایل ناموفق بود.'); }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const disposition = res.headers.get('Content-Disposition') ?? '';
      const match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
      const fallbackExt = file.name.match(/\.[^.]+$/)?.[0] ?? '';
      const name = match ? decodeURIComponent(match[1]) : `${file.name.replace(/\.[^.]+$/, '')}_edited${fallbackExt}`;
      setDownloadUrl(url); setOutputName(name); trackEvent('file_edit', { file_type: file.name.split('.').pop() ?? '' }); onUsageChanged?.();
    } catch (e) { setError(e instanceof Error ? e.message : 'ارتباط با سرور برقرار نشد.'); }
    finally { setLoading(false); }
  };

  const downloadTranscript = (ext: 'txt' | 'md') => {
    if (!messages.length) return;
    const text = messages.map(m => `${m.role === 'user' ? 'کاربر' : 'نویسا'}:\n${m.text}`).join('\n\n');
    const blob = new Blob([text], { type: ext === 'md' ? 'text/markdown;charset=utf-8' : 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = `nevissaa-chat-${Date.now()}.${ext}`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 mb-3">
          <FileSearch className="w-3.5 h-3.5 text-primary-400" /><span className="text-xs text-primary-300 font-medium">دستیار فایل نویسا</span>
        </div>
        <h2 className="text-xl font-bold text-white mb-1.5">یک فایل بدهید و هر کاری لازم است انجام دهید</h2>
        <p className="text-sm text-slate-400 leading-relaxed">یک فایل را انتخاب کنید؛ همان فایل برای تحلیل، گفتگو و ویرایش استفاده می‌شود و دائمی ذخیره نمی‌شود.</p>
      </div>

      <label className="block cursor-pointer">
        <input type="file" className="hidden" accept={ACCEPT} onChange={e => chooseFile(e.target.files?.[0] ?? null)} />
        <div className="min-h-28 rounded-2xl border border-dashed border-slate-700 bg-slate-800/40 hover:bg-slate-800/70 flex flex-col items-center justify-center gap-2">
          <Upload className="w-6 h-6 text-primary-400" /><span className="text-sm font-semibold text-slate-200">فایل را انتخاب کنید</span><span className="text-xs text-slate-500">PDF, Word, Excel, CSV, TXT و JSON — حداکثر ۱۰ مگابایت</span>
        </div>
      </label>

      {file && <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-800/60 border border-slate-700/50 px-3 py-2.5">
        <div className="min-w-0"><p className="text-sm text-slate-200 truncate">{file.name}</p><p className="text-[11px] text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p></div>
        <button type="button" onClick={() => chooseFile(null)} className="p-2 text-slate-500 hover:text-slate-200"><X className="w-4 h-4" /></button>
      </div>}

      <div className="grid grid-cols-3 gap-2 p-1 rounded-2xl bg-slate-800/60 border border-slate-700/50">
        {([
          ['analyze', 'تحلیل فایل', FileSearch],
          ['chat', 'چت با فایل', MessageCircle],
          ['edit', 'ویرایش فایل', FilePenLine],
        ] as const).map(([value, label, Icon]) => <button key={value} type="button" onClick={() => setMode(value)} className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${mode === value ? 'bg-primary-500/15 text-primary-300' : 'text-slate-500 hover:text-slate-300'}`}><Icon className="w-4 h-4" />{label}</button>)}
      </div>

      {!file && <div className="rounded-2xl bg-slate-800/40 border border-slate-700/40 p-5 text-center text-sm text-slate-500">برای شروع یک فایل انتخاب کنید.</div>}

      {file && mode === 'analyze' && <>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">{ANALYZE_MODES.map(item => <button key={item.value} type="button" onClick={() => setAnalyzeMode(item.value)} className={`px-3 py-2 rounded-xl text-xs font-semibold border ${analyzeMode === item.value ? 'border-primary-500/40 bg-primary-500/10 text-primary-300' : 'border-slate-700/50 bg-slate-800/50 text-slate-400'}`}>{item.label}</button>)}</div>
        {(analyzeMode === 'questions' || analyzeMode === 'custom') && <textarea value={instruction} onChange={e => setInstruction(e.target.value)} placeholder="سؤال یا نوع تحلیل موردنظر را بنویسید..." rows={4} className="w-full px-4 py-3 rounded-2xl bg-slate-800/60 border border-slate-700/50 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-primary-500/50 resize-none text-sm leading-7" />}
        <button type="button" onClick={() => void runAnalyze()} disabled={loading || !canUse} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold disabled:opacity-40">{loading ? <><Loader2 className="w-5 h-5 animate-spin" /> در حال تحلیل...</> : <><FileSearch className="w-5 h-5" /> {canUse ? 'تحلیل فایل' : 'سقف مصرف تمام شده'}</>}</button>
        {result && <div className="rounded-2xl bg-slate-800/60 border border-slate-700/50 p-4 whitespace-pre-wrap text-sm leading-7 text-slate-300">{result}</div>}
      </>}

      {file && mode === 'chat' && <>
        {messages.length > 0 && <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">{messages.map((m, i) => <div key={i} className={`rounded-2xl p-4 ${m.role === 'user' ? 'bg-primary-500/10 border border-primary-500/20 mr-5' : 'bg-slate-800/60 border border-slate-700/50 ml-5'}`}><p className="text-[11px] font-bold text-slate-500 mb-1">{m.role === 'user' ? 'شما' : 'نویسا'}</p><div className="whitespace-pre-wrap text-sm leading-7 text-slate-300">{m.text}</div></div>)}</div>}
        <textarea value={question} onChange={e => setQuestion(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) void sendChat(); }} placeholder="مثلاً: فروش سه ماه اول را مقایسه کن..." rows={4} className="w-full px-4 py-3 rounded-2xl bg-slate-800/60 border border-slate-700/50 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-primary-500/50 resize-none text-sm leading-6" />
        <button type="button" onClick={() => void sendChat()} disabled={!question.trim() || loading || !canUse} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold disabled:opacity-40">{loading ? <><Loader2 className="w-5 h-5 animate-spin" /> در حال بررسی فایل...</> : <><MessageCircle className="w-5 h-5" /> {canUse ? 'ارسال سؤال' : 'سقف مصرف تمام شده'}</>}</button>
        {messages.length > 0 && <div className="flex flex-wrap gap-2"><button onClick={() => downloadTranscript('txt')} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-300"><Download className="w-3.5 h-3.5" /> دانلود TXT</button><button onClick={() => downloadTranscript('md')} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-300"><Download className="w-3.5 h-3.5" /> دانلود Markdown</button></div>}
      </>}

      {file && mode === 'edit' && <>
        <textarea value={instruction} onChange={e => setInstruction(e.target.value)} placeholder="مثلاً: غلط‌های نگارشی را اصلاح کن.&#10;یا: در Excel ردیف‌ها را بر اساس مبلغ فروش از بیشترین به کمترین مرتب کن." rows={5} className="w-full px-4 py-3 rounded-2xl bg-slate-800/60 border border-slate-700/50 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-primary-500/50 resize-none text-sm leading-7" />
        <button type="button" onClick={() => void editFile()} disabled={!instruction.trim() || loading || !canUse} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold disabled:opacity-40">{loading ? <><Loader2 className="w-5 h-5 animate-spin" /> در حال ویرایش فایل...</> : <><FilePenLine className="w-5 h-5" /> {canUse ? 'اعمال تغییرات و ساخت فایل' : 'سقف مصرف تمام شده'}</>}</button>
        {downloadUrl && <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4"><p className="text-sm font-bold text-emerald-300 mb-1">فایل اصلاح‌شده آماده است ✅</p><p className="text-xs text-slate-400 mb-3 truncate">{outputName}</p><a href={downloadUrl} download={outputName} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/20 text-emerald-200 text-sm font-semibold"><Download className="w-4 h-4" /> دانلود فایل اصلاح‌شده</a></div>}
      </>}

      {error && <div className="px-4 py-3 rounded-xl bg-error-500/10 border border-error-500/20 text-error-400 text-sm flex gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
    </div>
  );
}
