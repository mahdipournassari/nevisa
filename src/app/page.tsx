import Link from 'next/link';
import { Sparkles, Camera, Megaphone, Mail, FileText, PenLine, Feather, ArrowLeft, Check } from 'lucide-react';

export const metadata = {
  title: 'نویسا — تولید محتوای متنی با هوش مصنوعی',
  description:
    'کپشن اینستاگرام، متن تبلیغاتی، ایمیل حرفه‌ای، مقاله وبلاگ، تیتر و محتوای خلاقانه — فقط موضوع را بنویس و هوش مصنوعی در کمتر از ۱۰ ثانیه متن حرفه‌ای برایت تولید می‌کند.',
};

const features = [
  { icon: Camera, title: 'کپشن اینستاگرام', desc: 'کپشن‌های جذاب برای پست‌های اینستاگرام، تلگرام و لینکدین' },
  { icon: Megaphone, title: 'متن تبلیغاتی', desc: 'توضیحات محصول و پیام‌های فروش ترغیب‌کننده' },
  { icon: Mail, title: 'ایمیل حرفه‌ای', desc: 'ایمیل‌های خوش‌آمدگویی، اطلاعیه و پیام‌های کسب‌وکار' },
  { icon: FileText, title: 'محتوای وبلاگ', desc: 'مقدمه مقاله و محتوای تخصصی برای وب‌سایت' },
  { icon: Sparkles, title: 'تیتر و ایده', desc: 'تیترهای خبری و ایده‌های تولید محتوا' },
  { icon: PenLine, title: 'خلاصه و بازنویسی', desc: 'خلاصه‌سازی متن طولانی یا بازنویسی با لحن متفاوت' },
  { icon: Feather, title: 'محتوای خلاقانه', desc: 'شعر، داستان کوتاه و فیلم‌نامه برای محتوای هنری' },
];

const steps = [
  { num: '۱', title: 'نوع متن را انتخاب کن', desc: 'از بین کپشن، تبلیغ، ایمیل، مقاله و...' },
  { num: '۲', title: 'موضوع را بنویس', desc: 'کافیست چند کلمه درباره موضوعت بنویسی' },
  { num: '۳', title: 'لحن و طول را تنظیم کن', desc: 'رسمی، صمیمی، طنز، انگیزشی یا شاعرانه' },
  { num: '۴', title: 'متن را دریافت کن', desc: 'در کمتر از ۱۰ ثانیه متن حرفه‌ای آماده استفاده' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary-900/20 via-slate-900 to-slate-900" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary-500/10 rounded-full blur-[120px]" />

        <div className="relative max-w-3xl mx-auto px-4 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 mb-5 animate-fade-in">
            <Sparkles className="w-4 h-4 text-primary-400" />
            <span className="text-xs text-primary-300 font-medium">هوش مصنوعی نویسا</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight">
            متن حرفه‌ای در کمتر از ۱۰ ثانیه
          </h1>
          <p className="text-base text-slate-400 leading-relaxed mb-8 max-w-xl mx-auto">
            کپشن اینستاگرام، متن تبلیغاتی، ایمیل، مقاله، تیتر و محتوای خلاقانه — فقط موضوع را بنویس و بقیه را به هوش مصنوعی بسپار
          </p>

          <Link
            href="/app"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold text-sm shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            شروع رایگان
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <p className="text-[11px] text-slate-600 mt-4">
            ۲۰ درخواست رایگان در روز —{' '}
            <Link href="/pricing" className="text-primary-400 hover:underline">
              مشاهده پلن‌ها
            </Link>
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-3xl mx-auto px-4 py-12">
        <h2 className="text-xl font-bold text-white mb-2 text-center">هر متنی که نیاز داری</h2>
        <p className="text-sm text-slate-400 text-center mb-8">۷ نوع محتوای آماده برای کسب‌وکار و شبکه‌های اجتماعی</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800/70 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-primary-500/15 flex items-center justify-center mb-3">
                <f.icon className="w-5 h-5 text-primary-400" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">{f.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-3xl mx-auto px-4 py-12">
        <h2 className="text-xl font-bold text-white mb-2 text-center">چطور کار می‌کند؟</h2>
        <p className="text-sm text-slate-400 text-center mb-8">در ۴ مرحله ساده، متن حرفه‌ای دریافت کن</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {steps.map((s) => (
            <div key={s.num} className="flex items-start gap-3 p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50">
              <div className="w-8 h-8 rounded-full bg-primary-500 text-white text-sm font-bold flex items-center justify-center shrink-0">
                {s.num}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white mb-0.5">{s.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="max-w-3xl mx-auto px-4 py-12">
        <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/50">
          <h2 className="text-xl font-bold text-white mb-6 text-center">چرا نویسا؟</h2>
          <div className="space-y-3">
            {[
              'هوش مصنوعی مخصوص زبان فارسی — متن طبیعی و روان',
              'تاریخچه کامل — متن‌های تولید شده در حساب شما ذخیره می‌شوند',
              'کار با هر دستگاه — موبایل، تبلت و کامپیوتر',
              '۲۰ درخواست رایگان در روز — ۱٬۰۰۰ در ماه',
            ].map((b) => (
              <div key={b} className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-success-500/20 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-success-400" />
                </div>
                <p className="text-sm text-slate-300">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-white mb-3">آماده‌ای شروع کنی؟</h2>
        <p className="text-sm text-slate-400 mb-6">ثبت‌نام کن و اولین متن را همین حالا تولید کن</p>
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/50 text-slate-200 font-bold text-sm hover:bg-slate-800 transition-all mr-3"
        >
          مشاهده پلن‌ها
        </Link>
        <Link
          href="/app"
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold text-sm shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          شروع کن
          <ArrowLeft className="w-4 h-4" />
        </Link>
      </section>

      <footer className="py-6 text-center border-t border-slate-800/60">
        <p className="text-[11px] text-slate-600">نویسا — تولید محتوا با هوش مصنوعی</p>
      </footer>
    </div>
  );
}
