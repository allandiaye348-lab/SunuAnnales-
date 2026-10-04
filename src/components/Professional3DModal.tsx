import React, { useState } from 'react';
import { Annale } from '../types';
import { Professional3DBookViewer } from './Professional3DBookViewer';
import { X, Sparkles, BookOpen, ShoppingBag, ShieldCheck, CheckCircle2, Award, Clock, ArrowRight, Eye } from 'lucide-react';

interface Professional3DModalProps {
  annale: Annale;
  isPurchased: boolean;
  onClose: () => void;
  onBuy: (annale: Annale) => void;
  onOpenReader: (annale: Annale) => void;
}

export const Professional3DModal: React.FC<Professional3DModalProps> = ({
  annale,
  isPurchased,
  onClose,
  onBuy,
  onOpenReader,
}) => {
  const [viewMode, setViewMode] = useState<'3d' | 'poster'>('3d');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl flex flex-col">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur-md z-20">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {annale.category}
                </span>
                <span className="text-xs text-slate-400">Édition Officielle 2026</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white line-clamp-1">
                {annale.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Switcher */}
            <div className="flex items-center p-1 rounded-xl bg-slate-800 border border-slate-700 text-xs">
              <button
                onClick={() => setViewMode('3d')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                  viewMode === '3d'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Vue 3D Studio</span>
              </button>
              <button
                onClick={() => setViewMode('poster')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                  viewMode === 'poster'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Affiche 2D</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-5 sm:p-6 items-center">
          {/* Left Column: 3D Studio or 2D Poster */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center">
            {viewMode === '3d' ? (
              <Professional3DBookViewer
                annale={annale}
                isPurchased={isPurchased}
                onOpenReader={() => onOpenReader(annale)}
                onBuy={() => onBuy(annale)}
                height="460px"
              />
            ) : (
              <div className="w-full max-w-sm rounded-2xl overflow-hidden border border-slate-700 shadow-2xl bg-black">
                <img
                  src={annale.cover_image}
                  alt={annale.title}
                  className="w-full h-auto object-contain block"
                />
              </div>
            )}
          </div>

          {/* Right Column: Key Details & Purchasing */}
          <div className="lg:col-span-5 flex flex-col space-y-4">
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Contenu Certifié Conforme
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>320</strong> exercices corrigés</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400 shrink-0" />
                  <span><strong>4</strong> concours blancs</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>Programme <strong>30 jours</strong></span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Corrigés du jury</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-800/40 p-4 rounded-2xl border border-slate-800">
              {annale.description}
            </p>

            {/* Price Box */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-900 to-emerald-500/10 border border-amber-500/30 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-300 block">Tarif unique officiel</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white font-['Cabinet_Grotesk']">2 000</span>
                  <span className="text-sm font-bold text-amber-400">FCFA</span>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
                Paiement Wave & OM
              </span>
            </div>

            {/* Main Action CTA */}
            {isPurchased ? (
              <button
                onClick={() => onOpenReader(annale)}
                className="w-full py-3.5 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/40 transition active:scale-98"
              >
                <BookOpen className="w-4 h-4" />
                <span>Consulter le livre en lecture sécurisée</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => onBuy(annale)}
                className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:brightness-110 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/25 transition active:scale-98"
              >
                <ShoppingBag className="w-4 h-4 fill-slate-950" />
                <span>Commander l'annale (2 000 FCFA)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            <div className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1.5 pt-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Activation immédiate dès confirmation du paiement</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
