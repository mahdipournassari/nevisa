'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Check, Loader2, Sparkles, ArrowLeft, RefreshCw } from 'lucide-react';
import { PLANS, type PlanId } from '@/lib/plans';
import { useAuth } from '@/lib/auth';
import { fetchSubscription, startCheckout, type SubscriptionInfo } from '@/lib/subscription-client';

const planOrder: PlanId[] = ['free', 'pro', 'business'];

export function PricingContent() {
  const { session } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<PlanId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [remotePlans, setRemotePlans] = useState<typeof PLANS | null>(null);

  useEffect(() => {
    if (session?.access_token) fetchSubscription(session.access_token).then(setSubscription);
    fetch('/api/plans', { cache: 'no-store' }).then((r) => r.ok ? r.json() : null).then((data) => {
      if (data?.plans) setRemotePlans(Object.fromEntries(data.plans.map((p: (typeof PLANS)[PlanId]) => [p.id, p])) as typeof PLANS);
    }).catch(() => undefined);
  }, [session]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get('payment');
    if (payment === 'success') {
      setError(null);
    } else if (payment === 'cancelled') {
      setError('پرداخت لغو شد.');
    } else if (payment === 'failed') {
      setError('پرداخت ناموفق بود. دوباره تلاش کنید.');
    } else if (payment === 'error') {
      setError('خطا در فعال‌سازی اشتراک. با پشتیبانی تماس بگیرید.');
    }
  }, []);

  const handleSubscribe = async (planId: PlanId) => {
    if (planId === 'free') {
      window.location.href = '/app';
      return;
    }

    if (!session) {
      window.location.href = '/app';
      return;
    }

    setLoadingPlan(planId);
    setError(null);
    try {
      const url = await startCheckout(planId, session.access_token);
      if (url) window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در پرداخت');
      setLoadingPlan(null);
    }
  };

  const currentPlan = subscription?.plan ?? 'free';
  const periodEnd = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString('fa-IR')
    : null;

  return (
    <div className="space-y-10">
      <section className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 mb-4">
          <Sparkles className="w-4 h-4 text-primary-400" />
          <span className="text-xs text-primary-300 font-medium">پلن‌های اشتراک</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">پلن مناسب خود را انتخاب کنید</h1>
        <p className="text-sm text-slate-400 leading-relaxed">
          پلن رایگان برای شروع کافی است. با ارتقا، محدودیت بیشتر، مدل قوی‌تر و اولویت پردازش دریافت می‌کنید.
        </p>
      </section>

      {session && currentPlan !== 'free' && periodEnd && (
        <div className="max-w-3xl mx-auto px-4 py-3 rounded-xl bg-primary-500/10 border border-primary-500/20 text-center">
          <p className="text-sm text-primary-300">
            اشتراک فعلی: <strong>{PLANS[currentPlan].name}</strong> — اعتبار تا {periodEnd}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            برای تمدید، همان پلن یا پلن بالاتر را دوباره خریداری کنید.
          </p>
        </div>
      )}

      <section className="max-w-3xl mx-auto p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
        <h2 className="text-sm font-semibold text-white mb-2">چرا پلن‌های گران‌تر کیفیت بالاتری دارند؟</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          <strong className="text-slate-300">پلن بیزینس</strong> از قدرتمندترین مدل هوش مصنوعی (
          <span className="text-primary-300">Gemini Pro</span>
          ) برای تولید محتوای دقیق‌تر، حرفه‌ای‌تر و پیچیده‌تر استفاده می‌کند. پلن پرو از{' '}
          <span className="text-primary-300">Gemini Flash</span> با اولویت پردازش بهره می‌برد و پلن رایگان از مدل
          سبک‌تر <span className="text-primary-300">Flash Lite</span> برای مصرف روزمره استفاده می‌کند.
        </p>
      </section>

      {error && (
        <div className="max-w-3xl mx-auto px-4 py-3 rounded-xl bg-error-500/10 border border-error-500/20 text-error-400 text-sm text-center">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
        {planOrder.map((planId) => {
          const plan = remotePlans?.[planId] ?? PLANS[planId];
          const isHighlighted = plan.highlighted;
          const isCurrent = currentPlan === planId;

          return (
            <div
              key={planId}
              className={`relative flex flex-col rounded-3xl p-5 border transition-all ${
                isHighlighted
                  ? 'bg-gradient-to-b from-primary-500/10 to-slate-800/60 border-primary-500/40 shadow-lg shadow-primary-500/10 scale-[1.02]'
                  : 'bg-slate-800/40 border-slate-700/50'
              }`}
            >
              {isHighlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary-500 text-white text-[10px] font-bold">
                  محبوب‌ترین
                </span>
              )}
              {isCurrent && planId !== 'free' && (
                <span className="absolute -top-3 right-4 px-2 py-0.5 rounded-full bg-success-500/20 text-success-400 text-[10px] font-bold border border-success-500/30">
                  پلن فعلی
                </span>
              )}

              <div className="mb-4">
                <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                <p className="text-xl font-bold text-white mt-1">{plan.priceLabel}</p>
                <p className="text-[11px] text-slate-500 mt-1">{plan.modelLabel}</p>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed mb-4 min-h-[40px]">{plan.modelDescription}</p>

              <ul className="space-y-2 mb-5 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-slate-300">
                    <Check className="w-3.5 h-3.5 text-success-400 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              {planId === 'free' ? (
                <Link
                  href="/app"
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-700/60 text-slate-200 text-sm font-semibold hover:bg-slate-700 transition-colors"
                >
                  شروع رایگان
                  <ArrowLeft className="w-4 h-4" />
                </Link>
              ) : (
                <button
                  onClick={() => handleSubscribe(planId)}
                  disabled={loadingPlan !== null}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50 ${
                    isHighlighted
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50'
                      : 'bg-slate-700/60 text-white hover:bg-slate-700'
                  }`}
                >
                  {loadingPlan === planId ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isCurrent ? (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      تمدید {plan.name}
                    </>
                  ) : (
                    <>خرید {plan.name}</>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <section className="max-w-2xl mx-auto text-center text-[11px] text-slate-600 leading-relaxed">
        <p>
          پلن رایگان: سقف روزانه و ماهانه مطابق تنظیمات فعلی سیستم است. پس از رسیدن به سقف، برای ادامه باید اشتراک
          تهیه کنید. پرداخت‌ها از طریق درگاه امن <strong className="text-slate-500">زرین‌پال</strong> و به ریال انجام
          می‌شود.
        </p>
      </section>
    </div>
  );
}
