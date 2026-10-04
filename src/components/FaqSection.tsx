import React, { useState } from 'react';
import { ChevronDown, HelpCircle, ShieldCheck, Zap, Lock, CreditCard } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
  category?: string;
}

const FAQS: FaqItem[] = [
  {
    question: "Comment fonctionne le paiement de 2 000 FCFA avec SaaSPay Sénégal ?",
    answer: "Lorsque vous cliquez sur « Payer 2 000 FCFA », notre serveur crée une commande sécurisée au statut « pending » puis initialise la procédure officielle SaaSPay Sénégal. Vous réglez directement via Wave Sénégal ou Orange Money (avec le code #144#391#). Dès confirmation de votre débit, SaaSPay notifie notre serveur via webhook sécurisé, qui débloque instantanément votre accès et le téléchargement du PDF.",
    category: "Paiement"
  },
  {
    question: "L'accès au PDF est-il débloqué dès l'arrivée sur la page de succès ?",
    answer: "Non, et c'est une garantie de sécurité absolue : le fichier PDF n'est JAMAIS débloqué sur simple affichage d'une URL de retour. Le déblocage dépend exclusivement de la confirmation réelle et authentique serveur à serveur attestant du versement effectif et exact des 2 000 FCFA.",
    category: "Sécurité"
  },
  {
    question: "Puis-je télécharger le fascicule PDF pour le lire hors ligne ?",
    answer: "Absolument. Dès la confirmation serveur du paiement, vous pouvez à la fois consulter les 320 exercices et leurs corrections directement dans notre lecteur interactif sécurisé, et télécharger le document PDF officiel intégrant votre licence nominative certifiée.",
    category: "Téléchargement"
  },
  {
    question: "Qu'est-ce que le filigrane nominatif sur les documents ?",
    answer: "Chaque fascicule téléchargé comporte un filigrane numérique officiel mentionnant votre adresse email, votre référence de commande SaaSPay et un jeton DRM unique. Cela garantit l'authenticité de votre acquisition auprès des jurys et protège vos droits.",
    category: "Sécurité"
  },
  {
    question: "Quels sont les opérateurs mobiles acceptés au Sénégal ?",
    answer: "Les deux moyens de paiement mobiles leaders au Sénégal sont pris en charge : Wave Sénégal (scan QR ou validation mobile sans frais) et Orange Money Sonatel (validation instantanée par code USSD #144#391#).",
    category: "Paiement"
  },
  {
    question: "Que contient exactement chaque annale à 2 000 FCFA ?",
    answer: "Chaque annale est un programme de préparation complet contenant exactement 320 exercices distincts avec corrigés détaillés rédigés par d'anciens lauréats et correcteurs officiels, 4 simulations de concours blancs avec barèmes, des fiches de préparation physique et un plan d'entraînement intensif sur 30 jours.",
    category: "Contenu"
  },
];

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="py-16 bg-slate-950 border-b border-slate-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold">
            <HelpCircle className="w-3.5 h-3.5" />
            Questions Fréquentes
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white font-['Cabinet_Grotesk']">
            Tout comprendre sur les Annales & le Paiement PayTech
          </h2>
          <p className="text-xs text-slate-400 max-w-lg mx-auto">
            Retrouvez les réponses aux questions les plus courantes sur les concours au Sénégal, le prix unique de 2 000 FCFA et la sécurité de vos données.
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden transition duration-200"
              >
                <button
                  type="button"
                  onClick={() => toggle(index)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 hover:bg-slate-850 transition"
                >
                  <span className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-emerald-400' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs text-slate-300 leading-relaxed border-t border-slate-850/80 bg-slate-950/40">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
