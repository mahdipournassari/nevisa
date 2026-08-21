import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/server';
import { getAdminStats, isAdminUser, listAdminPayments, listAdminUsers, updateUserPlan, listPlanLimits, updatePlanLimit } from '@/lib/admin';

async function requireAdmin(req: NextRequest) {
  const { user, error } = await getAuthenticatedUser(req);
  if (error || !user) return { response: NextResponse.json({ error }, { status: 401 }) };
  if (!(await isAdminUser(user.id))) return { response: NextResponse.json({ error: 'دسترسی ادمین ندارید' }, { status: 403 }) };
  return { response: null };
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (auth.response) return auth.response;
    const users = await listAdminUsers();
    const [stats, payments, planLimits] = await Promise.all([getAdminStats(users), listAdminPayments(), listPlanLimits()]);
    return NextResponse.json({ users, stats, payments, planLimits });
  } catch (error) {
    console.error('Admin GET error:', error);
    return NextResponse.json({ error: 'خطا در دریافت اطلاعات پنل ادمین' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (auth.response) return auth.response;
    let body: unknown;
    try { body = await req.json(); } catch { return NextResponse.json({ error: 'بدنه درخواست نامعتبر است' }, { status: 400 }); }
    const { userId, plan, dailyLimit, monthlyLimit } = (body ?? {}) as Record<string, unknown>;
    if (typeof plan === 'string' && dailyLimit !== undefined && monthlyLimit !== undefined) {
      if (!['free', 'pro', 'business'].includes(plan) || !Number.isInteger(dailyLimit) || !Number.isInteger(monthlyLimit) || Number(dailyLimit) < 0 || Number(monthlyLimit) < 0) {
        return NextResponse.json({ error: 'مقادیر سقف مصرف نامعتبر است' }, { status: 400 });
      }
      const { user } = await getAuthenticatedUser(req);
      if (!user) return NextResponse.json({ error: 'احراز هویت نامعتبر است' }, { status: 401 });
      await updatePlanLimit(plan as 'free' | 'pro' | 'business', Number(dailyLimit), Number(monthlyLimit), user.id);
      return NextResponse.json({ success: true });
    }
    if (typeof userId !== 'string' || !['free', 'pro', 'business'].includes(plan as string)) {
      return NextResponse.json({ error: 'اطلاعات تغییر پلن نامعتبر است' }, { status: 400 });
    }
    await updateUserPlan(userId, plan as 'free' | 'pro' | 'business');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin PATCH error:', error);
    return NextResponse.json({ error: 'خطا در تغییر پلن کاربر' }, { status: 500 });
  }
}
