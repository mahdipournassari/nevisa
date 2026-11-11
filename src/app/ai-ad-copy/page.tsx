import type { Metadata } from 'next';
import { SeoLanding } from '@/components/SeoLanding';

export const metadata: Metadata = {
  title: 'نوشتن متن تبلیغاتی با هوش مصنوعی',
  description: 'برای محصول یا خدمت خود متن تبلیغاتی فارسی و متناسب با هدف فروش با نویسا تولید کنید.',
  alternates: { canonical: 'https://nevissaa.ir/ai-ad-copy' },
  openGraph: { title: 'نوشتن متن تبلیغاتی با هوش مصنوعی', description: 'برای محصول یا خدمت خود متن تبلیغاتی فارسی و متناسب با هدف فروش با نویسا تولید کنید.', url: 'https://nevissaa.ir/ai-ad-copy', type: 'website', locale: 'fa_IR' },
};

export default function Page() {
  return <SeoLanding title='نوشتن متن تبلیغاتی با هوش مصنوعی' description='برای محصول یا خدمت خود متن تبلیغاتی فارسی و متناسب با هدف فروش با نویسا تولید کنید.' eyebrow='متن تبلیغاتی با هوش مصنوعی' steps={['محصول یا خدمت را توضیح دهید', 'لحن مناسب را انتخاب کنید', 'چند نسخه متن تبلیغاتی بگیرید']} />;
}
