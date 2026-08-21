'use client';

import { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, Users, CreditCard, Sparkles, RefreshCw, Search, ChevronDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

type Plan = 'free' | 'pro' | 'business';
type AdminUser = {
  id: string; email: string | null; createdAt: string; lastSignInAt: string | null;
  plan: Plan; subscriptionStatus: string | null; currentPeriodEnd: string | null;
  dailyUsage: number; monthlyUsage: number;
};
type Stats = { users: number; proUsers: number; businessUsers: number; payments: number; completedPayments: number; generations: number };
type Payment = { id: string; userId: string; email: string | null; plan: 'pro' | 'business'; amount: number; authority: string; refId: string | null; status: 'pending' | 'completed' | 'failed' | 'cancelled'; createdAt: string; verifiedAt: string | null };
type PlanLimit = { plan: Plan; dailyLimit: number; monthlyLimit: number; updatedAt: string | null };

const planLabels: Record<Plan, string> = { free: 'رایگان', pro: 'حرفه‌ای', business: 'کسب‌وکار' };

function formatDate(value: string | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' }).format(new Date(value));
}

export default function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [planLimits, setPlanLimits] = useState<PlanLimit[]>([]);
  const [limitSaving, setLimitSaving] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  async function load() {
    setLoading(true);
    setForbidden(false);
    setMessage('');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setForbidden(true); setLoading(false); return; }
    const response = await fetch('/api/admin', { headers: { Authorization: `Bearer ${session.access_token}` } });
    if (response.status === 403) { setForbidden(true); setLoading(false); return; }
    const data = await response.json();
    if (!response.ok) { setMessage(data.error ?? 'خطا در دریافت اطلاعات'); setLoading(false); return; }
    setUsers(data.users ?? []); setStats(data.stats ?? null); setPayments(data.payments ?? []); setPlanLimits(data.planLimits ?? []); setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  async function savePlanLimit(plan: Plan) {
    const item = planLimits.find((p) => p.plan === plan);
    if (!item) return;
    if (!Number.isInteger(item.dailyLimit) || item.dailyLimit < 0 || !Number.isInteger(item.monthlyLimit) || item.monthlyLimit < 0) {
      setMessage('سقف مصرف باید عدد صحیح صفر یا بیشتر باشد');
      return;
    }
    setLimitSaving(plan); setMessage('');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setLimitSaving(null); return; }
    const response = await fetch('/api/admin', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan, dailyLimit: item.dailyLimit, monthlyLimit: item.monthlyLimit }),
    });
    const data = await response.json();
    setMessage(response.ok ? `سقف مصرف پلن ${planLabels[plan]} ذخیره شد` : (data.error ?? 'ذخیره سقف مصرف ناموفق بود'));
    if (response.ok) await load();
    setLimitSaving(null);
  }

  function updatePlanLimitLocal(plan: Plan, field: 'dailyLimit' | 'monthlyLimit', value: string) {
    const numeric = value === '' ? 0 : Math.max(0, Number(value));
    setPlanLimits((items) => items.map((item) => item.plan === plan ? { ...item, [field]: numeric } : item));
  }

  async function changePlan(userId: string, plan: Plan) {
    setSaving(userId); setMessage('');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const response = await fetch('/api/admin', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, plan }),
    });
    const data = await response.json();
    if (!response.ok) setMessage(data.error ?? 'تغییر پلن ناموفق بود');
    else setMessage('پلن کاربر با موفقیت تغییر کرد');
    await load();
    setSaving(null);
  }

  const filtered = useMemo(() => users.filter((u) =>
    (u.email ?? '').toLowerCase().includes(search.toLowerCase()) || u.id.includes(search)
  ), [users, search]);

  if (forbidden) return <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6"><div className="max-w-md text-center"><ShieldCheck className="w-12 h-12 mx-auto mb-4 text-primary-400" /><h1 className="text-xl font-bold mb-2">دسترسی غیرمجاز</h1><p className="text-sm text-slate-400 mb-6">این حساب در فهرست مدیران سیستم نیست.</p><Link href="/app" className="text-primary-400 hover:underline">بازگشت به برنامه</Link></div></main>;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-8">
          <div><div className="flex items-center gap-2 mb-1"><ShieldCheck className="w-6 h-6 text-primary-400" /><h1 className="text-2xl font-bold">پنل مدیریت نویسا</h1></div><p className="text-sm text-slate-400">مدیریت کاربران، اشتراک‌ها و آمار سیستم</p></div>
          <div className="flex gap-2"><button onClick={() => void load()} className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm flex items-center gap-2"><RefreshCw className="w-4 h-4" /> بروزرسانی</button><Link href="/app" className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm">برنامه</Link></div>
        </header>

        {message && <div className="mb-5 p-3 rounded-xl bg-primary-500/10 border border-primary-500/20 text-primary-300 text-sm">{message}</div>}

        <section className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-8">
          {[
            { label: 'کاربران', value: stats?.users ?? 0, Icon: Users },
            { label: 'Pro', value: stats?.proUsers ?? 0, Icon: Sparkles },
            { label: 'Business', value: stats?.businessUsers ?? 0, Icon: Sparkles },
            { label: 'پرداخت‌ها', value: stats?.payments ?? 0, Icon: CreditCard },
            { label: 'پرداخت موفق', value: stats?.completedPayments ?? 0, Icon: CreditCard },
            { label: 'تولیدها', value: stats?.generations ?? 0, Icon: Sparkles },
          ].map(({ label, value, Icon }) => (
            <div key={label} className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <Icon className="w-5 h-5 text-primary-400 mb-3" />
              <div className="text-xl font-bold">{Number(value).toLocaleString('fa-IR')}</div>
              <div className="text-xs text-slate-500 mt-1">{label}</div>
            </div>
          ))}
        </section>

        <section className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden mb-6">
          <div className="p-4 border-b border-slate-800">
            <h2 className="font-bold">سقف مصرف پلن‌ها</h2>
            <p className="text-xs text-slate-500 mt-1">تغییرات از همین لحظه روی بررسی سهمیه کاربران اعمال می‌شود و نیازی به Deploy مجدد ندارد.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-slate-500 border-b border-slate-800"><th className="text-right p-4">پلن</th><th className="text-right p-4">سقف روزانه</th><th className="text-right p-4">سقف ماهانه</th><th className="text-right p-4">عملیات</th></tr></thead>
              <tbody>
                {planLimits.map((item) => (
                  <tr key={item.plan} className="border-b border-slate-800/70">
                    <td className="p-4 font-medium">{planLabels[item.plan]}</td>
                    <td className="p-4"><input type="number" min="0" value={item.dailyLimit} onChange={(e) => updatePlanLimitLocal(item.plan, 'dailyLimit', e.target.value)} className="w-32 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 outline-none focus:border-primary-500" /></td>
                    <td className="p-4"><input type="number" min="0" value={item.monthlyLimit} onChange={(e) => updatePlanLimitLocal(item.plan, 'monthlyLimit', e.target.value)} className="w-32 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 outline-none focus:border-primary-500" /></td>
                    <td className="p-4"><button disabled={limitSaving === item.plan} onClick={() => void savePlanLimit(item.plan)} className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-xs font-semibold">{limitSaving === item.plan ? 'در حال ذخیره...' : 'ذخیره'}</button></td>
                  </tr>
                ))}
                {!planLimits.length && <tr><td colSpan={4} className="p-6 text-center text-slate-500">در حال دریافت تنظیمات...</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row gap-3 justify-between"><h2 className="font-bold">کاربران</h2><div className="relative w-full sm:w-80"><Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-500" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="جستجوی ایمیل یا شناسه..." className="w-full pr-9 pl-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm outline-none focus:border-primary-500" /></div></div>
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-slate-500 border-b border-slate-800"><th className="text-right p-4">کاربر</th><th className="text-right p-4">پلن</th><th className="text-right p-4">مصرف امروز</th><th className="text-right p-4">مصرف ماه</th><th className="text-right p-4">پایان اشتراک</th><th className="text-right p-4">تغییر پلن</th></tr></thead><tbody>
            {loading ? <tr><td colSpan={6} className="p-8 text-center text-slate-500">در حال دریافت...</td></tr> : filtered.map((u) => <tr key={u.id} className="border-b border-slate-800/70 hover:bg-slate-800/30"><td className="p-4"><div className="font-medium text-slate-200">{u.email ?? 'بدون ایمیل'}</div><div className="text-[10px] text-slate-600 mt-1 font-mono">{u.id}</div></td><td className="p-4"><span className="px-2.5 py-1 rounded-lg bg-slate-800">{planLabels[u.plan]}</span></td><td className="p-4 text-slate-300">{u.dailyUsage.toLocaleString('fa-IR')}</td><td className="p-4 text-slate-300">{u.monthlyUsage.toLocaleString('fa-IR')}</td><td className="p-4 text-slate-400">{u.plan === 'free' ? '—' : formatDate(u.currentPeriodEnd)}</td><td className="p-4"><div className="relative inline-block"><select disabled={saving === u.id} value={u.plan} onChange={(e) => void changePlan(u.id, e.target.value as Plan)} className="appearance-none bg-slate-950 border border-slate-700 rounded-lg py-1.5 pr-3 pl-8 text-xs"><option value="free">رایگان</option><option value="pro">حرفه‌ای</option><option value="business">کسب‌وکار</option></select><ChevronDown className="pointer-events-none absolute left-2 top-2 w-3 h-3 text-slate-500" /></div></td></tr>)}
            {!loading && filtered.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-500">کاربری پیدا نشد.</td></tr>}
          </tbody></table></div>
        </section>
        <section className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden mt-6">
          <div className="p-4 border-b border-slate-800"><h2 className="font-bold">آخرین پرداخت‌ها</h2></div>
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-slate-500 border-b border-slate-800"><th className="text-right p-4">کاربر</th><th className="text-right p-4">پلن</th><th className="text-right p-4">مبلغ</th><th className="text-right p-4">وضعیت</th><th className="text-right p-4">تاریخ</th><th className="text-right p-4">Ref ID</th></tr></thead><tbody>
            {payments.length === 0 ? <tr><td colSpan={6} className="p-8 text-center text-slate-500">تراکنشی ثبت نشده است.</td></tr> : payments.slice(0, 50).map((p) => <tr key={p.id} className="border-b border-slate-800/70"><td className="p-4">{p.email ?? 'بدون ایمیل'}</td><td className="p-4">{planLabels[p.plan]}</td><td className="p-4">{p.amount.toLocaleString('fa-IR')} ریال</td><td className="p-4"><span className="px-2 py-1 rounded-lg bg-slate-800">{p.status === 'completed' ? 'موفق' : p.status === 'pending' ? 'در انتظار' : p.status === 'cancelled' ? 'لغوشده' : 'ناموفق'}</span></td><td className="p-4 text-slate-400">{formatDate(p.createdAt)}</td><td className="p-4 font-mono text-[10px] text-slate-600">{p.refId ?? '—'}</td></tr>)}
          </tbody></table></div>
        </section>
        <p className="text-[11px] text-slate-600 mt-4">دسترسی پنل فقط با رکورد admin_users کنترل می‌شود و اطلاعات پرداخت از سمت سرور خوانده می‌شود.</p>
      </div>
    </main>
  );
}
