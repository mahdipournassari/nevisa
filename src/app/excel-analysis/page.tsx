import type { Metadata } from 'next';
import { SeoLanding } from '@/components/SeoLanding';

export const metadata: Metadata = {
  title: 'تحلیل Excel با هوش مصنوعی',
  description: 'فایل Excel و CSV را با نویسا بررسی کنید و درباره داده‌ها سؤال بپرسید یا تحلیل موردنیازتان را درخواست کنید.',
  alternates: { canonical: 'https://nevissaa.ir/excel-analysis' },
  openGraph: { title: 'تحلیل Excel با هوش مصنوعی', description: 'فایل Excel و CSV را با نویسا بررسی کنید و درباره داده‌ها سؤال بپرسید یا تحلیل موردنیازتان را درخواست کنید.', url: 'https://nevissaa.ir/excel-analysis', type: 'website', locale: 'fa_IR' },
};

export default function Page() {
  return <SeoLanding title='تحلیل Excel با هوش مصنوعی' description='فایل Excel و CSV را با نویسا بررسی کنید و درباره داده‌ها سؤال بپرسید یا تحلیل موردنیازتان را درخواست کنید.' eyebrow='تحلیل Excel با هوش مصنوعی' steps={['فایل Excel یا CSV را آپلود کنید', 'سؤال یا نوع تحلیل را بنویسید', 'نتیجه را دریافت کنید']} />;
}
