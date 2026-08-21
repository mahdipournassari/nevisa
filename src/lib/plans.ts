export type PlanId = 'free' | 'pro' | 'business';

// Temporary single-model configuration for testing.
// All plans use the stable Gemini 3.5 Flash-Lite model until a paid model is enabled.
export const GEMINI_MODEL = 'gemini-3.5-flash-lite';
export const GEMINI_MODEL_LABEL = 'Gemini 3.5 Flash-Lite';

export interface PlanConfig {
  id: PlanId;
  name: string;
  nameEn: string;
  /** Price in Rial (ریال) */
  price: number;
  priceLabel: string;
  dailyLimit: number;
  monthlyLimit: number;
  model: string;
  modelLabel: string;
  modelDescription: string;
  features: string[];
  highlighted?: boolean;
}

export const PLANS: Record<PlanId, PlanConfig> = {
  free: {
    id: 'free',
    name: 'رایگان',
    nameEn: 'Free',
    price: 0,
    priceLabel: 'رایگان',
    dailyLimit: 10,
    monthlyLimit: 200,
    model: GEMINI_MODEL,
    modelLabel: GEMINI_MODEL_LABEL,
    modelDescription: 'مدل سبک و سریع Gemini — مناسب تست و استفاده روزمره',
    features: [
      '۱۰ درخواست در روز',
      '۲۰۰ درخواست در ماه',
      'مدل Gemini 3.5 Flash-Lite',
      'تمام قالب‌های محتوا',
      'ذخیره تاریخچه',
    ],
  },
  pro: {
    id: 'pro',
    name: 'پرو',
    nameEn: 'Pro',
    price: 4990000,
    priceLabel: '۴٬۹۹۰٬۰۰۰ ریال / ماه',
    dailyLimit: 25,
    monthlyLimit: 500,
    model: GEMINI_MODEL,
    modelLabel: GEMINI_MODEL_LABEL,
    modelDescription: 'در مرحله تست از همان مدل Gemini 3.5 Flash-Lite استفاده می‌شود',
    highlighted: true,
    features: [
      '۲۵ درخواست در روز',
      '۵۰۰ درخواست در ماه',
      'مدل Gemini 3.5 Flash-Lite',
      'اولویت پردازش',
      'پشتیبانی ایمیل',
    ],
  },
  business: {
    id: 'business',
    name: 'بیزینس',
    nameEn: 'Business',
    price: 14990000,
    priceLabel: '۱۴٬۹۹۰٬۰۰۰ ریال / ماه',
    dailyLimit: 50,
    monthlyLimit: 2000,
    model: GEMINI_MODEL,
    modelLabel: GEMINI_MODEL_LABEL,
    modelDescription: 'در مرحله تست از همان مدل Gemini 3.5 Flash-Lite استفاده می‌شود',
    features: [
      '۵۰ درخواست در روز',
      '۲٬۰۰۰ درخواست در ماه',
      'مدل Gemini 3.5 Flash-Lite',
      'بالاترین کیفیت خروجی',
      'اولویت پردازش',
      'پشتیبانی اختصاصی',
    ],
  },
};

export function getPlan(planId: string | null | undefined): PlanConfig {
  if (planId && planId in PLANS) return PLANS[planId as PlanId];
  return PLANS.free;
}

export function formatPriceRial(amount: number): string {
  if (amount === 0) return 'رایگان';
  return `${amount.toLocaleString('fa-IR')} ریال`;
}

