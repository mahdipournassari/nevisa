'use client';

import Link from 'next/link';
import { AlertTriangle, CheckCircle2, Gauge, Sparkles } from 'lucide-react';
import type { SubscriptionInfo } from '@/lib/subscription-client';

interface UsageBarProps {
  subscription: SubscriptionInfo | null;
  loading?: boolean;
}

function UsageMeter({
  label,
  used,
  limit,
  remaining,
  percentage,
}: {
  label: string;
  used: number;
  limit: number;
  remaining: number;
  percentage: number;
}) {
  const pct = Math.min(100, Math.max(0, percentage));
  const barColor = pct >= 100 ? 'bg-error-500' : pct >= 80 ? 'bg-warning-500' : 'bg-primary-500';

  return (
    <div className="rounded-xl bg-slate-900/40 border border-slate-700/40 p-3">
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className="text-xs text-slate-300 font-medium">{label}</span>
        <span className="text-xs text-white font-bold tabular-nums">
          {used.toLocaleString('fa-IR')} / {limit.toLocaleString('fa-IR')}
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-700/70 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center justify-between mt-2 text-[11px]">
        <span className="text-slate-500">{pct.toLocaleString('fa-IR')}٪ مصرف شده</span>
        <span className={remaining === 0 ? 'text-error-400 font-medium' : 'text-slate-400'}>
          {remaining === 0
            ? 'سهمیه تمام شده'
            : `${remaining.toLocaleString('fa-IR')} درخواست باقی مانده`}
        </span>
      </div>
    </div>
  );
}

export function UsageBar({ subscription, loading }: UsageBarProps) {
  if (loading) {
    return (
      <div className="rounded-2xl bg-slate-800/50 border border-slate-700/60 p-4 animate-pulse">
        <div className="h-5 bg-slate-700/60 rounded w-1/3 mb-4" />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="h-24 bg-slate-700/40 rounded-xl" />
          <div className="h-24 bg-slate-700/40 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="rounded-2xl bg-error-500/5 border border-error-500/20 p-4">
        <div className="flex items-center gap-2 text-sm text-error-300">
          <AlertTriangle className="w-4 h-4" />
          <span>اطلاعات مصرف در دسترس نیست. صفحه را دوباره بارگذاری کنید.</span>
        </div>
      </div>
    );
  }

  const { plan, planName, usage, limits, remaining, percentages, canGenerate, model } = subscription;
  const totalRemaining = Math.min(remaining.daily, remaining.monthly);

  return (
    <section className="rounded-2xl bg-slate-800/50 border border-slate-700/60 p-4 shadow-lg shadow-black/5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary-500/15 flex items-center justify-center">
            <Gauge className="w-4.5 h-4.5 text-primary-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">میزان استفاده</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-300 border border-primary-500/20">
                پلن {planName}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">مدل: {model}</p>
          </div>
        </div>
        <Link
          href="/pricing"
          className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-primary-500/15 text-primary-300 border border-primary-500/25 hover:bg-primary-500/25 transition-colors"
        >
          {plan === 'free' ? 'ارتقا' : 'تمدید'}
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <UsageMeter
          label="مصرف امروز"
          used={usage.daily}
          limit={limits.daily}
          remaining={remaining.daily}
          percentage={percentages.daily}
        />
        <UsageMeter
          label="مصرف این ماه"
          used={usage.monthly}
          limit={limits.monthly}
          remaining={remaining.monthly}
          percentage={percentages.monthly}
        />
      </div>

      <div className="flex items-center justify-between gap-3 mt-3 px-1 text-[11px]">
        <div className="flex items-center gap-1.5">
          {canGenerate ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-3.5 h-3.5 text-error-400" />
          )}
          <span className={canGenerate ? 'text-slate-400' : 'text-error-400'}>
            {canGenerate
              ? `${totalRemaining.toLocaleString('fa-IR')} درخواست قابل استفاده باقی مانده`
              : subscription.limitReason === 'daily'
                ? 'سقف روزانه تمام شده است'
                : 'سقف ماهانه تمام شده است'}
          </span>
        </div>

        {subscription.currentPeriodEnd && plan !== 'free' && (
          <span className="text-slate-500">
            اعتبار تا {new Date(subscription.currentPeriodEnd).toLocaleDateString('fa-IR')}
          </span>
        )}
      </div>

      {!canGenerate && (
        <div className="flex items-start gap-2 mt-3 px-3 py-2.5 rounded-xl bg-error-500/10 border border-error-500/20">
          <AlertTriangle className="w-4 h-4 text-error-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs text-error-300 leading-relaxed">
              برای ادامه تولید محتوا باید پلن خود را ارتقا یا تمدید کنید.
            </p>
            <Link href="/pricing" className="text-xs text-primary-400 font-semibold mt-1 inline-block hover:underline">
              مشاهده پلن‌ها ←
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
