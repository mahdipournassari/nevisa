import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/server';
import { createPendingPayment, ensureUserProfile } from '@/lib/subscription';
import { getAppUrl } from '@/lib/app-url';
import { isZarinpalConfigured, requestPayment } from '@/lib/zarinpal';
import { PLANS, type PlanId } from '@/lib/plans';

export async function POST(req: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(req);
    if (authError || !user) {
      return NextResponse.json({ error: authError }, { status: 401 });
    }

    if (!isZarinpalConfigured()) {
      return NextResponse.json(
        { error: 'درگاه پرداخت زرین‌پال هنوز پیکربندی نشده است.' },
        { status: 503 }
      );
    }

    const body = await req.json();
    const planId = body.plan as PlanId;
    if (planId !== 'pro' && planId !== 'business') {
      return NextResponse.json({ error: 'پلن نامعتبر است' }, { status: 400 });
    }

    const plan = PLANS[planId];
    await ensureUserProfile(user.id);

    const appUrl = getAppUrl();
    const callbackUrl = `${appUrl}/api/billing/verify`;

    const result = await requestPayment({
      amount: plan.price,
      callbackUrl,
      description: `اشتراک ${plan.name} نویسا — ${plan.priceLabel}`,
      email: user.email ?? undefined,
    });

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 502 });
    }

    const pending = await createPendingPayment(user.id, planId, plan.price, result.authority);
    if (!pending) {
      return NextResponse.json({ error: 'خطا در ثبت تراکنش' }, { status: 500 });
    }

    return NextResponse.json({ url: result.url, authority: result.authority });
  } catch (err) {
    console.error('Checkout error:', err);
    return NextResponse.json({ error: 'خطا در ایجاد درخواست پرداخت' }, { status: 500 });
  }
}
