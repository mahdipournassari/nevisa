import type { Metadata } from 'next';
import { SeoLanding } from '@/components/SeoLanding';

export const metadata: Metadata = {
  title: 'خلاصه‌سازی فایل Word با هوش مصنوعی',
  description: 'فایل Word را به نویسا بدهید و خلاصه، نکات کلیدی یا پاسخ به سؤال‌های خود را دریافت کنید.',
  alternates: { canonical: 'https://nevissaa.ir/word-summary' },
  openGraph: { title: 'خلاصه‌سازی فایل Word با هوش مصنوعی', description: 'فایل Word را به نویسا بدهید و خلاصه، نکات کلیدی یا پاسخ به سؤال‌های خود را دریافت کنید.', url: 'https://nevissaa.ir/word-summary', type: 'website', locale: 'fa_IR' },
};

export default function Page() {
  return <SeoLanding title='خلاصه‌سازی فایل Word با هوش مصنوعی' description='فایل Word را به نویسا بدهید و خلاصه، نکات کلیدی یا پاسخ به سؤال‌های خود را دریافت کنید.' eyebrow='خلاصه فایل Word' steps={['فایل DOCX را انتخاب کنید', 'نوع تحلیل را مشخص کنید', 'خلاصه یا پاسخ موردنیاز را دریافت کنید']} />;
}
