import type { Metadata } from 'next';
import { SeoLanding } from '@/components/SeoLanding';

export const metadata: Metadata = {
  title: 'تولید محتوای وبلاگ با هوش مصنوعی',
  description: 'برای مقاله و وبلاگ ایده، مقدمه و متن فارسی تولید کنید و زمان تولید محتوا را کاهش دهید.',
  alternates: { canonical: 'https://nevissaa.ir/ai-blog-content' },
  openGraph: { title: 'تولید محتوای وبلاگ با هوش مصنوعی', description: 'برای مقاله و وبلاگ ایده، مقدمه و متن فارسی تولید کنید و زمان تولید محتوا را کاهش دهید.', url: 'https://nevissaa.ir/ai-blog-content', type: 'website', locale: 'fa_IR' },
};

export default function Page() {
  return <SeoLanding title='تولید محتوای وبلاگ با هوش مصنوعی' description='برای مقاله و وبلاگ ایده، مقدمه و متن فارسی تولید کنید و زمان تولید محتوا را کاهش دهید.' eyebrow='محتوای وبلاگ با هوش مصنوعی' steps={['موضوع مقاله را وارد کنید', 'نوع و لحن محتوا را انتخاب کنید', 'متن اولیه را دریافت و ویرایش کنید']} />;
}
