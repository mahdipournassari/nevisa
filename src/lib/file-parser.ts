export const MAX_FILE_SIZE = 10 * 1024 * 1024;
export const MAX_EXTRACTED_CHARS = 60_000;

export const ALLOWED_EXTENSIONS = new Set(['txt', 'csv', 'json', 'pdf', 'docx', 'xlsx', 'xls']);
export const ALLOWED_TYPES = new Set([
  'text/plain',
  'text/csv',
  'application/json',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
]);

export function getExtension(name: string) {
  return name.split('.').pop()?.toLowerCase() ?? '';
}

export function truncateContent(text: string) {
  if (text.length <= MAX_EXTRACTED_CHARS) return text;
  return `${text.slice(0, MAX_EXTRACTED_CHARS)}\n\n[ادامه فایل به دلیل محدودیت حجم متن برای تحلیل ارسال نشد.]`;
}

export async function extractFileContent(file: File, extension: string): Promise<{ content: string; label: string }> {
  const buffer = Buffer.from(await file.arrayBuffer());

  if (extension === 'txt') return { content: buffer.toString('utf8'), label: 'فایل متنی TXT' };

  if (extension === 'json') {
    const raw = buffer.toString('utf8');
    try { return { content: JSON.stringify(JSON.parse(raw), null, 2), label: 'فایل JSON' }; }
    catch { throw new Error('فایل JSON معتبر نیست.'); }
  }

  if (extension === 'csv' || extension === 'xlsx' || extension === 'xls') {
    const XLSX = await import('xlsx');
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    const sections: string[] = [];
    for (const sheetName of workbook.SheetNames.slice(0, 20)) {
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' }) as unknown[][];
      const limitedRows = rows.slice(0, 1000);
      sections.push(`### Sheet: ${sheetName}\n${limitedRows.map((row) => row.map((cell) => String(cell)).join(' | ')).join('\n')}`);
    }
    return { content: sections.join('\n\n'), label: extension === 'csv' ? 'فایل CSV' : 'فایل Excel' };
  }

  if (extension === 'docx') {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    return { content: result.value, label: 'فایل Word' };
  }

  if (extension === 'pdf') {
    const pdfParse = (await import('pdf-parse')).default;
    const result = await pdfParse(buffer);
    return { content: result.text, label: 'فایل PDF' };
  }

  throw new Error('این نوع فایل در نسخه فعلی پشتیبانی نمی‌شود.');
}

export function validateFile(file: File) {
  const extension = getExtension(file.name);
  if (!ALLOWED_EXTENSIONS.has(extension) || (file.type && !ALLOWED_TYPES.has(file.type))) {
    throw new Error('نوع فایل پشتیبانی نمی‌شود. فایل TXT، CSV، JSON، PDF، Word یا Excel ارسال کنید.');
  }
  if (file.size <= 0) throw new Error('فایل خالی است.');
  if (file.size > MAX_FILE_SIZE) throw new Error('حجم فایل نمی‌تواند بیشتر از ۱۰ مگابایت باشد.');
  return extension;
}
