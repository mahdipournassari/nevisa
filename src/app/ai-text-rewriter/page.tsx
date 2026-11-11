import type { Metadata } from 'next';
import { SeoLanding } from '@/components/SeoLanding';

export const metadata: Metadata = {
  title: 'بازنویسی و خلاصه‌سازی متن با هوش مصنوعی',
  description: 'متن‌های طولانی را خلاصه کنید یا متن خود را با لحن رسمی، صمیمی، تبلیغاتی و متفاوت بازنویسی کنید.',
  alternates: { canonical: 'https://nevissaa.ir/ai-text-rewriter' },
  openGraph: { title: 'بازنویسی و خلاصه‌سازی متن با هوش مصنوعی', description: 'متن‌های طولانی را خلاصه کنید یا متن خود را با لحن رسمی، صمیمی، تبلیغاتی و متفاوت بازنویسی کنید.', url: 'https://nevissaa.ir/ai-text-rewriter', type: 'website', locale: 'fa_IR' },
};

export default function Page() {
  return <SeoLanding title='بازنویسی و خلاصه‌سازی متن با هوش مصنوعی' description='متن‌های طولانی را خلاصه کنید یا متن خود را با لحن رسمی، صمیمی، تبلیغاتی و متفاوت بازنویسی کنید.' eyebrow='بازنویسی متن با هوش مصنوعی' steps={['متن یا موضوع را وارد کنید', 'لحن و طول را انتخاب کنید', 'نسخه بازنویسی\u200cشده را دریافت کنید']} />;
}
