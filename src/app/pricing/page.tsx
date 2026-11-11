import Link from 'next/link';
import { Sparkles, ArrowLeft } from 'lucide-react';
import { PricingContent } from '@/components/PricingContent';

export const metadata = {
  title: 'قیمت‌گذاری',
  description:
    'پلن‌های اشتراک نویسا — رایگان، پرو و بیزینس. پلن بیزینس از Gemini Pro برای محتوای دقیق‌تر و حرفه‌ای‌تر استفاده می‌کند.',
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <header className="border-b border-slate-800/60">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white">نویسا</span>
          </Link>
          <Link
            href="/app"
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
          >
            ورود به اپ
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10 pb-16">
        <PricingContent />
      </main>
    </div>
  );
}
