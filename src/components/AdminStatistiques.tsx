import React, { useState, useEffect, useRef } from 'react';
import { VisitorStats, DayMetric, Annale } from '../types';
import {
  Users,
  Eye,
  Activity,
  Calendar,
  Clock,
  Smartphone,
  Monitor,
  Tablet,
  Globe,
  RefreshCw,
  LogOut,
  ShieldCheck,
  BarChart3,
  Compass,
  ArrowUpRight,
  TrendingUp,
  FileText,
  Upload,
  Download,
  CheckCircle2,
  RotateCcw,
  Trash2,
} from 'lucide-react';

interface AdminStatistiquesProps {
  onLogout: () => void;
}

export const AdminStatistiques: React.FC<AdminStatistiquesProps> = ({ onLogout }) => {
  const [activeAdminTab, setActiveAdminTab] = useState<'statistiques' | 'pdfs'>('statistiques');
  const [stats, setStats] = useState<VisitorStats | null>(null);
  const [annales, setAnnales] = useState<Annale[]>([]);
  const [uploadingPdfId, setUploadingPdfId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [chartPeriod, setChartPeriod] = useState<'today' | '7d' | '30d' | '90d'>('7d');
  const [adminEmail, setAdminEmail] = useState<string>(() => {
    return sessionStorage.getItem('sunu_admin_email') || 'allandiaye348@gmail.com';
  });
  const pdfFileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleResetStats = async () => {
    setIsResetting(true);
    try {
      const token = sessionStorage.getItem('sunu_admin_token') || localStorage.getItem('sunu_token') || '';
      const savedKey = sessionStorage.getItem('sunu_admin_key') || localStorage.getItem('sunu_admin_key') || '';
      const res = await fetch('/api/admin/statistiques/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-admin-key': savedKey,
          'x-admin-token': token,
        },
      });
      if (res.ok) {
        setShowResetConfirm(false);
        setActionMessage('Toutes les statistiques de visiteurs ont été remises à 0.');
        await fetchStats(true);
      }
    } catch (err) {
      console.error('Failed to reset stats:', err);
    } finally {
      setIsResetting(false);
    }
  };

  const fetchAnnales = async () => {
    try {
      const res = await fetch('/api/annales');
      if (res.ok) {
        const data = await res.json();
        setAnnales(data);
      }
    } catch (_err) {
      // Ignorer
    }
  };

  const handleUploadPdfFile = async (annaleId: string, file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      alert('Veuillez sélectionner un fichier au format .PDF');
      return;
    }
    setUploadingPdfId(annaleId);
    setActionMessage(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target?.result as string;
        if (!base64Data) {
          setUploadingPdfId(null);
          return;
        }

        const token = sessionStorage.getItem('sunu_admin_token') || '';
        const res = await fetch('/api/admin/upload-pdf', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}`, 'x-admin-token': token } : {}),
          },
          body: JSON.stringify({
            annale_id: annaleId,
            pdf_data: base64Data,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setActionMessage(data.message || 'Fichier PDF original enregistré avec succès !');
          setAnnales(prev =>
            prev.map(a =>
              a.id === annaleId ? { ...a, pdf_path: data.pdf_url, has_original_pdf: true } : a
            )
          );
        } else {
          alert('Erreur lors du téléversement du fichier PDF.');
        }
        setUploadingPdfId(null);
      };
      reader.readAsDataURL(file);
    } catch {
      setUploadingPdfId(null);
    }
  };

  const fetchStats = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const token = sessionStorage.getItem('sunu_admin_token') || localStorage.getItem('sunu_token') || '';
      const res = await fetch('/api/admin/statistiques', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.status === 401 || res.status === 403) {
        // Redirection obligatoire si non autorisé
        onLogout();
        return;
      }

      if (res.ok) {
        const data: VisitorStats = await res.json();
        setStats(data);
      }
    } catch (_err) {
      // En cas d'erreur réseau
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchAnnales();
    // Rafraîchissement automatique toutes les 30 secondes pour le suivi temps réel
    const interval = setInterval(() => fetchStats(false), 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogoutClick = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch (_e) {
      // Ignorer
    }
    sessionStorage.removeItem('sunu_admin_token');
    sessionStorage.removeItem('sunu_admin_email');
    localStorage.removeItem('sunu_admin_auth');
    onLogout();
  };

  // Sélection des données du graphique selon la période
  const currentChartData: DayMetric[] = React.useMemo(() => {
    if (!stats) return [];
    if (chartPeriod === 'today') return stats.chart_today || [];
    if (chartPeriod === '7d') return stats.chart_7_days || [];
    if (chartPeriod === '30d') return stats.chart_30_days || [];
    if (chartPeriod === '90d') return stats.chart_90_days || [];
    return [];
  }, [stats, chartPeriod]);

  const maxChartValue = React.useMemo(() => {
    if (!currentChartData || currentChartData.length === 0) return 1;
    const max = Math.max(...currentChartData.map((d) => d.visitors || 0));
    return max > 0 ? max : 1;
  }, [currentChartData]);

  const hasChartData = currentChartData.some((d) => d.visitors > 0 || d.page_views > 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                <span>Statistiques Sunu-Annales</span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-bold">
                  Espace Privé
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 truncate max-w-[200px] sm:max-w-none">
                Connecté en tant que <span className="text-emerald-300 font-mono">{adminEmail}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => fetchStats(true)}
              disabled={refreshing}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
              title="Rafraîchir les données"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
              <span className="hidden sm:inline">Actualiser</span>
            </button>

            <button
              onClick={() => setShowResetConfirm(true)}
              className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:text-rose-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="Remettre toutes les statistiques de visiteurs à 0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Remettre à 0</span>
            </button>

            <button
              onClick={handleLogoutClick}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
              title="Se déconnecter"
            >
              <LogOut className="w-4 h-4" />
              <span>Se déconnecter</span>
            </button>
          </div>
        </div>
      </header>

      {/* Confirmation modal for resetting stats to 0 */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-white font-['Cabinet_Grotesk']">
                Remettre les statistiques à 0 ?
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Cette action va réinitialiser l'historique des visites et remettre tous les compteurs de visiteurs (aujourd'hui, semaine, mois, total, graphiques) à <strong>0</strong>.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                disabled={isResetting}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleResetStats}
                disabled={isResetting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30"
              >
                {isResetting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <RotateCcw className="w-4 h-4" />
                )}
                <span>Confirmer (Mettre à 0)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Tab Switcher */}
      <div className="bg-slate-900/60 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 overflow-x-auto py-2.5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveAdminTab('statistiques')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeAdminTab === 'statistiques'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Statistiques des Visiteurs</span>
            </button>

            <button
              onClick={() => setActiveAdminTab('pdfs')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeAdminTab === 'pdfs'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Fichiers PDF Originaux ({annales.length})</span>
            </button>
          </div>

          {actionMessage && (
            <div className="text-xs text-emerald-400 font-medium px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1.5 animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{actionMessage}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        {activeAdminTab === 'statistiques' && (
          <>
        {/* ========================================================= */}
        {/* SECTION 3 : LES 6 CARTES STATISTIQUES */}
        {/* ========================================================= */}
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Carte 1 : Visiteurs aujourd'hui */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Visiteurs aujourd'hui
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white font-mono">
                {loading ? '—' : (stats?.visitors_today ?? 0).toLocaleString('fr-FR')}
              </div>
              <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-400" />
                <span>Visiteurs uniques du jour</span>
              </div>
            </div>

            {/* Carte 2 : Visiteurs des 7 derniers jours */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Visiteurs des 7 derniers jours
                </span>
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white font-mono">
                {loading ? '—' : (stats?.visitors_7_days ?? 0).toLocaleString('fr-FR')}
              </div>
              <div className="text-[11px] text-slate-500 mt-2">
                <span>Sur les 7 derniers jours</span>
              </div>
            </div>

            {/* Carte 3 : Visiteurs des 30 derniers jours */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Visiteurs des 30 derniers jours
                </span>
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white font-mono">
                {loading ? '—' : (stats?.visitors_30_days ?? 0).toLocaleString('fr-FR')}
              </div>
              <div className="text-[11px] text-slate-500 mt-2">
                <span>Sur les 30 derniers jours</span>
              </div>
            </div>

            {/* Carte 4 : Visiteurs totaux */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Visiteurs totaux
                </span>
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <Globe className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white font-mono">
                {loading ? '—' : (stats?.visitors_total ?? 0).toLocaleString('fr-FR')}
              </div>
              <div className="text-[11px] text-slate-500 mt-2">
                <span>Total visiteurs uniques</span>
              </div>
            </div>

            {/* Carte 5 : Pages vues */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Pages vues
                </span>
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                  <Eye className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white font-mono">
                {loading ? '—' : (stats?.page_views ?? 0).toLocaleString('fr-FR')}
              </div>
              <div className="text-[11px] text-slate-500 mt-2">
                <span>Volume total de consultations</span>
              </div>
            </div>

            {/* Carte 6 : Visiteurs actuellement actifs */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-emerald-500/30 shadow-sm relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/20">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Actuellement actifs
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
                {loading ? '—' : (stats?.active_visitors_now ?? 0).toLocaleString('fr-FR')}
              </div>
              <div className="text-[11px] text-emerald-500/80 mt-2">
                <span>Actifs (dernières 10 min)</span>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 4 : GRAPHIQUE DES VISITEURS PAR JOUR */}
        {/* ========================================================= */}
        <section className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-400" />
                <span>Nombre de visiteurs par jour</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Évolution temporelle des visiteurs uniques réels
              </p>
            </div>

            {/* Périodes : Aujourd'hui | 7 jours | 30 jours | 90 jours */}
            <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-xl self-start sm:self-auto">
              {(
                [
                  { id: 'today', label: "Aujourd'hui" },
                  { id: '7d', label: '7 jours' },
                  { id: '30d', label: '30 jours' },
                  { id: '90d', label: '90 jours' },
                ] as const
              ).map((p) => (
                <button
                  key={p.id}
                  onClick={() => setChartPeriod(p.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    chartPeriod === p.id
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Zone du graphique */}
          <div className="w-full">
            {!hasChartData ? (
              <div className="py-20 text-center text-slate-500 font-medium text-sm flex flex-col items-center justify-center">
                <BarChart3 className="w-10 h-10 text-slate-700 mb-3" />
                <span>Aucune donnée disponible pour cette période</span>
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <div className="min-w-[500px] h-64 flex items-end gap-2 pt-6 pb-2 border-b border-slate-800">
                  {currentChartData.map((item, idx) => {
                    const heightPercent = Math.max(
                      6,
                      Math.round((item.visitors / maxChartValue) * 100)
                    );
                    return (
                      <div
                        key={idx}
                        className="flex-1 flex flex-col items-center h-full justify-end group relative"
                      >
                        {/* Tooltip on hover */}
                        <div className="opacity-0 group-hover:opacity-100 transition pointer-events-none absolute -top-12 z-20 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-[11px] shadow-xl whitespace-nowrap">
                          <p className="font-bold">{item.date}</p>
                          <p className="text-emerald-400 font-mono">
                            {item.visitors} visiteur{item.visitors > 1 ? 's' : ''} ({item.page_views} vue{item.page_views > 1 ? 's' : ''})
                          </p>
                        </div>

                        {/* Bar */}
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full max-w-[28px] rounded-t-md transition-all duration-300 ${
                            item.visitors > 0
                              ? 'bg-emerald-500 group-hover:bg-emerald-400 shadow-sm shadow-emerald-500/20'
                              : 'bg-slate-800'
                          }`}
                        />

                        {/* Label underneath */}
                        <span className="text-[10px] text-slate-500 mt-2 truncate max-w-full text-center">
                          {chartPeriod === 'today'
                            ? item.date
                            : chartPeriod === '7d'
                            ? item.day_name
                            : item.date.slice(5)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 7 & 8 : PAGES PLUS CONSULTÉES + APPAREILS */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 7. Pages les plus consultées */}
          <section className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col">
            <div className="mb-6">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Eye className="w-5 h-5 text-sky-400" />
                <span>Pages les plus consultées</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Pages les plus visitées enregistrées en direct
              </p>
            </div>

            <div className="flex-1 overflow-x-auto">
              {(!stats?.top_pages_list || stats.top_pages_list.length === 0) ? (
                <div className="py-16 text-center text-slate-500 text-sm">
                  Aucune donnée disponible
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-bold text-[10px]">
                      <th className="pb-3 font-semibold">Page</th>
                      <th className="pb-3 font-semibold text-right">Visites</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {stats.top_pages_list.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30 transition">
                        <td className="py-3 font-semibold text-white flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-slate-800 text-slate-400 flex items-center justify-center text-[10px] font-mono">
                            {idx + 1}
                          </span>
                          <span>{row.page}</span>
                        </td>
                        <td className="py-3 text-right font-mono font-bold text-emerald-400">
                          {row.views.toLocaleString('fr-FR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          {/* 8. Appareils des visiteurs */}
          <section className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col">
            <div className="mb-6">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-indigo-400" />
                <span>Appareils des visiteurs</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Répartition des visites selon le type d'appareil
              </p>
            </div>

            {(!stats?.device_breakdown || (stats.device_breakdown.mobile === 0 && stats.device_breakdown.desktop === 0 && stats.device_breakdown.tablet === 0)) ? (
              <div className="flex-1 flex items-center justify-center py-16 text-slate-500 text-sm">
                Aucune donnée disponible
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-center space-y-6">
                {/* Mobile */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="flex items-center gap-2 text-white">
                      <span>📱 Mobile</span>
                    </span>
                    <span className="font-mono text-emerald-400">
                      {stats.device_breakdown.mobile_percent}% ({stats.device_breakdown.mobile})
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      style={{ width: `${stats.device_breakdown.mobile_percent}%` }}
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    />
                  </div>
                </div>

                {/* Ordinateur */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="flex items-center gap-2 text-white">
                      <span>💻 Ordinateur</span>
                    </span>
                    <span className="font-mono text-sky-400">
                      {stats.device_breakdown.desktop_percent}% ({stats.device_breakdown.desktop})
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      style={{ width: `${stats.device_breakdown.desktop_percent}%` }}
                      className="h-full bg-sky-500 rounded-full transition-all duration-500"
                    />
                  </div>
                </div>

                {/* Tablette */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="flex items-center gap-2 text-white">
                      <span>📲 Tablette</span>
                    </span>
                    <span className="font-mono text-purple-400">
                      {stats.device_breakdown.tablet_percent}% ({stats.device_breakdown.tablet})
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      style={{ width: `${stats.device_breakdown.tablet_percent}%` }}
                      className="h-full bg-purple-500 rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* ========================================================= */}
        {/* SECTION 9 & 10 : ORIGINE DU TRAFIC + ACTIVITÉ RÉCENTE */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 9. Origine des visiteurs */}
          <section className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Compass className="w-5 h-5 text-amber-400" />
                <span>Origine des visiteurs</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Sources de provenance et référents (Google, TikTok, Réseaux, Direct...)
              </p>
            </div>

            {(!stats?.traffic_sources || stats.traffic_sources.length === 0) ? (
              <div className="py-16 text-center text-slate-500 text-sm">
                Aucune donnée disponible
              </div>
            ) : (
              <div className="space-y-3">
                {stats.traffic_sources.map((src, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs"
                  >
                    <div className="font-semibold text-white flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      <span>{src.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-slate-400">{src.count} visite{src.count > 1 ? 's' : ''}</span>
                      <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                        {src.percent}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 10. Activité récente */}
          <section className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-400" />
                <span>Activité récente</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Historique chronologique des dernières visites réelles
              </p>
            </div>

            {(!stats?.recent_activity || stats.recent_activity.length === 0) ? (
              <div className="py-16 text-center text-slate-500 text-sm">
                Aucune donnée disponible
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {stats.recent_activity.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2 text-slate-300 font-mono truncate">
                      <span className="text-emerald-400 font-bold">{item.time}</span>
                      <span className="text-slate-600">—</span>
                      <span className="text-white font-medium truncate">{item.page}</span>
                      <span className="text-slate-600">—</span>
                      <span className="text-slate-400">{item.device}</span>
                      <span className="text-slate-600">—</span>
                      <span className="text-slate-400">{item.country}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
        </>
        )}

        {/* ========================================================= */}
        {/* ONGLET 2 : GESTION DES FICHIERS PDF ORIGINAUX */}
        {/* ========================================================= */}
        {activeAdminTab === 'pdfs' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-950/80 via-slate-900 to-indigo-950/80 border border-blue-800/40 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-400" />
                  <span>Gestion & Téléversement de vos Fichiers PDF Originaux</span>
                </h2>
                <p className="text-xs text-slate-300 mt-1.5 max-w-2xl leading-relaxed">
                  Déposez directement vos propres fichiers PDF pour chaque annale (Police, Gendarmerie, Douane, Greffe, ENA, etc.). Dès qu'un fichier PDF est téléversé, il est stocké en toute sécurité et servi directement aux candidats sans aucune modification ni altération de son contenu.
                </p>
              </div>
              <div className="shrink-0 flex items-center gap-2">
                <span className="px-3.5 py-2 rounded-xl bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-500/30 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Fichiers 100% préservés & intacts
                </span>
              </div>
            </div>

            {/* Grid of all annales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {annales.map((annale) => (
                <div
                  key={annale.id}
                  className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between transition"
                >
                  <div className="p-4 border-b border-slate-800/80 bg-slate-950/40 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase">
                        {annale.category}
                      </span>
                      <h3 className="text-xs font-bold text-white mt-1 line-clamp-1">{annale.title}</h3>
                    </div>
                  </div>

                  <div className="p-4 space-y-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={annale.cover_image || '/covers/police.jpg'}
                        alt={annale.title}
                        className="w-12 h-16 object-cover rounded-lg border border-slate-700 shrink-0 shadow-md"
                      />
                      <div className="text-xs space-y-1">
                        <p className="text-slate-300 font-semibold">{annale.total_exercises} exercices corrigés</p>
                        <p className="text-[11px] text-slate-500">Tarif officiel : 2 000 FCFA</p>
                        <div className="flex items-center gap-1.5 text-[11px] pt-0.5">
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Fichier PDF officiel actif
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 space-y-2">
                      <input
                        type="file"
                        accept=".pdf,application/pdf"
                        ref={(el) => {
                          pdfFileInputRefs.current[annale.id] = el;
                        }}
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadPdfFile(annale.id, file);
                        }}
                      />

                      <button
                        type="button"
                        disabled={uploadingPdfId === annale.id}
                        onClick={() => pdfFileInputRefs.current[annale.id]?.click()}
                        className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-md shadow-blue-950/40 cursor-pointer"
                      >
                        {uploadingPdfId === annale.id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Upload className="w-3.5 h-3.5" />
                        )}
                        <span>
                          {uploadingPdfId === annale.id
                            ? 'Téléversement en cours...'
                            : 'Remplacer / Téléverser mon PDF (.pdf)'}
                        </span>
                      </button>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <a
                          href={`/pdfs/${annale.id}.pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                          title="Visualiser le fichier PDF officiel original"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-400" />
                          <span>Voir PDF</span>
                        </a>
                        <a
                          href={`/api/annales/${annale.id}/download-pdf?token=${encodeURIComponent(sessionStorage.getItem('sunu_admin_token') || localStorage.getItem('sunu_token') || '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2 px-2.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 hover:text-emerald-200 border border-emerald-800/60 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                          title="Télécharger le fichier PDF officiel"
                        >
                          <Download className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Télécharger</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-[11px] text-slate-600">
        Espace d'administration privé Sunu-Annales • Statistiques réelles certifiées
      </footer>
    </div>
  );
};
