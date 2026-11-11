import { Sparkles, ShieldCheck, FileSearch, Mic, PenLine } from 'lucide-react';
import { siteInfo } from '@/lib/site-info';
import { SiteFooter } from '@/components/SiteFooter';

export const metadata = {
  title: 'درباره ما',
  description: 'آشنایی با نویسا، هدف پروژه و تیم طراحی و توسعه آن.',
};

const features = [
  { icon: PenLine, title: 'تولید و ویرایش متن', desc: 'تولید محتوا، بازنویسی، خلاصه‌سازی و تغییر لحن با هوش مصنوعی.' },
  { icon: FileSearch, title: 'تحلیل فایل', desc: 'بررسی فایل‌هایی مانند PDF، Word، Excel و فرمت‌های متنی.' },
  { icon: Mic, title: 'ورودی صوتی', desc: 'امکان تبدیل صحبت کاربر به متن برای استفاده سریع‌تر از نویسا.' },
  { icon: ShieldCheck, title: 'حریم خصوصی', desc: 'طراحی قابلیت‌های فایل با رویکرد پردازش موقت و حداقل نگهداری داده.' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <main className="max-w-3xl mx-auto px-4 py-10 sm:py-14">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 mb-4">
            <Sparkles className="w-4 h-4 text-primary-400" />
            <span className="text-xs text-primary-300 font-medium">درباره نویسا</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">نویسا برای ساده‌تر کردن نوشتن و تحلیل محتوا ساخته شده است</h1>
          <p className="text-sm leading-7 text-slate-400 max-w-2xl mx-auto">{siteInfo.description}. هدف ما این است که کارهای زمان‌بر نوشتن، ویرایش و بررسی محتوا را سریع‌تر و ساده‌تر کنیم.</p>
        </div>

        <section className="p-6 rounded-3xl bg-slate-800/40 border border-slate-700/50 mb-6">
          <h2 className="text-lg font-bold text-white mb-3">نویسا چیست؟</h2>
          <p className="text-sm leading-8 text-slate-400">نویسا یک ابزار هوشمند برای تولید، بازنویسی، خلاصه‌سازی و تحلیل محتواست. این پروژه با تمرکز بر تجربه ساده برای کاربران فارسی‌زبان توسعه داده می‌شود و قابلیت‌هایی مانند تحلیل فایل و استفاده از ورودی صوتی نیز در مسیر توسعه آن قرار دارند.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-bold text-white mb-4">قابلیت‌های نویسا</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {features.map((item) => (
              <div key={item.title} className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50">
                <item.icon className="w-5 h-5 text-primary-400 mb-3" />
                <h3 className="text-sm font-semibold text-white mb-1">{item.title}</h3>
                <p className="text-xs leading-6 text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="p-6 rounded-3xl bg-gradient-to-br from-primary-500/10 to-slate-800/40 border border-primary-500/20">
          <h2 className="text-lg font-bold text-white mb-3">طراح و توسعه‌دهنده</h2>
          <p className="text-base font-semibold text-primary-300 mb-2">{siteInfo.designerName}</p>
          <p className="text-sm leading-7 text-slate-400">{siteInfo.designerBio}</p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
