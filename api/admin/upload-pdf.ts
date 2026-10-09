import fs from 'fs';
import path from 'path';
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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-token');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'allandiaye348@gmail.com').trim().toLowerCase();
  const SESSION_SECRET = process.env.SESSION_SECRET || 'sunu_admin_secret_session_key_2026';

  const cookies = parseCookies(req.headers.cookie);
  const cookieToken = cookies.admin_session;
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;
  const xToken = req.headers['x-admin-token'] as string;
  const token = cookieToken || bearerToken || xToken;

  if (!token || !verifyToken(token, SESSION_SECRET, ADMIN_EMAIL)) {
    return res.status(401).json({ error: 'Accès réservé à l’administrateur autorisé.' });
  }

  const { annale_id, pdf_data } = req.body || {};
  if (!annale_id || !pdf_data) {
    return res.status(400).json({ error: 'Identifiant du concours et données PDF requis.' });
  }

  try {
    const base64Data = typeof pdf_data === 'string' && pdf_data.includes('base64,')
      ? pdf_data.split('base64,')[1]
      : pdf_data;
    const buffer = Buffer.from(base64Data, 'base64');

    const pdfDir = path.resolve(process.cwd(), 'public/pdfs');
    if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });

    const filename = `${annale_id}.pdf`;
    const filePath = path.join(pdfDir, filename);
    fs.writeFileSync(filePath, buffer);

    const dataPdfDir = path.resolve(process.cwd(), 'data/pdfs');
    if (!fs.existsSync(dataPdfDir)) fs.mkdirSync(dataPdfDir, { recursive: true });
    fs.writeFileSync(path.join(dataPdfDir, filename), buffer);

    // Update database.json
    const dbPath = path.resolve(process.cwd(), 'data/database.json');
    if (fs.existsSync(dbPath)) {
      const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
      if (db.annales) {
        const item = db.annales.find((a: any) => a.id === annale_id);
        if (item) {
          item.pdf_path = `public/pdfs/${filename}`;
          item.has_original_pdf = true;
          fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf-8');
        }
      }
    }

    return res.status(200).json({
      success: true,
      annale_id,
      pdf_url: `/pdfs/${filename}`,
      message: `Votre fichier PDF original pour ce concours a été enregistré avec succès et sera servi 100% intact sans aucune modification.`,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur lors de l’enregistrement du fichier PDF: ' + err.message });
  }
}
