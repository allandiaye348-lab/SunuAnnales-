import React from 'react';
import { Award, BookOpen, CheckCircle2, ShieldCheck, Users, Target, Clock, ArrowRight, ArrowLeft, Sparkles, FileText, Compass, HeartHandshake } from 'lucide-react';

interface AboutSectionProps {
  onNavigateHome: () => void;
  onNavigateContact: () => void;
  totalAnnalesCount: number;
}

export const AboutSection: React.FC<AboutSectionProps> = ({
  onNavigateHome,
  onNavigateContact,
  totalAnnalesCount,
}) => {
  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-300">
      {/* Back button */}
      <div>
        <button
          onClick={onNavigateHome}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 hover:border-emerald-500/60 text-xs font-semibold transition shadow-lg group"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-400 group-hover:-translate-x-0.5 transition-transform" />
          <span>Retour au catalogue des annales</span>
        </button>
      </div>

      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          À PROPOS DE SUNUANNALES SÉNÉGAL
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight font-['Cabinet_Grotesk'] leading-tight">
          Démocratiser la réussite aux <span className="text-emerald-400">concours nationaux</span> du Sénégal
        </h1>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
          SunuAnnales est la première plateforme éducative sénégalaise conçue pour fournir à chaque candidat, 
          à Dakar comme dans les 14 régions de l'intérieur, des annales d'élite avec 320 exercices corrigés, 
          4 concours blancs et un plan méthodologique de 30 jours au tarif républicain unique de <strong>2 000 FCFA</strong>.
        </p>
      </div>

      {/* 3 Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 space-y-4 relative overflow-hidden group hover:border-emerald-500/40 transition">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Target className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white font-['Cabinet_Grotesk']">
            Exigence & Fidélité aux Épreuves
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Chaque fascicule est élaboré par des enseignants chevronnés et des spécialistes des jurys sénégalais, 
            respectant scrupuleusement les arrêtés d'ouverture, les barèmes et les spécificités des épreuves réelles.
          </p>
        </div>

        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 space-y-4 relative overflow-hidden group hover:border-emerald-500/40 transition">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white font-['Cabinet_Grotesk']">
            Pédagogie Active sur 30 Jours
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Fini les révisions désordonnées. Nos tomes incluent un plan d'étude jour par jour sur un mois, 
            permettant aux candidats de progresser méthodiquement du diagnostic initial jusqu'aux concours blancs.
          </p>
        </div>

        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 space-y-4 relative overflow-hidden group hover:border-emerald-500/40 transition">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white font-['Cabinet_Grotesk']">
            Accessibilité & Autonomie
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Paiement mobile instantané par Wave et Orange Money, consultation hors-ligne sur smartphone ou ordinateur, 
            sécurisation numérique pour garantir l'intégrité de vos supports d'étude sans publicité intrusive.
          </p>
        </div>
      </div>

      {/* Detailed Pedagogy Section */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-emerald-950/30 rounded-3xl border border-slate-800 p-8 sm:p-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold">
              LA FORMULE 320 EXERCICES
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-['Cabinet_Grotesk']">
              Pourquoi chaque fascicule compte exactement 320 exercices distincts ?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Les concours au Sénégal se jouent souvent à des dixièmes de points face à des milliers de concurrents. 
              Pour faire la différence, un candidat ne peut pas se contenter de simples résumés théoriques.
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-300">
                  <strong>10 domaines clés (32 questions chacun) :</strong> Maîtrise exhaustive de l'ensemble du programme officiel sans angle mort.
                </span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-300">
                  <strong>Corrections commentées :</strong> Pas seulement la réponse finale, mais le raisonnement, la méthodologie et les pièges fréquents.
                </span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-300">
                  <strong>4 Concours blancs intégraux :</strong> Mises en situation réelles chronométrées pour apprendre à gérer la pression du jour J.
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800 text-center">
              <p className="text-3xl sm:text-4xl font-black text-emerald-400 font-['Cabinet_Grotesk']">{totalAnnalesCount}</p>
              <p className="text-xs text-slate-300 font-semibold mt-1">Concours & BTS</p>
              <p className="text-[10px] text-slate-500 mt-1">Police, Armée, Douanes, ENA, ENSOA, BTS, IFACE...</p>
            </div>
            <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800 text-center">
              <p className="text-3xl sm:text-4xl font-black text-amber-400 font-['Cabinet_Grotesk']">320</p>
              <p className="text-xs text-slate-300 font-semibold mt-1">Exercices par Tome</p>
              <p className="text-[10px] text-slate-500 mt-1">Tous corrigés et gradués</p>
            </div>
            <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800 text-center">
              <p className="text-3xl sm:text-4xl font-black text-blue-400 font-['Cabinet_Grotesk']">2 000</p>
              <p className="text-xs text-slate-300 font-semibold mt-1">FCFA Tarif Unique</p>
              <p className="text-[10px] text-slate-500 mt-1">Paiement Wave & OM</p>
            </div>
            <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800 text-center">
              <p className="text-3xl sm:text-4xl font-black text-purple-400 font-['Cabinet_Grotesk']">100%</p>
              <p className="text-xs text-slate-300 font-semibold mt-1">En Ligne & Hors-ligne</p>
              <p className="text-[10px] text-slate-500 mt-1">Liseuse sécurisée instantanée</p>
            </div>
          </div>
        </div>
      </div>

      {/* Values & Republic Engagement */}
      <div className="space-y-6">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-white font-['Cabinet_Grotesk']">
            Nos Engagements Déontologiques
          </h2>
          <p className="text-xs text-slate-400 mt-2">
            SunuAnnales s'inscrit dans les principes républicains d'égalité des chances et de transparence méritocratique.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 space-y-2">
            <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
              <Compass className="w-4 h-4" />
              Égalité des Territoires
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Un candidat à Tambacounda, Matam ou Kolda doit bénéficier exactement des mêmes ressources documentaires de pointe qu'un étudiant dakarois.
            </p>
          </div>

          <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 space-y-2">
            <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2">
              <Award className="w-4 h-4" />
              Rigueur & Actualisation
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Mise à jour annuelle selon les modifications de programmes (SYSCOHADA, code général des impôts, réformes du baccalauréat et probatoire).
            </p>
          </div>

          <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 space-y-2">
            <h4 className="text-sm font-bold text-blue-400 flex items-center gap-2">
              <HeartHandshake className="w-4 h-4" />
              Support Candidat Dédié
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Une assistance réactive pour répondre à vos questions techniques, confirmer vos commandes et vous accompagner jusqu'à l'examen.
            </p>
          </div>
        </div>
      </div>

      {/* Call to actions */}
      <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-center gap-4">
        <button
          onClick={onNavigateHome}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-500/20"
        >
          <BookOpen className="w-4 h-4" />
          <span>Explorer les 22 fascicules du catalogue</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          onClick={onNavigateContact}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition"
        >
          <Users className="w-4 h-4 text-emerald-400" />
          <span>Contacter notre équipe pédagogique</span>
        </button>
      </div>
    </div>
  );
};
