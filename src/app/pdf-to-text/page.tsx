import type { Metadata } from 'next';
import { SeoLanding } from '@/components/SeoLanding';

export const metadata: Metadata = {
  title: 'تبدیل و استخراج متن از PDF',
  description: 'متن موجود در فایل‌های PDF را برای تحلیل و استفاده سریع‌تر با نویسا استخراج کنید.',
  alternates: { canonical: 'https://nevissaa.ir/pdf-to-text' },
  openGraph: { title: 'تبدیل و استخراج متن از PDF', description: 'متن موجود در فایل‌های PDF را برای تحلیل و استفاده سریع‌تر با نویسا استخراج کنید.', url: 'https://nevissaa.ir/pdf-to-text', type: 'website', locale: 'fa_IR' },
};

export default function Page() {
  return <SeoLanding title='تبدیل و استخراج متن از PDF' description='متن موجود در فایل‌های PDF را برای تحلیل و استفاده سریع‌تر با نویسا استخراج کنید.' eyebrow='استخراج متن PDF' steps={['PDF را بارگذاری کنید', 'متن فایل پردازش می\u200cشود', 'از متن استخراج\u200cشده برای تحلیل و سؤال استفاده کنید']} />;
}
