export type Tone = 'formal' | 'friendly' | 'humor' | 'motivational' | 'serious' | 'poetic';
export type Length = 'short' | 'medium' | 'long';

export interface TemplateConfig {
  id: string;
  label: string;
  icon: string;
  description: string;
  inputLabel: string;
  inputPlaceholder: string;
  examples: string[];
}

export const TONES: { value: Tone; label: string }[] = [
  { value: 'formal', label: 'رسمی' },
  { value: 'friendly', label: 'صمیمی' },
  { value: 'humor', label: 'طنز' },
  { value: 'motivational', label: 'انگیزشی' },
  { value: 'serious', label: 'جدی' },
  { value: 'poetic', label: 'شاعرانه' },
];

export const LENGTHS: { value: Length; label: string }[] = [
  { value: 'short', label: 'کوتاه' },
  { value: 'medium', label: 'متوسط' },
  { value: 'long', label: 'بلند' },
];

export const TEMPLATES: TemplateConfig[] = [
  {
    id: 'instagram-caption',
    label: 'کپشن اینستاگرام',
    icon: 'Camera',
    description: 'کپشن‌های جذاب برای پست‌های اینستاگرام، تلگرام و لینکدین',
    inputLabel: 'موضوع پست',
    inputPlaceholder: 'مثلاً: موضوع: تلاش و پشتکار، لحن: جدی و انگیزشی',
    examples: [
      'موضوع: تلاش و پشتکار',
      'محصول: کیف چرم دست‌ساز، تخفیف ۲۰٪',
      'موضوع: تنبلی در صبح',
    ],
  },
  {
    id: 'ad-copy',
    label: 'متن تبلیغاتی',
    icon: 'Megaphone',
    description: 'توضیحات محصول و پیام‌های فروش برای کسب‌وکارها',
    inputLabel: 'جزئیات محصول یا تخفیف',
    inputPlaceholder: 'مثلاً: محصول: هدفون بی‌سیم، ویژگی‌ها: ضدآب، باتری ۳۰ ساعت',
    examples: [
      'محصول: هدفون بی‌سیم، ضدآب، باتری ۳۰ ساعت',
      'تخفیف ویژه ۵۰٪ به مناسبت عید، ست آشپزخانه',
      'دوره آموزش دیجیتال مارکتینگ برای مبتدیان',
    ],
  },
  {
    id: 'email',
    label: 'ایمیل حرفه‌ای',
    icon: 'Mail',
    description: 'ایمیل‌های خوش‌آمدگویی، اطلاعیه و پیام‌های حرفه‌ای',
    inputLabel: 'نوع پیام و مخاطب',
    inputPlaceholder: 'مثلاً: ایمیل خوش‌آمدگویی برای مشتری جدید فروش لوازم آرایشی',
    examples: [
      'ایمیل خوش‌آمدگویی برای مشتری جدید، فروش لوازم آرایشی',
      'پیام تبریک عید نوروز برای مشتریان ویژه',
      'اطلاعیه عرضه محصول جدید برای مشترکان خبرنامه',
    ],
  },
  {
    id: 'blog',
    label: 'محتوای وبلاگ',
    icon: 'FileText',
    description: 'مقدمه مقاله، توضیحات صفحات و محتوای تخصصی وب‌سایت',
    inputLabel: 'موضوع مقاله یا صفحه',
    inputPlaceholder: 'مثلاً: مزایای اپلیکیشن‌های مدیریت زمان برای دانشجویان',
    examples: [
      'مزایای اپلیکیشن‌های مدیریت زمان برای دانشجویان',
      'مشاوره کسب‌وکار برای استارتاپ‌ها',
      '۱۰ راه افزایش بهره‌وری در کار از خانه',
    ],
  },
  {
    id: 'headline',
    label: 'تیتر و ایده',
    icon: 'Sparkles',
    description: 'تیترهای خبری، تیتر مقاله و ایده‌های تولید محتوا',
    inputLabel: 'موضوع تیتر یا ایده',
    inputPlaceholder: 'مثلاً: افزایش قیمت طلا',
    examples: [
      'افزایش قیمت طلا',
      'تناسب اندام برای زنان',
      'راه‌های کاهش استرس در محیط کار',
    ],
  },
  {
    id: 'rewrite',
    label: 'خلاصه و بازنویسی',
    icon: 'PenLine',
    description: 'خلاصه‌سازی متن طولانی یا بازنویسی با لحن متفاوت',
    inputLabel: 'متن اصلی',
    inputPlaceholder: 'متن خود را اینجا بنویسید...',
    examples: [
      'یک مقاله ۳۰۰۰ کلمه‌ای درباره عادت‌های افراد موفق',
      'متن رسمی زیر را با لحن طنز بازنویسی کن: ...',
    ],
  },
  {
    id: 'creative',
    label: 'محتوای خلاقانه',
    icon: 'Feather',
    description: 'شعر، داستان کوتاه و فیلم‌نامه برای محتوای هنری',
    inputLabel: 'موضوع و نوع اثر',
    inputPlaceholder: 'مثلاً: شعر کوتاه درباره پاییز، لحن غمگین',
    examples: [
      'شعر کوتاه درباره پاییز، لحن غمگین',
      'داستان کوتاه درباره یک گربه خیابانی و یک کودک',
      'فیلم‌نامه کوتاه: ملاقات دو دوست قدیمی',
    ],
  },
];

export interface GenerationResult {
  id?: string;
  text: string;
  templateId: string;
  topic: string;
  tone: Tone;
  length: Length;
  createdAt: number;
}

export async function generateContentAI(
  templateId: string,
  topic: string,
  tone: Tone,
  length: Length,
  authToken?: string | null
): Promise<{
  result: GenerationResult | null;
  error: string | null;
  limitExceeded?: boolean;
}> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authToken) headers.Authorization = `Bearer ${authToken}`;

    const response = await fetch('/api/generate', {
      method: 'POST',
      headers,
      body: JSON.stringify({ templateId, topic, tone, length }),
    });

    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        result: null,
        error: body?.error ?? 'خطا در ارتباط با سرور',
        limitExceeded: !!body?.limitExceeded,
      };
    }

    if (!body.text) {
      return { result: null, error: 'پاسخی دریافت نشد' };
    }

    return {
      result: {
        id: body.id ?? undefined,
        text: body.text,
        templateId,
        topic,
        tone,
        length,
        createdAt: body.createdAt ?? Date.now(),
      },
      error: null,
    };
  } catch {
    return { result: null, error: 'ارتباط با سرور برقرار نشد. دوباره تلاش کنید.' };
  }
}

export function getTemplate(id: string): TemplateConfig | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
