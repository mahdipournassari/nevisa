# راه‌اندازی پنل Admin نویسا

پنل مدیریت در مسیر `/admin` قرار دارد و دیگر از `ADMIN_API_KEY` استفاده نمی‌کند.
احراز هویت مدیر با Supabase Auth انجام می‌شود و مجوز مدیر بودن در جدول خصوصی `admin_users` نگهداری می‌شود.

## 1. اجرای migration

Migration زیر را در Supabase اجرا کن:

`supabase/migrations/20260809200000_admin_dashboard.sql`

## 2. ساخت حساب مدیر

ابتدا با ایمیل مدیر در خود برنامه یک حساب Supabase بساز یا با همان حساب وارد شو.
سپس UUID کاربر را از Supabase Dashboard > Authentication > Users بردار و این SQL را اجرا کن:

```sql
insert into public.admin_users (user_id)
values ('AUTH_USER_UUID');
```

برای حذف دسترسی مدیر:

```sql
delete from public.admin_users
where user_id = 'AUTH_USER_UUID';
```

## 3. ورود به پنل

با همان حساب مدیر وارد `/app` شو و سپس `/admin` را باز کن.

پنل شامل این بخش‌هاست:

- تعداد کل کاربران
- تعداد کاربران Pro و Business
- تعداد کل و موفق پرداخت‌ها
- تعداد تولیدهای ثبت‌شده
- فهرست کاربران و مصرف روزانه/ماهانه
- تغییر پلن کاربر
- فهرست آخرین پرداخت‌ها

### نکته امنیتی

جدول `admin_users` هیچ policy کلاینتی ندارد و فقط `service_role` سمت سرور می‌تواند آن را بخواند. هیچ کلید Admin در مرورگر یا هدر اختصاصی ذخیره نمی‌شود.
