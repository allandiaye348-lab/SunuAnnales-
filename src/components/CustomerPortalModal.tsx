import React, { useState, useEffect } from 'react';
import { User, Annale } from '../types';
import { fallbackAnnales } from '../data/fallbackAnnales';
import { downloadAnnalePdf } from '../utils/pdfDownloader';
import { 
  X, ShoppingBag, BookOpen, DownloadCloud, FileText, CheckCircle2, 
  Clock, AlertTriangle, ExternalLink, ShieldCheck, RefreshCw, Key, 
  ArrowRight, ArrowLeft, Award, ChevronRight
} from 'lucide-react';

interface CustomerPortalModalProps {
  currentUser: User | null;
  allAnnales: Annale[];
  onClose: () => void;
  onOpenReader: (annale: Annale) => void;
  onOpenAuth: () => void;
}

interface OrderItemData {
  id: string;
  user_email: string;
  customer_phone: string;
  total_amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'paid' | 'cancelled' | 'failed';
  transaction_ref: string;
  items: {
    id: string;
    annale_id: string;
    annale_title: string;
    unit_price: number;
    quantity: number;
  }[];
  created_at: string;
}

interface PurchaseItemData {
  id: string;
  annale_id: string;
  annale_title: string;
  amount: number;
  currency: string;
  access_token: string;
  purchased_at: string;
  download_count: number;
  purchase_info?: {
    access_token: string;
    purchased_at: string;
    download_count: number;
  };
}

export const CustomerPortalModal: React.FC<CustomerPortalModalProps> = ({
  currentUser,
  allAnnales,
  onClose,
  onOpenReader,
  onOpenAuth,
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'annales' | 'downloads'>('dashboard');
  const [orders, setOrders] = useState<OrderItemData[]>([]);
  const [purchasedAnnales, setPurchasedAnnales] = useState<Annale[]>([]);
  const [downloads, setDownloads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeReceiptRef, setActiveReceiptRef] = useState<string | null>(null);
  const [receiptData, setReceiptData] = useState<any | null>(null);
  const [loadingReceipt, setLoadingReceipt] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    loadUserData();
  }, [currentUser]);

  const loadUserData = async () => {
    setLoading(true);
    const token = localStorage.getItem('sunu_token') || '';
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const [ordersRes, annalesRes, downloadsRes] = await Promise.all([
        fetch('/api/user/orders', { headers }),
        fetch('/api/user/annales', { headers }),
        fetch('/api/user/downloads', { headers }),
      ]);

      if (ordersRes.ok) setOrders(await ordersRes.json());
      if (annalesRes.ok) setPurchasedAnnales(await annalesRes.json());
      if (downloadsRes.ok) setDownloads(await downloadsRes.json());
    } catch (err) {
      console.warn('Backend indisponible, utilisation du cache local:', err);
    } finally {
      // Vérification du stockage local pour les achats effectués en mode autonome (Vercel / GitHub Pages)
      try {
        const localPurchasedIds: string[] = JSON.parse(localStorage.getItem('sunu_purchases') || '[]');
        if (localPurchasedIds.length > 0) {
          setPurchasedAnnales(prev => {
            const currentIds = prev.map(a => a.id);
            const missing = fallbackAnnales.filter(a => localPurchasedIds.includes(a.id) && !currentIds.includes(a.id));
            return [...prev, ...missing];
          });
        }
      } catch {}
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (annaleId: string, _annaleTitle: string) => {
    const matched = purchasedAnnales.find(a => a.id === annaleId) || fallbackAnnales.find(a => a.id === annaleId);
    if (matched) {
      downloadAnnalePdf(matched, currentUser);
    }
  };

  const handleViewReceipt = async (ref: string) => {
    setActiveReceiptRef(ref);
    setLoadingReceipt(true);
    try {
      const res = await fetch(`/api/payments/receipt/${ref}`);
      if (res.ok) {
        setReceiptData(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingReceipt(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Espace Candidat</h3>
          <p className="text-xs text-slate-400">
            Retrouvez ici vos annales débloquées, vos examens et vos attestations officielles.
          </p>
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
            >
              Accéder au catalogue
            </button>
          </div>
        </div>
      </div>
    );
  }

  const completedOrders = orders.filter(o => o.status === 'completed');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-hidden">
      <div className="relative w-full max-w-4xl h-full sm:h-[88vh] bg-slate-900 border-0 sm:border border-slate-800 rounded-none sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-slate-950 flex items-center justify-center font-black shadow-md">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Espace Candidat — SunuAnnales</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Compte Vérifié
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {currentUser.name} • {currentUser.email} • {currentUser.phone || '+221 77 845 12 34'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadUserData}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              title="Rafraîchir"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
              title="Retour au catalogue"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
              <span>Retour</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 px-6 bg-slate-950/40 shrink-0 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Tableau de bord
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === 'orders'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            Mes commandes
            <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] text-slate-300">
              {orders.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('annales')}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === 'annales'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Mes annales payées
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px]">
              {purchasedAnnales.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('downloads')}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === 'downloads'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <DownloadCloud className="w-4 h-4" />
            Mes téléchargements PDF
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: TABLEAU DE BORD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400">Nombre d'achats confirmés</span>
                    <p className="text-2xl font-black text-emerald-400 mt-1 font-['Cabinet_Grotesk']">
                      {completedOrders.length}
                    </p>
                    <span className="text-[10px] text-slate-500">Paiements validés SaaSPay</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400">Annales au catalogue</span>
                    <p className="text-2xl font-black text-amber-400 mt-1 font-['Cabinet_Grotesk']">
                      {allAnnales.length}
                    </p>
                    <span className="text-[10px] text-slate-500">Concours officiels 2026</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                    <BookOpen className="w-5 h-5" />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400">Téléchargements effectués</span>
                    <p className="text-2xl font-black text-sky-400 mt-1 font-['Cabinet_Grotesk']">
                      {purchasedAnnales.reduce((acc, a: any) => acc + (a.purchase_info?.download_count || 0), 0)}
                    </p>
                    <span className="text-[10px] text-slate-500">Licences DRM actives</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20">
                    <DownloadCloud className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Dernières commandes */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">Dernières Commandes</h4>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    Voir tout <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {orders.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-slate-950/40 border border-slate-800 text-center space-y-2">
                    <ShoppingBag className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="text-xs text-slate-400">Vous n'avez pas encore passé de commande.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {orders.slice(0, 3).map((o) => (
                      <div
                        key={o.id}
                        className="p-3.5 rounded-2xl bg-slate-950/50 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-white truncate">
                            {o.items?.[0]?.annale_title || 'Annale Concours Sénégal'}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                            <span>{o.transaction_ref}</span>
                            <span>•</span>
                            <span>{new Date(o.created_at).toLocaleDateString('fr-FR')}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-bold text-amber-400 font-['Cabinet_Grotesk']">
                            2 000 FCFA
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              o.status === 'completed'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : o.status === 'pending'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-red-500/20 text-red-400 border border-red-500/30'
                            }`}
                          >
                            {o.status === 'completed' ? 'Payé' : o.status === 'pending' ? 'En attente' : 'Échoué'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Vos Annales Prêtes à la révision */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-white">Vos Fascicules Débloqués</h4>
                {purchasedAnnales.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-slate-950/40 border border-slate-800 text-center space-y-2">
                    <BookOpen className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="text-xs text-slate-400">Aucune annale débloquée pour le moment.</p>
                    <p className="text-[11px] text-slate-500">
                      Choisissez un concours dans le catalogue et réglez 2 000 FCFA par SaaSPay pour débloquer immédiatement le contenu.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {purchasedAnnales.map((annale) => (
                      <div
                        key={annale.id}
                        className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-950 to-slate-900 border border-emerald-500/30 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {annale.cover_image && (
                            <img
                              src={annale.cover_image}
                              alt={annale.title}
                              className="w-10 h-14 object-cover rounded-lg shadow-md border border-slate-700 shrink-0"
                              referrerPolicy="no-referrer"
                            />
                          )}
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                              {annale.category}
                            </span>
                            <p className="text-xs font-bold text-white truncate">{annale.title}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">320 exercices corrigés • Licence active</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            onClose();
                            onOpenReader(annale);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shrink-0 flex items-center gap-1 transition"
                        >
                          Étudier
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: MES COMMANDES */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white">Historique de vos commandes</h4>
                <span className="text-xs text-slate-400">{orders.length} commande(s) enregistrée(s)</span>
              </div>

              {orders.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-950/40 border border-slate-800 text-center space-y-2">
                  <ShoppingBag className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-300 font-semibold">Aucune commande trouvée</p>
                  <p className="text-[11px] text-slate-500">
                    Vos commandes passées via SaaSPay (Wave ou Orange Money) apparaîtront ici.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-white">
                              {order.transaction_ref}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                order.status === 'completed' || order.status === 'paid'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : order.status === 'pending'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
                              }`}
                            >
                              {order.status === 'completed' || order.status === 'paid' ? 'PAYÉ / CONFIRMÉ' : order.status === 'pending' ? 'EN ATTENTE DE PAIEMENT' : 'ANNULÉ / ÉCHOUÉ'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Date : {new Date(order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>

                        <div className="text-right flex sm:flex-col items-center sm:items-end justify-between">
                          <span className="text-[10px] text-slate-400">Montant total</span>
                          <span className="text-base font-black text-amber-400 font-['Cabinet_Grotesk']">
                            {order.total_amount} {order.currency}
                          </span>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="space-y-1.5">
                        {order.items.map((it) => (
                          <div key={it.id} className="flex items-center justify-between text-xs">
                            <span className="text-slate-300 flex items-center gap-1.5">
                              <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                              {it.annale_title}
                            </span>
                            <span className="text-slate-400 font-mono">1 x {it.unit_price} FCFA</span>
                          </div>
                        ))}
                      </div>

                      {/* Actions */}
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-slate-500">
                          {order.status === 'completed' || order.status === 'paid' ? '✅ Téléchargement PDF et consultation autorisés' : '⏳ En attente de la confirmation SaaSPay'}
                        </span>
                        <button
                          onClick={() => handleViewReceipt(order.transaction_ref)}
                          className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center gap-1.5 transition text-[11px]"
                        >
                          <FileText className="w-3.5 h-3.5 text-amber-400" />
                          Voir le reçu officiel
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MES ANNALES */}
          {activeTab === 'annales' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">Mes Fascicules Officiels</h4>
                  <p className="text-xs text-slate-400">
                    Seules les annales dont le paiement de 2 000 FCFA a été réellement confirmé par SaaSPay sont listées ici.
                  </p>
                </div>
                <span className="text-xs font-bold text-emerald-400">
                  {purchasedAnnales.length} fascicule(s)
                </span>
              </div>

              {purchasedAnnales.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-950/40 border border-slate-800 text-center space-y-3">
                  <BookOpen className="w-12 h-12 text-slate-600 mx-auto" />
                  <h5 className="text-sm font-bold text-white">Vous n'avez pas encore d'annale débloquée</h5>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Consultez les concours (Police, Gendarmerie, Douane, ENA, ENSOA, Eaux & Forêts, INSEPS) et achetez votre fascicule à 2 000 FCFA pour débloquer les 320 exercices corrigés.
                  </p>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
                  >
                    Explorer les concours
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {purchasedAnnales.map((annale) => (
                    <div
                      key={annale.id}
                      className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-3"
                    >
                      <div className="flex gap-3 items-start">
                        {annale.cover_image && (
                          <img
                            src={annale.cover_image}
                            alt={annale.title}
                            className="w-14 h-20 object-cover rounded-xl shadow-md border border-slate-700 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              {annale.category}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              320 Exercices • PDF
                            </span>
                          </div>
                          <h5 className="text-xs font-bold text-white line-clamp-2">{annale.title}</h5>
                          <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{annale.description}</p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                        <button
                          onClick={() => {
                            onClose();
                            onOpenReader(annale);
                          }}
                          className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          Consulter en ligne
                        </button>
                        <button
                          onClick={() => handleDownloadPDF(annale.id, annale.title)}
                          className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1 transition"
                          title="Télécharger le fichier PDF officiel protégé"
                        >
                          <DownloadCloud className="w-3.5 h-3.5 text-amber-400" />
                          PDF
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: MES TÉLÉCHARGEMENTS */}
          {activeTab === 'downloads' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">Centre de Téléchargement Certifié</h4>
                  <p className="text-xs text-slate-400">
                    Téléchargez vos fascicules protégés avec filigrane nominatif anti-plagiat ({currentUser.email}).
                  </p>
                </div>
              </div>

              {purchasedAnnales.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-950/40 border border-slate-800 text-center space-y-2">
                  <DownloadCloud className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-300 font-semibold">Aucun document téléchargeable</p>
                  <p className="text-[11px] text-slate-500">
                    Achetez une annale pour générer votre jeton de téléchargement cryptographique sécurisé.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {purchasedAnnales.map((annale) => {
                    const purchaseInfo = (annale as any).purchase_info;
                    return (
                      <div
                        key={annale.id}
                        className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                            {annale.category} • Format PDF Officiel
                          </span>
                          <h5 className="text-xs font-bold text-white">{annale.title}</h5>
                          <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400 font-mono">
                            <span className="flex items-center gap-1 text-slate-300">
                              <Key className="w-3 h-3 text-amber-400" />
                              Licence : {purchaseInfo?.access_token || 'DRM-ACTIVE'}
                            </span>
                            <span>•</span>
                            <span>Téléchargé {purchaseInfo?.download_count || 0} fois</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDownloadPDF(annale.id, annale.title)}
                          className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition shrink-0 shadow-md shadow-amber-500/10"
                        >
                          <DownloadCloud className="w-4 h-4" />
                          Télécharger le PDF
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 space-y-1.5">
                <p className="font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Sécurité & Filigrane Nominatif :
                </p>
                <p className="text-[11px] leading-relaxed">
                  Chaque document téléchargé intègre dans ses métadonnées et son en-tête vos coordonnées nominatives ({currentUser.email}) ainsi qu'un hash SHA-256 unique prouvant l'acquisition de la licence. La reproduction ou redistribution non autorisée est interdite.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Reçu de Paiement */}
        {activeReceiptRef && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
            <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-400" />
                  <h4 className="text-sm font-bold text-white">Reçu Officiel d'Achat</h4>
                </div>
                <button
                  onClick={() => {
                    setActiveReceiptRef(null);
                    setReceiptData(null);
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {loadingReceipt || !receiptData ? (
                <div className="py-12 text-center">
                  <RefreshCw className="w-6 h-6 animate-spin text-emerald-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">Chargement du reçu fiscal...</p>
                </div>
              ) : (
                <div className="space-y-4 text-xs font-mono">
                  {/* Company */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                    <p className="font-bold text-white">{receiptData.company.name}</p>
                    <p className="text-[10px] text-slate-400">RCCM : {receiptData.company.rccm} • NINEA : {receiptData.company.ninea}</p>
                    <p className="text-[10px] text-slate-400">{receiptData.company.address}</p>
                  </div>

                  {/* Details */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">N° Reçu :</span>
                      <span className="text-white font-bold">{receiptData.receipt.receipt_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Réf. SaaSPay :</span>
                      <span className="text-amber-300 font-bold">{receiptData.receipt.transaction_ref}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Client :</span>
                      <span className="text-white">{receiptData.receipt.customer.name} ({receiptData.receipt.customer.email})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Produit :</span>
                      <span className="text-white font-bold">{receiptData.receipt.item.title}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-800 pt-2 text-sm font-bold">
                      <span className="text-slate-300">Total payé :</span>
                      <span className="text-emerald-400">{receiptData.receipt.item.total} {receiptData.receipt.item.currency}</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-300 space-y-1">
                    <p>Sceau cryptographique d'authenticité :</p>
                    <p className="font-mono text-[9px] break-all">{receiptData.receipt.verification_seal}</p>
                  </div>

                  <button
                    onClick={() => window.print()}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
                  >
                    Imprimer le reçu
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
