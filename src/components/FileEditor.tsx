'use client';

import { useState } from 'react';
import { AlertCircle, Download, FilePenLine, Loader2, Upload, X } from 'lucide-react';

interface FileEditorProps { authToken?: string | null; onUsageChanged?: () => void; canEdit?: boolean; }

export function FileEditor({ authToken, onUsageChanged, canEdit = true }: FileEditorProps) {
  const [file, setFile] = useState<File | null>(null);
  const [instruction, setInstruction] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [outputName, setOutputName] = useState('');

  const edit = async () => {
    if (!file || !instruction.trim() || loading || !canEdit) return;
    setLoading(true); setError(null); if (downloadUrl) URL.revokeObjectURL(downloadUrl); setDownloadUrl(null);
    try {
      const form = new FormData(); form.append('file', file); form.append('instruction', instruction.trim());
      const headers: Record<string, string> = {}; if (authToken) headers.Authorization = `Bearer ${authToken}`;
      const res = await fetch('/api/edit-file', { method: 'POST', headers, body: form });
      if (!res.ok) { const body = await res.json().catch(() => ({})); throw new Error(body?.error ?? 'ویرایش فایل ناموفق بود.'); }
      const blob = await res.blob(); const url = URL.createObjectURL(blob); const disposition = res.headers.get('Content-Disposition') ?? '';
      const match = disposition.match(/filename\*=UTF-8''([^;]+)/i); const name = match ? decodeURIComponent(match[1]) : `${file.name.replace(/\.[^.]+$/, '')}_edited${file.name.match(/\.[^.]+$/)?.[0] ?? ''}`;
      setDownloadUrl(url); setOutputName(name); onUsageChanged?.();
    } catch (e) { setError(e instanceof Error ? e.message : 'ارتباط با سرور برقرار نشد.'); }
    finally { setLoading(false); }
  };

  return <div className="space-y-5">
    <div className="text-center"><div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 mb-3"><FilePenLine className="w-3.5 h-3.5 text-primary-400" /><span className="text-xs text-primary-300 font-medium">ویرایش فایل با هوش مصنوعی</span></div><h2 className="text-xl font-bold text-white mb-1.5">فایل را بدهید، تغییرات را انجام می‌دهیم</h2><p className="text-sm text-slate-400 leading-relaxed">نسخه اصلی دائمی ذخیره نمی‌شود. فایل اصلاح‌شده برای دانلود ساخته می‌شود.</p></div>
    <label className="block cursor-pointer"><input type="file" className="hidden" accept=".pdf,.docx,.xlsx,.xls,.csv,.txt,.json" onChange={e => { setFile(e.target.files?.[0] ?? null); setError(null); setDownloadUrl(null); }} /><div className="min-h-28 rounded-2xl border border-dashed border-slate-700 bg-slate-800/40 hover:bg-slate-800/70 flex flex-col items-center justify-center gap-2"><Upload className="w-6 h-6 text-primary-400" /><span className="text-sm font-semibold text-slate-200">فایل را انتخاب کنید</span><span className="text-xs text-slate-500">TXT, CSV, JSON, Word و Excel — حداکثر ۱۰ مگابایت</span></div></label>
    {file && <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-800/60 border border-slate-700/50 px-3 py-2.5"><div className="min-w-0"><p className="text-sm text-slate-200 truncate">{file.name}</p><p className="text-[11px] text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p></div><button type="button" onClick={() => setFile(null)} className="p-2 text-slate-500 hover:text-slate-200"><X className="w-4 h-4" /></button></div>}
    <textarea value={instruction} onChange={e => setInstruction(e.target.value)} placeholder="مثلاً: غلط‌های نگارشی را اصلاح کن و نسخه تمیز را تحویل بده.&#10;یا: در Excel ردیف‌ها را بر اساس مبلغ فروش از بیشترین به کمترین مرتب کن." rows={5} className="w-full px-4 py-3 rounded-2xl bg-slate-800/60 border border-slate-700/50 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-primary-500/50 resize-none text-sm leading-7" />
    <button type="button" onClick={() => void edit()} disabled={!file || !instruction.trim() || loading || !canEdit} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold disabled:opacity-40">{loading ? <><Loader2 className="w-5 h-5 animate-spin" /> در حال ویرایش فایل...</> : <><FilePenLine className="w-5 h-5" /> {canEdit ? 'اعمال تغییرات و ساخت فایل' : 'سقف مصرف تمام شده'}</>}</button>
    {error && <div className="px-4 py-3 rounded-xl bg-error-500/10 border border-error-500/20 text-error-400 text-sm flex gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
    {downloadUrl && <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4"><p className="text-sm font-bold text-emerald-300 mb-1">فایل اصلاح‌شده آماده است ✅</p><p className="text-xs text-slate-400 mb-3 truncate">{outputName}</p><a href={downloadUrl} download={outputName} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30 text-sm font-semibold"><Download className="w-4 h-4" /> دانلود فایل اصلاح‌شده</a></div>}
  </div>;
}
