export type AnalyticsEvent =
  | 'page_view'
  | 'sign_up'
  | 'generation'
  | 'file_analyze'
  | 'file_chat'
  | 'file_edit'
  | 'purchase';

export function trackEvent(event: AnalyticsEvent, properties?: Record<string, string | number | boolean | null>) {
  if (typeof window === 'undefined') return;
  const payload = JSON.stringify({ event, properties: properties ?? {}, path: window.location.pathname });
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/analytics', new Blob([payload], { type: 'application/json' }));
      return;
    }
    void fetch('/api/analytics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true });
  } catch { /* analytics must never break the app */ }
}
