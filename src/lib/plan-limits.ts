import { createServerClient } from './server';
import { PLANS, type PlanId, type PlanConfig } from './plans';

export type { PlanId, PlanConfig };

export type PlanLimits = Record<PlanId, { dailyLimit: number; monthlyLimit: number }>;

export async function getPlanLimits(): Promise<PlanLimits> {
  const supabase = createServerClient();
  const result = Object.fromEntries(
    Object.values(PLANS).map((p) => [p.id, { dailyLimit: p.dailyLimit, monthlyLimit: p.monthlyLimit }])
  ) as PlanLimits;
  const { data, error } = await supabase.from('plan_limits').select('plan, daily_limit, monthly_limit');
  if (error) { console.error('getPlanLimits error:', error.message); return result; }
  for (const row of data ?? []) {
    if (row.plan in result) result[row.plan as PlanId] = { dailyLimit: Number(row.daily_limit), monthlyLimit: Number(row.monthly_limit) };
  }
  return result;
}

export async function getDynamicPlan(planId: PlanId): Promise<PlanConfig> {
  const limits = await getPlanLimits();
  return { ...PLANS[planId], ...limits[planId] };
}
