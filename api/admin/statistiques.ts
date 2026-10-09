import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

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

  if (!token || !verifyToken(token, SESSION_SECRET, ADMIN_EMAIL)) {
    return res.status(401).json({
      error: 'Accès strictement refusé. Cette ressource statistique est réservée exclusivement à l’administrateur SunuAnnales.',
    });
  }

  // Load real visits from database
  let rawVisits: any[] = [];
  try {
    const dbPath = path.resolve(process.cwd(), 'data/database.json');
    if (fs.existsSync(dbPath)) {
      const dbContent = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
      rawVisits = dbContent.page_visits || [];
    }
  } catch (err) {
    console.warn('Could not read visits from data/database.json:', err);
  }

  const visits = rawVisits.filter(v => !v.id?.startsWith('visit-seed-'));
  const now = new Date();
  const nowMs = now.getTime();

  // Time boundaries
  const todayStr = now.toISOString().slice(0, 10);
  const yesterdayDate = new Date(nowMs - 86400000);
  const yesterdayStr = yesterdayDate.toISOString().slice(0, 10);
  const sevenDaysAgoMs = nowMs - 7 * 86400000;
  const thirtyDaysAgoMs = nowMs - 30 * 86400000;
  const tenMinutesAgoMs = nowMs - 10 * 60 * 1000;

  const todayVisits = visits.filter(v => v.timestamp?.startsWith(todayStr));
  const yesterdayVisits = visits.filter(v => v.timestamp?.startsWith(yesterdayStr));
  const weekVisits = visits.filter(v => new Date(v.timestamp).getTime() >= sevenDaysAgoMs);
  const monthVisits = visits.filter(v => new Date(v.timestamp).getTime() >= thirtyDaysAgoMs);
  const realTimeVisits = visits.filter(v => new Date(v.timestamp).getTime() >= tenMinutesAgoMs);

  const uniqueToday = new Set(todayVisits.map(v => v.visitor_id)).size;
  const uniqueYesterday = new Set(yesterdayVisits.map(v => v.visitor_id)).size;
  const unique7Days = new Set(weekVisits.map(v => v.visitor_id)).size;
  const unique30Days = new Set(monthVisits.map(v => v.visitor_id)).size;
  const uniqueTotal = new Set(visits.map(v => v.visitor_id)).size;
  const activeVisitorsNow = new Set(realTimeVisits.map(v => v.visitor_id)).size;

  const growthToday = uniqueYesterday > 0
    ? Math.round(((uniqueToday - uniqueYesterday) / uniqueYesterday) * 100)
    : (uniqueToday > 0 ? 100 : 0);

  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  const chartToday = Array.from({ length: 24 }, (_, hour) => {
    const hPrefix = `${todayStr}T${hour.toString().padStart(2, '0')}`;
    const hVisits = todayVisits.filter(v => v.timestamp?.startsWith(hPrefix));
    return {
      date: `${hour.toString().padStart(2, '0')}h`,
      day_name: `${hour.toString().padStart(2, '0')}h00`,
      visitors: new Set(hVisits.map(v => v.visitor_id)).size,
      page_views: hVisits.length,
    };
  });

  const getDailyMetrics = (daysCount: number) => {
    return Array.from({ length: daysCount }, (_, idx) => {
      const i = daysCount - 1 - idx;
      const d = new Date(nowMs - i * 86400000);
      const dStr = d.toISOString().slice(0, 10);
      const dayVisits = visits.filter(v => v.timestamp?.startsWith(dStr));
      return {
        date: dStr,
        day_name: dayNames[d.getDay()],
        visitors: new Set(dayVisits.map(v => v.visitor_id)).size,
        page_views: dayVisits.length,
      };
    });
  };

  const chart7Days = getDailyMetrics(7);
  const chart30Days = getDailyMetrics(30);
  const chart90Days = getDailyMetrics(90);

  // Top Pages
  const pageCounts: Record<string, { views: number; visitors: Set<string> }> = {};
  for (const v of visits) {
    const p = v.path || '/';
    if (!pageCounts[p]) pageCounts[p] = { views: 0, visitors: new Set() };
    pageCounts[p].views++;
    pageCounts[p].visitors.add(v.visitor_id);
  }
  const totalViews = Math.max(1, visits.length);
  const topPagesList = Object.entries(pageCounts)
    .map(([path, data]) => {
      let label = 'Accueil';
      if (path.includes('police')) label = 'Police';
      else if (path.includes('gendarmerie')) label = 'Gendarmerie';
      else if (path.includes('douane')) label = 'Douane';
      else if (path.includes('greffe')) label = 'Greffe';
      else if (path.includes('ena')) label = 'ENA';
      else if (path.includes('contact')) label = 'Contact';
      else if (path.includes('apropos')) label = 'À propos';
      return { page: label, views: data.views };
    })
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);

  // Device Breakdown
  let mobileCount = 0;
  let desktopCount = 0;
  let tabletCount = 0;
  for (const v of visits) {
    if (v.device_type === 'mobile') mobileCount++;
    else if (v.device_type === 'tablet') tabletCount++;
    else desktopCount++;
  }
  const totalDevices = mobileCount + desktopCount + tabletCount;
  const deviceBreakdown = {
    mobile: mobileCount,
    desktop: desktopCount,
    tablet: tabletCount,
    mobile_percent: totalDevices > 0 ? Math.round((mobileCount / totalDevices) * 100) : 0,
    desktop_percent: totalDevices > 0 ? Math.round((desktopCount / totalDevices) * 100) : 0,
    tablet_percent: totalDevices > 0 ? Math.round((tabletCount / totalDevices) * 100) : 0,
  };

  // Traffic Sources
  const sourceMap: Record<string, number> = {
    'Google': 0,
    'TikTok': 0,
    'Facebook': 0,
    'Instagram': 0,
    'Accès direct': 0,
    'Autres sites': 0,
  };
  for (const v of visits) {
    const ref = (v.referrer || '').toLowerCase();
    if (!ref || ref === 'direct' || ref.includes('localhost')) {
      sourceMap['Accès direct']++;
    } else if (ref.includes('google')) {
      sourceMap['Google']++;
    } else if (ref.includes('tiktok')) {
      sourceMap['TikTok']++;
    } else if (ref.includes('facebook') || ref.includes('fb.com')) {
      sourceMap['Facebook']++;
    } else if (ref.includes('instagram')) {
      sourceMap['Instagram']++;
    } else {
      sourceMap['Autres sites']++;
    }
  }
  const trafficSources = Object.entries(sourceMap)
    .filter(([_, count]) => count > 0)
    .map(([name, count]) => ({
      name,
      count,
      percent: visits.length > 0 ? Math.round((count / visits.length) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // Recent Activity
  const recentActivity = visits
    .slice(-20)
    .reverse()
    .map(v => {
      const d = new Date(v.timestamp);
      const timeStr = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      let pageName = 'Accueil';
      if (v.path?.includes('police')) pageName = 'Police';
      else if (v.path?.includes('gendarmerie')) pageName = 'Gendarmerie';
      else if (v.path?.includes('douane')) pageName = 'Douane';
      else if (v.path?.includes('greffe')) pageName = 'Greffe';
      else if (v.path?.includes('ena')) pageName = 'ENA';
      const devName = v.device_type === 'mobile' ? 'Mobile' : (v.device_type === 'tablet' ? 'Tablette' : 'Ordinateur');
      return {
        time: timeStr,
        page: pageName,
        device: devName,
        country: v.country || 'Sénégal',
        timestamp: v.timestamp,
        text: `${timeStr} — ${pageName} — ${devName} — ${v.country || 'Sénégal'}`,
      };
    });

  return res.status(200).json({
    visitors_today: uniqueToday,
    visitors_yesterday: uniqueYesterday,
    visitors_7_days: unique7Days,
    visitors_this_week: unique7Days,
    visitors_30_days: unique30Days,
    visitors_this_month: unique30Days,
    visitors_total: uniqueTotal,
    total_visitors: uniqueTotal,
    page_views: visits.length,
    total_page_views: visits.length,
    active_visitors_now: activeVisitorsNow,
    visitors_growth_today_vs_yesterday: growthToday,
    chart_today: chartToday,
    chart_7_days: chart7Days,
    chart_30_days: chart30Days,
    chart_90_days: chart90Days,
    top_pages_list: topPagesList,
    device_breakdown: deviceBreakdown,
    traffic_sources: trafficSources,
    recent_activity: recentActivity,
    last_updated: new Date().toISOString(),
  });
}
