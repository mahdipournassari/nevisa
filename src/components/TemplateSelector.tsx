'use client';

import {
  Camera,
  Megaphone,
  Mail,
  FileText,
  Sparkles,
  PenLine,
  Feather,
  type LucideIcon,
} from 'lucide-react';
import type { TemplateConfig } from '@/lib/generator';

const ICONS: Record<string, LucideIcon> = {
  Camera,
  Megaphone,
  Mail,
  FileText,
  Sparkles,
  PenLine,
  Feather,
};

interface TemplateSelectorProps {
  templates: TemplateConfig[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function TemplateSelector({ templates, selectedId, onSelect }: TemplateSelectorProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
      {templates.map((tpl) => {
        const Icon = ICONS[tpl.icon] ?? Sparkles;
        const active = tpl.id === selectedId;
        return (
          <button
            key={tpl.id}
            onClick={() => onSelect(tpl.id)}
            className={`group relative p-3 rounded-2xl border text-right transition-all duration-200 ${
              active
                ? 'bg-primary-500/15 border-primary-500/50 shadow-lg shadow-primary-500/10'
                : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/70 hover:border-slate-600'
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 transition-colors ${
                active ? 'bg-primary-500 text-white' : 'bg-slate-700/60 text-slate-300 group-hover:text-white'
              }`}
            >
              <Icon className="w-4.5 h-4.5" strokeWidth={2} />
            </div>
            <p className={`text-sm font-semibold mb-0.5 ${active ? 'text-primary-300' : 'text-slate-200'}`}>
              {tpl.label}
            </p>
            <p className="text-[10px] text-slate-500 leading-snug line-clamp-2">{tpl.description}</p>
            {active && (
              <span className="absolute top-2 left-2 w-2 h-2 rounded-full bg-primary-400 animate-pulse" />
            )}
          </button>
        );
      })}
    </div>
  );
}
