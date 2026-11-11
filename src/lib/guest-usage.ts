import { createHmac, randomUUID, timingSafeEqual } from 'crypto';
import type { NextRequest, NextResponse } from 'next/server';

export type GuestUsage = { day: string; generation: number; fileAnalysis: number; fileChat: number };
export type GuestKind = 'generation' | 'fileAnalysis' | 'fileChat';

export const GUEST_DAILY_GENERATION_LIMIT = 3;
export const GUEST_DAILY_FILE_LIMIT = 1;
export const GUEST_DAILY_FILE_CHAT_LIMIT = 3;
export const GUEST_COOKIE_NAME = 'nevissaa_guest_usage';
const MAX_COOKIE_AGE = 60 * 60 * 24 * 3;

function secret() {
  return process.env.GUEST_USAGE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.GEMINI_API_KEY || 'nevissaa-guest-dev-secret';
}

function today() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

function sign(payload: string) {
  return createHmac('sha256', secret()).update(payload).digest('base64url');
}

function encode(value: GuestUsage) {
  const payload = Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

function decode(value: string | undefined): GuestUsage {
  const fresh = { day: today(), generation: 0, fileAnalysis: 0, fileChat: 0 };
  if (!value) return fresh;
  const [payload, signature] = value.split('.');
  if (!payload || !signature) return fresh;
  const expected = sign(payload);
  try {
    if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return fresh;
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as Partial<GuestUsage>;
    if (parsed.day !== today()) return fresh;
    return {
      day: today(),
      generation: Math.max(0, Math.min(100, Number(parsed.generation) || 0)),
      fileAnalysis: Math.max(0, Math.min(100, Number(parsed.fileAnalysis) || 0)),
      fileChat: Math.max(0, Math.min(100, Number(parsed.fileChat) || 0)),
    };
  } catch {
    return fresh;
  }
}

export function getGuestUsage(req: NextRequest): GuestUsage {
  return decode(req.cookies.get(GUEST_COOKIE_NAME)?.value);
}

export function guestRemaining(usage: GuestUsage) {
  return {
    generation: Math.max(0, GUEST_DAILY_GENERATION_LIMIT - usage.generation),
    fileAnalysis: Math.max(0, GUEST_DAILY_FILE_LIMIT - usage.fileAnalysis),
    fileChat: Math.max(0, GUEST_DAILY_FILE_CHAT_LIMIT - usage.fileChat),
  };
}

export function guestLimit(kind: GuestKind) {
  if (kind === 'generation') return GUEST_DAILY_GENERATION_LIMIT;
  if (kind === 'fileAnalysis') return GUEST_DAILY_FILE_LIMIT;
  return GUEST_DAILY_FILE_CHAT_LIMIT;
}

export function isGuestAllowed(usage: GuestUsage, kind: GuestKind) {
  return usage[kind] < guestLimit(kind);
}

export function setGuestUsageCookie(response: NextResponse, usage: GuestUsage) {
  response.cookies.set({
    name: GUEST_COOKIE_NAME,
    value: encode(usage),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_COOKIE_AGE,
  });
}

export function consumeGuestUsage(req: NextRequest, response: NextResponse, kind: GuestKind) {
  const usage = getGuestUsage(req);
  usage[kind] += 1;
  setGuestUsageCookie(response, usage);
  return guestRemaining(usage);
}

export function ensureGuestId(req: NextRequest, response: NextResponse) {
  if (req.cookies.get('nevissaa_guest_id')?.value) return;
  response.cookies.set({
    name: 'nevissaa_guest_id',
    value: randomUUID(),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });
}
