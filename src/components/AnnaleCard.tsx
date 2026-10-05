import React from 'react';
import { Annale } from '../types';
import { downloadAnnalePdf } from '../utils/pdfDownloader';
import { ShieldCheck, BookOpen, CheckCircle2, ShoppingBag, Eye, Sparkles, Award, Clock, Download } from 'lucide-react';

interface AnnaleCardProps {
  annale: Annale;
  isPurchased: boolean;
  onBuy: (annale: Annale) => void;
  onOpenReader: (annale: Annale) => void;
  onPreview: (annale: Annale) => void;
  onOpen3D?: (annale: Annale) => void;
  onEditPhoto?: (annale: Annale) => void;
  onUploadCover?: (annaleId: string, file: File) => void;
}

export const AnnaleCard: React.FC<AnnaleCardProps> = ({
  annale,
  isPurchased,
  onBuy,
  onOpenReader,
  onPreview,
  onOpen3D,
  onUploadCover: _onUploadCover,
}) => {
  return (
    <div className="relative group bg-slate-900/90 rounded-3xl border border-slate-800 hover:border-emerald-500/50 transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-emerald-950/30">
      {/* Top Banner with gradient matching book */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${annale.cover_gradient}`} />

      {/* Official Book Cover Showcase - Completely Unaltered without any obstructive overlays */}
      {annale.cover_image && (
        <div
          onClick={() => onOpen3D && onOpen3D(annale)}
          className={`relative w-full bg-slate-950 flex items-center justify-center p-3 border-b border-slate-800/80 group-hover:bg-black/40 transition ${onOpen3D ? 'cursor-pointer' : ''}`}
          title={onOpen3D ? 'Cliquer pour ouvrir la vue 3D interactive' : undefined}
        >
          {/* Natural Unaltered Full Poster Display - 100% visible without text blockage */}
          <div className="relative w-full max-w-[280px] rounded-2xl overflow-hidden shadow-2xl shadow-black/80 border border-slate-700/80 bg-slate-900">
            <img
              key={annale.cover_image}
              src={annale.cover_image}
              alt={annale.title}
              className="w-full h-auto object-contain block transition-transform duration-200 group-hover:scale-[1.01]"
              referrerPolicy="no-referrer"
              loading="eager"
            />
          </div>
        </div>
      )}

      {/* Card Content */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col">
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-slate-800 text-slate-200 border border-slate-700">
            {annale.category}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              <Award className="w-3 h-3" />
              {annale.badge}
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition line-clamp-2">
          {annale.title}
        </h3>

        {/* Ministry Authority */}
        <p className="text-xs text-slate-400 mt-1 line-clamp-1">
          {annale.ministry}
        </p>

        {/* Target Corps */}
        <div className="mt-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <p className="text-[11px] text-slate-400 uppercase font-medium">Corps visés</p>
          <p className="text-xs text-slate-200 font-semibold line-clamp-1">{annale.target_corps}</p>
        </div>

        {/* Key Features Pill Matrix */}
        <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
          <div className="flex items-center gap-1.5 text-slate-300 bg-slate-800/50 px-2.5 py-1.5 rounded-lg border border-slate-700/40">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate"><strong>320</strong> exercices</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300 bg-slate-800/50 px-2.5 py-1.5 rounded-lg border border-slate-700/40">
            <BookOpen className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span className="truncate"><strong>4</strong> concours blancs</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300 bg-slate-800/50 px-2.5 py-1.5 rounded-lg border border-slate-700/40">
            <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">Plan <strong>30 jours</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300 bg-slate-800/50 px-2.5 py-1.5 rounded-lg border border-slate-700/40">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="truncate">Corrigés certifiés</span>
          </div>
        </div>

        {/* Short description */}
        <p className="text-xs text-slate-400 mt-4 line-clamp-3 leading-relaxed">
          {annale.description}
        </p>

        {/* Action Row: Sommaire & Vue 3D without blocking image */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2">
          <button
            onClick={() => onPreview(annale)}
            className="flex-1 py-2 px-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-800 transition"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">Sommaire (320 ex.)</span>
          </button>
          {onOpen3D && (
            <button
              type="button"
              onClick={() => onOpen3D(annale)}
              className="py-2 px-3 rounded-xl bg-slate-900/90 hover:bg-amber-950/40 text-amber-300 hover:text-amber-200 text-xs font-bold border border-amber-500/40 hover:border-amber-400/60 shadow-xs flex items-center justify-center gap-1.5 transition active:scale-95"
              title="Inspecter le livre en 3D interactive à 360°"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Vue 3D</span>
            </button>
          )}
        </div>
      </div>

      {/* Card Footer / Purchase or Access */}
      <div className="p-4 sm:p-5 bg-slate-950/90 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
        <div>
          <span className="text-[10px] text-slate-400 block uppercase font-medium">Prix officiel</span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-white font-['Cabinet_Grotesk']">
              2 000
            </span>
            <span className="text-xs font-bold text-emerald-400">FCFA</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isPurchased ? (
            <>
              <button
                onClick={() => onOpenReader(annale)}
                className="px-3 py-2 rounded-xl bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white font-bold text-xs border border-emerald-500/40 flex items-center gap-1.5 transition"
                title="Ouvrir le lecteur interactif complet"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-300" />
                <span>Lire</span>
              </button>

              <button
                onClick={() => downloadAnnalePdf(annale)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-white font-bold text-xs border border-amber-500/30 shadow-md flex items-center gap-1.5 transition active:scale-95"
                title="Télécharger le fichier PDF officiel (320 exercices corrigés)"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>PDF</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => onBuy(annale)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:brightness-110 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition active:scale-95"
              title="Acheter pour 2 000 FCFA via Wave ou Orange Money"
            >
              <ShoppingBag className="w-4 h-4 fill-slate-950" />
              <span>Acheter (2 000 F)</span>
            </button>
          )}
        </div>
      </div>

      {/* Verified purchased badge banner if owned */}
      {isPurchased && (
        <div className="absolute top-4 right-4 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          Acquis
        </div>
      )}
    </div>
  );
};
