import React from 'react';
import { Annale } from '../types';
import { X, BookOpen, ShoppingBag, CheckCircle, Sparkles, Lock, ArrowRight, ArrowLeft } from 'lucide-react';

interface PreviewSummaryModalProps {
  annale: Annale | null;
  isPurchased: boolean;
  onClose: () => void;
  onBuy: (annale: Annale) => void;
  onOpenReader: (annale: Annale) => void;
}

export const PreviewSummaryModal: React.FC<PreviewSummaryModalProps> = ({
  annale,
  isPurchased,
  onClose,
  onBuy,
  onOpenReader,
}) => {
  if (!annale) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 overflow-hidden my-auto max-h-[92dvh] flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4 gap-4">
          <div className="flex items-center gap-3.5">
            {annale.cover_image && (
              <img
                src={annale.cover_image}
                alt={annale.title}
                className="w-14 h-18 object-cover rounded-xl shadow-lg border border-slate-700 shrink-0"
                referrerPolicy="no-referrer"
              />
            )}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-0.5">
                Extrait Gratuit & Sommaire Détaillé
              </span>
              <h3 className="text-base sm:text-lg font-bold text-white leading-snug">{annale.title}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{annale.ministry}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition shrink-0"
            title="Retour au catalogue"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
            <span>Retour</span>
          </button>
        </div>

        {/* Content summary sections */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Structure Complète des 320 Exercices :
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
            {annale.summary_sections?.map((sec, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-slate-200 truncate pr-2">{sec.title}</span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-bold shrink-0">
                    {sec.count} ex.
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2">{sec.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] text-slate-400 block uppercase">Prix de l'annale</span>
            <span className="text-xl font-black text-white font-['Cabinet_Grotesk']">
              2 000 <span className="text-xs font-bold text-emerald-400">FCFA</span>
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Retour au catalogue</span>
            </button>

            {isPurchased ? (
              <button
                onClick={() => {
                  onClose();
                  onOpenReader(annale);
                }}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-900/30 flex items-center gap-1.5 transition"
              >
                <BookOpen className="w-4 h-4" />
                Lire mon Annale
              </button>
            ) : (
              <button
                onClick={() => {
                  onClose();
                  onBuy(annale);
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition"
              >
                <ShoppingBag className="w-4 h-4" />
                Acheter pour 2 000 FCFA
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
