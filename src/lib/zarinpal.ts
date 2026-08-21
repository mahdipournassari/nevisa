const SANDBOX = process.env.ZARINPAL_SANDBOX === 'true';

const API_BASE = SANDBOX
  ? 'https://sandbox.zarinpal.com/pg/v4'
  : 'https://api.zarinpal.com/pg/v4';

const START_PAY_BASE = SANDBOX
  ? 'https://sandbox.zarinpal.com/pg/StartPay'
  : 'https://www.zarinpal.com/pg/StartPay';

interface ZarinpalResponse<T> {
  data: T;
  errors?: { code: number; message: string; validations?: unknown[] }[];
}

export interface PaymentRequestResult {
  authority: string;
  url: string;
}

export interface PaymentVerifyResult {
  code: number;
  refId: string;
  alreadyVerified: boolean;
}

function getMerchantId(): string | null {
  return process.env.ZARINPAL_MERCHANT_ID?.trim() || null;
}

export function isZarinpalConfigured(): boolean {
  return !!getMerchantId();
}

async function readJson<T>(response: Response): Promise<ZarinpalResponse<T> | null> {
  try {
    return (await response.json()) as ZarinpalResponse<T>;
  } catch {
    return null;
  }
}

export async function requestPayment(params: {
  amount: number;
  callbackUrl: string;
  description: string;
  email?: string;
  mobile?: string;
}): Promise<PaymentRequestResult | { error: string }> {
  const merchantId = getMerchantId();
  if (!merchantId) return { error: 'درگاه پرداخت پیکربندی نشده است' };

  try {
    const response = await fetch(`${API_BASE}/payment/request.json`, {
      method: 'POST',
      headers: { accept: 'application/json', 'content-type': 'application/json' },
      body: JSON.stringify({
        merchant_id: merchantId,
        amount: params.amount,
        callback_url: params.callbackUrl,
        description: params.description,
        currency: 'IRR',
        metadata: { email: params.email ?? '', mobile: params.mobile ?? '' },
      }),
      signal: AbortSignal.timeout(20_000),
    });

    const json = await readJson<{ code: number; authority: string; message: string }>(response);
    if (!json) return { error: 'پاسخ نامعتبر از درگاه پرداخت دریافت شد' };

    if (!response.ok || json.errors?.length) {
      console.error('Zarinpal request error:', json.errors);
      return { error: json.errors?.[0]?.message ?? 'خطا در ایجاد درخواست پرداخت' };
    }

    if (json.data.code !== 100 || !json.data.authority) {
      return { error: json.data.message ?? 'درخواست پرداخت ناموفق بود' };
    }

    return { authority: json.data.authority, url: `${START_PAY_BASE}/${json.data.authority}` };
  } catch (error) {
    console.error('Zarinpal request exception:', error);
    return { error: 'ارتباط با درگاه پرداخت برقرار نشد' };
  }
}

export async function verifyPayment(params: {
  amount: number;
  authority: string;
}): Promise<PaymentVerifyResult | { error: string }> {
  const merchantId = getMerchantId();
  if (!merchantId) return { error: 'درگاه پرداخت پیکربندی نشده است' };

  try {
    const response = await fetch(`${API_BASE}/payment/verify.json`, {
      method: 'POST',
      headers: { accept: 'application/json', 'content-type': 'application/json' },
      body: JSON.stringify({ merchant_id: merchantId, amount: params.amount, authority: params.authority }),
      signal: AbortSignal.timeout(20_000),
    });

    const json = await readJson<{ code: number; message: string; ref_id: number }>(response);
    if (!json) return { error: 'پاسخ نامعتبر از درگاه پرداخت دریافت شد' };

    if (!response.ok || json.errors?.length) {
      console.error('Zarinpal verify error:', json.errors);
      return { error: json.errors?.[0]?.message ?? 'خطا در تأیید پرداخت' };
    }

    if (json.data.code === 100 || json.data.code === 101) {
      return {
        code: json.data.code,
        refId: String(json.data.ref_id),
        alreadyVerified: json.data.code === 101,
      };
    }

    return { error: json.data.message ?? 'پرداخت تأیید نشد' };
  } catch (error) {
    console.error('Zarinpal verify exception:', error);
    return { error: 'ارتباط با درگاه پرداخت برقرار نشد' };
  }
}
