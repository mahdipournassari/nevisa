import Link from 'next/link';
import { Mail, Info } from 'lucide-react';

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-800/60 py-7 mt-8">
      <div className="max-w-3xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-[11px] text-slate-600">© ۱۴۰۵ نویسا — تمامی حقوق محفوظ است.</p>
        <nav className="flex items-center gap-2 text-xs">
          <Link href="/about" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-400 hover:text-primary-300 hover:bg-slate-800/60 transition-colors">
            <Info className="w-3.5 h-3.5" /> درباره ما
          </Link>
          <Link href="/contact" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-400 hover:text-primary-300 hover:bg-slate-800/60 transition-colors">
            <Mail className="w-3.5 h-3.5" /> تماس با ما
          </Link>
          <Link href="/pricing" className="px-3 py-2 rounded-xl text-slate-400 hover:text-primary-300 hover:bg-slate-800/60 transition-colors">
            تعرفه‌ها
          </Link>
        </nav>
      </div>
    </footer>
  );
}
