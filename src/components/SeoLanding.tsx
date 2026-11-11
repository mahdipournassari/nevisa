import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Sparkles } from 'lucide-react';
import { SiteFooter } from '@/components/SiteFooter';

export function SeoLanding({ title, description, eyebrow, steps }: { title: string; description: string; eyebrow: string; steps: string[] }) {
  return <div className="min-h-screen bg-slate-900 text-slate-100">
    <main className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 mb-5"><Sparkles className="w-4 h-4 text-primary-400" /><span className="text-xs text-primary-300 font-medium">{eyebrow}</span></div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-4">{title}</h1>
        <p className="text-base leading-8 text-slate-400 max-w-2xl mx-auto">{description}</p>
        <Link href="/app" className="inline-flex items-center gap-2 mt-7 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold text-sm shadow-lg shadow-primary-500/20">امتحان رایگان نویسا <ArrowLeft className="w-4 h-4" /></Link>
        <p className="text-[11px] text-slate-600 mt-3">بدون نیاز به خرید اشتراک برای شروع</p>
      </div>
      <section className="p-6 rounded-3xl bg-slate-800/40 border border-slate-700/50 mb-6">
        <h2 className="text-xl font-bold text-white mb-5">چطور استفاده کنیم؟</h2>
        <div className="space-y-4">{steps.map((step, i) => <div key={step} className="flex items-start gap-3"><div className="w-8 h-8 rounded-full bg-primary-500/15 text-primary-300 font-bold text-sm flex items-center justify-center shrink-0">{i + 1}</div><p className="text-sm leading-7 text-slate-300">{step}</p></div>)}</div>
      </section>
      <section className="p-6 rounded-3xl bg-gradient-to-br from-primary-500/10 to-slate-800/40 border border-primary-500/20">
        <h2 className="text-xl font-bold text-white mb-3">با نویسا سریع‌تر کار کن</h2>
        <p className="text-sm leading-8 text-slate-400">نویسا ابزارهای تولید محتوا و کار با فایل را در یک محیط ساده جمع کرده است. می‌توانید فایل‌های پشتیبانی‌شده را تحلیل کنید، با آن‌ها گفتگو کنید یا محتوای فارسی تولید و بازنویسی کنید.</p>
        <div className="grid sm:grid-cols-2 gap-3 mt-5">{['تولید محتوای فارسی', 'تحلیل و چت با فایل', 'خلاصه‌سازی و بازنویسی', 'ویرایش فایل'].map(x => <div key={x} className="flex items-center gap-2 text-sm text-slate-300"><CheckCircle2 className="w-4 h-4 text-primary-400" />{x}</div>)}</div>
      </section>
      <div className="text-center mt-8"><Link href="/pricing" className="text-sm text-primary-400 hover:underline">مشاهده پلن‌های نویسا ←</Link></div>
    </main><SiteFooter />
  </div>;
}
