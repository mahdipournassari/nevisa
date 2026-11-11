'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Mail, MessageSquare, Send } from 'lucide-react';
import { siteInfo } from '@/lib/site-info';
import { SiteFooter } from '@/components/SiteFooter';

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const subject = String(form.get('subject') || 'پیام از سایت نویسا');
    const body = `نام: ${form.get('name') || ''}\nایمیل: ${form.get('email') || ''}\n\n${form.get('message') || ''}`;

    if (!siteInfo.contactEmail) return;
    window.location.href = `mailto:${siteInfo.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <main className="max-w-2xl mx-auto px-4 py-10 sm:py-14">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-primary-300 mb-8">
          <ArrowRight className="w-4 h-4" /> بازگشت به نویسا
        </Link>
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary-500/15 flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-6 h-6 text-primary-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">تماس با ما</h1>
          <p className="text-sm leading-7 text-slate-400">پیشنهاد، انتقاد، گزارش خطا یا هر سؤال دیگری دارید؟ پیام خود را برای ما ارسال کنید.</p>
        </div>

        <div className="p-6 rounded-3xl bg-slate-800/40 border border-slate-700/50">
          {siteInfo.contactEmail && (
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900/60 border border-slate-700/40 mb-5">
              <Mail className="w-4 h-4 text-primary-400" />
              <div>
                <p className="text-[11px] text-slate-500">ایمیل تماس</p>
                <a href={`mailto:${siteInfo.contactEmail}`} className="text-sm text-slate-200 hover:text-primary-300">{siteInfo.contactEmail}</a>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block"><span className="block text-xs text-slate-400 mb-1.5">نام و نام خانوادگی</span><input name="name" required className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2.5 text-sm text-white outline-none focus:border-primary-500" /></label>
              <label className="block"><span className="block text-xs text-slate-400 mb-1.5">ایمیل</span><input name="email" type="email" required className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2.5 text-sm text-white outline-none focus:border-primary-500" /></label>
            </div>
            <label className="block"><span className="block text-xs text-slate-400 mb-1.5">موضوع</span><input name="subject" required className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2.5 text-sm text-white outline-none focus:border-primary-500" /></label>
            <label className="block"><span className="block text-xs text-slate-400 mb-1.5">پیام</span><textarea name="message" required rows={6} className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2.5 text-sm text-white outline-none focus:border-primary-500 resize-y" /></label>

            {!siteInfo.contactEmail && <p className="text-xs text-amber-400/90">برای فعال شدن ارسال پیام، مقدار `NEXT_PUBLIC_CONTACT_EMAIL` را در فایل `.env.local` تنظیم کنید.</p>}
            {sent && <p className="text-xs text-success-400">پیام برای ارسال در نرم‌افزار ایمیل شما آماده شد.</p>}

            <button type="submit" disabled={!siteInfo.contactEmail} className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary-500 hover:bg-primary-400 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-3 text-sm font-bold text-white transition-colors">
              <Send className="w-4 h-4" /> ارسال پیام
            </button>
          </form>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
