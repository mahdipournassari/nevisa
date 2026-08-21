import { NextResponse } from 'next/server';
import { getPlanLimits } from '@/lib/plan-limits';
import { PLANS } from '@/lib/plans';

export const dynamic = 'force-dynamic';

export async function GET() {
  const limits = await getPlanLimits();
  return NextResponse.json({
    plans: Object.values(PLANS).map((p) => ({ ...p, dailyLimit: limits[p.id].dailyLimit, monthlyLimit: limits[p.id].monthlyLimit })),
  }, { headers: { 'Cache-Control': 'no-store' } });
}
