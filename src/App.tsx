import React, { useState, useEffect, useMemo } from 'react';
import { Annale, User } from './types';
import { fallbackAnnales } from './data/fallbackAnnales';
import { Navbar } from './components/Navbar';
import { AnnaleCard } from './components/AnnaleCard';
import { PaymentModal } from './components/PaymentModal';
import { SecureReaderModal } from './components/SecureReaderModal';
import { AdminDashboard } from './components/AdminDashboard';
import { PreviewSummaryModal } from './components/PreviewSummaryModal';
import { ApiRoutesModal } from './components/ApiRoutesModal';
import { FaqSection } from './components/FaqSection';
import { CustomerPortalModal } from './components/CustomerPortalModal';
import { PaymentReturnNotification } from './components/PaymentReturnNotification';
import { AboutSection } from './components/AboutSection';
import { ContactSection } from './components/ContactSection';
import { Professional3DModal } from './components/Professional3DModal';
import { Professional3DBookViewer } from './components/Professional3DBookViewer';
import { 
  Sparkles, ShieldCheck, CheckCircle2, Award, Zap, BookOpen, 
  Search, Filter, ChevronRight, HelpCircle, ArrowRight, ArrowLeft, Smartphone,
  PhoneCall, Users, DownloadCloud, Lock, Star, Eye
} from 'lucide-react';

export default function App() {
  const [annales, setAnnales] = useState<Annale[]>(fallbackAnnales);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [purchasedIds, setPurchasedIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('sunu_purchases') || '[]');
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);

  // Navigation tab: Accueil | A propos | Contact
  const [currentTab, setCurrentTab] = useState<'accueil' | 'apropos' | 'contact'>('accueil');

  // Filters & Search
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOnlyPurchased, setFilterOnlyPurchased] = useState(false);

  // Active Modals
  const [activePaymentAnnale, setActivePaymentAnnale] = useState<Annale | null>(null);
  const [activeReaderAnnaleId, setActiveReaderAnnaleId] = useState<string | null>(null);
  const [activePreviewAnnale, setActivePreviewAnnale] = useState<Annale | null>(null);
  const [active3DAnnale, setActive3DAnnale] = useState<Annale | null>(null);
  const [heroViewMode, setHeroViewMode] = useState<'3d' | 'poster'>('poster');
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [adminInitialTab, setAdminInitialTab] = useState<'overview' | 'payments' | 'failed' | 'users' | 'covers'>('overview');
  const [showRoutesModal, setShowRoutesModal] = useState(false);
  const [showPortalModal, setShowPortalModal] = useState(false);
  const [showPaymentReturn, setShowPaymentReturn] = useState(false);

  // Initial load
  useEffect(() => {
    fetchCatalog();
    checkCurrentUser();
    // Check if user is returning from PayTech redirect
    if (window.location.search.includes('payment=') && window.location.search.includes('ref=')) {
      setShowPaymentReturn(true);
    }
  }, []);

  const fetchCatalog = async () => {
    try {
      const res = await fetch('/api/annales');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setAnnales(data);
          return;
        }
      }

      // Si le backend n'est pas déployé (ex: Vercel statique ou GitHub Pages)
      const staticRes = await fetch('/annales.json');
      if (staticRes.ok) {
        const staticData = await staticRes.json();
        if (Array.isArray(staticData) && staticData.length > 0) {
          setAnnales(staticData);
          return;
        }
      }
    } catch (err) {
      console.warn('Mode autonome activé (catalogue embarqué chargé automatiquement):', err);
    } finally {
      // Garantit que le catalogue contient toujours les 24 annales
      setAnnales(prev => (prev && prev.length > 0 ? prev : fallbackAnnales));
      setLoading(false);
    }
  };

  const checkCurrentUser = async () => {
    const localPurchases: string[] = (() => {
      try {
        return JSON.parse(localStorage.getItem('sunu_purchases') || '[]');
      } catch {
        return [];
      }
    })();

    let token = localStorage.getItem('sunu_token');
    if (!token) {
      try {
        const guestRes = await fetch('/api/auth/guest', { method: 'POST' });
        if (guestRes.ok) {
          const guestData = await guestRes.json();
          localStorage.setItem('sunu_token', guestData.token);
          token = guestData.token;
          setCurrentUser(guestData.user);
          const merged = Array.from(new Set([...(guestData.purchased_annale_ids || []), ...localPurchases]));
          setPurchasedIds(merged);
          return;
        }
      } catch {
        // En mode statique pur (GitHub Pages / Vercel sans backend), simule une session invitée locale
        const guestUser: User = {
          id: 'user_local_guest',
          name: 'Candidat Officiel',
          email: 'candidat@sunuannales.sn',
          phone: '+221 77 000 00 00',
          role: 'student',
        };
        setCurrentUser(guestUser);
        setPurchasedIds(localPurchases);
        return;
      }
    }

    if (!token) {
      setPurchasedIds(localPurchases);
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        const merged = Array.from(new Set([...(data.purchased_annale_ids || []), ...localPurchases]));
        setPurchasedIds(merged);
      } else {
        setPurchasedIds(localPurchases);
      }
    } catch {
      setPurchasedIds(localPurchases);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('sunu_token');
    setCurrentUser(null);
    setPurchasedIds([]);
    setFilterOnlyPurchased(false);
  };

  const handlePaymentSuccess = (annaleId: string) => {
    setPurchasedIds(prev => {
      const updated = Array.from(new Set([...prev, annaleId]));
      localStorage.setItem('sunu_purchases', JSON.stringify(updated));
      return updated;
    });
    // Open reader immediately
    setActiveReaderAnnaleId(annaleId);
    setActivePaymentAnnale(null);
    // Refresh user state
    checkCurrentUser();
  };

  const handleResetPurchases = async () => {
    try {
      const token = localStorage.getItem('sunu_token') || '';
      await fetch('/api/user/reset-purchases', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setPurchasedIds([]);
      setFilterOnlyPurchased(false);
      checkCurrentUser();
    } catch (err) {
      console.error(err);
    }
  };

  const openReader = (annale: Annale) => {
    setActiveReaderAnnaleId(annale.id);
  };

  const openBuy = (annale: Annale) => {
    setActivePaymentAnnale(annale);
  };

  // Helper to normalize text (case, accents, whitespace)
  const stripAccents = (str: string | null | undefined): string =>
    (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

  // Robust check if a category value means "All categories / Toutes les filières"
  const isAllCategories = (cat: string | null | undefined): boolean => {
    if (!cat) return true;
    const norm = stripAccents(cat);
    return (
      norm === 'tous' ||
      norm === 'all' ||
      norm === '*' ||
      norm.includes('tous') ||
      norm.includes('toutes') ||
      norm.includes('filiere') ||
      norm.includes('concours')
    );
  };

  // Match an annale against selected category with alias support
  const matchCategory = (annale: Annale, selected: string): boolean => {
    if (isAllCategories(selected)) return true;

    const sel = stripAccents(selected);
    const cat = stripAccents(annale.category);
    const title = stripAccents(annale.title);
    const corps = stripAccents(annale.target_corps);
    const slug = stripAccents(annale.slug);
    const id = stripAccents(annale.id);

    // 1. Direct equality or substring containment
    if (cat === sel || cat.includes(sel) || sel.includes(cat)) return true;

    // 2. Specific aliases for faculties and specialized academies
    if (sel.includes('esp') && (cat.includes('polytechnique') || title.includes('esp') || slug.includes('esp'))) return true;
    if (sel.includes('esogn') && (cat.includes('esogn') || title.includes('esogn') || slug.includes('esogn'))) return true;
    if (sel.includes('iface') && (cat.includes('iface') || title.includes('iface') || slug.includes('iface'))) return true;
    if (sel.includes('agriculture') && (cat.includes('agriculture') || title.includes('agriculture') || corps.includes('armee'))) return true;

    return false;
  };

  // Filtered annales with accent-insensitive search and infallible category matching
  const filteredAnnales = useMemo(() => {
    const q = stripAccents(searchQuery);

    return annales.filter(a => {
      // 1. Category Filter
      const matchCat = matchCategory(a, selectedCategory);

      // 2. Purchased Filter (only if user has purchases, otherwise ignore to avoid empty screen)
      const matchPurchased = !filterOnlyPurchased || purchasedIds.length === 0 || purchasedIds.includes(a.id);

      // 3. Search Filter (checks all metadata fields without accent sensitivity)
      const matchSearch = !q || stripAccents(
        `${a.title} ${a.description} ${a.ministry} ${a.category} ${a.target_corps} ${a.badge} ${a.official_reference}`
      ).includes(q);

      return matchCat && matchPurchased && matchSearch;
    });
  }, [annales, selectedCategory, filterOnlyPurchased, purchasedIds, searchQuery]);

  const categories = useMemo(() => {
    const raw = Array.from(new Set(annales.map(a => a.category).filter(Boolean)));
    return ['Tous', ...raw];
  }, [annales]);

  useEffect(() => {
    // Hidden private access for administrator via ?admin=true in URL
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'true' || params.get('admin') === 'secret') {
      setShowAdminDashboard(true);
    }
  }, []);

  const handleUploadCover = async (annaleId: string, file: File) => {
    return new Promise<void>((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64Data = e.target?.result as string;
          if (!base64Data) return resolve();

          const res = await fetch('/api/admin/update-cover', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-admin-key': '2026',
            },
            body: JSON.stringify({
              annale_id: annaleId,
              image_data: base64Data,
            }),
          });

          const data = await res.json();
          if (res.ok) {
            setAnnales((prev) =>
              prev.map((a) => (a.id === annaleId ? { ...a, cover_image: data.cover_image } : a))
            );
          }
          resolve();
        } catch (err) {
          console.error('Error uploading cover:', err);
          resolve();
        }
      };
      reader.onerror = () => resolve();
      reader.readAsDataURL(file);
    });
  };

  const featuredAnnale = annales[0] || null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Navigation Header */}
      <Navbar
        currentUser={currentUser}
        purchasedCount={purchasedIds.length}
        onLogout={handleLogout}
        onTogglePurchasesFilter={() => setFilterOnlyPurchased(!filterOnlyPurchased)}
        filterOnlyPurchased={filterOnlyPurchased}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        categories={categories}
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onResetPurchases={handleResetPurchases}
        onOpenPortal={() => setShowPortalModal(true)}
      />

      {/* VIEW: ACCUEIL */}
      {currentTab === 'accueil' && (
        <>
          {/* HERO SECTION */}
          <section className="relative overflow-hidden pt-8 pb-16 lg:py-20 border-b border-slate-800">
            {/* Ambient Gradient glow */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-1/3 right-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Left Column: Hero Text */}
                <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                  {/* Official Seal Pill */}
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-emerald-500/30 text-xs font-semibold text-emerald-300 shadow-md">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    <span>Annales Officielles des Concours Directs & Professionnels du Sénégal</span>
                  </div>

                  {/* Main Headline (Exact User Specification) */}
                  <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.12] font-['Cabinet_Grotesk']">
                    Préparez vos concours avec les <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300">annales qu'il vous faut !</span>
                  </h1>

                  {/* Sub-headline (Exact User Specification) */}
                  <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                    Retrouvez les annales des concours du Sénégal, classées par concours et par année. Chaque fascicule contient 320 exercices corrigés, 4 concours blancs et la méthodologie de réussite.
                  </p>

                  {/* Highlight badge: À partir de 2 000 FCFA */}
                  <div className="inline-flex items-center gap-3 p-2.5 px-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold">Tarif officiel unique :</span>
                    <span className="text-lg font-black text-amber-400 font-['Cabinet_Grotesk']">
                      À partir de 2 000 FCFA
                    </span>
                  </div>

                  {/* Key Highlights */}
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-3 max-w-md mx-auto lg:mx-0 pt-1 text-left">
                    <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-900/70 border border-slate-800">
                      <span className="text-lg sm:text-2xl font-black text-amber-400 block font-['Cabinet_Grotesk']">2 000 F</span>
                      <span className="text-[10px] sm:text-[11px] text-slate-400">Prix unique</span>
                    </div>
                    <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-900/70 border border-slate-800">
                      <span className="text-lg sm:text-2xl font-black text-emerald-400 block font-['Cabinet_Grotesk']">Wave & OM</span>
                      <span className="text-[10px] sm:text-[11px] text-slate-400">Paiement direct</span>
                    </div>
                    <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-900/70 border border-slate-800">
                      <span className="text-lg sm:text-2xl font-black text-sky-400 block font-['Cabinet_Grotesk']">DRM PDF</span>
                      <span className="text-[10px] sm:text-[11px] text-slate-400">Accès certifié</span>
                    </div>
                  </div>

                  {/* Call to Actions (Exact Button Name: Explorer les annales) */}
                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
                    <a
                      href="#catalogue"
                      className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:brightness-110 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 flex items-center gap-2 transition active:scale-95"
                    >
                      <BookOpen className="w-4 h-4" />
                      Explorer les annales
                      <ArrowRight className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                {/* Right Column: Interactive 3D Book & 2D Showcase */}
                <div className="lg:col-span-5 flex flex-col items-center">
                  {featuredAnnale && (
                    <div className="w-full max-w-md bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-5 rounded-3xl border border-slate-800/80 shadow-2xl backdrop-blur-md flex flex-col items-center">
                      <div className="w-full flex items-center justify-between mb-3">
                        {/* 3D vs 2D Toggle */}
                        <div className="flex items-center p-1 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] font-bold">
                          <button
                            type="button"
                            onClick={() => setHeroViewMode('3d')}
                            className={`px-3 py-1 rounded-lg transition flex items-center gap-1.5 ${
                              heroViewMode === '3d'
                                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>Vue 3D Pro</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setHeroViewMode('poster')}
                            className={`px-3 py-1 rounded-lg transition flex items-center gap-1.5 ${
                              heroViewMode === 'poster'
                                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            <Eye className="w-3 h-3" />
                            <span>Affiche 2D</span>
                          </button>
                        </div>

                        <span className="text-xs font-mono font-black text-amber-400">2 000 FCFA</span>
                      </div>

                      {/* Showcase Display Area */}
                      {heroViewMode === '3d' ? (
                        <div className="w-full">
                          <Professional3DBookViewer
                            annale={featuredAnnale}
                            isPurchased={purchasedIds.includes(featuredAnnale.id)}
                            onOpenReader={() => openReader(featuredAnnale)}
                            onBuy={() => openBuy(featuredAnnale)}
                            height="380px"
                            enableFullscreen={() => setActive3DAnnale(featuredAnnale)}
                          />
                        </div>
                      ) : (
                        <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl border border-slate-700/80 bg-slate-950 group">
                          <img
                            src={featuredAnnale.cover_image}
                            alt={featuredAnnale.title}
                            className="w-full h-auto object-contain block transition-transform duration-300 group-hover:scale-[1.01]"
                          />
                        </div>
                      )}

                      <div className="w-full mt-4 space-y-2 text-left">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {featuredAnnale.category}
                          </span>
                          <span className="text-xs font-black text-amber-400">Édition Officielle</span>
                        </div>
                        <h3 className="font-bold text-white text-sm line-clamp-1">{featuredAnnale.title}</h3>
                        <p className="text-[11px] text-slate-400 line-clamp-2">{featuredAnnale.description}</p>
                        <div className="pt-2 flex items-center gap-2">
                          <button
                            onClick={() => setActive3DAnnale(featuredAnnale)}
                            className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 text-xs font-bold flex items-center justify-center gap-1.5 transition border border-amber-500/30 shadow-md"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            <span>Plein Écran 3D</span>
                          </button>
                          <button
                            onClick={() => setActivePreviewAnnale(featuredAnnale)}
                            className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition border border-slate-700/60"
                          >
                            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Sommaire</span>
                          </button>
                          <button
                            onClick={() => {
                              if (purchasedIds.includes(featuredAnnale.id)) {
                                openReader(featuredAnnale);
                              } else {
                                openBuy(featuredAnnale);
                              }
                            }}
                            className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:brightness-110 text-slate-950 text-xs font-black flex items-center justify-center gap-1.5 transition shadow-lg shadow-amber-500/20"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span>{purchasedIds.includes(featuredAnnale.id) ? 'Consulter' : 'Acheter'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

      {/* HOW IT WORKS / COMMENT ÇA MARCHE */}
      <section className="py-12 bg-slate-900/40 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400">Processus Simplifié & 100% Automatisé</span>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1 font-['Cabinet_Grotesk']">
              Comment obtenir votre annale en 3 étapes ?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 relative">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-black text-lg mb-4 border border-emerald-500/20">
                1
              </div>
              <h3 className="text-base font-bold text-white mb-2">Choisissez votre concours</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Parcourez nos fascicules officiels : Police nationale, Douane, Gendarmerie, ENA, ENSOA Koutal ou Eaux & Forêts. Visualisez le sommaire officiel et les 320 exercices corrigés.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 relative">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-black text-lg mb-4 border border-amber-500/20">
                2
              </div>
              <h3 className="text-base font-bold text-white mb-2">Paiement 2 000 FCFA par Wave / OM</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Scannez le QR Code Wave ou validez le code USSD Orange Money #144#391#. Aucun frais caché, transaction sécurisée et validée côté serveur.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 relative">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center font-black text-lg mb-4 border border-sky-500/20">
                3
              </div>
              <h3 className="text-base font-bold text-white mb-2">Déblocage & Révision immédiate</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Le webhook prestataire confirme le virement et débloque immédiatement les 320 exercices corrigés, les 4 concours blancs et le téléchargement PDF protégé.
              </p>
            </div>
          </div>
        </div>
      </section>
 
       {/* CATALOGUE SECTION */}
       <section id="catalogue" className="py-16 flex-1">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
           {/* Header & Filter Controls */}
           <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
             <div>
               <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400">
                 Catalogue Officiel des Annales
               </span>
               <h2 className="text-2xl sm:text-3xl font-black text-white mt-1 font-['Cabinet_Grotesk']">
                 Annales des Concours Disponibles
               </h2>
               <p className="text-xs text-slate-400 mt-1">
                 Chaque fascicule renforcé contient 320 énoncés distincts corrigés, 4 concours blancs et le plan d'action intensif sur 30 jours au tarif officiel unique de 2 000 FCFA.
               </p>
             </div>

             {/* Search Bar */}
             <div className="relative w-full md:w-80">
               <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
               <input
                 type="text"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 placeholder="Rechercher par concours, mot-clé..."
                 className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
               />
             </div>
           </div>

           {/* Category Filter & Purchased Filter */}
           <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
             <div className="flex items-center gap-3 flex-wrap">
               <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                 <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                 Filière :
               </span>
               <div className="relative">
                 <select
                   value={isAllCategories(selectedCategory) ? 'Tous' : selectedCategory}
                   onChange={(e) => {
                     const val = e.target.value;
                     setSelectedCategory(isAllCategories(val) ? 'Tous' : val);
                   }}
                   className="bg-slate-900 border border-slate-700 hover:border-emerald-500/60 rounded-xl pl-3 pr-8 py-2 text-xs text-white font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer shadow-sm appearance-none max-w-[210px] sm:max-w-xs truncate"
                 >
                   {categories.map((cat: string) => (
                     <option key={cat} value={cat} className="bg-slate-900 text-slate-200">
                       {cat === 'Tous' ? '✨ Tous les concours et BTS (22 filières)' : cat}
                     </option>
                   ))}
                 </select>
                 <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">
                   ▼
                 </div>
               </div>

               {!isAllCategories(selectedCategory) && (
                 <button
                   onClick={() => setSelectedCategory('Tous')}
                   className="text-xs text-emerald-300 hover:text-white font-medium px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-700/60 hover:border-emerald-500 transition flex items-center gap-1.5 shadow-sm"
                 >
                   <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
                   <span>Retour à tous les concours</span>
                 </button>
               )}
             </div>

            {purchasedIds.length > 0 && (
              <div className="flex items-center gap-3 ml-auto">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={filterOnlyPurchased}
                    onChange={(e) => setFilterOnlyPurchased(e.target.checked)}
                    className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span>Afficher seulement mes annales débloquées ({purchasedIds.length})</span>
                </label>
              </div>
            )}
          </div>

          {/* Annales Grid */}
          {loading ? (
            <div className="py-20 text-center">
              <div className="w-10 h-10 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-400">Chargement des annales en cours...</p>
            </div>
          ) : filteredAnnales.length === 0 ? (
            <div className="py-16 text-center bg-slate-900/40 rounded-3xl border border-slate-800 p-8 space-y-3">
              <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-white">Aucune annale ne correspond à votre filtre</h3>
              <p className="text-xs text-slate-400">Essayez de réinitialiser la recherche ou sélectionnez "Tous".</p>
              <button
                onClick={() => {
                  setSelectedCategory('Tous');
                  setSearchQuery('');
                  setFilterOnlyPurchased(false);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 mx-auto transition"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
                <span>Retour au catalogue complet</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAnnales.map((annale) => (
                <AnnaleCard
                  key={annale.id}
                  annale={annale}
                  isPurchased={purchasedIds.includes(annale.id)}
                  onBuy={openBuy}
                  onOpenReader={openReader}
                  onPreview={setActivePreviewAnnale}
                  onOpen3D={setActive3DAnnale}
                  onUploadCover={handleUploadCover}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* WHY SUNUANNALES SECTION */}
      <section className="py-16 bg-gradient-to-b from-slate-950 to-slate-900 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400">
                Garantie Réussite & Transparence
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight font-['Cabinet_Grotesk']">
                Pourquoi SunuAnnales est le choix numéro 1 des candidats au Sénégal ?
              </h2>
              <div className="space-y-4 text-xs text-slate-300">
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-white">Contenu 100% conforme aux programmes officiels</h4>
                    <p className="text-slate-400 mt-0.5">
                      Rédigé et vérifié d'après les arrêtés et avis officiels des ministères des Forces Armées, de l'Intérieur, des Finances et de l'Environnement.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-white">Zéro répétition artificielle : 320 exercices uniques</h4>
                    <p className="text-slate-400 mt-0.5">
                      Chaque question a été formulée de manière originale pour couvrir l'intégralité du spectre (écrits, logique, épreuves physiques, déontologie et oraux).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-white">Paiement sécurisé et instantané au Sénégal</h4>
                    <p className="text-slate-400 mt-0.5">
                      Wave, Orange Money (#144#391#), Free Money et cartes bancaires. Accès immédiat 24h/24 sans attendre une validation manuelle.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Testimonials / Stats Box */}
            <div className="p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <p className="text-3xl font-black text-white font-['Cabinet_Grotesk']">+14 500</p>
                  <p className="text-xs text-slate-400">Exercices travaillés sur la plateforme</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-emerald-400 font-['Cabinet_Grotesk']">96,8 %</p>
                  <p className="text-xs text-slate-400">Taux de satisfaction candidats</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                <div className="flex items-center gap-1 text-amber-400">
                  {'★'.repeat(5)}
                </div>
                <p className="text-slate-300 italic">
                  « Le fascicule de Police m'a permis de dominer l'épreuve de droit public et les tests psychotechniques. Les corrigés sont clairs et vont droit au but ! »
                </p>
                <p className="text-slate-400 text-[11px] font-semibold">
                  — Ibrahima S., admis à l'École Nationale de Police de Dakar
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                <div className="flex items-center gap-1 text-amber-400">
                  {'★'.repeat(5)}
                </div>
                <p className="text-slate-300 italic">
                  « Paiement par Wave en 10 secondes et accès instantané. Le plan de 30 jours m'a donné un cadre de travail militaire pour Koutal. »
                </p>
                <p className="text-slate-400 text-[11px] font-semibold">
                  — Ousmane N., candidat ENSOA
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION (QUESTIONS FREQUENTES) */}
      <FaqSection />

      {/* CALL TO ACTION (CTA) SECTION */}
      <section className="py-16 bg-gradient-to-r from-emerald-950/70 via-slate-900 to-teal-950/70 border-t border-b border-emerald-500/20 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Concours Directs & Examens du Sénégal — Préparation Complète
          </span>

          <h2 className="text-3xl sm:text-4xl font-black text-white font-['Cabinet_Grotesk'] max-w-2xl mx-auto leading-tight">
            Prêt à réussir votre concours avec brio ?
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            Rejoignez plus de 14 500 candidats qui révisent avec les annales officielles SunuAnnales. Accès immédiat à vos 320 exercices corrigés et téléchargement PDF garanti pour seulement 2 000 FCFA.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <a
              href="#catalogue"
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:brightness-110 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 flex items-center gap-2 transition active:scale-95"
            >
              <BookOpen className="w-4 h-4" />
              Commander mon annale à 2 000 FCFA
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              Paiement officiel SaaSPay Sénégal
            </span>
            <span>•</span>
            <span>Wave & Orange Money direct</span>
            <span>•</span>
            <span>Confirmation serveur sécurisée</span>
          </div>
        </div>
      </section>
        </>
      )}

      {/* VIEW: A PROPOS */}
      {currentTab === 'apropos' && (
        <AboutSection
          onNavigateHome={() => {
            setCurrentTab('accueil');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onNavigateContact={() => {
            setCurrentTab('contact');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          totalAnnalesCount={annales.length}
        />
      )}

      {/* VIEW: CONTACT */}
      {currentTab === 'contact' && (
        <ContactSection
          onNavigateHome={() => {
            setCurrentTab('accueil');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          categories={categories}
        />
      )}

      {/* FOOTER */}
      <footer className="bg-slate-950 border-t border-slate-800 py-12 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold">
                  SA
                </div>
                <span className="text-base font-bold text-white font-['Cabinet_Grotesk']">
                  SunuAnnales
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Plateforme numérique nationale pour la préparation d'élite aux concours et examens officiels de la République du Sénégal.
              </p>
              
              {/* Quick Navigation in Footer */}
              <div className="flex items-center gap-3 pt-1 text-[11px] font-semibold text-emerald-400">
                <button
                  onClick={() => {
                    setCurrentTab('accueil');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`hover:underline ${currentTab === 'accueil' ? 'text-white underline' : ''}`}
                >
                  Accueil
                </button>
                <span className="text-slate-600">•</span>
                <button
                  onClick={() => {
                    setCurrentTab('apropos');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`hover:underline ${currentTab === 'apropos' ? 'text-white underline' : ''}`}
                >
                  À propos
                </button>
                <span className="text-slate-600">•</span>
                <button
                  onClick={() => {
                    setCurrentTab('contact');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`hover:underline ${currentTab === 'contact' ? 'text-white underline' : ''}`}
                >
                  Contact
                </button>
              </div>

              <div className="space-y-1 pt-1 text-[11px]">
                <p className="text-emerald-400 font-medium">
                  📧 <a href="mailto:support@sunuannales.sn" className="hover:underline">support@sunuannales.sn</a>
                </p>
                <p className="text-slate-400">
                  Dakar, République du Sénégal
                </p>
              </div>
            </div>

            <div>
              <h5 className="font-bold text-white mb-3 uppercase tracking-wider text-[11px]">Concours & BTS Couverts</h5>
              <ul className="space-y-1.5 text-[11px]">
                <li>Police, Gendarmerie & Douanes</li>
                <li>Magistrature & Greffe (CFJ)</li>
                <li>BTS Gestion Chaîne Approvisionnement Logistique, Transit & Secrétariat</li>
                <li>ESP Dakar & Concours IFACE</li>
                <li>ENA, ENSOA, Agriculture de l'Armée & Écoles Militaires</li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold text-white mb-3 uppercase tracking-wider text-[11px]">Paiements Sénégal</h5>
              <ul className="space-y-1.5 text-[11px]">
                <li>Wave Sénégal (scan QR & push direct)</li>
                <li>Orange Money Sonatel (#144#391#)</li>
                <li>Passerelle sécurisée SaaSPay Sénégal</li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold text-white mb-3 uppercase tracking-wider text-[11px]">Assistance Candidats</h5>
              <p className="text-[11px] text-slate-400 mb-3">
                Assistance continue pour vos commandes, paiements Wave / Orange Money et consultation des fascicules.
              </p>
              <div className="text-[11px] text-slate-300 space-y-1.5">
                <p className="flex items-center gap-1.5 text-emerald-400">
                  <span>✓</span> Activation instantanée après paiement
                </p>
                <p className="flex items-center gap-1.5 text-slate-300">
                  <span>✓</span> Mode hors-ligne et liseuse sécurisée
                </p>
                <p className="flex items-center gap-1.5 text-slate-300">
                  <span>✓</span> Support réactif par email
                </p>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-3">
            <p>© 2026 SunuAnnales SN SARL. Tous droits réservés. République du Sénégal.</p>
            <div className="flex items-center gap-4">
              <p>Conforme aux réglementations UEMOA et protection des données personnelles.</p>
              <button
                onClick={() => setShowAdminDashboard(true)}
                className="text-slate-700 hover:text-slate-400 transition text-[10px]"
                title="Espace administration"
              >
                Admin
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      {/* 1. Payment Modal */}
      {activePaymentAnnale && (
        <PaymentModal
          annale={activePaymentAnnale}
          currentUser={currentUser}
          onClose={() => setActivePaymentAnnale(null)}
          onPaymentSuccess={(id) => {
            handlePaymentSuccess(id);
            setActivePaymentAnnale(null);
            setActiveReaderAnnaleId(id);
          }}
          onOpenAuth={() => {}}
        />
      )}

      {/* 2. DRM Protected Reader Modal */}
      {activeReaderAnnaleId && (
        <SecureReaderModal
          annaleId={activeReaderAnnaleId}
          onClose={() => setActiveReaderAnnaleId(null)}
          onBuyRequired={(id) => {
            const ann = annales.find(a => a.id === id);
            if (ann) openBuy(ann);
          }}
        />
      )}

      {/* 4. Preview / Summary Modal */}
      {activePreviewAnnale && (
        <PreviewSummaryModal
          annale={activePreviewAnnale}
          isPurchased={purchasedIds.includes(activePreviewAnnale.id)}
          onClose={() => setActivePreviewAnnale(null)}
          onBuy={(ann) => {
            setActivePreviewAnnale(null);
            openBuy(ann);
          }}
          onOpenReader={(ann) => {
            setActivePreviewAnnale(null);
            openReader(ann);
          }}
        />
      )}

      {/* 4. Professional 3D Inspection Modal */}
      {active3DAnnale && (
        <Professional3DModal
          annale={active3DAnnale}
          isPurchased={purchasedIds.includes(active3DAnnale.id)}
          onClose={() => setActive3DAnnale(null)}
          onBuy={(ann) => {
            setActive3DAnnale(null);
            openBuy(ann);
          }}
          onOpenReader={(ann) => {
            setActive3DAnnale(null);
            openReader(ann);
          }}
        />
      )}

      {/* 5. Admin Dashboard Modal */}
      {showAdminDashboard && (
        <AdminDashboard
          initialTab={adminInitialTab}
          onClose={() => {
            setShowAdminDashboard(false);
            fetchCatalog();
          }}
        />
      )}

      {/* 6. API Routes Explorer Modal */}
      {showRoutesModal && (
        <ApiRoutesModal onClose={() => setShowRoutesModal(false)} />
      )}

      {/* 7. Customer Portal Modal (Espace Candidat / Mes commandes / Mes annales / Mes téléchargements) */}
      {showPortalModal && (
        <CustomerPortalModal
          currentUser={currentUser}
          allAnnales={annales}
          onClose={() => setShowPortalModal(false)}
          onOpenReader={(ann) => {
            setShowPortalModal(false);
            openReader(ann);
          }}
          onOpenAuth={() => {}}
        />
      )}

      {/* 9. PayTech Return Notification Modal (when returning to ?payment=success or ?payment=cancelled) */}
      {showPaymentReturn && (
        <PaymentReturnNotification
          onPaymentConfirmed={(annaleId) => {
            handlePaymentSuccess(annaleId);
          }}
          onOpenReader={(annaleId) => {
            const ann = annales.find(a => a.id === annaleId);
            if (ann) openReader(ann);
          }}
          onClose={() => setShowPaymentReturn(false)}
        />
      )}
    </div>
  );
}
