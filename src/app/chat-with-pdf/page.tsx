import type { Metadata } from 'next';
import { SeoLanding } from '@/components/SeoLanding';

export const metadata: Metadata = {
  title: 'چت با PDF با هوش مصنوعی',
  description: 'با فایل PDF خود گفتگو کنید و پاسخ سؤال‌هایتان را از محتوای همان فایل دریافت کنید.',
  alternates: { canonical: 'https://nevissaa.ir/chat-with-pdf' },
  openGraph: { title: 'چت با PDF با هوش مصنوعی', description: 'با فایل PDF خود گفتگو کنید و پاسخ سؤال‌هایتان را از محتوای همان فایل دریافت کنید.', url: 'https://nevissaa.ir/chat-with-pdf', type: 'website', locale: 'fa_IR' },
};

export default function Page() {
  return <SeoLanding title='چت با PDF با هوش مصنوعی' description='با فایل PDF خود گفتگو کنید و پاسخ سؤال‌هایتان را از محتوای همان فایل دریافت کنید.' eyebrow='چت با PDF' steps={['فایل PDF را انتخاب کنید', 'سؤال خود را بنویسید', 'پاسخ مبتنی بر فایل دریافت کنید', 'در صورت نیاز گفت\u200cوگو را ادامه دهید']} />;
}
