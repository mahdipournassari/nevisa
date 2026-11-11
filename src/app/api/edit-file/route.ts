import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/server';
import { GEMINI_MODEL } from '@/lib/plans';
import { checkUsageLimit, finalizeGenerationSlot, releaseGenerationSlot, reserveGenerationSlot } from '@/lib/subscription';
import { getGuestUsage, isGuestAllowed, setGuestUsageCookie, guestRemaining, guestLimit } from '@/lib/guest-usage';
import { extractFileContent, truncateContent, validateFile } from '@/lib/file-parser';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL?.trim() || GEMINI_MODEL;

type EditOperation =
  | { op: 'set_cell'; sheet: string; cell: string; value: string | number | boolean | null }
  | { op: 'append_row'; sheet: string; values: unknown[] }
  | { op: 'delete_row'; sheet: string; row: number }
  | { op: 'add_sheet'; sheet: string; rows: unknown[][] }
  | { op: 'rename_sheet'; sheet: string; newName: string }
  | { op: 'sort_sheet'; sheet: string; column: string; direction?: 'asc' | 'desc'; hasHeader?: boolean }
  | { op: 'delete_column'; sheet: string; column: string }
  | { op: 'add_column'; sheet: string; column: string; values?: unknown[] };

type EditPlan = { kind: 'content'; editedContent: string } | { kind: 'operations'; operations: EditOperation[] };

function buildPrompt(fileType: string, instruction: string, content: string) {
  return `تو موتور ویرایش فایل نویسا هستی. فقط تغییرات صریح و قابل اطمینان درخواست کاربر را اعمال کن.
نوع فایل: ${fileType}
درخواست: ${instruction}

برای TXT/CSV/JSON/DOCX فقط JSON با این ساختار بده:
{"kind":"content","editedContent":"..."}

برای Excel فقط JSON با این ساختار بده:
{"kind":"operations","operations":[...]}
عملیات مجاز: set_cell, append_row, delete_row, add_sheet, rename_sheet, sort_sheet, delete_column, add_column.
شماره ردیف از 1 شروع می‌شود و column مثل A یا C است. برای sort_sheet جهت asc یا desc را مشخص کن.
اگر تغییری لازم نیست، آرایه عملیات خالی باشد.

محتوای فعلی فایل:
---
${content}
---`;
}

async function askAI(fileType: string, instruction: string, content: string): Promise<EditPlan> {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL)}:generateContent?key=${encodeURIComponent(KEY!)}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: 'فقط JSON معتبر و بدون Markdown برگردان. از حدس زدن داده‌ها خودداری کن.' }] },
      contents: [{ role: 'user', parts: [{ text: buildPrompt(fileType, instruction, content) }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 12000, responseMimeType: 'application/json' },
    }), signal: AbortSignal.timeout(90_000),
  });
  if (!response.ok) throw new Error('Gemini API error');
  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('').trim();
  if (!text) throw new Error('AI returned no edit plan');
  try { return JSON.parse(text) as EditPlan; } catch { throw new Error('پاسخ ویرایش فایل معتبر نبود.'); }
}

function colToNumber(col: string) { let n = 0; for (const c of col.toUpperCase()) n = n * 26 + c.charCodeAt(0) - 64; return n - 1; }
function parseCell(cell: string) { const m = /^([A-Za-z]+)(\d+)$/.exec(cell.trim()); if (!m) throw new Error(`آدرس سلول نامعتبر است: ${cell}`); return { c: colToNumber(m[1]), r: Number(m[2]) - 1 }; }

async function buildOutput(file: File, extension: string, plan: EditPlan) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const base = file.name.replace(/\.[^.]+$/, '');
  if (extension === 'txt' || extension === 'csv') {
    if (plan.kind !== 'content') throw new Error('برای این فایل خروجی متنی لازم است.');
    return { buffer: Buffer.from(plan.editedContent, 'utf8'), mime: extension === 'csv' ? 'text/csv;charset=utf-8' : 'text/plain;charset=utf-8', name: `${base}_edited.${extension}` };
  }
  if (extension === 'json') {
    if (plan.kind !== 'content') throw new Error('برای JSON خروجی محتوایی لازم است.');
    let parsed: unknown; try { parsed = JSON.parse(plan.editedContent); } catch { throw new Error('خروجی JSON معتبر نیست.'); }
    return { buffer: Buffer.from(JSON.stringify(parsed, null, 2), 'utf8'), mime: 'application/json', name: `${base}_edited.json` };
  }
  if (extension === 'docx') {
    if (plan.kind !== 'content') throw new Error('برای Word خروجی محتوایی لازم است.');
    const { Document, Packer, Paragraph } = await import('docx');
    const doc = new Document({ sections: [{ properties: {}, children: plan.editedContent.split(/\r?\n/).map(line => new Paragraph({ text: line })) }] });
    return { buffer: Buffer.from(await Packer.toBuffer(doc)), mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', name: `${base}_edited.docx` };
  }
  if (extension === 'xlsx' || extension === 'xls') {
    if (plan.kind !== 'operations') throw new Error('برای Excel عملیات ساختاری لازم است.');
    const XLSX = await import('xlsx');
    const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    for (const operation of plan.operations) applyExcelOperation(XLSX, wb, operation);
    const out = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    return { buffer: Buffer.from(out), mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', name: `${base}_edited.xlsx` };
  }
  throw new Error('ویرایش مستقیم PDF در نسخه فعلی فعال نیست.');
}

function applyExcelOperation(XLSX: typeof import('xlsx'), wb: import('xlsx').WorkBook, operation: EditOperation) {
  if (operation.op === 'add_sheet') { if (!wb.SheetNames.includes(operation.sheet)) XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(operation.rows), operation.sheet.slice(0, 31) || 'NewSheet'); return; }
  const ws = wb.Sheets[operation.sheet]; if (!ws) return;
  if (operation.op === 'rename_sheet') { const newName = operation.newName.slice(0, 31); if (newName && !wb.SheetNames.includes(newName)) { const i = wb.SheetNames.indexOf(operation.sheet); wb.SheetNames[i] = newName; wb.Sheets[newName] = ws; delete wb.Sheets[operation.sheet]; } return; }
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: '' }) as unknown[][];
  if (operation.op === 'set_cell') { const { c, r } = parseCell(operation.cell); if (!rows[r]) rows[r] = []; rows[r][c] = operation.value; }
  else if (operation.op === 'append_row') rows.push(operation.values);
  else if (operation.op === 'delete_row') rows.splice(Math.max(0, operation.row - 1), 1);
  else if (operation.op === 'delete_column') { const c = colToNumber(operation.column); rows.forEach(row => row.splice(c, 1)); }
  else if (operation.op === 'add_column') { const c = colToNumber(operation.column); rows.forEach((row, i) => row.splice(c, 0, operation.values?.[i] ?? '')); }
  else if (operation.op === 'sort_sheet') { const c = colToNumber(operation.column); const header = operation.hasHeader !== false ? rows.shift() : undefined; rows.sort((a, b) => String(a?.[c] ?? '').localeCompare(String(b?.[c] ?? ''), 'fa', { numeric: true })); if (operation.direction === 'desc') rows.reverse(); if (header) rows.unshift(header); }
  wb.Sheets[operation.sheet] = XLSX.utils.aoa_to_sheet(rows);
}

export async function POST(req: NextRequest) {
  let reservationId: string | null = null;
  try {
    const { user, error } = await getAuthenticatedUser(req);
    const hasAuth = !!req.headers.get('authorization');
    if (hasAuth && (error || !user)) return NextResponse.json({ error: error ?? 'احراز هویت نامعتبر' }, { status: 401 });
    const guest = !user; const usage = guest ? getGuestUsage(req) : null;
    if (guest && !isGuestAllowed(usage!, 'fileAnalysis')) return NextResponse.json({ error: `سهمیه ویرایش فایل مهمان (${guestLimit('fileAnalysis')} فایل در روز) تمام شده است.`, limitExceeded: true }, { status: 429 });
    if (!KEY) return NextResponse.json({ error: 'کلید API هوش مصنوعی تنظیم نشده است.' }, { status: 503 });
    const form = await req.formData(); const file = form.get('file'); const instruction = String(form.get('instruction') ?? '').trim();
    if (!(file instanceof File)) return NextResponse.json({ error: 'فایلی ارسال نشده است.' }, { status: 400 });
    if (!instruction || instruction.length > 5000) return NextResponse.json({ error: 'دستور ویرایش را وارد کنید.' }, { status: 400 });
    let extension: string; try { extension = validateFile(file); } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'فایل نامعتبر است.' }, { status: 400 }); }
    if (extension === 'pdf') return NextResponse.json({ error: 'ویرایش مستقیم PDF در نسخه فعلی فعال نیست. PDF را می‌توان تحلیل کرد و به Word تبدیل کرد.' }, { status: 422 });
    const extracted = await extractFileContent(file, extension); const content = truncateContent(extracted.content);
    if (!content.trim()) return NextResponse.json({ error: 'محتوای قابل ویرایش از فایل استخراج نشد.' }, { status: 422 });
    if (!guest) {
      const check = await checkUsageLimit(user!.id); if (!check.allowed) return NextResponse.json({ error: check.limitReason === 'monthly' ? 'سقف ماهانه تمام شده است.' : 'سقف روزانه تمام شده است.', limitExceeded: true }, { status: 429 });
      const reservation = await reserveGenerationSlot(user!.id, check.plan.dailyLimit, check.plan.monthlyLimit); reservationId = reservation.reservationId;
      if (!reservationId) return NextResponse.json({ error: 'سهمیه استفاده در دسترس نیست.' }, { status: 429 });
    }
    let plan: EditPlan; try { plan = await askAI(extracted.label, instruction, content); } catch { if (reservationId) await releaseGenerationSlot(reservationId); return NextResponse.json({ error: 'تولید دستور ویرایش توسط هوش مصنوعی ناموفق بود.' }, { status: 502 }); }
    let output; try { output = await buildOutput(file, extension, plan); } catch (e) { if (reservationId) await releaseGenerationSlot(reservationId); return NextResponse.json({ error: e instanceof Error ? e.message : 'ساخت فایل اصلاح‌شده ناموفق بود.' }, { status: 422 }); }
    if (reservationId) { await finalizeGenerationSlot(reservationId); reservationId = null; }
    const response = new NextResponse(output.buffer, { headers: { 'Content-Type': output.mime, 'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(output.name)}`, 'Cache-Control': 'no-store' } });
    if (guest) { const next = { ...usage!, fileAnalysis: usage!.fileAnalysis + 1 }; setGuestUsageCookie(response, next); response.headers.set('X-Guest-Remaining', String(guestRemaining(next).fileAnalysis)); }
    return response;
  } catch (e) { if (reservationId) await releaseGenerationSlot(reservationId); console.error('edit-file error', e); return NextResponse.json({ error: 'خطای سرور هنگام ویرایش فایل.' }, { status: 500 }); }
}
