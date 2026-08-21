# اصلاح تولید متن‌های طولانی

- خروجی بر اساس طول متن تا 4096 توکن افزایش یافته است.
- تمام parts پاسخ Gemini جمع می‌شوند.
- اگر Gemini با MAX_TOKENS متوقف شود، حداکثر دو بار ادامه متن به‌صورت خودکار درخواست می‌شود.
- نسخه فعلی همچنان از gemini-2.5-flash-lite استفاده می‌کند.

## File Analyzer

The app now includes a temporary file-analysis flow at `/api/analyze-file` and a **تحلیل فایل** tab in the main app.

Supported in V1:
- PDF
- DOCX
- XLSX / XLS
- CSV
- TXT
- JSON

Uploaded files are processed in memory and are **not persisted in Supabase Storage** by this feature. The current implementation uses the existing generation usage/reservation system, so each successful file analysis consumes one normal request from the user's current quota.

### New dependencies

Run:

```bash
npm install mammoth pdf-parse xlsx
npm install -D @types/pdf-parse
```

If your lockfile is out of sync, run `npm install` after installing/updating the dependencies.
