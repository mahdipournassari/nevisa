'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthScreen } from '@/components/AuthScreen';
import { useAuth } from '@/lib/auth';

function LoginContent() {
  const params = useSearchParams();
  const router = useRouter();
  const { session, loading } = useAuth();

  useEffect(() => {
    if (!loading && session) router.replace('/app');
  }, [loading, session, router]);

  if (!loading && session) return null;
  const mode = params.get('mode');
  return <AuthScreen initialMode={mode === 'signin' ? 'signin' : 'signup'} />;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">در حال بارگذاری...</div>}>
      <LoginContent />
    </Suspense>
  );
}
