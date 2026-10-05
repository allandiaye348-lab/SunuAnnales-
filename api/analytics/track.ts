// Vercel Serverless Function for visitor tracking
export default function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-key, Authorization');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      visitor_id,
      session_id,
      path,
      device_type,
      browser,
      os,
    } = req.body || {};

    const country = req.headers['x-vercel-ip-country'] || 'SN';

    return res.status(200).json({
      ok: true,
      tracked: true,
      timestamp: new Date().toISOString(),
      country,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Tracking error' });
  }
}
