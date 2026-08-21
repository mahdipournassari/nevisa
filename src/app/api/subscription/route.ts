import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { createServerClient, getAuthenticatedUser } from '@/lib/server';
import {
  checkUsageLimit,
  ensureUserProfile,
  getEffectivePlan,
  getUserProfile,
} from '@/lib/subscription';
import { getPlanLimits, getDynamicPlan } from '@/lib/plan-limits';
import { PLANS } from '@/lib/plans';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(req);
    if (authError || !user) {
      return NextResponse.json({ error: authError }, { status: 401 });
    }

    const profile = await ensureUserProfile(user.id);
    const effectivePlan = getEffectivePlan(profile);
    const plan = await getDynamicPlan(effectivePlan);
    const limits = await getPlanLimits();
    const check = await checkUsageLimit(user.id);
    const usage = check.usage;

    return NextResponse.json({
      plan: effectivePlan,
      planName: plan.name,
      usage,
      remaining: {
        daily: Math.max(0, plan.dailyLimit - usage.daily),
        monthly: Math.max(0, plan.monthlyLimit - usage.monthly),
      },
      percentages: {
        daily: plan.dailyLimit > 0 ? Math.min(100, Math.round((usage.daily / plan.dailyLimit) * 100)) : 0,
        monthly: plan.monthlyLimit > 0 ? Math.min(100, Math.round((usage.monthly / plan.monthlyLimit) * 100)) : 0,
      },
      limits: {
        daily: plan.dailyLimit,
        monthly: plan.monthlyLimit,
      },
      model: plan.modelLabel,
      canGenerate: check.allowed,
      limitReason: check.limitReason,
      subscriptionStatus: profile.subscription_status,
      currentPeriodEnd: profile.current_period_end,
      plans: Object.values(PLANS).map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        priceLabel: p.priceLabel,
        dailyLimit: limits[p.id].dailyLimit,
        monthlyLimit: limits[p.id].monthlyLimit,
        modelLabel: p.modelLabel,
      })),
    }, { headers: { 'Cache-Control': 'private, no-store, max-age=0' } });
  } catch (err) {
    console.error('Subscription error:', err);
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 });
  }
}
