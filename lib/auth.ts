import { cookies } from 'next/headers';
import crypto from 'crypto';
import { UserSession, Role } from './types';

const JWT_SECRET = process.env.JWT_SECRET || 'simple_finance_secret_key_change_me_in_prod';

function base64UrlEncode(str: string): string {
  return Buffer.from(str, 'utf-8')
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf-8');
}

function signHMAC(data: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

export function createToken(user: UserSession): string {
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = base64UrlEncode(
    JSON.stringify({
      id: user.id,
      name: user.name,
      userCode: user.userCode,
      role: user.role,
      permissions: user.permissions || [],
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
    })
  );

  const signature = signHMAC(`${header}.${payload}`, JWT_SECRET);
  return `${header}.${payload}.${signature}`;
}

export function getUserSession(): UserSession | null {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('sf_session')?.value;
    if (!token) return null;

    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, payload, signature] = parts;
    const expectedSignature = signHMAC(`${header}.${payload}`, JWT_SECRET);
    if (signature !== expectedSignature) return null;

    const jsonStr = base64UrlDecode(payload);
    const decoded = JSON.parse(jsonStr);

    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return {
      id: decoded.id,
      name: decoded.name,
      userCode: decoded.userCode || decoded.email || 'USR001',
      role: decoded.role as Role,
      permissions: decoded.permissions || [],
    };
  } catch (err) {
    console.error('Session decode error:', err);
    return null;
  }
}

export function setUserSession(user: UserSession): void {
  const cookieStore = cookies();
  const token = createToken(user);
  cookieStore.set('sf_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  });
}

export function clearSessionCookie(): void {
  const cookieStore = cookies();
  cookieStore.delete('sf_session');
}

export const getSession = getUserSession;
