import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, getAuthenticatedUser } from '@/lib/server';
import { GEMINI_MODEL } from '@/lib/plans';
import {
  checkUsageLimit,
  finalizeGenerationSlot,
  releaseGenerationSlot,
  reserveGenerationSlot,
} from '@/lib/subscription';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL_ID = process.env.GEMINI_MODEL?.trim() || GEMINI_MODEL;

const TEMPLATE_PROMPTS: Record<string, string> = {
  'instagram-caption': 'یک کپشن جذاب و مناسب برای اینستاگرام بنویس',
  'ad-copy': 'یک متن تبلیغاتی حرفه‌ای و ترغیب‌کننده برای محصول بنویس',
  email: 'یک ایمیل حرفه‌ای و مناسب برای کسب‌وکار بنویس',
  blog: 'محتوای وبلاگ شامل مقدمه و بدنه مقاله بنویس',
  headline: 'چند تیتر جذاب و خلاقانه برای موضوع داده شده پیشنهاد بده',
  rewrite: 'متن داده شده را خلاصه کن یا با لحن مشخص شده بازنویسی کن',
  creative: 'محتوای خلاقانه (شعر، داستان کوتاه یا فیلم‌نامه) برای موضوع بنویس',
};

const TONE_PROMPTS: Record<string, string> = {
  formal: 'رسمی و محترمانه',
  friendly: 'صمیمی و خودمانی',
  humor: 'شوخ‌طبعانه و خنده‌دار',
  motivational: 'انگیزشی و الهام‌بخش',
  serious: 'جدی و حرفه‌ای',
  poetic: 'شاعرانه و ادبی',
};

const LENGTH_PROMPTS: Record<string, string> = {
  short: 'متن را کوتاه و موجز نگه دار (حدود ۲ تا ۳ جمله)',
  medium: 'متن را با طول متوسط نگه دار (حدود یک پاراگراف کامل)',
  long: 'متن را مفصل و کامل نگه دار (چند پاراگراف)',
};

const TEMPLATE_IDS = new Set(Object.keys(TEMPLATE_PROMPTS));
const TONE_IDS = new Set(Object.keys(TONE_PROMPTS));
const LENGTH_IDS = new Set(Object.keys(LENGTH_PROMPTS));
const MAX_TOPIC_LENGTH = 8000;

function getMaxOutputTokens(length: string): number {
  if (length === 'short') return 1024;
  if (length === 'medium') return 2048;
  return 4096;
}

interface GeminiCallResult {
  text: string;
  finishReason?: string;
}

async function callGemini(
  model: string,
  templateId: string,
  topic: string,
  tone: string,
  length: string,
  continuationContext?: string
): Promise<GeminiCallResult> {
  const templateInstruction = TEMPLATE_PROMPTS[templateId];
  const toneInstruction = TONE_PROMPTS[tone];
  const lengthInstruction = LENGTH_PROMPTS[length];
  const systemPrompt = 'تو یک دستیار تولید محتوای حرفه‌ای فارسی‌زبان هستی. فقط به زبان فارسی پاسخ بده و متن آماده استفاده تولید کن.';

  const basePrompt = `${templateInstruction}.\n\nموضوع: ${topic}\nلحن: ${toneInstruction}\nطول: ${lengthInstruction}\n\nمتن را مستقیماً و بدون توضیح اضافه تولید کن. از علامت‌های نقل قول استفاده نکن.`;
  const userPrompt = continuationContext
    ? `${basePrompt}\n\nاین متن قبلاً تولید شده و به انتهای خروجی رسیده است:\n---\n${continuationContext}\n---\n\nفقط ادامه مستقیم متن را بنویس. متن قبلی را تکرار نکن، مقدمه جدید نساز و پاسخ را از همان جایی که متن قبلی تمام شده ادامه بده. اگر متن از نظر محتوایی کامل شده است، فقط یک پایان طبیعی و کوتاه برای آن اضافه کن.`
    : basePrompt;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY!)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: {
          maxOutputTokens: getMaxOutputTokens(length),
        },
      }),
      signal: AbortSignal.timeout(45_000),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    console.error('Gemini API error:', response.status, model, errorBody.slice(0, 500));
    throw new Error('Gemini API error');
  }

  const data = await response.json();
  const candidate = data.candidates?.[0];
  const text = candidate?.content?.parts
    ?.map((part: { text?: string }) => part.text ?? '')
    .join('')
    .trim();

  return {
    text: text ?? '',
    finishReason: candidate?.finishReason,
  };
}

async function generateCompleteText(
  model: string,
  templateId: string,
  topic: string,
  tone: string,
  length: string
): Promise<string> {
  const first = await callGemini(model, templateId, topic, tone, length);
  if (!first.text) return '';

  let completeText = first.text;
  let finishReason = first.finishReason;

  // Gemini may stop because it reached maxOutputTokens. For long content,
  // automatically request the continuation instead of returning a truncated result.
  for (let attempt = 0; attempt < 2 && finishReason === 'MAX_TOKENS'; attempt += 1) {
    const tail = completeText.slice(-5000);
    const continuation = await callGemini(
      model,
      templateId,
      topic,
      tone,
      length,
      tail
    );

    if (!continuation.text) break;

    completeText = `${completeText.trim()}\n\n${continuation.text.trim()}`;
    finishReason = continuation.finishReason;
  }

  return completeText.trim();
}

function limitMessage(reason: 'daily' | 'monthly', dailyLimit: number, monthlyLimit: number): string {
  return reason === 'daily'
    ? `سقف روزانه (${dailyLimit.toLocaleString('fa-IR')} درخواست) تمام شده است. برای ادامه، اشتراک تهیه کنید.`
    : `سقف ماهانه (${monthlyLimit.toLocaleString('fa-IR')} درخواست) تمام شده است. برای ادامه، اشتراک تهیه کنید.`;
}

export async function POST(req: NextRequest) {
  let reservationId: string | null = null;

  try {
    const { user, error: authError } = await getAuthenticatedUser(req);
    if (authError || !user) return NextResponse.json({ error: authError }, { status: 401 });

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'بدنه درخواست نامعتبر است' }, { status: 400 });
    }

    const { templateId, topic, tone, length } = (body ?? {}) as Record<string, unknown>;

    if (typeof templateId !== 'string' || !TEMPLATE_IDS.has(templateId)) {
      return NextResponse.json({ error: 'قالب انتخاب‌شده نامعتبر است' }, { status: 400 });
    }
    if (typeof tone !== 'string' || !TONE_IDS.has(tone)) {
      return NextResponse.json({ error: 'لحن انتخاب‌شده نامعتبر است' }, { status: 400 });
    }
    if (typeof length !== 'string' || !LENGTH_IDS.has(length)) {
      return NextResponse.json({ error: 'طول متن نامعتبر است' }, { status: 400 });
    }
    if (typeof topic !== 'string' || !topic.trim()) {
      return NextResponse.json({ error: 'موضوع الزامی است' }, { status: 400 });
    }
    if (topic.length > MAX_TOPIC_LENGTH) {
      return NextResponse.json({ error: `موضوع نمی‌تواند بیشتر از ${MAX_TOPIC_LENGTH.toLocaleString('fa-IR')} کاراکتر باشد` }, { status: 400 });
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'کلید API هوش مصنوعی تنظیم نشده است.' }, { status: 503 });
    }

    const usageCheck = await checkUsageLimit(user.id);
    if (!usageCheck.allowed) {
      return NextResponse.json({
        error: limitMessage(usageCheck.limitReason!, usageCheck.plan.dailyLimit, usageCheck.plan.monthlyLimit),
        limitExceeded: true,
        limitReason: usageCheck.limitReason,
        plan: usageCheck.plan.id,
        usage: usageCheck.usage,
        limits: { daily: usageCheck.plan.dailyLimit, monthly: usageCheck.plan.monthlyLimit },
      }, { status: 429 });
    }

    const reservation = await reserveGenerationSlot(
      user.id,
      usageCheck.plan.dailyLimit,
      usageCheck.plan.monthlyLimit
    );
    reservationId = reservation.reservationId;

    if (!reservationId) {
      const reason = reservation.limitReason ?? 'daily';
      return NextResponse.json({
        error: limitMessage(reason, usageCheck.plan.dailyLimit, usageCheck.plan.monthlyLimit),
        limitExceeded: true,
        limitReason: reason,
        plan: usageCheck.plan.id,
      }, { status: 429 });
    }

    let text: string | undefined;
    try {
      text = await generateCompleteText(GEMINI_MODEL_ID, templateId, topic.trim(), tone, length);
    } catch {
      await releaseGenerationSlot(reservationId);
      reservationId = null;
      return NextResponse.json({ error: 'خطا در ارتباط با سرویس هوش مصنوعی. دوباره تلاش کنید.' }, { status: 502 });
    }

    if (!text) {
      await releaseGenerationSlot(reservationId);
      reservationId = null;
      return NextResponse.json({ error: 'پاسخی دریافت نشد. دوباره تلاش کنید.' }, { status: 502 });
    }

    const supabase = createServerClient();
    const { data: inserted, error: insertError } = await supabase
      .from('user_generations')
      .insert({
        user_id: user.id,
        template_id: templateId,
        topic: topic.trim(),
        tone,
        length,
        result_text: text,
      })
      .select('id, created_at')
      .single();

    if (insertError || !inserted) {
      await releaseGenerationSlot(reservationId);
      reservationId = null;
      console.error('Failed to save generation:', insertError?.message);
      return NextResponse.json({ error: 'ذخیره نتیجه ناموفق بود؛ درخواست دوباره تلاش شود.' }, { status: 500 });
    }

    await finalizeGenerationSlot(reservationId);
    reservationId = null;

    return NextResponse.json({
      text,
      mode: 'ai',
      plan: usageCheck.plan.id,
      model: usageCheck.plan.modelLabel,
      id: inserted.id,
      createdAt: new Date(inserted.created_at).getTime(),
    });
  } catch (err) {
    if (reservationId) await releaseGenerationSlot(reservationId);
    console.error('Generate error:', err);
    if (err instanceof Error && err.message === 'USAGE_RESERVATION_FAILED') {
      return NextResponse.json({ error: 'سرویس سهمیه موقتاً در دسترس نیست. دوباره تلاش کنید.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'خطای سرور. دوباره تلاش کنید.' }, { status: 500 });
  }
}
