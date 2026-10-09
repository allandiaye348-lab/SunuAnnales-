import React, { useState, useEffect } from 'react';
import { Annale, Exercise } from '../types';
import { fallbackAnnales } from '../data/fallbackAnnales';
import { downloadAnnalePdf } from '../utils/pdfDownloader';
import { 
  X, ShieldCheck, Download, Search, CheckCircle, 
  HelpCircle, ChevronRight, FileText, Clock, Printer, 
  Sparkles, Lock, ArrowLeft, BookOpen, AlertCircle,
  ZoomIn, ZoomOut, Type
} from 'lucide-react';

function cleanNoHashNumber(text: string | null | undefined, isQuestion = false, isAnswer = false): string {
  if (!text || typeof text !== 'string') return '';
  let str = text;
  if (isQuestion) {
    str = str.replace(/^Exercice\s+approfondi\s+(?:#\s*)?\d+\s*\([^)]*\)\s*:\s*/i, '');
    str = str.replace(/^Exercice\s+(?:#\s*)?\d+\s*:\s*/i, '');
    str = str.replace(/(\b[a-zA-ZÀ-ÿ\s\'-]+?)\s+(?:#\s*)?\d{1,4}\s*(?=\s*:)/g, '$1 ');
  }
  if (isAnswer) {
    str = str.replace(/(\bCorrection\s+[a-zA-ZÀ-ÿ\s\'-]*?)\s+(?:#\s*)?\d{1,4}\s*(?=\s*:)/g, '$1 ');
  }
  str = str.replace(/#\s*(\d+)/g, '$1');
  str = str.replace(/#\s*/g, '');
  str = str.replace(/\s{2,}/g, ' ');
  str = str.replace(/\s+:/g, ' :');
  str = str.trim();
  if (isQuestion && str && str[0] === str[0].toLowerCase() && /[a-zà-ÿ]/.test(str[0])) {
    str = str[0].toUpperCase() + str.slice(1);
  }
  return str;
}

interface SecureReaderModalProps {
  annaleId: string;
  onClose: () => void;
  onBuyRequired: (annaleId: string) => void;
}

export const SecureReaderModal: React.FC<SecureReaderModalProps> = ({
  annaleId,
  onClose,
  onBuyRequired,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'content' | 'simulations' | 'plan'>('content');
  const [selectedSection, setSelectedSection] = useState<string>('Tous');
  const [revealedAnswers, setRevealedAnswers] = useState<Record<number, boolean>>({});
  const [fontSize, setFontSize] = useState<'standard' | 'grand' | 'tres-grand'>('grand');

  // Simulation timer
  const [timerSeconds, setTimerSeconds] = useState(7200); // 2 hours
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
    fetchSecureContent();
  }, [annaleId]);

  useEffect(() => {
    let interval: any = null;
    if (timerActive && timerSeconds > 0) {
      interval = setInterval(() => setTimerSeconds(s => s - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, timerSeconds]);

  const fetchSecureContent = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('sunu_token') || '';
      const res = await fetch(`/api/annales/${annaleId}/secure-content`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const json = await res.json();
        setData(json);
        setLoading(false);
        return;
      }
    } catch {
      // Backend injoignable (Vercel statique / GitHub Pages)
    }

    // Fallback de secours autonome complet pour Vercel / GitHub Pages
    const localAnnale = fallbackAnnales.find(a => a.id === annaleId);
    if (localAnnale) {
      setData({
        success: true,
        annale: localAnnale,
        user: { name: 'Candidat Officiel', email: 'candidat@sunuannales.sn' },
        watermark: 'CERTIFIÉ CONFORME — ÉDITIONS SUNUANNALES 2026',
        timestamp: new Date().toISOString(),
      });
      setLoading(false);
      return;
    }

    setError('Annale introuvable.');
    setLoading(false);
  };

  const toggleAnswer = (id: number) => {
    setRevealedAnswers(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const revealAll = () => {
    const all: Record<number, boolean> = {};
    data?.annale?.protected_exercises?.forEach((ex: Exercise) => {
      all[ex.id] = true;
    });
    setRevealedAnswers(all);
  };

  const formatTimer = (totalSecs: number) => {
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleDownload = () => {
    if (data?.annale) {
      downloadAnnalePdf(data.annale, data.user);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-950/90 backdrop-blur-md overflow-hidden">
      <div className="relative w-full max-w-5xl h-full sm:h-[94vh] bg-slate-900 border-0 sm:border border-slate-800 rounded-none sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Top DRM Watermark & Bar */}
        <div className="px-4 sm:px-6 py-3 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 overflow-hidden">
            {data?.annale?.cover_image ? (
              <img
                src={data.annale.cover_image}
                alt={data?.annale?.title || ''}
                className="w-8 h-10 object-cover rounded shadow border border-slate-700 shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
            )}
            <div className="truncate">
              <h2 className="text-sm font-bold text-white truncate">
                {data?.annale?.title || 'Fascicule Officiel — DRM Protégé'}
              </h2>
              {data?.purchase_info && (
                <p className="text-[10px] text-emerald-400 font-mono truncate">
                  {data.purchase_info.watermark}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {data?.purchased && (
              <button
                onClick={handleDownload}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition"
                title="Télécharger version officielle"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Télécharger</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
              title="Retour au catalogue des annales"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
              <span>Retour</span>
            </button>
          </div>
        </div>

        {/* Access Denied or Loading Screen */}
        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-12 h-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin mb-4" />
            <p className="text-sm font-semibold text-slate-300">Vérification de la licence DRM sur le serveur...</p>
          </div>
        )}

        {!loading && error && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-lg mx-auto space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Lock className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white">Contenu Intégralement Protégé</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {error}
            </p>
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left text-xs text-slate-400 w-full space-y-1">
              <p>• <strong>320 exercices</strong> avec corrigés détaillés et barèmes</p>
              <p>• <strong>4 concours blancs</strong> conformes aux programmes officiels</p>
              <p>• <strong>Plan de travail sur 30 jours</strong> structuré par des spécialistes</p>
            </div>
            <div className="flex gap-3 w-full">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4 text-emerald-400" />
                <span>Retour au catalogue</span>
              </button>
              <button
                onClick={() => {
                  onClose();
                  onBuyRequired(annaleId);
                }}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20"
              >
                Débloquer pour 2 000 FCFA
              </button>
            </div>
          </div>
        )}

        {/* Authorized Reader Content */}
        {!loading && data?.purchased && (
          <div className="flex-1 flex flex-col min-h-0 bg-slate-950">
            {/* Navigation Tabs & Controls */}
            <div className="px-4 sm:px-6 py-2 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setActiveTab('content')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    activeTab === 'content'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  320 Exercices & Corrigés
                </button>
                <button
                  onClick={() => setActiveTab('simulations')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    activeTab === 'simulations'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  4 Concours Blancs
                </button>
                <button
                  onClick={() => setActiveTab('plan')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    activeTab === 'plan'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  Plan de 30 Jours
                </button>
              </div>

              <div className="flex items-center gap-2">
                {/* Contrôle de la taille de police (Augmenter la police du fascicule) */}
                <div className="flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800 text-xs">
                  <Type className="w-3.5 h-3.5 text-emerald-400 mr-0.5" />
                  <span className="text-[10px] text-slate-400 font-semibold mr-1">Police :</span>
                  <button
                    onClick={() => setFontSize('standard')}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition ${
                      fontSize === 'standard' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                    title="Taille Standard"
                  >
                    A
                  </button>
                  <button
                    onClick={() => setFontSize('grand')}
                    className={`px-2 py-0.5 rounded-lg text-[12px] font-bold transition ${
                      fontSize === 'grand' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                    title="Grande police lisible"
                  >
                    A+
                  </button>
                  <button
                    onClick={() => setFontSize('tres-grand')}
                    className={`px-2 py-0.5 rounded-lg text-[13px] font-bold transition ${
                      fontSize === 'tres-grand' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                    title="Très grande police confort"
                  >
                    A++
                  </button>
                </div>

                {/* Concours Blanc Timer */}
                <div className="flex items-center gap-2 bg-slate-950 px-3 py-1 rounded-xl border border-slate-800 text-xs">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-mono font-bold text-amber-300">{formatTimer(timerSeconds)}</span>
                  <button
                    onClick={() => setTimerActive(!timerActive)}
                    className="text-[10px] font-bold text-slate-400 hover:text-white underline ml-1"
                  >
                    {timerActive ? 'Pause' : 'Chrono'}
                  </button>
                </div>
              </div>
            </div>

            {/* TAB 1: 320 Exercices & Corrigés */}
            {activeTab === 'content' && (
              <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
                {/* Left sidebar: Table of contents */}
                <div className="w-full md:w-64 bg-slate-900/60 border-r border-slate-800 p-4 overflow-y-auto shrink-0">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Sommaire des 320 Épreuves
                  </div>
                  <div className="space-y-1">
                    <button
                      onClick={() => setSelectedSection('Tous')}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                        selectedSection === 'Tous'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      Toutes les matières
                    </button>
                    {data.annale.summary_sections?.map((sec: any, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedSection(sec.title)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition line-clamp-1 ${
                          selectedSection === sec.title
                            ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                        }`}
                      >
                        {cleanNoHashNumber(sec.title)}
                      </button>
                    ))}
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800">
                    <button
                      onClick={revealAll}
                      className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                    >
                      Afficher tous les corrigés
                    </button>
                  </div>
                </div>

                {/* Right content: Exercises list */}
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                  {/* Search and count header */}
                  <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
                    <div className="relative flex-1 max-w-md">
                      <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Rechercher une question ou mot-clé..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <span className="text-xs text-slate-400">
                      <strong>{data.annale.protected_exercises?.length || 0}</strong> exercices disponibles
                    </span>
                  </div>

                  {/* Exercises list scroll */}
                  <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                    {data.annale.protected_exercises
                      ?.filter((ex: Exercise) => {
                        const cleanSec = cleanNoHashNumber(ex.section);
                        const cleanQ = cleanNoHashNumber(ex.question, true, false);
                        const cleanA = cleanNoHashNumber(ex.answer || ex.answer_preview, false, true);
                        const matchSec = selectedSection === 'Tous' || cleanSec.toLowerCase().includes(selectedSection.toLowerCase());
                        const matchQ = !searchQuery || cleanQ.toLowerCase().includes(searchQuery.toLowerCase()) || cleanA.toLowerCase().includes(searchQuery.toLowerCase());
                        return matchSec && matchQ;
                      })
                      .map((ex: Exercise) => {
                        const isRevealed = revealedAnswers[ex.id];
                        const cleanQ = cleanNoHashNumber(ex.question, true, false);
                        const cleanA = cleanNoHashNumber(ex.answer || ex.answer_preview, false, true);
                        const cleanSec = cleanNoHashNumber(ex.section);
                        const cleanId = cleanNoHashNumber(String(ex.id));

                        return (
                          <div
                            key={ex.id}
                            className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition relative overflow-hidden"
                          >
                            {/* Subtle watermark in background */}
                            <div className="absolute top-2 right-3 text-[10px] font-mono text-slate-700 pointer-events-none select-none">
                              SUNUANNALES • DR-2026
                            </div>

                            <div className="flex items-center gap-2 mb-3">
                              <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold text-xs">
                                Exercice {cleanId}
                              </span>
                              <span className="px-2.5 py-0.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 text-xs font-semibold">
                                {cleanSec}
                              </span>
                            </div>

                            <h4 className={`text-white leading-relaxed ${
                              fontSize === 'standard' 
                                ? 'text-sm font-semibold' 
                                : fontSize === 'grand' 
                                ? 'text-base sm:text-lg font-bold' 
                                : 'text-lg sm:text-xl font-bold'
                            }`}>
                              {cleanQ}
                            </h4>

                            {/* Answer Accordion */}
                            <div className="mt-4 pt-3 border-t border-slate-800">
                              {isRevealed ? (
                                <div className="p-4 sm:p-5 rounded-xl bg-slate-950/90 border-l-4 border-emerald-500 border-t border-r border-b border-emerald-950/40 leading-relaxed animate-in fade-in">
                                  <div className="flex items-center justify-between mb-2 text-emerald-400 font-bold text-xs sm:text-sm">
                                    <span className="flex items-center gap-1.5">
                                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                                      Solution & Argumentation officielle :
                                    </span>
                                    <button
                                      onClick={() => toggleAnswer(ex.id)}
                                      className="text-xs text-slate-400 hover:text-slate-200 underline"
                                    >
                                      Masquer
                                    </button>
                                  </div>
                                  <p className={`text-slate-200 leading-relaxed ${
                                    fontSize === 'standard' 
                                      ? 'text-xs sm:text-sm' 
                                      : fontSize === 'grand' 
                                      ? 'text-sm sm:text-base' 
                                      : 'text-base sm:text-lg'
                                  }`}>
                                    {cleanA}
                                  </p>
                                </div>
                              ) : (
                                <button
                                  onClick={() => toggleAnswer(ex.id)}
                                  className="text-xs sm:text-sm font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 transition py-1"
                                >
                                  <HelpCircle className="w-4 h-4" />
                                  Afficher le corrigé certifié
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: 4 Concours Blancs */}
            {activeTab === 'simulations' && (
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white">4 Concours Blancs Complets — Simulation Réelle</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Conformes aux épreuves d'admission directe et professionnelle du Sénégal. Chronométrez vos séances.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.annale.exam_simulations?.map((sim: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 transition space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Épreuve {idx + 1}
                        </span>
                        <span className="text-xs text-sky-400 font-bold flex items-center gap-1.5 bg-sky-950/40 px-2.5 py-1 rounded-lg border border-sky-800/40">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          {sim.duration}
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-white leading-snug">{cleanNoHashNumber(sim.title)}</h4>
                      <p className="text-xs sm:text-sm text-slate-300">
                        {sim.questions_count || 4} épreuves de synthèse transversales avec grille d'évaluation et barème officiel /20.
                      </p>

                      <button
                        onClick={() => {
                          setActiveTab('content');
                          setTimerSeconds(sim.duration === '2h00' ? 7200 : 9000);
                          setTimerActive(true);
                        }}
                        className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/40"
                      >
                        Lancer ce Concours Blanc avec Chrono
                        <ArrowLeft className="w-4 h-4 rotate-180" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: Plan de 30 Jours */}
            {activeTab === 'plan' && (
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                <div>
                  <h3 className="text-lg font-bold text-white">Programme de Révision Intensif sur 30 Jours</h3>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    Méthodologie recommandée : 45 min de révision théorique + 60 min d'exercices + 15 min de correction certifiée.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                  {[
                    { days: "Jours 1–3", subject: "Français & Syntaxe administrative", detail: "Grammaire, vocabulaire et exercices 1 à 40.", color: "border-indigo-500/40 text-indigo-400" },
                    { days: "Jours 4–6", subject: "Mathématiques & Logique chiffrée", detail: "Calculs de pourcentages, vitesses et proportions.", color: "border-sky-500/40 text-sky-400" },
                    { days: "Jours 7–9", subject: "Histoire du Sénégal & Afrique", detail: "Repères 1960, royaumes et grandes figures.", color: "border-emerald-500/40 text-emerald-400" },
                    { days: "Jours 10–12", subject: "Géographie, frontières & climat", detail: "Territoire, bassins fluviaux et mangroves.", color: "border-teal-500/40 text-teal-400" },
                    { days: "Jours 13–15", subject: "Institutions & Citoyenneté", detail: "Constitution, séparation des pouvoirs, probité.", color: "border-amber-500/40 text-amber-400" },
                    { days: "Jours 16–18", subject: "Droit public & Réglementation", detail: "Police administrative, judiciaire et légalité.", color: "border-orange-500/40 text-orange-400" },
                    { days: "Jours 19–21", subject: "Technique Métier Spécialisée", detail: "Missions de terrain, déontologie et sécurité.", color: "border-cyan-500/40 text-cyan-400" },
                    { days: "Jours 22–24", subject: "Mises en situation & Études de cas", detail: "Cas réels de guichet, litiges et rédaction.", color: "border-blue-500/40 text-blue-400" },
                    { days: "Jours 25–26", subject: "Anglais & Épreuves physiques", detail: "Luc-Léger, 100m et vocabulaire de service.", color: "border-purple-500/40 text-purple-400" },
                    { days: "Jour 27", subject: "Entretien oral avec le jury", detail: "Présentation 60 secondes et posture d'agent.", color: "border-rose-500/40 text-rose-400" },
                    { days: "Jour 28", subject: "Concours Blanc 1", detail: "Simulation chronométrée en conditions d'examen.", color: "border-yellow-500/40 text-yellow-400" },
                    { days: "Jours 29–30", subject: "Concours Blanc Final & Bilan", detail: "Reprise des erreurs et fiches mémo finales.", color: "border-emerald-500/40 text-emerald-400" }
                  ].map((p, idx) => (
                    <div key={idx} className={`p-4 rounded-xl bg-slate-900 border ${p.color} text-xs space-y-1`}>
                      <span className="text-[11px] font-bold text-amber-400 font-mono block">{p.days}</span>
                      <h5 className="font-bold text-white text-sm mt-0.5">{cleanNoHashNumber(p.subject)}</h5>
                      <p className="text-xs text-slate-300 leading-relaxed mt-1">{cleanNoHashNumber(p.detail)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
