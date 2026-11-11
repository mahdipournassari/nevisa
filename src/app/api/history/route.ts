import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, getAuthenticatedUser } from '@/lib/server';

export async function GET(req: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(req);
    if (authError || !user) {
      return NextResponse.json({ error: authError }, { status: 401 });
    }

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('user_generations')
      .select('*')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ error: 'خطا در دریافت تاریخچه' }, { status: 500 });
    }

    return NextResponse.json({ items: data || [] });
  } catch (err) {
    console.error('History error:', err);
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(req);
    if (authError || !user) {
      return NextResponse.json({ error: authError }, { status: 401 });
    }

    const supabase = createServerClient();
    const { error } = await supabase
      .from('user_generations')
      .update({ deleted_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .is('deleted_at', null);

    if (error) {
      return NextResponse.json({ error: 'خطا در پاک کردن تاریخچه' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Clear error:', err);
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 });
  }
}
