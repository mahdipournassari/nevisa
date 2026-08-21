import { createClient } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function createServerClient() {
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

export async function getAuthenticatedUser(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null, error: 'احراز هویت نشده' };
  }
  const token = authHeader.replace('Bearer ', '');
  const client = createServerClient();
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) {
    return { user: null, error: 'احراز هویت نامعتبر' };
  }
  return { user: data.user, error: null };
}
