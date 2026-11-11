'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { trackEvent } from './analytics';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signUp: (username: string, email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (identifier: string, password: string) => Promise<{ error: string | null }>;
  setUsername: (username: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const signUp = async (username: string, optionalEmail: string, password: string) => {
    const cleanUsername = username.trim().toLowerCase();
    const email = optionalEmail.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,30}$/.test(cleanUsername)) return { error: 'نام کاربری باید ۳ تا ۳۰ کاراکتر و فقط شامل حروف انگلیسی، عدد یا _ باشد' };
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'فرمت ایمیل صحیح نیست' };
    if (email.endsWith('@accounts.nevissaa.invalid')) return { error: 'این دامنه برای شناسه داخلی حساب‌ها رزرو شده است' };

    const { data: available, error: lookupError } = await supabase.rpc('is_username_available', { p_username: cleanUsername });
    if (lookupError) return { error: 'بررسی نام کاربری ممکن نشد. Migration نام کاربری را در Supabase اجرا کنید' };
    if (!available) return { error: 'این نام کاربری قبلاً استفاده شده است' };

    // Supabase Auth requires an email identifier. An internal alias is used only
    // when the user chooses not to provide a personal email address.
    const authEmail = email || `${cleanUsername}@accounts.nevissaa.invalid`;
    const { error } = await supabase.auth.signUp({
      email: authEmail,
      password,
      options: { data: { username: cleanUsername, email_optional: !email } },
    });
    if (error) return { error: translateError(error.message) };
    trackEvent('sign_up');
    return { error: null };
  };

  const signIn = async (identifier: string, password: string) => {
    const value = identifier.trim().toLowerCase();
    if (!value) return { error: 'نام کاربری یا ایمیل را وارد کنید' };
    let email = value;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      const { data, error: lookupError } = await supabase.rpc('get_email_by_username', { p_username: value });
      if (lookupError) return { error: 'بررسی نام کاربری ممکن نشد. Migration نام کاربری را در Supabase اجرا کنید' };
      if (!data) return { error: 'نام کاربری یا رمز عبور اشتباه است' };
      email = String(data).toLowerCase();
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: translateError(error.message) };
    return { error: null };
  };

  const setUsername = async (username: string) => {
    const cleanUsername = username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,30}$/.test(cleanUsername)) return { error: 'نام کاربری باید ۳ تا ۳۰ کاراکتر و فقط شامل حروف انگلیسی، عدد یا _ باشد' };
    const { error } = await supabase.rpc('set_my_username', { p_username: cleanUsername });
    if (error) return { error: error.message.includes('username_taken') ? 'این نام کاربری قبلاً استفاده شده است' : 'ذخیره نام کاربری انجام نشد. Migration را در Supabase اجرا کنید' };
    await supabase.auth.updateUser({ data: { username: cleanUsername } });
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, signUp, signIn, setUsername, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

function translateError(msg: string): string {
  if (msg.includes('Invalid login credentials')) return 'نام کاربری/ایمیل یا رمز عبور اشتباه است';
  if (msg.includes('already registered')) return 'این ایمیل قبلاً ثبت شده است. وارد شوید';
  if (msg.includes('Password should be at least')) return 'رمز عبور باید حداقل ۶ کاراکتر باشد';
  if (msg.includes('Unable to send email')) return 'خطا در ارسال ایمیل';
  if (msg.includes('Email not confirmed')) return 'ایمیل تایید نشده است';
  return 'خطایی رخ داد. دوباره تلاش کنید';
}
