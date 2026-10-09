import crypto from 'crypto';

function parseCookies(cookieHeader?: string): Record<string, string> {
  const list: Record<string, string> = {};
  if (!cookieHeader) return list;
  cookieHeader.split(';').forEach(cookie => {
    const parts = cookie.split('=');
    if (parts.length >= 2) {
      list[parts[0].trim()] = decodeURIComponent(parts.slice(1).join('=').trim());
    }
  });
  return list;
}

function verifyToken(token: string, secret: string, adminEmail: string): boolean {
  if (!token || !token.includes('.')) return false;
  const [str, sig] = token.split('.');
  if (!str || !sig) return false;
  const expectedSig = crypto.createHmac('sha256', secret).update(str).digest('base64url');
  if (sig !== expectedSig) return false;
  try {
    const payload = JSON.parse(Buffer.from(str, 'base64url').toString('utf-8'));
    if (!payload || payload.role !== 'admin') return false;
    if (Date.now() > payload.exp) return false;
    if (payload.email !== adminEmail) return false;
    return true;
  } catch {
    return false;
  }
}

export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'allandiaye348@gmail.com').trim().toLowerCase();
  const SESSION_SECRET = process.env.SESSION_SECRET || 'sunu_admin_secret_session_key_2026';

  const cookies = parseCookies(req.headers.cookie);
  const cookieToken = cookies.admin_session;
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;
  const token = cookieToken || bearerToken;

  if (token && verifyToken(token, SESSION_SECRET, ADMIN_EMAIL)) {
    return res.status(200).json({ authenticated: true, email: ADMIN_EMAIL });
  }

  return res.status(401).json({ authenticated: false, error: 'Session non authentifiée ou expirée' });
}
