import crypto from 'crypto';

export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { email, password } = req.body || {};
  const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'allandiaye348@gmail.com').trim().toLowerCase();
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
  const SESSION_SECRET = process.env.SESSION_SECRET || 'sunu_admin_secret_session_key_2026';

  if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
    return res.status(401).json({ error: 'Identifiants incorrects' });
  }

  if (email.trim().toLowerCase() !== ADMIN_EMAIL) {
    return res.status(401).json({ error: 'Identifiants incorrects' });
  }

  if (!ADMIN_PASSWORD) {
    console.error('[ADMIN SECURITY]: Variable ADMIN_PASSWORD non configurée dans Vercel.');
    return res.status(401).json({ error: 'Identifiants incorrects' });
  }

  const bufProvided = Buffer.from(password);
  const bufExpected = Buffer.from(ADMIN_PASSWORD);
  const isMatch = bufProvided.length === bufExpected.length && crypto.timingSafeEqual(bufProvided, bufExpected);

  if (!isMatch) {
    return res.status(401).json({ error: 'Identifiants incorrects' });
  }

  const payload = {
    email: ADMIN_EMAIL,
    role: 'admin',
    iat: Date.now(),
    exp: Date.now() + 24 * 3600 * 1000,
  };

  const str = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(str).digest('base64url');
  const token = `${str}.${sig}`;

  const isSecure = process.env.NODE_ENV === 'production';
  res.setHeader(
    'Set-Cookie',
    `admin_session=${token}; Path=/; Max-Age=${24 * 3600}; HttpOnly; SameSite=Lax${isSecure ? '; Secure' : ''}`
  );

  return res.status(200).json({
    success: true,
    token,
    email: ADMIN_EMAIL,
    expires_in: 24 * 3600,
  });
}
