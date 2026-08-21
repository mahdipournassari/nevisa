import { createServerClient } from './server';
import { getDynamicPlan, type PlanId, type PlanConfig } from './plan-limits';

export interface UserProfile {
  user_id: string;
  plan: PlanId;
  zarinpal_ref_id: string | null;
  subscription_status: string | null;
  current_period_end: string | null;
}

export interface PaymentTransaction {
  id: string;
  user_id: string;
  plan: PlanId;
  amount: number;
  authority: string;
  ref_id: string | null;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  verified_at?: string | null;
}

export interface UsageStats {
  daily: number;
  monthly: number;
}

export interface UsageCheckResult {
  allowed: boolean;
  plan: PlanConfig;
  usage: UsageStats;
  limitReason: 'daily' | 'monthly' | null;
}

function startOfDayUTC(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

function startOfMonthUTC(): string {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function ensureUserProfile(userId: string): Promise<UserProfile> {
  const supabase = createServerClient();

  const { data: existing } = await supabase
    .from('user_profiles')
    .select('user_id, plan, zarinpal_ref_id, subscription_status, current_period_end')
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) return existing as UserProfile;

  const { data: created, error } = await supabase
    .from('user_profiles')
    .upsert({ user_id: userId, plan: 'free' }, { onConflict: 'user_id', ignoreDuplicates: true })
    .select('user_id, plan, zarinpal_ref_id, subscription_status, current_period_end')
    .maybeSingle();

  if (created) return created as UserProfile;
  if (error) console.error('ensureUserProfile error:', error.message);

  return {
    user_id: userId,
    plan: 'free',
    zarinpal_ref_id: null,
    subscription_status: 'active',
    current_period_end: null,
  };
}

export async function getUserProfile(userId: string): Promise<UserProfile> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from('user_profiles')
    .select('user_id, plan, zarinpal_ref_id, subscription_status, current_period_end')
    .eq('user_id', userId)
    .maybeSingle();

  if (data) return data as UserProfile;
  return ensureUserProfile(userId);
}

export async function getUsageStats(userId: string): Promise<UsageStats> {
  const supabase = createServerClient();
  const dayStart = startOfDayUTC();
  const monthStart = startOfMonthUTC();

  // Usage is based on the immutable generation reservation audit trail,
  // not on user_generations. Deleting a History item must never restore quota.
  const [{ count: daily }, { count: monthly }] = await Promise.all([
    supabase
      .from('generation_reservations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .in('status', ['completed', 'reserved'])
      .gte('created_at', dayStart),
    supabase
      .from('generation_reservations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .in('status', ['completed', 'reserved'])
      .gte('created_at', monthStart),
  ]);

  return { daily: daily ?? 0, monthly: monthly ?? 0 };
}

export async function checkUsageLimit(userId: string): Promise<UsageCheckResult> {
  const profile = await getUserProfile(userId);
  const plan = await getDynamicPlan(getEffectivePlan(profile));
  const usage = await getUsageStats(userId);

  let limitReason: 'daily' | 'monthly' | null = null;
  if (usage.daily >= plan.dailyLimit) limitReason = 'daily';
  else if (usage.monthly >= plan.monthlyLimit) limitReason = 'monthly';

  return { allowed: limitReason === null, plan, usage, limitReason };
}

export function getEffectivePlan(profile: UserProfile): PlanId {
  if (profile.plan === 'free') return 'free';
  if (profile.subscription_status && !['active', 'trialing'].includes(profile.subscription_status)) {
    return 'free';
  }
  if (!profile.current_period_end || new Date(profile.current_period_end) < new Date()) return 'free';
  return profile.plan;
}

export async function reserveGenerationSlot(
  userId: string,
  dailyLimit: number,
  monthlyLimit: number
): Promise<{ reservationId: string | null; limitReason: 'daily' | 'monthly' | null }> {
  const supabase = createServerClient();
  const { data, error } = await supabase.rpc('reserve_generation_slot', {
    p_user_id: userId,
    p_daily_limit: dailyLimit,
    p_monthly_limit: monthlyLimit,
  });

  if (error) {
    console.error('reserveGenerationSlot error:', error.message);
    throw new Error('USAGE_RESERVATION_FAILED');
  }

  const result = data?.[0] as { reservation_id: string | null; limit_reason: 'daily' | 'monthly' | null } | undefined;
  return {
    reservationId: result?.reservation_id ?? null,
    limitReason: result?.limit_reason ?? null,
  };
}

export async function releaseGenerationSlot(reservationId: string): Promise<void> {
  const supabase = createServerClient();
  const { error } = await supabase.rpc('release_generation_slot', { p_reservation_id: reservationId });
  if (error) console.error('releaseGenerationSlot error:', error.message);
}

export async function finalizeGenerationSlot(reservationId: string): Promise<void> {
  const supabase = createServerClient();
  const { error } = await supabase.rpc('finalize_generation_slot', { p_reservation_id: reservationId });
  if (error) console.error('finalizeGenerationSlot error:', error.message);
}

export async function createPendingPayment(
  userId: string,
  plan: PlanId,
  amount: number,
  authority: string
): Promise<PaymentTransaction | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('payment_transactions')
    .insert({ user_id: userId, plan, amount, authority, status: 'pending' })
    .select('*')
    .single();

  if (error) {
    console.error('createPendingPayment error:', error.message);
    return null;
  }
  return data as PaymentTransaction;
}

export async function getPaymentByAuthority(authority: string): Promise<PaymentTransaction | null> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from('payment_transactions')
    .select('*')
    .eq('authority', authority)
    .maybeSingle();
  return (data as PaymentTransaction) ?? null;
}

export async function activateSubscription(
  userId: string,
  plan: PlanId,
  refId: string,
  authority: string
): Promise<boolean> {
  const supabase = createServerClient();
  const now = new Date().toISOString();

  // A repeated callback must never extend an already-completed payment again.
  const { data: payment, error: paymentReadError } = await supabase
    .from('payment_transactions')
    .select('status, ref_id, verified_at')
    .eq('authority', authority)
    .maybeSingle();

  if (paymentReadError || !payment) return false;

  if (payment.status === 'completed') {
    if (payment.ref_id !== refId) return false;
    const profile = await getUserProfile(userId);
    if (profile.zarinpal_ref_id === refId) return true;

    // Repair a previously completed payment whose profile update failed, but
    // never overwrite a newer subscription payment.
    if (profile.zarinpal_ref_id) return true;

    const repairedEnd = new Date(
      new Date(payment.verified_at ?? now).getTime() + 30 * 24 * 60 * 60 * 1000
    );
    const { error: repairError } = await supabase
      .from('user_profiles')
      .update({
        plan,
        subscription_status: 'active',
        current_period_end: repairedEnd.toISOString(),
        zarinpal_ref_id: refId,
        updated_at: now,
      })
      .eq('user_id', userId);
    if (repairError) console.error('Profile repair error:', repairError.message);
    return !repairError;
  }

  if (payment.status !== 'pending') return false;

  const { data: updatedPayment, error: txError } = await supabase
    .from('payment_transactions')
    .update({ status: 'completed', ref_id: refId, verified_at: now })
    .eq('authority', authority)
    .eq('status', 'pending')
    .select('id')
    .maybeSingle();

  if (txError || !updatedPayment) {
    if (txError) console.error('Payment transaction update error:', txError.message);
    return false;
  }

  const current = await getUserProfile(userId);
  const currentEnd = current.current_period_end ? new Date(current.current_period_end) : null;
  const base = current.plan !== 'free' && currentEnd && currentEnd > new Date() ? currentEnd : new Date();
  const periodEnd = new Date(base.getTime() + 30 * 24 * 60 * 60 * 1000);

  const { error: profileError } = await supabase
    .from('user_profiles')
    .update({
      plan,
      subscription_status: 'active',
      current_period_end: periodEnd.toISOString(),
      zarinpal_ref_id: refId,
      updated_at: now,
    })
    .eq('user_id', userId);

  if (profileError) {
    console.error('Profile activation error:', profileError.message);
    return false;
  }

  return true;
}

export async function markPaymentFailed(authority: string, status: 'failed' | 'cancelled' = 'failed') {
  const supabase = createServerClient();
  await supabase
    .from('payment_transactions')
    .update({ status })
    .eq('authority', authority)
    .eq('status', 'pending');
}
