'use client';

import { History, Trash2, ChevronLeft } from 'lucide-react';
import type { GenerationResult } from '@/lib/generator';
import { getTemplate } from '@/lib/generator';
import { ResultCard } from './ResultCard';

interface HistoryPanelProps {
  items: GenerationResult[];
  onRegenerate: (item: GenerationResult) => void;
  onDelete: (createdAt: number) => void;
  onClear: () => void;
  onClose: () => void;
}

export function HistoryPanel({ items, onRegenerate, onDelete, onClear, onClose }: HistoryPanelProps) {
  return (
    <div className="fixed inset-0 z-40 flex justify-start animate-fade-in">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md h-full bg-slate-900 border-l border-slate-800 flex flex-col animate-slide-up">
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary-400" />
            <h2 className="text-base font-bold text-white">تاریخچه</h2>
            <span className="text-xs text-slate-500">({items.length})</span>
          </div>
          <div className="flex items-center gap-1">
            {items.length > 0 && (
              <button
                onClick={onClear}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-error-400 hover:bg-error-500/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                پاک کردن
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/60 flex items-center justify-center mb-3">
                <History className="w-7 h-7 text-slate-600" />
              </div>
              <p className="text-sm text-slate-400 font-medium">هنوز متنی تولید نکرده‌اید</p>
              <p className="text-xs text-slate-500 mt-1">متن‌های تولید شده اینجا ذخیره می‌شوند</p>
            </div>
          ) : (
            items.map((item) => (
              <ResultCard
                key={item.createdAt}
                result={item}
                onRegenerate={() => onRegenerate(item)}
                onDelete={() => onDelete(item.createdAt)}
                compact
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export function getTemplateLabel(templateId: string): string {
  return getTemplate(templateId)?.label ?? 'متن';
}
