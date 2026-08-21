import type { PlanId } from './plans';

export interface SubscriptionInfo {
  plan: PlanId;
  planName: string;
  usage: { daily: number; monthly: number };
  remaining: { daily: number; monthly: number };
  percentages: { daily: number; monthly: number };
  limits: { daily: number; monthly: number };
  model: string;
  canGenerate: boolean;
  limitReason: 'daily' | 'monthly' | null;
  subscriptionStatus: string | null;
  currentPeriodEnd: string | null;
}

export async function fetchSubscription(authToken: string): Promise<SubscriptionInfo | null> {
  try {
    const response = await fetch('/api/subscription', {
      cache: 'no-store',
      headers: { Authorization: `Bearer ${authToken}`, 'Cache-Control': 'no-cache' },
    });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

export async function startCheckout(plan: 'pro' | 'business', authToken: string): Promise<string | null> {
  const response = await fetch('/api/billing/checkout', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ plan }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? 'خطا در پرداخت');
  return data.url ?? null;
}
