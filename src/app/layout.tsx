import type { Metadata, Viewport } from 'next';
import { AuthProvider } from '@/lib/auth';
import './globals.css';
import { AnalyticsTracker } from '@/components/AnalyticsTracker';

export const metadata: Metadata = {
  metadataBase: new URL('https://nevissaa.ir'),
  title: {
    default: 'نویسا — هوش مصنوعی برای تولید محتوا و کار با فایل',
    template: '%s | نویسا',
  },
  description:
    'نویسا ابزار هوش مصنوعی فارسی برای تولید محتوا، تحلیل PDF و Word و Excel، چت با فایل، خلاصه‌سازی و ویرایش فایل. چند ثانیه‌ای نتیجه بگیر.',
  keywords: [
    'تولید محتوا',
    'هوش مصنوعی',
    'تحلیل PDF',
    'چت با PDF',
    'خلاصه PDF',
    'تحلیل فایل',
    'ویرایش فایل',
    'کپشن اینستاگرام',
    'متن تبلیغاتی',
    'چت با فایل',
    'خلاصه‌سازی فایل',
    'ویرایش فایل',
    'نوشتن ایمیل',
    'محتوای وبلاگ',
    'ابزار نوشتن',
    'نویسا',
    'AI content generator',
    'Persian AI writer',
    'AI PDF analyzer',
    'chat with PDF',
  ],
  authors: [{ name: 'نویسا' }],
  creator: 'نویسا',
  publisher: 'نویسا',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'fa_IR',
    url: 'https://nevissaa.ir',
    siteName: 'نویسا',
    title: 'نویسا — هوش مصنوعی برای تولید محتوا و کار با فایل',
    description:
      'کپشن اینستاگرام، متن تبلیغاتی، ایمیل، مقاله، تیتر و محتوای خلاقانه — فقط موضوع را بنویس و بقیه را به هوش مصنوعی بسپار.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'نویسا — هوش مصنوعی برای تولید محتوا و کار با فایل',
    description:
      'کپشن اینستاگرام، متن تبلیغاتی، ایمیل، مقاله و محتوای خلاقانه با هوش مصنوعی.',
  },
  alternates: {
    canonical: 'https://nevissaa.ir',
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48', type: 'image/x-icon' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/icon-512.png',
  },
  category: 'technology',
};

export const viewport: Viewport = {
  themeColor: '#0ea5e9',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'نویسا',
  url: 'https://nevissaa.ir',
  description:
    'ابزار هوش مصنوعی فارسی برای تولید محتوا، تحلیل و گفت‌وگو با فایل و ویرایش فایل',
  applicationCategory: 'ProductivityApplication',
  operatingSystem: 'Web',
  inLanguage: 'fa-IR',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'IRR',
  },
  featureList: [
    'کپشن اینستاگرام',
    'متن تبلیغاتی',
    'تحلیل PDF',
    'چت با فایل',
    'خلاصه‌سازی فایل',
    'ویرایش فایل',
    'ایمیل حرفه‌ای',
    'محتوای وبلاگ',
    'تیتر و ایده',
    'خلاصه و بازنویسی',
    'محتوای خلاقانه',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <AuthProvider><AnalyticsTracker />{children}</AuthProvider>
      </body>
    </html>
  );
}
