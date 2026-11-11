'use client';

import { useMemo, useState } from 'react';
import { AlertCircle, Download, FileSearch, Loader2, MessageCircle, Upload, X } from 'lucide-react';

interface FileChatProps { authToken?: string | null; onUsageChanged?: () => void; canChat?: boolean; }
type Message = { role: 'user' | 'assistant'; text: string };

export function FileChat({ authToken, onUsageChanged, canChat = true }: FileChatProps) {
  const [file, setFile] = useState<File | null>(null);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const transcript = useMemo(() => messages.map((m) => `${m.role === 'user' ? 'کاربر' : 'نویسا'}:\n${m.text}`).join('\n\n'), [messages]);

  const send = async () => {
    if (!file || !question.trim() || loading || !canChat) return;
    const q = question.trim();
    setLoading(true); setError(null); setQuestion('');
    try {
      const formData = new FormData();
      formData.append('file', file); formData.append('question', q);
      const headers: Record<string, string> = {}; if (authToken) headers.Authorization = `Bearer ${authToken}`;
      const response = await fetch('/api/chat-file', { method: 'POST', headers, body: formData });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) { setError(body?.error ?? 'پاسخ‌گویی ناموفق بود.'); setQuestion(q); return; }
      setMessages((prev) => [...prev, { role: 'user', text: q }, { role: 'assistant', text: body.answer ?? '' }]);
      onUsageChanged?.();
    } catch { setError('ارتباط با سرور برقرار نشد.'); setQuestion(q); }
    finally { setLoading(false); }
  };

  const download = (ext: 'txt' | 'md') => {
    if (!transcript) return;
    const blob = new Blob([transcript], { type: ext === 'md' ? 'text/markdown;charset=utf-8' : 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = `nevissaa-chat-${Date.now()}.${ext}`; a.click(); URL.revokeObjectURL(url);
  };

  return <div className="space-y-5">
    <div className="text-center">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 mb-3"><MessageCircle className="w-3.5 h-3.5 text-primary-400" /><span className="text-xs text-primary-300 font-medium">چت با فایل</span></div>
      <h2 className="text-xl font-bold text-white mb-1.5">با فایل خود گفتگو کنید</h2>
      <p className="text-sm text-slate-400 leading-relaxed">فایل دائمی ذخیره نمی‌شود؛ برای هر سؤال، فایل به‌صورت موقت پردازش می‌شود.</p>
    </div>

    <label className="block cursor-pointer"><input type="file" className="hidden" accept=".pdf,.docx,.xlsx,.xls,.csv,.txt,.json" onChange={(e) => { setFile(e.target.files?.[0] ?? null); setMessages([]); setError(null); }} />
      <div className="min-h-28 rounded-2xl border border-dashed border-slate-700 bg-slate-800/40 hover:bg-slate-800/70 flex flex-col items-center justify-center gap-2"><Upload className="w-6 h-6 text-primary-400" /><span className="text-sm font-semibold text-slate-200">فایل را انتخاب کنید</span><span className="text-xs text-slate-500">حداکثر ۱۰ مگابایت</span></div>
    </label>

    {file && <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-800/60 border border-slate-700/50 px-3 py-2.5"><div className="min-w-0"><p className="text-sm text-slate-200 truncate">{file.name}</p><p className="text-[11px] text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p></div><button type="button" onClick={() => { setFile(null); setMessages([]); }} className="p-2 text-slate-500 hover:text-slate-200"><X className="w-4 h-4" /></button></div>}

    {messages.length > 0 && <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">{messages.map((m, i) => <div key={i} className={`rounded-2xl p-4 ${m.role === 'user' ? 'bg-primary-500/10 border border-primary-500/20 mr-5' : 'bg-slate-800/60 border border-slate-700/50 ml-5'}`}><p className="text-[11px] font-bold text-slate-500 mb-1">{m.role === 'user' ? 'شما' : 'نویسا'}</p><div className="whitespace-pre-wrap text-sm leading-7 text-slate-300">{m.text}</div></div>)}</div>}

    <textarea value={question} onChange={(e) => setQuestion(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) void send(); }} placeholder="مثلاً: فروش سه ماه اول را مقایسه کن..." rows={4} className="w-full px-4 py-3 rounded-2xl bg-slate-800/60 border border-slate-700/50 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-primary-500/50 resize-none text-sm leading-6" />
    <button type="button" onClick={() => void send()} disabled={!file || !question.trim() || loading || !canChat} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold disabled:opacity-40">{loading ? <><Loader2 className="w-5 h-5 animate-spin" /> در حال بررسی فایل...</> : <><FileSearch className="w-5 h-5" /> {canChat ? 'ارسال سؤال' : 'سقف مصرف تمام شده'}</>}</button>

    {error && <div className="px-4 py-3 rounded-xl bg-error-500/10 border border-error-500/20 text-error-400 text-sm flex gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
    {messages.length > 0 && <div className="flex flex-wrap gap-2"><button onClick={() => download('txt')} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-300 hover:text-white"><Download className="w-3.5 h-3.5" /> دانلود TXT</button><button onClick={() => download('md')} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-300 hover:text-white"><Download className="w-3.5 h-3.5" /> دانلود Markdown</button></div>}
  </div>;
}
