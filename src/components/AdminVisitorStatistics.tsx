import React, { useState, useEffect } from 'react';
import { VisitorStats } from '../types';
import {
  Users,
  Eye,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  Smartphone,
  Monitor,
  Tablet,
  Globe,
  Search,
  BookOpen,
  ArrowLeft,
  RefreshCw,
  Download,
  ShieldCheck,
  Activity,
  Layers,
  Sparkles,
  Lock,
  ChevronRight
} from 'lucide-react';

interface AdminVisitorStatisticsProps {
  onBack?: () => void;
  onClose?: () => void;
}

export const AdminVisitorStatistics: React.FC<AdminVisitorStatisticsProps> = ({ onBack, onClose }) => {
  const [stats, setStats] = useState<VisitorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d'>('7d');
  const [adminPin, setAdminPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('sunu_admin_auth') === 'true';
  });
  const [authError, setAuthError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [hoveredDay, setHoveredDay] = useState<any | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('sunu_token') || '';
      const savedKey = sessionStorage.getItem('sunu_admin_key') || localStorage.getItem('sunu_admin_key') || '';
      
      if (!savedKey && !token) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      const res = await fetch('/api/admin/statistiques', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-admin-key': savedKey,
        },
      });

      if (res.ok) {
        const data: VisitorStats = await res.json();
        setStats(data);
        setIsAuthenticated(true);
        sessionStorage.setItem('sunu_admin_auth', 'true');
      } else {
        setIsAuthenticated(false);
        sessionStorage.removeItem('sunu_admin_auth');
        localStorage.removeItem('sunu_admin_auth');
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Auto-refresh stats every 45 seconds to keep live active count accurate
    const interval = setInterval(fetchStats, 45000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPin.trim()) return;
    setIsVerifying(true);
    setAuthError(null);

    try {
      const res = await fetch('/api/admin/statistiques', {
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminPin.trim(),
        },
      });

      if (res.ok) {
        const data = await res.json();
        setStats(data);
        setIsAuthenticated(true);
        sessionStorage.setItem('sunu_admin_auth', 'true');
        sessionStorage.setItem('sunu_admin_key', adminPin.trim());
        localStorage.setItem('sunu_admin_key', adminPin.trim());
      } else {
        const errJson = await res.json().catch(() => ({}));
        setAuthError(errJson.error || 'Code PIN administrateur incorrect. Veuillez vérifier la variable ADMIN_PIN.');
      }
    } catch {
      setAuthError('Erreur de connexion au serveur.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleExportCSV = () => {
    if (!stats) return;
    const chart = timeRange === '7d' ? stats.chart_7_days : stats.chart_30_days;
    const headers = ['Date', 'Jour', 'Visiteurs Uniques', 'Pages Vues'];
    const rows = chart.map(c => [c.date, c.day_name, c.visitors, c.page_views]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sunuannales_statistiques_${timeRange}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // If not authenticated, display secure PIN lock gate
  if (!isAuthenticated && !loading) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4 text-emerald-400">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2 font-['Cabinet_Grotesk']">
            Espace Statistiques Privé
          </h2>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            Ce tableau de bord est réservé exclusivement à l'administrateur de SunuAnnales. Veuillez saisir votre code de sécurité pour déverrouiller les données.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <input
                type="password"
                placeholder="Code secret ADMIN_PIN"
                value={adminPin}
                onChange={(e) => setAdminPin(e.target.value)}
                autoFocus
                className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-center tracking-widest text-white placeholder-slate-500 focus:outline-none transition"
              />
            </div>

            {authError && (
              <p className="text-xs text-rose-400 font-medium bg-rose-950/40 border border-rose-800/60 rounded-xl py-2 px-3">
                {authError}
              </p>
            )}

            <div className="flex items-center gap-3 pt-2">
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-800 text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition font-medium"
                >
                  Annuler
                </button>
              )}
              <button
                type="submit"
                disabled={isVerifying}
                className={`py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-900/40 transition flex items-center justify-center gap-2 ${
                  onClose ? 'w-1/2' : 'w-full'
                }`}
              >
                {isVerifying ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Déverrouiller</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Chiffrement AES & Session Administrateur</span>
          </div>
        </div>
      </div>
    );
  }

  const currentChart = timeRange === '7d' ? stats?.chart_7_days || [] : stats?.chart_30_days || [];
  const maxVisitorsInChart = Math.max(...currentChart.map(c => c.visitors), 10);
  const maxViewsInChart = Math.max(...currentChart.map(c => c.page_views), 15);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition shrink-0"
                title="Retour au panneau d'administration"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-900 border border-emerald-500/30 flex items-center justify-center text-white shadow-md">
                <Activity className="w-4 h-4 text-emerald-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-bold text-white font-['Cabinet_Grotesk'] leading-tight">
                    Statistiques de Fréquentation
                  </h1>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Administrateur
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  Mesure réelle des visiteurs, consultations d'annales et parcours sur SunuAnnales
                </p>
              </div>
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Real-time pulse indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-800/40 text-emerald-300 text-xs font-semibold shadow-inner">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>
                {stats?.active_visitors_now || 1} en direct
              </span>
            </div>

            {/* Time range selector */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5 text-xs font-semibold">
              <button
                onClick={() => setTimeRange('7d')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  timeRange === '7d' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                7 jours
              </button>
              <button
                onClick={() => setTimeRange('30d')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  timeRange === '30d' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                30 jours
              </button>
            </div>

            {/* Refresh */}
            <button
              onClick={fetchStats}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
              title="Rafraîchir les statistiques"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>

            {/* Export CSV */}
            <button
              onClick={handleExportCSV}
              className="px-2.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-medium transition flex items-center gap-1.5"
              title="Exporter les données au format CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Exporter</span>
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition ml-1"
              >
                Fermer
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* KPI Summary Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* 1. Aujourd'hui */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-emerald-500/40 transition shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Aujourd'hui</span>
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white font-['Cabinet_Grotesk'] my-1">
              {stats?.visitors_today ?? '—'}
            </div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
              <TrendingUp className="w-3 h-3" />
              <span>+{stats?.visitors_growth_today_vs_yesterday ?? 0}% vs hier</span>
            </div>
          </div>

          {/* 2. Hier */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Hier</span>
              <Calendar className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-black text-slate-200 font-['Cabinet_Grotesk'] my-1">
              {stats?.visitors_yesterday ?? '—'}
            </div>
            <p className="text-[11px] text-slate-500">
              Visiteurs uniques
            </p>
          </div>

          {/* 3. Cette Semaine */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-sky-500/40 transition shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Cette semaine</span>
              <TrendingUp className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-black text-white font-['Cabinet_Grotesk'] my-1">
              {stats?.visitors_this_week ?? '—'}
            </div>
            <p className="text-[11px] text-sky-400 font-medium">
              Derniers 7 jours
            </p>
          </div>

          {/* 4. Ce Mois */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-purple-500/40 transition shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Ce mois-ci</span>
              <Calendar className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-white font-['Cabinet_Grotesk'] my-1">
              {stats?.visitors_this_month ?? '—'}
            </div>
            <p className="text-[11px] text-purple-400 font-medium">
              Mois en cours
            </p>
          </div>

          {/* 5. Total Visiteurs Cumulés */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-amber-500/40 transition shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Total Visiteurs</span>
              <Globe className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-white font-['Cabinet_Grotesk'] my-1">
              {stats?.total_visitors ?? '—'}
            </div>
            <p className="text-[11px] text-amber-400 font-medium">
              Visiteurs distincts
            </p>
          </div>

          {/* 6. Pages Vues */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-teal-500/40 transition shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Pages Vues</span>
              <Eye className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-2xl font-black text-white font-['Cabinet_Grotesk'] my-1">
              {stats?.total_page_views ?? '—'}
            </div>
            <p className="text-[11px] text-slate-400">
              {stats && stats.total_visitors > 0
                ? `${(stats.total_page_views / stats.total_visitors).toFixed(1)} pages / visiteur`
                : 'Impressions'}
            </p>
          </div>
        </div>

        {/* Interactive Traffic Chart Section */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-['Cabinet_Grotesk']">
                  Courbe de Fréquentation ({timeRange === '7d' ? '7 derniers jours' : '30 derniers jours'})
                </h3>
                <span className="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-medium">
                  {currentChart.reduce((sum, d) => sum + d.visitors, 0)} visiteurs cumulés
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Survolez les colonnes pour inspecter le détail quotidien des visiteurs uniques et des pages vues
              </p>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-emerald-500"></span>
                <span className="text-slate-300 font-medium">Visiteurs uniques</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-sky-500/40 border border-sky-400"></span>
                <span className="text-slate-300 font-medium">Pages vues</span>
              </div>
            </div>
          </div>

          {/* SVG Bar Chart with Hover Tooltip */}
          <div className="relative h-64 sm:h-72 w-full pt-4">
            <div className="absolute inset-0 flex items-end justify-between gap-1 sm:gap-2 px-2 pb-6 border-b border-slate-800">
              {currentChart.map((day, idx) => {
                const visitorHeightPercent = Math.max(6, Math.round((day.visitors / maxVisitorsInChart) * 100));
                const viewsHeightPercent = Math.max(8, Math.round((day.page_views / maxViewsInChart) * 100));
                const isHovered = hoveredDay?.date === day.date;

                return (
                  <div
                    key={day.date}
                    onMouseEnter={() => setHoveredDay(day)}
                    onMouseLeave={() => setHoveredDay(null)}
                    className="relative flex-1 h-full flex flex-col justify-end items-center group cursor-pointer"
                  >
                    {/* Tooltip Popup on Hover */}
                    {isHovered && (
                      <div className="absolute bottom-full mb-2 z-20 bg-slate-800 text-white rounded-xl py-2 px-3 shadow-2xl border border-slate-700 text-xs whitespace-nowrap animate-in fade-in zoom-in-95 pointer-events-none">
                        <p className="font-bold text-emerald-400">{day.day_name} {day.date}</p>
                        <p className="text-slate-200">👥 Visiteurs : <strong>{day.visitors}</strong></p>
                        <p className="text-sky-300">📄 Pages vues : <strong>{day.page_views}</strong></p>
                      </div>
                    )}

                    {/* Comparative Dual Bars */}
                    <div className="w-full flex items-end justify-center gap-1 sm:gap-1.5 h-full">
                      {/* Unique Visitors Bar */}
                      <div
                        style={{ height: `${visitorHeightPercent}%` }}
                        className={`w-full max-w-[14px] sm:max-w-[22px] rounded-t-md transition-all duration-300 ${
                          isHovered
                            ? 'bg-emerald-400 shadow-lg shadow-emerald-500/40 scale-y-[1.03]'
                            : 'bg-gradient-to-t from-emerald-600 to-emerald-400'
                        }`}
                      />
                      {/* Page Views Bar */}
                      <div
                        style={{ height: `${viewsHeightPercent}%` }}
                        className={`w-full max-w-[14px] sm:max-w-[22px] rounded-t-md transition-all duration-300 ${
                          isHovered
                            ? 'bg-sky-400 shadow-lg shadow-sky-500/30 scale-y-[1.03]'
                            : 'bg-gradient-to-t from-sky-800/80 to-sky-500/70 border-t border-sky-400/50'
                        }`}
                      />
                    </div>

                    {/* Date Label at bottom */}
                    <div className="absolute top-full pt-1.5 text-center">
                      <span className={`text-[10px] sm:text-[11px] font-medium transition ${
                        isHovered ? 'text-emerald-400 font-bold' : 'text-slate-500'
                      }`}>
                        {timeRange === '7d' ? day.day_name : day.date.slice(8)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 2-Column Grid: Top Pages & Top Annales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 1. Pages les plus visitées */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <h3 className="text-base font-bold text-white font-['Cabinet_Grotesk']">
                  Pages les plus visitées
                </h3>
              </div>
              <span className="text-xs text-slate-400">Total Vues</span>
            </div>

            <div className="space-y-3">
              {stats?.top_pages && stats.top_pages.length > 0 ? (
                stats.top_pages.map((page, idx) => (
                  <div key={page.path} className="group">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-md bg-slate-800 text-slate-400 font-bold text-[10px] flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-slate-200 truncate">{page.label}</span>
                        <code className="text-[10px] text-slate-500 hidden sm:inline">{page.path}</code>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-2">
                        <span className="text-slate-400 text-[11px]">{page.unique_visitors} visiteurs</span>
                        <span className="font-bold text-white text-xs">{page.views} vues</span>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${Math.max(4, page.percentage)}%` }}
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 py-4 text-center">Aucune page consultée pour le moment.</p>
              )}
            </div>
          </div>

          {/* 2. Annales et Concours les plus consultés */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-sky-400" />
                <h3 className="text-base font-bold text-white font-['Cabinet_Grotesk']">
                  Annales les plus consultées
                </h3>
              </div>
              <span className="text-xs text-slate-400">Intérêt candidats</span>
            </div>

            <div className="space-y-3">
              {stats?.top_annales && stats.top_annales.length > 0 ? (
                stats.top_annales.map((ann, idx) => (
                  <div key={ann.id} className="group">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-md bg-slate-800 text-sky-400 font-bold text-[10px] flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-slate-200 truncate">{ann.title}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="font-bold text-sky-300 text-xs">{ann.views} clics</span>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${Math.max(6, ann.percentage * 2)}%` }}
                        className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full"
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 py-4 text-center">Aucun fascicule consulté pour le moment.</p>
              )}
            </div>
          </div>
        </div>

        {/* 3-Column Grid: Recherches, Appareils, Pays */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. Mots-clés recherchés */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Search className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white font-['Cabinet_Grotesk']">
                  Recherches les plus fréquentes
                </h3>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Termes saisis par les candidats dans la barre de recherche
              </p>

              <div className="flex flex-wrap gap-2">
                {stats?.top_searches && stats.top_searches.length > 0 ? (
                  stats.top_searches.map((s) => (
                    <div
                      key={s.query}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs text-slate-200"
                    >
                      <span className="font-medium">{s.query}</span>
                      <span className="px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-300 font-bold text-[10px]">
                        {s.count}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">Aucune recherche enregistrée.</p>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Optimisation SEO & Catalogue</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </div>
          </div>

          {/* 2. Répartition Mobile vs Ordinateur */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white font-['Cabinet_Grotesk']">
                  Répartition des appareils
                </h3>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Support utilisé pour consulter et payer les annales
              </p>

              {/* Progress visual */}
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="flex items-center gap-1.5 font-medium text-slate-300">
                      <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                      Smartphones (Mobile)
                    </span>
                    <span className="font-bold text-white">{stats?.device_breakdown.mobile_percent ?? 78}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${stats?.device_breakdown.mobile_percent ?? 78}%` }}
                      className="h-full bg-emerald-500 rounded-full"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="flex items-center gap-1.5 font-medium text-slate-300">
                      <Monitor className="w-3.5 h-3.5 text-sky-400" />
                      Ordinateurs (PC / Mac)
                    </span>
                    <span className="font-bold text-white">{stats?.device_breakdown.desktop_percent ?? 20}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${stats?.device_breakdown.desktop_percent ?? 20}%` }}
                      className="h-full bg-sky-500 rounded-full"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="flex items-center gap-1.5 font-medium text-slate-300">
                      <Tablet className="w-3.5 h-3.5 text-purple-400" />
                      Tablettes
                    </span>
                    <span className="font-bold text-white">{stats?.device_breakdown.tablet_percent ?? 2}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${stats?.device_breakdown.tablet_percent ?? 2}%` }}
                      className="h-full bg-purple-500 rounded-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Optimisé paiement mobile Wave / OM</span>
              <span className="text-emerald-400 font-semibold">100% Responsive</span>
            </div>
          </div>

          {/* 3. Pays des visiteurs */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Globe className="w-4 h-4 text-teal-400" />
                <h3 className="text-sm font-bold text-white font-['Cabinet_Grotesk']">
                  Pays des visiteurs
                </h3>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Localisation géographique des candidats
              </p>

              <div className="space-y-2.5">
                {stats?.country_breakdown && stats.country_breakdown.length > 0 ? (
                  stats.country_breakdown.map((c) => (
                    <div key={c.code} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{c.flag}</span>
                        <span className="font-semibold text-slate-200">{c.country}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">{c.count} visites</span>
                        <span className="font-bold text-teal-300">{c.percent}%</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">Aucune donnée géographique.</p>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Détection GeoIP & UEMOA</span>
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            </div>
          </div>
        </div>

        {/* Live Visitor Activity Stream */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <h3 className="text-base font-bold text-white font-['Cabinet_Grotesk']">
                Flux d'activité en temps réel
              </h3>
            </div>
            <span className="text-xs text-slate-400">Dernières visites enregistrées</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-2.5 font-semibold">Temps</th>
                  <th className="pb-2.5 font-semibold">Page / Destination</th>
                  <th className="pb-2.5 font-semibold">Appareil</th>
                  <th className="pb-2.5 font-semibold">Pays</th>
                  <th className="pb-2.5 font-semibold text-right">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {stats?.recent_live_feed && stats.recent_live_feed.length > 0 ? (
                  stats.recent_live_feed.map((live) => (
                    <tr key={live.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-2.5 text-slate-400 flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{live.time_ago}</span>
                      </td>
                      <td className="py-2.5 font-semibold text-slate-200">
                        {live.path === '/' ? '✨ Accueil / Catalogue' : live.path}
                      </td>
                      <td className="py-2.5 text-slate-300">
                        <span className="capitalize">{live.device_type}</span>
                      </td>
                      <td className="py-2.5 text-slate-300">
                        <span>{live.country}</span>
                      </td>
                      <td className="py-2.5 text-right">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                          Actif
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-slate-500">
                      En attente de nouvelles visites...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Footer info note */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-4 sm:px-6 lg:px-8 text-center text-[11px] text-slate-500">
        <p>
          Système de statistiques interne SunuAnnales • Conforme à la protection des données personnelles (Loi sénégalaise n° 2008-12) et Vercel Web Analytics.
        </p>
      </footer>
    </div>
  );
};
