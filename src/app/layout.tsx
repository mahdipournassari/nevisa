import type { Metadata, Viewport } from 'next';
import { AuthProvider } from '@/lib/auth';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://nevisa.app'),
  title: {
    default: 'نویسا — تولید محتوای متنی با هوش مصنوعی',
    template: '%s | نویسا',
  },
  description:
    'نویسا اپلیکیشن تولید محتوای متنی با هوش مصنوعی برای شبکه‌های اجتماعی، تبلیغات، ایمیل، وبلاگ و محتوای خلاقانه. فقط موضوع را بنویس و متن حرفه‌ای در چند ثانیه دریافت کن.',
  keywords: [
    'تولید محتوا',
    'هوش مصنوعی',
    'کپشن اینستاگرام',
    'متن تبلیغاتی',
    'نوشتن ایمیل',
    'محتوای وبلاگ',
    'ابزار نوشتن',
    'نویسا',
    'AI content generator',
    'Persian AI writer',
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
    url: 'https://nevisa.app',
    siteName: 'نویسا',
    title: 'نویسا — تولید محتوای متنی با هوش مصنوعی',
    description:
      'کپشن اینستاگرام، متن تبلیغاتی، ایمیل، مقاله، تیتر و محتوای خلاقانه — فقط موضوع را بنویس و بقیه را به هوش مصنوعی بسپار.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'نویسا — تولید محتوای متنی با هوش مصنوعی',
    description:
      'کپشن اینستاگرام، متن تبلیغاتی، ایمیل، مقاله و محتوای خلاقانه با هوش مصنوعی.',
  },
  alternates: {
    canonical: 'https://nevisa.app',
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/icon-192.svg',
    apple: '/icon-192.svg',
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
  description:
    'اپلیکیشن تولید محتوای متنی با هوش مصنوعی برای شبکه‌های اجتماعی، تبلیغات، ایمیل و وبلاگ',
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
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
