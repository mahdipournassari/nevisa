'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Wand2, Lightbulb, Loader2, AlertCircle } from 'lucide-react';
import {
  TEMPLATES,
  generateContentAI,
  type Tone,
  type Length,
  type GenerationResult,
} from '@/lib/generator';
import { TemplateSelector } from './TemplateSelector';
import { ToneSelector } from './OptionChips';
import { LengthSelector } from './OptionChips';
import { ResultCard } from './ResultCard';
import { useAuth } from '@/lib/auth';

interface GeneratorProps {
  onGenerated: (result: GenerationResult) => void;
  regenerateItem?: GenerationResult | null;
  onRegenerateConsumed?: () => void;
  onUsageChanged?: () => void;
  canGenerate?: boolean;
}

export function Generator({
  onGenerated,
  regenerateItem,
  onRegenerateConsumed,
  onUsageChanged,
  canGenerate = true,
}: GeneratorProps) {
  const { session } = useAuth();
  const [templateId, setTemplateId] = useState(TEMPLATES[0].id);
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState<Tone>('motivational');
  const [length, setLength] = useState<Length>('medium');
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limitExceeded, setLimitExceeded] = useState(false);

  const template = TEMPLATES.find((t) => t.id === templateId)!;

  useEffect(() => {
    if (!regenerateItem) return;
    setTemplateId(regenerateItem.templateId);
    setTopic(regenerateItem.topic);
    setTone(regenerateItem.tone);
    setLength(regenerateItem.length);
    runGeneration(
      regenerateItem.templateId,
      regenerateItem.topic,
      regenerateItem.tone,
      regenerateItem.length
    );
    onRegenerateConsumed?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regenerateItem]);

  const runGeneration = async (tId: string, tpc: string, tn: Tone, ln: Length) => {
    setLoading(true);
    setResult(null);
    setError(null);
    setLimitExceeded(false);

    const token = session?.access_token ?? null;
    const { result: aiResult, error: aiError, limitExceeded: limited } =
      await generateContentAI(tId, tpc, tn, ln, token);

    if (aiError || !aiResult) {
      setError(aiError ?? 'خطایی رخ داد');
      setLimitExceeded(!!limited);
      setLoading(false);
      return;
    }

    setResult(aiResult);
    onGenerated(aiResult);
    onUsageChanged?.();
    setLoading(false);
  };

  const handleGenerate = async () => {
    if (!topic.trim() || loading || !canGenerate) return;
    await runGeneration(templateId, topic.trim(), tone, length);
  };

  const handleRegenerate = async () => {
    if (!topic.trim() && !regenerateItem) return;
    const tId = regenerateItem?.templateId ?? templateId;
    const tpc = regenerateItem?.topic ?? topic.trim();
    const tn = regenerateItem?.tone ?? tone;
    const ln = regenerateItem?.length ?? length;
    await runGeneration(tId, tpc, tn, ln);
  };

  const useExample = (ex: string) => {
    setTopic(ex);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-sm font-semibold text-slate-300 mb-2.5">نوع متن را انتخاب کنید</h2>
        <TemplateSelector templates={TEMPLATES} selectedId={templateId} onSelect={setTemplateId} />
      </div>

      <div>
        <label className="text-sm font-semibold text-slate-300 mb-2 block">{template.inputLabel}</label>
        <textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder={template.inputPlaceholder}
          rows={3}
          className="w-full px-4 py-3 rounded-2xl bg-slate-800/60 border border-slate-700/50 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 transition-all resize-none text-sm leading-6"
        />
        <div className="flex flex-wrap gap-1.5 mt-2">
          <div className="flex items-center gap-1 text-[11px] text-slate-500 ml-1">
            <Lightbulb className="w-3 h-3" />
            مثال:
          </div>
          {template.examples.map((ex, i) => (
            <button
              key={i}
              onClick={() => useExample(ex)}
              className="text-[11px] px-2 py-1 rounded-lg bg-slate-800/60 text-slate-400 border border-slate-700/40 hover:bg-slate-700/60 hover:text-slate-200 transition-colors"
            >
              {ex.length > 35 ? ex.slice(0, 35) + '...' : ex}
            </button>
          ))}
        </div>
      </div>

      <ToneSelector selected={tone} onSelect={setTone} />
      <LengthSelector selected={length} onSelect={setLength} />

      <button
        onClick={handleGenerate}
        disabled={!topic.trim() || loading || !canGenerate}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold text-base shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40 disabled:scale-100 disabled:shadow-none"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2.5} />
            در حال تولید...
          </>
        ) : (
          <>
            <Wand2 className="w-5 h-5" strokeWidth={2.5} />
            {canGenerate ? 'تولید متن' : 'سقف مصرف تمام شده'}
          </>
        )}
      </button>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-error-500/10 border border-error-500/20 text-error-400 text-sm animate-scale-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
          {limitExceeded && (
            <Link
              href="/pricing"
              className="inline-block mt-2 text-xs font-semibold text-primary-400 hover:underline"
            >
              مشاهده پلن‌ها و خرید اشتراک ←
            </Link>
          )}
        </div>
      )}


      {loading && (
        <div className="space-y-2.5">
          <div className="h-4 rounded-lg shimmer-bg" />
          <div className="h-4 rounded-lg shimmer-bg w-5/6" />
          <div className="h-4 rounded-lg shimmer-bg w-4/6" />
          <div className="h-4 rounded-lg shimmer-bg w-3/4" />
        </div>
      )}

      {result && !loading && (
        <ResultCard result={result} onRegenerate={handleRegenerate} />
      )}
    </div>
  );
}
