import { NextRequest, NextResponse } from 'next/server';
import {
  activateSubscription,
  getPaymentByAuthority,
  markPaymentFailed,
} from '@/lib/subscription';
import { getAppUrl } from '@/lib/app-url';
import { verifyPayment } from '@/lib/zarinpal';
import type { PlanId } from '@/lib/plans';

export async function GET(req: NextRequest) {
  const appUrl = getAppUrl();
  const { searchParams } = new URL(req.url);
  const authority = searchParams.get('Authority');
  const status = searchParams.get('Status');

  if (!authority) {
    return NextResponse.redirect(`${appUrl}/pricing?payment=invalid`);
  }

  if (status !== 'OK') {
    await markPaymentFailed(authority, 'cancelled');
    return NextResponse.redirect(`${appUrl}/pricing?payment=cancelled`);
  }

  const payment = await getPaymentByAuthority(authority);
  if (!payment) {
    return NextResponse.redirect(`${appUrl}/pricing?payment=notfound`);
  }

  const verify = await verifyPayment({
    amount: payment.amount,
    authority,
  });

  if ('error' in verify) {
    await markPaymentFailed(authority, 'failed');
    return NextResponse.redirect(`${appUrl}/pricing?payment=failed`);
  }

  const activated = await activateSubscription(
    payment.user_id,
    payment.plan as PlanId,
    verify.refId,
    authority
  );

  if (!activated) {
    return NextResponse.redirect(`${appUrl}/pricing?payment=error`);
  }

  return NextResponse.redirect(`${appUrl}/app?payment=success&ref=${verify.refId}`);
}
