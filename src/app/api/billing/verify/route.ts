import { NextRequest, NextResponse } from 'next/server';
import {
  activateSubscription,
  getPaymentByAuthority,
  markPaymentFailed,
} from '@/lib/subscription';
import { getAppUrl } from '@/lib/app-url';
import { verifyPayment } from '@/lib/zarinpal';
import type { PlanId } from '@/lib/plans';
import { createServerClient } from '@/lib/server';

export async function GET(req: NextRequest) {
  const appUrl = getAppUrl();
  const { searchParams } = new URL(req.url);
  const authority = searchParams.get('Authority');
  const status = searchParams.get('Status');
  const source = searchParams.get('source');
  const isMobile = source === 'mobile';
  const mobileUrl = (payment: string, ref?: string) => {
    const qs = new URLSearchParams({ payment });
    if (ref) qs.set('ref', ref);
    return `nevissaa://payment?${qs.toString()}`;
  };

  if (!authority) {
    return NextResponse.redirect(isMobile ? mobileUrl('invalid') : `${appUrl}/pricing?payment=invalid`);
  }

  if (status !== 'OK') {
    await markPaymentFailed(authority, 'cancelled');
    return NextResponse.redirect(isMobile ? mobileUrl('cancelled') : `${appUrl}/pricing?payment=cancelled`);
  }

  const payment = await getPaymentByAuthority(authority);
  if (!payment) {
    return NextResponse.redirect(isMobile ? mobileUrl('notfound') : `${appUrl}/pricing?payment=notfound`);
  }

  const verify = await verifyPayment({
    amount: payment.amount,
    authority,
  });

  if ('error' in verify) {
    await markPaymentFailed(authority, 'failed');
    return NextResponse.redirect(isMobile ? mobileUrl('failed') : `${appUrl}/pricing?payment=failed`);
  }

  const activated = await activateSubscription(
    payment.user_id,
    payment.plan as PlanId,
    verify.refId,
    authority
  );

  if (!activated) {
    return NextResponse.redirect(isMobile ? mobileUrl('error') : `${appUrl}/pricing?payment=error`);
  }

  try {
    await createServerClient().from('analytics_events').insert({ event: 'purchase', path: '/pricing', user_id: payment.user_id, properties: { plan: payment.plan, amount: payment.amount } });
  } catch { /* analytics failure must not block successful payment */ }

  return NextResponse.redirect(isMobile ? mobileUrl('success', verify.refId) : `${appUrl}/app?payment=success&ref=${verify.refId}`);
}
