import type { Metadata } from 'next';
import { SeoLanding } from '@/components/SeoLanding';

export const metadata: Metadata = {
  title: 'تولید کپشن اینستاگرام با هوش مصنوعی',
  description: 'برای پست‌های اینستاگرام کپشن فارسی، جذاب و متناسب با موضوع خود را با نویسا بسازید.',
  alternates: { canonical: 'https://nevissaa.ir/ai-instagram-caption' },
  openGraph: { title: 'تولید کپشن اینستاگرام با هوش مصنوعی', description: 'برای پست‌های اینستاگرام کپشن فارسی، جذاب و متناسب با موضوع خود را با نویسا بسازید.', url: 'https://nevissaa.ir/ai-instagram-caption', type: 'website', locale: 'fa_IR' },
};

export default function Page() {
  return <SeoLanding title='تولید کپشن اینستاگرام با هوش مصنوعی' description='برای پست‌های اینستاگرام کپشن فارسی، جذاب و متناسب با موضوع خود را با نویسا بسازید.' eyebrow='کپشن اینستاگرام با هوش مصنوعی' steps={['موضوع پست را بنویسید', 'لحن را انتخاب کنید', 'کپشن آماده را دریافت و ویرایش کنید']} />;
}
