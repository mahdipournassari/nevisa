import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/server';
import { GEMINI_MODEL } from '@/lib/plans';
import { getGuestUsage, isGuestAllowed, setGuestUsageCookie, guestRemaining, guestLimit } from '@/lib/guest-usage';
import {
  checkUsageLimit,
  finalizeGenerationSlot,
  releaseGenerationSlot,
  reserveGenerationSlot,
} from '@/lib/subscription';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL_ID = process.env.GEMINI_MODEL?.trim() || GEMINI_MODEL;
import { extractFileContent, MAX_EXTRACTED_CHARS, truncateContent, validateFile } from '@/lib/file-parser';

type AnalysisMode = 'summary' | 'key-points' | 'questions' | 'custom';

function buildInstruction(mode: AnalysisMode, question: string) {
  switch (mode) {
    case 'key-points':
      return 'مهم‌ترین نکات، اعداد، یافته‌ها و موارد قابل توجه فایل را به صورت دسته‌بندی‌شده استخراج کن.';
    case 'questions':
      return 'بر اساس محتوای فایل، به سؤال کاربر پاسخ بده و اگر اطلاعات کافی در فایل وجود ندارد، صریحاً بگو.';
    case 'custom':
      return question.trim() || 'فایل را تحلیل کن و مهم‌ترین یافته‌ها را ارائه بده.';
    case 'summary':
    default:
      return 'یک خلاصه دقیق و کاربردی از فایل ارائه کن و بخش‌های مهم را از قلم نینداز.';
  }
}

async function callGemini(content: string, fileLabel: string, mode: AnalysisMode, question: string) {
  const instruction = buildInstruction(mode, question);
  const systemPrompt = `تو دستیار تحلیل فایل نویسا هستی. فقط بر اساس محتوای فایل پاسخ بده. اگر داده‌ای در فایل وجود ندارد، حدس نزن و آن را اعلام کن. برای اعداد و محاسبات تا حد ممکن دقیق باش. پاسخ را به زبان فارسی و با ساختار خوانا ارائه کن.`;
  const userPrompt = `${instruction}\n\nنوع فایل: ${fileLabel}\n${question.trim() ? `سؤال/درخواست کاربر: ${question.trim()}\n` : ''}\nمحتوای فایل:\n---\n${content}\n---`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL_ID)}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY!)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: { maxOutputTokens: 4096 },
      }),
      signal: AbortSignal.timeout(60_000),
    }
  );

  if (!response.ok) {
    console.error('File analysis Gemini error:', response.status, (await response.text().catch(() => '')).slice(0, 500));
    throw new Error('Gemini API error');
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text ?? '').join('').trim() ?? '';
}

export async function POST(req: NextRequest) {
  let reservationId: string | null = null;

  try {
    const { user, error: authError } = await getAuthenticatedUser(req);
    const hasAuthHeader = !!req.headers.get('authorization');
    if (hasAuthHeader && (authError || !user)) {
      return NextResponse.json({ error: authError ?? 'احراز هویت نامعتبر' }, { status: 401 });
    }
    const isGuest = !user;
    const guestUsage = isGuest ? getGuestUsage(req) : null;
    if (isGuest && !isGuestAllowed(guestUsage!, 'fileAnalysis')) {
      return NextResponse.json({
        error: `سهمیه تحلیل فایل مهمان (${guestLimit('fileAnalysis')} فایل در روز) تمام شده است. برای ادامه، رایگان ثبت‌نام کنید.`,
        limitExceeded: true, guest: true, guestRemaining: guestRemaining(guestUsage!),
      }, { status: 429 });
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'کلید API هوش مصنوعی تنظیم نشده است.' }, { status: 503 });
    }

    const formData = await req.formData();
    const file = formData.get('file');
    const modeValue = formData.get('mode');
    const questionValue = formData.get('question');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'فایلی برای تحلیل ارسال نشده است.' }, { status: 400 });
    }

    let extension: string;
    try { extension = validateFile(file); }
    catch (error) {
      const message = error instanceof Error ? error.message : 'فایل نامعتبر است.';
      return NextResponse.json({ error: message }, { status: message.includes('۱۰ مگابایت') ? 413 : 400 });
    }

    const mode: AnalysisMode = ['summary', 'key-points', 'questions', 'custom'].includes(String(modeValue))
      ? (String(modeValue) as AnalysisMode)
      : 'summary';
    const question = typeof questionValue === 'string' ? questionValue.slice(0, 4000) : '';

    let extracted;
    try {
      extracted = await extractFileContent(file, extension);
      if (!extracted.content.trim()) throw new Error('محتوای قابل تحلیل از فایل استخراج نشد.');
      extracted.content = truncateContent(extracted.content);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'استخراج محتوای فایل ناموفق بود.';
      return NextResponse.json({ error: message }, { status: 422 });
    }

    if (isGuest) {
      // Guest file analysis is limited separately and is not persisted in account history.
      let result: string;
      try {
        result = await callGemini(extracted.content, extracted.label, mode, question);
      } catch {
        return NextResponse.json({ error: 'خطا در تحلیل فایل توسط هوش مصنوعی. دوباره تلاش کنید.' }, { status: 502 });
      }
      if (!result) return NextResponse.json({ error: 'پاسخی از هوش مصنوعی دریافت نشد.' }, { status: 502 });
      const nextUsage = { ...guestUsage!, fileAnalysis: guestUsage!.fileAnalysis + 1 };
      const remaining = guestRemaining(nextUsage);
      const response = NextResponse.json({
        text: result, fileName: file.name, fileType: extracted.label, mode,
        truncated: extracted.content.length >= MAX_EXTRACTED_CHARS, guest: true,
        guestRemaining: remaining,
      });
      setGuestUsageCookie(response, nextUsage);
      response.headers.set('X-Guest-Remaining', String(remaining.fileAnalysis));
      return response;
    }

    if (!user) return NextResponse.json({ error: 'احراز هویت نشده' }, { status: 401 });
    const usageCheck = await checkUsageLimit(user.id);
    if (!usageCheck.allowed) {
      const reason = usageCheck.limitReason ?? 'daily';
      const message = reason === 'daily'
        ? `سقف روزانه (${usageCheck.plan.dailyLimit.toLocaleString('fa-IR')} درخواست) تمام شده است.`
        : `سقف ماهانه (${usageCheck.plan.monthlyLimit.toLocaleString('fa-IR')} درخواست) تمام شده است.`;
      return NextResponse.json({
        error: message,
        limitExceeded: true,
        limitReason: reason,
        plan: usageCheck.plan.id,
      }, { status: 429 });
    }

    const reservation = await reserveGenerationSlot(
      user.id,
      usageCheck.plan.dailyLimit,
      usageCheck.plan.monthlyLimit
    );
    reservationId = reservation.reservationId;

    if (!reservationId) {
      return NextResponse.json({
        error: 'سهمیه استفاده در دسترس نیست. دوباره تلاش کنید.',
        limitExceeded: true,
      }, { status: 429 });
    }

    let result: string;
    try {
      result = await callGemini(extracted.content, extracted.label, mode, question);
    } catch {
      await releaseGenerationSlot(reservationId);
      reservationId = null;
      return NextResponse.json({ error: 'خطا در تحلیل فایل توسط هوش مصنوعی. دوباره تلاش کنید.' }, { status: 502 });
    }

    if (!result) {
      await releaseGenerationSlot(reservationId);
      reservationId = null;
      return NextResponse.json({ error: 'پاسخی از هوش مصنوعی دریافت نشد.' }, { status: 502 });
    }

    await finalizeGenerationSlot(reservationId);
    reservationId = null;

    return NextResponse.json({
      text: result,
      fileName: file.name,
      fileType: extracted.label,
      mode,
      truncated: extracted.content.length >= MAX_EXTRACTED_CHARS,
      plan: usageCheck.plan.id,
    });
  } catch (error) {
    if (reservationId) await releaseGenerationSlot(reservationId);
    console.error('File analysis error:', error);
    return NextResponse.json({ error: 'خطای سرور هنگام تحلیل فایل. دوباره تلاش کنید.' }, { status: 500 });
  }
}
