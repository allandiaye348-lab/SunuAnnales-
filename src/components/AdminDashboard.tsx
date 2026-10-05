import React, { useState, useEffect, useRef } from 'react';
import { AdminStats, PaymentRecord, User, Annale } from '../types';
import { AdminVisitorStatistics } from './AdminVisitorStatistics';
import { 
  TrendingUp, Users, ShoppingBag, AlertOctagon, CheckCircle2, 
  Clock, XCircle, Search, Download, RefreshCw, Eye, ShieldAlert, ShieldCheck,
  ArrowUpRight, BarChart3, Database, Key, Check, Image as ImageIcon,
  Upload, Link as LinkIcon, Camera, Sparkles, ArrowLeft, FileArchive, Activity
} from 'lucide-react';

interface AdminDashboardProps {
  onClose: () => void;
  initialTab?: 'overview' | 'statistiques' | 'payments' | 'failed' | 'users' | 'covers';
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose, initialTab = 'overview' }) => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [annales, setAnnales] = useState<Annale[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'statistiques' | 'payments' | 'failed' | 'users' | 'covers'>(initialTab);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRawResponse, setSelectedRawResponse] = useState<any | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [customUrls, setCustomUrls] = useState<Record<string, string>>({});
  const [paymentSettings, setPaymentSettings] = useState<any>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const batchFileInputRef = useRef<HTMLInputElement | null>(null);
  const [isBatchUploading, setIsBatchUploading] = useState(false);
  const getAdminKey = () => sessionStorage.getItem('sunu_admin_key') || localStorage.getItem('sunu_admin_key') || '';

  const handleBatchUploadFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setIsBatchUploading(true);
    setActionMessage(`Synchronisation de ${fileArray.length} affiche(s) en cours...`);

    const matchRules: { keywords: string[]; id: string }[] = [
      { keywords: ['police'], id: 'annale-police-sn' },
      { keywords: ['gendarmerie'], id: 'annale-gendarmerie-sn' },
      { keywords: ['douane'], id: 'annale-douane-sn' },
      { keywords: ['ena'], id: 'annale-ena-sn' },
      { keywords: ['ensoa'], id: 'annale-ensoa-sn' },
      { keywords: ['eaux', 'foret'], id: 'annale-eaux-forets-sn' },
      { keywords: ['inseps', '14.03.43'], id: 'annale-inseps-sn' },
      { keywords: ['fastef', 'pastef'], id: 'annale-fastef-sn' },
      { keywords: ['crem'], id: 'annale-crem-sn' },
      { keywords: ['endss'], id: 'annale-endss-sn' },
      { keywords: ['transit'], id: 'annale-bts-transit-sn' },
      { keywords: ['btssecretariat', 'bts_secretariat', 'bts secretariat'], id: 'annale-bts-secretariat-sn' },
      { keywords: ['logistique', 'chaine d approvisionnement', 'gcl'], id: 'annale-bts-logistique-sn' },
      { keywords: ['magistrature'], id: 'annale-magistrature-sn' },
      { keywords: ['greffe'], id: 'annale-greffe-sn' },
      { keywords: ['esp'], id: 'annale-esp-sn' },
      { keywords: ['civil'], id: 'annale-bts-genie-civil-sn' },
      { keywords: ['bts comptablite', 'bts_comptabilite', 'bts comptabilite'], id: 'annale-bts-comptabilite-sn' },
      { keywords: ['bt secretaria', 'bt_secretariat', 'bt secretariat'], id: 'annale-bt-secretariat-sn' },
      { keywords: ['bt.jpeg', 'bt.jpg', 'bt comptabilite'], id: 'annale-bt-comptabilite-sn' },
      { keywords: ['probatoire'], id: 'annale-probatoire-sn' },
      { keywords: ['iface'], id: 'annale-iface-sn' },
      { keywords: ['eaa'], id: 'annale-eaa-sn' },
      { keywords: ['esogn'], id: 'annale-esogn-sn' },
    ];

    let successCount = 0;
    for (const file of fileArray) {
      const lower = file.name.toLowerCase();
      const match = matchRules.find(r => r.keywords.some(k => lower.includes(k)));
      if (match) {
        await new Promise<void>((resolve) => {
          const reader = new FileReader();
          reader.onload = async (e) => {
            const base64Data = e.target?.result as string;
            if (base64Data) {
              try {
                const res = await fetch('/api/admin/update-cover', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('sunu_token') || ''}`,
                    'x-admin-key': getAdminKey(),
                  },
                  body: JSON.stringify({
                    annale_id: match.id,
                    image_data: base64Data,
                  }),
                });
                if (res.ok) {
                  const data = await res.json();
                  setAnnales(prev => prev.map(a => a.id === match.id ? { ...a, cover_image: data.cover_image } : a));
                  successCount++;
                }
              } catch (err) {
                console.error('Batch upload error:', err);
              }
            }
            resolve();
          };
          reader.onerror = () => resolve();
          reader.readAsDataURL(file);
        });
      }
    }
    setIsBatchUploading(false);
    setActionMessage(`${successCount} affiche(s) officielle(s) synchronisée(s) avec succès !`);
    setTimeout(() => setActionMessage(null), 5000);
  };

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('sunu_token') || '';
      const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
        'x-admin-key': getAdminKey(),
      };

      const [statsRes, paymentsRes, usersRes, annalesRes, settingsRes] = await Promise.all([
        fetch('/api/admin/stats', { headers }),
        fetch('/api/admin/payments', { headers }),
        fetch('/api/admin/users', { headers }),
        fetch('/api/annales'),
        fetch('/api/admin/payment-settings', { headers }),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (paymentsRes.ok) setPayments(await paymentsRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
      if (annalesRes.ok) setAnnales(await annalesRes.json());
      if (settingsRes.ok) setPaymentSettings(await settingsRes.json());
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePayTechEnv = async (targetEnv: 'prod' | 'test') => {
    try {
      const token = localStorage.getItem('sunu_token') || '';
      const res = await fetch('/api/admin/payment-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-admin-key': getAdminKey(),
        },
        body: JSON.stringify({ paytech_env: targetEnv }),
      });
      if (res.ok) {
        const data = await res.json();
        setPaymentSettings((prev: any) => ({ ...prev, paytech_env: targetEnv }));
        setActionMessage(data.message);
        setTimeout(() => setActionMessage(null), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleUploadPhotoFile = async (annaleId: string, file: File) => {
    setUploadingId(annaleId);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target?.result as string;
        if (!base64Data) {
          setUploadingId(null);
          return;
        }

        const token = localStorage.getItem('sunu_token') || '';
        const res = await fetch('/api/admin/update-cover', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'x-admin-key': getAdminKey(),
          },
          body: JSON.stringify({
            annale_id: annaleId,
            image_data: base64Data,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          // Update local annales list immediately
          setAnnales(prev => prev.map(a => a.id === annaleId ? { ...a, cover_image: data.cover_image } : a));
          setActionMessage(`Photo mise à jour avec succès pour le concours !`);
          setTimeout(() => setActionMessage(null), 4000);
        } else {
          const err = await res.json();
          alert(`Erreur lors de la mise à jour: ${err.error || 'Inconnue'}`);
        }
        setUploadingId(null);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error(err);
      setUploadingId(null);
    }
  };

  const handleApplyUrl = async (annaleId: string) => {
    const url = customUrls[annaleId]?.trim();
    if (!url) return;

    setUploadingId(annaleId);
    try {
      const token = localStorage.getItem('sunu_token') || '';
      const res = await fetch('/api/admin/update-cover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-admin-key': getAdminKey(),
        },
        body: JSON.stringify({
          annale_id: annaleId,
          image_url: url,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAnnales(prev => prev.map(a => a.id === annaleId ? { ...a, cover_image: data.cover_image } : a));
        setActionMessage(`Lien de la photo appliqué avec succès !`);
        setCustomUrls(prev => ({ ...prev, [annaleId]: '' }));
        setTimeout(() => setActionMessage(null), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingId(null);
    }
  };

  const handleUpdateStatus = async (paymentId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('sunu_token') || '';
      const res = await fetch(`/api/admin/payments/${paymentId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-admin-key': getAdminKey(),
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setActionMessage(`Statut de la transaction mis à jour : ${newStatus}`);
        fetchAdminData();
        setTimeout(() => setActionMessage(null), 3500);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const exportCSV = () => {
    if (!payments.length) return;
    const headers = ['ID', 'Utilisateur', 'Email', 'Téléphone', 'Annale', 'Montant FCFA', 'Opérateur', 'Référence', 'Statut', 'Date'];
    const rows = payments.map(p => [
      p.id,
      p.user_name,
      p.user_email,
      p.customer_phone,
      `"${p.annale_title.replace(/"/g, '""')}"`,
      p.amount,
      p.provider,
      p.transaction_ref,
      p.status,
      p.created_at,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sunuannales_transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredPayments = payments.filter(p => {
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchQ = !searchQuery || 
      p.transaction_ref.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.customer_phone.includes(searchQuery) ||
      p.annale_title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchQ;
  });

  const failedPayments = payments.filter(p => p.status === 'failed');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-950/90 backdrop-blur-md overflow-hidden">
      <div className="relative w-full max-w-6xl h-full sm:h-[92vh] bg-slate-900 border-0 sm:border border-slate-800 rounded-none sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Dashboard Administrateur SaaS</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  SunuAnnales SN Live
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Suivi en temps réel des ventes, paiements Wave/OM, logs de webhooks et utilisateurs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/data.zip"
              download="sunuannales-data.zip"
              className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 border border-emerald-500/30 transition"
              title="Télécharger l'archive ZIP du dossier data (database.json)"
            >
              <FileArchive className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Télécharger data.zip</span>
            </a>
            <button
              onClick={exportCSV}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition"
              title="Exporter les transactions au format CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
            <button
              onClick={fetchAdminData}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Rafraîchir les données"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition ml-2 flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Retour au site</span>
            </button>
          </div>
        </div>

        {/* Action message banner */}
        {actionMessage && (
          <div className="bg-emerald-950/80 border-b border-emerald-800/80 px-6 py-2 text-xs text-emerald-300 font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            {actionMessage}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="px-6 py-2 bg-slate-900 border-b border-slate-800 flex items-center gap-2 shrink-0 overflow-x-auto">
          {[
            { id: 'overview', label: 'Vue Générale & Revenus' },
            { id: 'statistiques', label: '📊 Statistiques Visiteurs' },
            { id: 'covers', label: `Photos & Couvertures (${annales.length})` },
            { id: 'payments', label: `Tous les Paiements (${payments.length})` },
            { id: 'failed', label: `Échecs & Diagnostics (${failedPayments.length})` },
            { id: 'users', label: `Candidats & Utilisateurs (${users.length})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950">
          {/* TAB: VISITOR STATS */}
          {activeTab === 'statistiques' && (
            <div className="-m-6">
              <AdminVisitorStatistics onBack={() => setActiveTab('overview')} />
            </div>
          )}

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* KPI Cards Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>Revenus Encaissés</span>
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-black text-emerald-400 font-['Cabinet_Grotesk']">
                    {(stats?.totalRevenue || 0).toLocaleString()} <span className="text-xs">FCFA</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Total vérifié par webhook</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>Ventes Débloquées</span>
                    <ShoppingBag className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-2xl font-black text-white font-['Cabinet_Grotesk']">
                    {stats?.totalPurchases || 0}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Fascicules payés à 2 000 F</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>Transactions Réussies</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-black text-white font-['Cabinet_Grotesk']">
                    {stats?.successfulPayments || 0}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Taux : {stats?.totalPayments ? Math.round(((stats.successfulPayments || 0) / stats.totalPayments) * 100) : 0} %
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>Échecs Opérateurs</span>
                    <XCircle className="w-4 h-4 text-red-400" />
                  </div>
                  <div className="text-2xl font-black text-red-400 font-['Cabinet_Grotesk']">
                    {stats?.failedPayments || 0}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Solde insuffisant ou rejet</p>
                </div>
              </div>

              {/* Annales Sales Breakdown */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-purple-400" />
                    Répartition des Ventes par Concours (2 000 FCFA / unité)
                  </h3>
                  <span className="text-xs text-slate-400">Total : {stats?.totalPurchases || 0} ventes</span>
                </div>

                <div className="space-y-3">
                  {stats?.annalesSoldBreakdown?.map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-300 font-semibold truncate pr-4">{item.title}</span>
                        <span className="text-emerald-400 font-bold shrink-0">
                          {item.count} ventes ({item.revenue.toLocaleString()} FCFA)
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, Math.max(12, ((item.count || 1) / Math.max(1, stats.totalPurchases)) * 100))}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}

                  {(!stats?.annalesSoldBreakdown || stats.annalesSoldBreakdown.length === 0) && (
                    <p className="text-xs text-slate-500 italic py-2">
                      Aucune vente enregistrée pour le moment. Réalisez un test d'achat pour observer les métriques !
                    </p>
                  )}
                </div>
              </div>

              {/* SaaSPay Gateway Mode & Pricing Control */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-emerald-950/30 to-slate-900 border border-emerald-900/40 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-sm font-bold text-white">Passerelle SaaSPay Sénégal (Wave & Orange Money) — 2 000 FCFA</h3>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Gestion du mode de facturation officiel et encaissement sécurisé.
                    </p>
                  </div>
                  <div className="shrink-0">
                    <span className="px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border-emerald-500/40">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      Clé Live Active : 2 000 FCFA Réels
                    </span>
                  </div>
                </div>

                {/* Information banner regarding SaaSPay */}
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-2">
                  <div className="font-bold text-emerald-300 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Intégration officielle SaaSPay Sénégal</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Sur la plateforme <strong>SunuAnnales SN</strong>, chaque annale est configurée exclusivement à <strong>2 000 FCFA</strong>. Les paiements par <strong>Wave Sénégal</strong> et <strong>Orange Money</strong> transitent par votre compte marchand officiel SaaSPay avec votre clé secrète de production.
                  </p>
                </div>

                {/* Merchant Payout & Identity Details */}
                <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      Coordonnées officielles d'encaissement des paiements
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                      Actif
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Email Marchand / Compte</span>
                      <span className="text-xs font-mono font-bold text-white break-all">
                        {paymentSettings?.merchant_email || 'visionservices607@gmail.com'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">N° d'encaissement (Wave / OM)</span>
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        {paymentSettings?.merchant_phone || '773358754'} (+221 77 335 87 54)
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Nom de l'entreprise</span>
                      <span className="text-xs font-bold text-amber-300">
                        {paymentSettings?.merchant_name || 'Vision Services'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <a
                    href="https://app.saspay.me"
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 text-xs font-bold border border-emerald-700/50 flex items-center gap-2 transition"
                  >
                    <span>Accéder au Tableau de Bord SaaSPay (app.saspay.me)</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ALL PAYMENTS */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
              {/* Filter and Search Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 p-3.5 rounded-2xl border border-slate-800">
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filtrer par référence, email, téléphone ou annale..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-400">Statut :</span>
                  {['all', 'completed', 'failed', 'pending'].map(st => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition ${
                        statusFilter === st
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {st === 'all' ? 'Tous' : st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Transactions Table */}
              <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-900">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="p-3.5">Référence / Date</th>
                        <th className="p-3.5">Candidat</th>
                        <th className="p-3.5">Annale commandée</th>
                        <th className="p-3.5">Opérateur</th>
                        <th className="p-3.5">Montant</th>
                        <th className="p-3.5">Statut</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {filteredPayments.map(p => (
                        <tr key={p.id} className="hover:bg-slate-800/40 transition">
                          <td className="p-3.5">
                            <span className="font-mono font-bold text-white block">{p.transaction_ref}</span>
                            <span className="text-[10px] text-slate-500">
                              {new Date(p.created_at).toLocaleString('fr-FR')}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <p className="font-semibold text-white">{p.user_name}</p>
                            <p className="text-[11px] text-slate-400">{p.customer_phone || p.user_email}</p>
                          </td>
                          <td className="p-3.5 max-w-xs">
                            <p className="font-medium text-slate-200 truncate">{p.annale_title}</p>
                          </td>
                          <td className="p-3.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              p.provider === 'wave'
                                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                                : p.provider === 'orange_money'
                                ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}>
                              {p.provider}
                            </span>
                          </td>
                          <td className="p-3.5 font-bold font-mono text-white">
                            {p.amount.toLocaleString()} FCFA
                          </td>
                          <td className="p-3.5">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              p.status === 'completed'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : p.status === 'failed'
                                ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}>
                              {p.status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
                              {p.status === 'failed' && <XCircle className="w-3 h-3" />}
                              {p.status === 'pending' && <Clock className="w-3 h-3" />}
                              {p.status}
                            </span>
                          </td>
                          <td className="p-3.5 text-right space-x-1.5">
                            <button
                              onClick={() => setSelectedRawResponse(p.provider_response)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                              title="Voir payload brut du prestataire"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            {p.status !== 'completed' && (
                              <button
                                onClick={() => handleUpdateStatus(p.id, 'completed')}
                                className="px-2 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white text-[10px] font-bold transition border border-emerald-500/30"
                                title="Forcer la validation et débloquer l'annale"
                              >
                                Valider
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FAILED TRANSACTIONS DIAGNOSTICS */}
          {activeTab === 'failed' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-red-950/30 border border-red-900/40 text-xs text-red-200 flex items-start gap-3">
                <AlertOctagon className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-red-300">Journal d'Analyse des Transactions Échouées</h4>
                  <p className="text-[11px] text-red-300/80 mt-0.5">
                    Permet de détecter les erreurs récurrentes (solde insuffisant du client, rejet du code USSD #144#, timeout opérateur ou abandon) et de relancer les candidats.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {failedPayments.map(p => (
                  <div
                    key={p.id}
                    className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white">{p.transaction_ref}</span>
                        <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-[10px] font-bold">
                          ÉCHEC
                        </span>
                        <span className="text-slate-400 text-[11px] uppercase font-bold">{p.provider}</span>
                      </div>
                      <p className="text-slate-300 font-medium mt-1">{p.annale_title}</p>
                      <p className="text-red-400 text-[11px] font-semibold mt-1">
                        Motif : {p.failure_reason || 'Rejet par l’opérateur ou solde insuffisant'}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-mono text-slate-300">{p.customer_phone}</p>
                        <p className="text-[10px] text-slate-500">{new Date(p.created_at).toLocaleTimeString()}</p>
                      </div>
                      <button
                        onClick={() => setSelectedRawResponse(p.provider_response)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                      >
                        Inspecter Log
                      </button>
                    </div>
                  </div>
                ))}

                {failedPayments.length === 0 && (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    Aucune transaction échouée pour l’instant.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: USERS DIRECTORY */}
          {activeTab === 'users' && (
            <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-900">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3.5">Nom du Candidat</th>
                    <th className="p-3.5">Email</th>
                    <th className="p-3.5">Téléphone SN</th>
                    <th className="p-3.5">Rôle</th>
                    <th className="p-3.5">Annales Achetées</th>
                    <th className="p-3.5">Total Dépensé</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3.5 font-bold text-white">{u.name}</td>
                      <td className="p-3.5 text-slate-400">{u.email}</td>
                      <td className="p-3.5 font-mono text-slate-300">{u.phone}</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          u.role === 'admin' ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3.5 font-semibold text-emerald-400">
                        {u.purchases_count} annales
                      </td>
                      <td className="p-3.5 font-mono font-bold text-white">
                        {(u.total_spent || 0).toLocaleString()} FCFA
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 5: PHOTOS & COUVERTURES */}
          {activeTab === 'covers' && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/70 via-slate-900 to-indigo-950/70 border border-purple-800/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-purple-400" />
                    Gestion & Synchronisation des 24 Affiches Officielles
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                    Téléversez vos 24 affiches d'un seul coup grâce au bouton de sélection multiple ci-contre, ou remplacez-les concours par concours. Les images sont automatiquement associées par nom de fichier et répercutées instantanément sur les cartes, l'aperçu détaillé et le tunnel Wave/Orange Money.
                  </p>
                </div>
                <div className="shrink-0 flex items-center gap-3">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    ref={batchFileInputRef}
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleBatchUploadFiles(e.target.files);
                        e.target.value = '';
                      }
                    }}
                  />
                  <button
                    type="button"
                    disabled={isBatchUploading}
                    onClick={() => batchFileInputRef.current?.click()}
                    className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 disabled:opacity-50 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/50 transition active:scale-95 cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{isBatchUploading ? 'Synchronisation...' : 'Importer mes 24 affiches en 1 clic'}</span>
                  </button>
                  <span className="px-3 py-1.5 rounded-xl bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-500/30 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    {annales.length} Concours Actifs
                  </span>
                </div>
              </div>

              {/* Grid of annales with their photos */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {annales.map((annale) => (
                  <div
                    key={annale.id}
                    className="bg-slate-900 border border-slate-800 hover:border-purple-500/40 rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between transition"
                  >
                    {/* Header */}
                    <div className="p-4 border-b border-slate-800/80 bg-slate-950/40">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          {annale.category}
                        </span>
                        <span className="text-[11px] font-mono text-emerald-400 font-bold">
                          2 000 FCFA
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white line-clamp-1" title={annale.title}>
                        {annale.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{annale.ministry}</p>
                    </div>

                    {/* Image Preview */}
                    <div className="p-4 flex flex-col items-center">
                      <div className="relative w-36 h-48 rounded-xl overflow-hidden shadow-xl border border-slate-700 bg-slate-950 flex items-center justify-center group">
                        {annale.cover_image ? (
                          <img
                            src={annale.cover_image}
                            alt={annale.title}
                            className="w-full h-full object-cover"
                            key={annale.cover_image}
                          />
                        ) : (
                          <div className="text-center p-3 text-slate-500 text-xs">
                            <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-50" />
                            Aucune photo
                          </div>
                        )}

                        {uploadingId === annale.id && (
                          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center gap-2">
                            <RefreshCw className="w-6 h-6 text-purple-400 animate-spin" />
                            <span className="text-[10px] text-purple-200 font-bold">Mise à jour...</span>
                          </div>
                        )}
                      </div>

                      <span className="text-[10px] text-slate-400 mt-2 truncate max-w-full font-mono">
                        {annale.cover_image || 'Par défaut'}
                      </span>
                    </div>

                    {/* Actions: File upload + URL */}
                    <div className="p-4 bg-slate-950/60 border-t border-slate-800 space-y-3">
                      {/* Hidden File Input */}
                      <input
                        type="file"
                        accept="image/*"
                        ref={(el) => { fileInputRefs.current[annale.id] = el; }}
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleUploadPhotoFile(annale.id, file);
                            e.target.value = '';
                          }
                        }}
                      />

                      {/* Button to pick file from device */}
                      <button
                        type="button"
                        disabled={uploadingId === annale.id}
                        onClick={() => fileInputRefs.current[annale.id]?.click()}
                        className="w-full py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-purple-900/30"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Importer ma photo (JPG/PNG)</span>
                      </button>

                      {/* URL input fallback */}
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          placeholder="Ou coller une URL d'image..."
                          value={customUrls[annale.id] || ''}
                          onChange={(e) => setCustomUrls({ ...customUrls, [annale.id]: e.target.value })}
                          className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-[11px] placeholder-slate-500 focus:outline-none focus:border-purple-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleApplyUrl(annale.id)}
                          disabled={!customUrls[annale.id]?.trim() || uploadingId === annale.id}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-semibold border border-slate-700"
                          title="Appliquer l'URL"
                        >
                          OK
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Raw Provider Response Inspector Modal */}
      {selectedRawResponse && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                Données Brutes du Prestataire (JSON)
              </h4>
              <button
                onClick={() => setSelectedRawResponse(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-80 leading-relaxed">
              {JSON.stringify(selectedRawResponse, null, 2)}
            </pre>
            <button
              onClick={() => setSelectedRawResponse(null)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
            >
              Fermer l'inspecteur
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
