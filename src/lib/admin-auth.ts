import { cookies } from 'next/headers';
import { createHash, createHmac, randomBytes } from 'crypto';

const SESSION_COOKIE = 'admin_session';
const SESSION_SECRET = process.env.ADMIN_PASSWORD || '';
const SESSION_DURATION_MINUTES = 15;
const SESSION_DURATION_MS = SESSION_DURATION_MINUTES * 60 * 1000;

interface SessionPayload {
  token: string;
  expiresAt: number;
}

function generateToken(): string {
  const timestamp = Date.now().toString();
  const random = randomBytes(16).toString('hex');
  const data = `${timestamp}:${random}:${SESSION_SECRET}`;
  return createHash('sha256').update(data).digest('hex');
}

function sign(payload: SessionPayload): string {
  const data = JSON.stringify(payload);
  const signature = createHmac('sha256', SESSION_SECRET)
    .update(data)
    .digest('hex');
  return Buffer.from(JSON.stringify({ payload, signature })).toString('base64');
}

function verify(encoded: string): SessionPayload | null {
  try {
    const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
    const { payload, signature } = JSON.parse(decoded) as { 
      payload: SessionPayload; 
      signature: string;
    };
    
    // Verify HMAC signature
    const expectedSignature = createHmac('sha256', SESSION_SECRET)
      .update(JSON.stringify(payload))
      .digest('hex');
    
    if (signature !== expectedSignature) {
      return null;
    }
    
    // Check token format
    if (!payload.token || payload.token.length !== 64) {
      return null;
    }
    
    // Check expiration
    if (Date.now() > payload.expiresAt) {
      return null;
    }
    
    return payload;
  } catch {
    return null;
  }
}

export function isPasswordConfigured(): boolean {
  return !!SESSION_SECRET && SESSION_SECRET.length > 0;
}

export async function isAdminAuthenticated(): Promise<boolean> {
  if (!isPasswordConfigured()) return false;
  
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE);
  if (!session?.value) return false;
  
  const payload = verify(session.value);
  return payload !== null;
}

export async function getSessionTimeRemaining(): Promise<number> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE);
  if (!session?.value) return 0;
  
  const payload = verify(session.value);
  if (!payload) return 0;
  
  const remaining = payload.expiresAt - Date.now();
  return Math.max(0, remaining);
}

export function validateAdminPassword(password: string): boolean {
  if (!isPasswordConfigured()) return false;
  return password === SESSION_SECRET;
}

export async function setAdminSession(): Promise<number> {
  const cookieStore = await cookies();
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  const payload: SessionPayload = {
    token: generateToken(),
    expiresAt,
  };
  
  const signedSession = sign(payload);
  
  cookieStore.set(SESSION_COOKIE, signedSession, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION_MINUTES * 60,
    path: '/',
  });
  
  return expiresAt;
}

export async function refreshAdminSession(): Promise<number | null> {
  const isAuthenticated = await isAdminAuthenticated();
  if (!isAuthenticated) {
    return null;
  }
  return await setAdminSession();
}

export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
