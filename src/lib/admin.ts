import { createServerClient } from './server';
import { PLANS, type PlanId } from './plans';

export interface AdminPaymentSummary {
  id: string;
  userId: string;
  email: string | null;
  plan: 'pro' | 'business';
  amount: number;
  authority: string;
  refId: string | null;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  createdAt: string;
  verifiedAt: string | null;
}

export interface AdminUserSummary {
  id: string;
  email: string | null;
  createdAt: string;
  lastSignInAt: string | null;
  plan: 'free' | 'pro' | 'business';
  subscriptionStatus: string | null;
  currentPeriodEnd: string | null;
  dailyUsage: number;
  monthlyUsage: number;
}

export async function isAdminUser(userId: string): Promise<boolean> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();
  return Boolean(data);
}

export async function listAdminUsers(): Promise<AdminUserSummary[]> {
  const supabase = createServerClient();
  const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (usersError) throw usersError;

  const users = usersData.users;
  if (!users.length) return [];

  const ids = users.map((u) => u.id);
  const [{ data: profiles, error: profileError }, { data: generations, error: generationsError }] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('user_id, plan, subscription_status, current_period_end')
      .in('user_id', ids),
    supabase
      .from('generation_reservations')
      .select('user_id, created_at, status')
      .in('user_id', ids)
      .in('status', ['completed', 'reserved'])
      .gte('created_at', new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString()),
  ]);

  if (profileError) throw profileError;
  if (generationsError) throw generationsError;

  const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));
  const now = new Date();
  const dayStart = new Date(now);
  dayStart.setUTCHours(0, 0, 0, 0);
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const usageMap = new Map<string, { daily: number; monthly: number }>();

  for (const row of generations ?? []) {
    const current = usageMap.get(row.user_id) ?? { daily: 0, monthly: 0 };
    const created = new Date(row.created_at);
    if (created >= dayStart) current.daily += 1;
    if (created >= monthStart) current.monthly += 1;
    usageMap.set(row.user_id, current);
  }

  return users.map((user) => {
    const profile = profileMap.get(user.id);
    const usage = usageMap.get(user.id) ?? { daily: 0, monthly: 0 };
    return {
      id: user.id,
      email: user.email ?? null,
      createdAt: user.created_at,
      lastSignInAt: user.last_sign_in_at ?? null,
      plan: profile?.plan ?? 'free',
      subscriptionStatus: profile?.subscription_status ?? 'active',
      currentPeriodEnd: profile?.current_period_end ?? null,
      dailyUsage: usage.daily,
      monthlyUsage: usage.monthly,
    };
  });
}

export async function listAdminPayments(): Promise<AdminPaymentSummary[]> {
  const supabase = createServerClient();
  const [{ data: payments, error: paymentsError }, { data: usersData, error: usersError }] = await Promise.all([
    supabase.from('payment_transactions').select('*').order('created_at', { ascending: false }).limit(200),
    supabase.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);
  if (paymentsError) throw paymentsError;
  if (usersError) throw usersError;
  const emails = new Map(usersData.users.map((u) => [u.id, u.email ?? null]));
  return (payments ?? []).map((p) => ({
    id: p.id, userId: p.user_id, email: emails.get(p.user_id) ?? null, plan: p.plan, amount: p.amount,
    authority: p.authority, refId: p.ref_id, status: p.status, createdAt: p.created_at, verifiedAt: p.verified_at ?? null,
  }));
}

export async function updateUserPlan(userId: string, plan: 'free' | 'pro' | 'business') {
  const supabase = createServerClient();
  const now = new Date().toISOString();
  const periodEnd = plan === 'free'
    ? null
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase
    .from('user_profiles')
    .upsert({
      user_id: userId,
      plan,
      subscription_status: 'active',
      current_period_end: periodEnd,
      updated_at: now,
    }, { onConflict: 'user_id' });

  if (error) throw error;
}

export interface AdminPlanLimit { plan: PlanId; dailyLimit: number; monthlyLimit: number; updatedAt: string | null; }

export async function listPlanLimits(): Promise<AdminPlanLimit[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase.from('plan_limits').select('plan, daily_limit, monthly_limit, updated_at').order('plan');
  if (error) throw error;
  const map = new Map((data ?? []).map((row) => [row.plan, row]));
  return (Object.keys(PLANS) as PlanId[]).map((plan) => {
    const row = map.get(plan);
    return { plan, dailyLimit: Number(row?.daily_limit ?? PLANS[plan].dailyLimit), monthlyLimit: Number(row?.monthly_limit ?? PLANS[plan].monthlyLimit), updatedAt: row?.updated_at ?? null };
  });
}

export async function updatePlanLimit(plan: PlanId, dailyLimit: number, monthlyLimit: number, adminUserId: string) {
  if (!Number.isInteger(dailyLimit) || dailyLimit < 0 || !Number.isInteger(monthlyLimit) || monthlyLimit < 0) throw new Error('INVALID_LIMIT');
  const supabase = createServerClient();
  const { error } = await supabase.from('plan_limits').upsert({ plan, daily_limit: dailyLimit, monthly_limit: monthlyLimit, updated_at: new Date().toISOString(), updated_by: adminUserId }, { onConflict: 'plan' });
  if (error) throw error;
}

export async function getAdminStats(users: AdminUserSummary[]) {
  const supabase = createServerClient();
  const { count: paymentsCount } = await supabase
    .from('payment_transactions')
    .select('*', { count: 'exact', head: true });
  const { count: completedPayments } = await supabase
    .from('payment_transactions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed');
  const { count: generations } = await supabase
    .from('generation_reservations')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed');

  return {
    users: users.length,
    proUsers: users.filter((u) => u.plan === 'pro').length,
    businessUsers: users.filter((u) => u.plan === 'business').length,
    payments: paymentsCount ?? 0,
    completedPayments: completedPayments ?? 0,
    generations: generations ?? 0,
  };
}
