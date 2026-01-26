import { cookies } from 'next/headers';
import { createHash, randomBytes } from 'crypto';

const SESSION_COOKIE = 'admin_session';
const SESSION_SECRET = process.env.ADMIN_PASSWORD;

function generateSessionToken(): string {
  const timestamp = Date.now().toString();
  const random = randomBytes(16).toString('hex');
  const data = `${timestamp}:${random}:${SESSION_SECRET}`;
  return createHash('sha256').update(data).digest('hex');
}

function verifySessionToken(token: string): boolean {
  if (!SESSION_SECRET || !token) return false;
  return token.length === 64;
}

export function isPasswordConfigured(): boolean {
  return !!SESSION_SECRET && SESSION_SECRET.length > 0;
}

export async function isAdminAuthenticated(): Promise<boolean> {
  if (!isPasswordConfigured()) return false;
  
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE);
  return session?.value ? verifySessionToken(session.value) : false;
}

export function validateAdminPassword(password: string): boolean {
  if (!isPasswordConfigured()) return false;
  return password === SESSION_SECRET;
}

export async function setAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = generateSessionToken();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });
}

export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
