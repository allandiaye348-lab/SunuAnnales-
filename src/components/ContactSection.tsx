import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2, AlertCircle, Clock, MessageSquare, ShieldCheck, ArrowRight, ArrowLeft, HelpCircle } from 'lucide-react';

interface ContactSectionProps {
  onNavigateHome: () => void;
  categories: string[];
}

export const ContactSection: React.FC<ContactSectionProps> = ({
  onNavigateHome,
  categories,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [concours, setConcours] = useState('Tous');
  const [subject, setSubject] = useState('Aide à la commande ou paiement Wave/OM');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successResponse, setSuccessResponse] = useState<{ message: string; ticket_id: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim() || !email.trim() || !message.trim()) {
      setErrorMessage('Veuillez renseigner votre nom, adresse email et votre message.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          concours: concours !== 'Tous' ? concours : undefined,
          subject,
          message: message.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessResponse({
          message: data.message || 'Votre message a bien été envoyé.',
          ticket_id: data.ticket_id || `SN-${Date.now().toString().slice(-6)}`,
        });
        setName('');
        setEmail('');
        setPhone('');
        setMessage('');
      } else {
        setErrorMessage(data.error || 'Une erreur est survenue lors de l\'envoi. Veuillez réessayer.');
      }
    } catch (err) {
      setErrorMessage('Erreur réseau. Veuillez vérifier votre connexion internet et réessayer.');
    } finally {
      setSubmitting(false);
    }
  };

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

      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          <MessageSquare className="w-3.5 h-3.5" />
          SERVICE CANDIDATS & ASSISTANCE
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight font-['Cabinet_Grotesk'] leading-tight">
          Contactez l'équipe <span className="text-emerald-400">SunuAnnales</span>
        </h1>
        <p className="text-sm text-slate-300 leading-relaxed">
          Une question sur un fascicule, une commande Wave / Orange Money, ou une suggestion pédagogique ? 
          Notre équipe vous répond sous 24h ouvrées.
        </p>
      </div>

      {/* Main Grid: Form + Contact Info */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form */}
        <div className="lg:col-span-7 bg-slate-900/90 rounded-3xl border border-slate-800 p-6 sm:p-8 shadow-xl">
          <h2 className="text-lg font-bold text-white mb-6 font-['Cabinet_Grotesk'] flex items-center gap-2">
            <Mail className="w-5 h-5 text-emerald-400" />
            Envoyer un message à l'assistance
          </h2>

          {successResponse ? (
            <div className="bg-emerald-950/70 border border-emerald-500/40 rounded-2xl p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Message transmis avec succès !</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {successResponse.message}
              </p>
              <div className="inline-block bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-emerald-400 font-mono">
                Référence Ticket : <strong>{successResponse.ticket_id}</strong>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => setSuccessResponse(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700 transition"
                >
                  Envoyer un autre message
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Nom complet <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Cheikh Tidiane Diop"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Adresse email <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="candidat@domaine.sn"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Téléphone (Wave / WhatsApp)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+221 77 000 00 00"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Concours ou filière concernée
                  </label>
                  <select
                    value={concours}
                    onChange={(e) => setConcours(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="Tous">Général / Aucun en particulier</option>
                    {categories.filter(c => c !== 'Tous').map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Objet de la demande
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="Aide à la commande ou paiement Wave/OM">Aide à la commande ou paiement Wave/Orange Money</option>
                  <option value="Accès à une annale achetée">Accès à une annale achetée / Consultation liseuse</option>
                  <option value="Question pédagogique sur une épreuve">Question pédagogique sur une épreuve</option>
                  <option value="Partenariat école ou centre de formation">Partenariat école ou centre de formation</option>
                  <option value="Autre demande">Autre demande</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Votre message <span className="text-emerald-400">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Détaillez votre question ou la référence de votre transaction..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Envoyer mon message</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Right Column: Contact Details & Quick FAQ */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-6 space-y-5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-['Cabinet_Grotesk']">
              Coordonnées Officielles
            </h3>

            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-white">Email Assistance</p>
                  <a href="mailto:support@sunuannales.sn" className="text-emerald-400 hover:underline">
                    support@sunuannales.sn
                  </a>
                  <p className="text-[10px] text-slate-400 mt-0.5">Réponse garantie sous 24h ouvrées</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-white">Horaires d'Assistance</p>
                  <p className="text-slate-300">Du Lundi au Dimanche</p>
                  <p className="text-[10px] text-slate-400">08h00 — 22h00 GMT</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-white">Siège National</p>
                  <p className="text-slate-300">Dakar, République du Sénégal</p>
                  <p className="text-[10px] text-slate-400">Couverture nationale des 14 régions</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick FAQ Mini Card */}
          <div className="bg-slate-900/60 rounded-3xl border border-slate-800 p-6 space-y-4">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-emerald-400" />
              Questions fréquentes immédiates
            </h4>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <p className="font-semibold text-slate-200">Comment débloquer une annale ?</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Cliquez sur "Acheter (2 000 FCFA)", effectuez le paiement sur la page sécurisée Wave ou Orange Money, votre accès est activé automatiquement.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <p className="font-semibold text-slate-200">Puis-je réviser sans connexion ?</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Oui ! Une fois votre annale ouverte dans la liseuse sécurisée, elle reste consultable même si votre connexion internet est interrompue.
                </p>
              </div>
            </div>

            <button
              onClick={onNavigateHome}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <span>Retourner au Catalogue des Concours</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
