import type { Metadata } from 'next';
import { SeoLanding } from '@/components/SeoLanding';

export const metadata: Metadata = {
  title: 'تولید محتوا با هوش مصنوعی فارسی',
  description: 'با نویسا برای اینستاگرام، تبلیغات، ایمیل، وبلاگ و محتوای خلاقانه متن فارسی تولید کنید.',
  alternates: { canonical: 'https://nevissaa.ir/ai-content-generator' },
  openGraph: { title: 'تولید محتوا با هوش مصنوعی فارسی', description: 'با نویسا برای اینستاگرام، تبلیغات، ایمیل، وبلاگ و محتوای خلاقانه متن فارسی تولید کنید.', url: 'https://nevissaa.ir/ai-content-generator', type: 'website', locale: 'fa_IR' },
};

export default function Page() {
  return <SeoLanding title='تولید محتوا با هوش مصنوعی فارسی' description='با نویسا برای اینستاگرام، تبلیغات، ایمیل، وبلاگ و محتوای خلاقانه متن فارسی تولید کنید.' eyebrow='تولید محتوا با هوش مصنوعی' steps={['نوع محتوا را انتخاب کنید', 'موضوع را وارد کنید', 'لحن و طول را تنظیم کنید', 'متن آماده را دریافت کنید']} />;
}
