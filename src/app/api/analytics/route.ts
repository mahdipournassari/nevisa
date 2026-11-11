import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/server';

const ALLOWED = new Set(['page_view','sign_up','generation','file_analyze','file_chat','file_edit','purchase']);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const event = typeof body?.event === 'string' ? body.event : '';
    if (!ALLOWED.has(event)) return NextResponse.json({ ok: false }, { status: 400 });
    const client = createServerClient();
    const userAgent = req.headers.get('user-agent')?.slice(0, 500) ?? null;
    const { data: auth } = await client.auth.getUser(req.headers.get('authorization')?.replace(/^Bearer /, '') ?? '');
    const { error } = await client.from('analytics_events').insert({
      event, path: typeof body.path === 'string' ? body.path.slice(0, 500) : null,
      user_id: auth.user?.id ?? null, properties: body.properties ?? {},
      user_agent: userAgent,
    });
    if (error) return NextResponse.json({ ok: false });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
