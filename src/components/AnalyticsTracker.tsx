'use client';

import { useEffect } from 'react';
import { trackEvent } from '@/lib/analytics';

export function AnalyticsTracker() {
  useEffect(() => { trackEvent('page_view'); }, []);
  return null;
}
