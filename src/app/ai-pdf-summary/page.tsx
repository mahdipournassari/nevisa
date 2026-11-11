import type { Metadata } from 'next';
import { SeoLanding } from '@/components/SeoLanding';

export const metadata: Metadata = {
  title: 'خلاصه‌سازی PDF با هوش مصنوعی',
  description: 'فایل PDF خود را با نویسا خلاصه کنید، نکات مهم را پیدا کنید و بدون خواندن تمام صفحات سؤال بپرسید.',
  alternates: { canonical: 'https://nevissaa.ir/ai-pdf-summary' },
  openGraph: { title: 'خلاصه‌سازی PDF با هوش مصنوعی', description: 'فایل PDF خود را با نویسا خلاصه کنید، نکات مهم را پیدا کنید و بدون خواندن تمام صفحات سؤال بپرسید.', url: 'https://nevissaa.ir/ai-pdf-summary', type: 'website', locale: 'fa_IR' },
};

export default function Page() {
  return <SeoLanding title='خلاصه‌سازی PDF با هوش مصنوعی' description='فایل PDF خود را با نویسا خلاصه کنید، نکات مهم را پیدا کنید و بدون خواندن تمام صفحات سؤال بپرسید.' eyebrow='خلاصه PDF با هوش مصنوعی' steps={['آپلود PDF', 'خلاصه\u200cسازی خودکار', 'استخراج نکات مهم', 'پرسش و پاسخ با فایل']} />;
}
