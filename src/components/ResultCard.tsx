'use client';

import { useState } from 'react';
import { Copy, Check, Share2, Trash2, RotateCw } from 'lucide-react';
import type { GenerationResult } from '@/lib/generator';
import { getTemplate } from '@/lib/generator';

interface ResultCardProps {
  result: GenerationResult;
  onRegenerate: () => void;
  onDelete?: () => void;
  compact?: boolean;
}

export function ResultCard({ result, onRegenerate, onDelete, compact }: ResultCardProps) {
  const [copied, setCopied] = useState(false);
  const [shareError, setShareError] = useState(false);
  const tpl = getTemplate(result.templateId);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = result.text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ text: result.text, title: tpl?.label ?? 'نویسا' });
      } catch {
        // user cancelled
      }
    } else {
      setShareError(true);
      setTimeout(() => setShareError(false), 2500);
    }
  };

  const date = new Date(result.createdAt);
  const timeStr = date.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
  const dateStr = date.toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' });

  return (
    <div className={`bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden animate-scale-in ${compact ? '' : 'shadow-xl'}`}>
      {!compact && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800/80 border-b border-slate-700/50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-primary-300">{tpl?.label ?? 'متن'}</span>
            <span className="text-slate-600">·</span>
            <span className="text-[11px] text-slate-500">{result.topic.slice(0, 30)}{result.topic.length > 30 ? '...' : ''}</span>
          </div>
          <span className="text-[10px] text-slate-500">{dateStr} · {timeStr}</span>
        </div>
      )}
      <div className="p-4">
        <p className="text-slate-200 text-sm leading-7 whitespace-pre-wrap select-text" style={{ userSelect: 'text' }}>
          {result.text}
        </p>
      </div>
      <div className="flex items-center gap-1.5 px-3 pb-3">
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
            copied
              ? 'bg-success-500/20 text-success-400'
              : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
          }`}
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'کپی شد' : 'کپی'}
        </button>
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-slate-700/50 text-slate-300 hover:bg-slate-700 transition-all"
        >
          <Share2 className="w-3.5 h-3.5" />
          اشتراک
        </button>
        <button
          onClick={onRegenerate}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-slate-700/50 text-slate-300 hover:bg-slate-700 transition-all"
        >
          <RotateCw className="w-3.5 h-3.5" />
          بازتولید
        </button>
        {onDelete && (
          <button
            onClick={onDelete}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-error-400 hover:bg-error-500/10 transition-all mr-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {shareError && (
        <p className="px-4 pb-3 text-[11px] text-warning-500">اشتراک‌گذاری در این مرورگر پشتیبانی نمی‌شود. از دکمه کپی استفاده کنید.</p>
      )}
    </div>
  );
}
