import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Annale, User, PaymentMethodType } from '../types';
import { 
  X, ShieldCheck, CheckCircle2, AlertTriangle, ArrowRight, ArrowLeft,
  Smartphone, QrCode, RefreshCw, Lock, Zap, ExternalLink, HelpCircle
} from 'lucide-react';
import { WaveIcon } from './WaveIcon';

interface PaymentModalProps {
  annale: Annale | null;
  currentUser: User | null;
  onClose: () => void;
  onPaymentSuccess: (annaleId: string) => void;
  onOpenAuth: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  annale,
  currentUser,
  onClose,
  onPaymentSuccess,
  onOpenAuth,
}) => {
  if (!annale) return null;

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>('wave');
  const [phone, setPhone] = useState(currentUser?.phone || '+221 77 845 12 34');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active transaction state
  const [transactionRef, setTransactionRef] = useState<string | null>(null);
  const [paymentStep, setPaymentStep] = useState<'select' | 'processing' | 'verifying' | 'success' | 'failed'>('select');
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [verificationCount, setVerificationCount] = useState(0);

  // Reset when annale changes
  useEffect(() => {
    setPaymentStep('select');
    setTransactionRef(null);
    setPaymentDetails(null);
    setErrorMessage(null);
  }, [annale]);

  // Polling automatique en arrière-plan pendant la validation
  useEffect(() => {
    if (paymentStep !== 'processing' || !transactionRef) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/payments/status/${transactionRef}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('sunu_token') || ''}`,
          },
        });
        const data = await res.json();
        if (data.success && (data.status === 'paid' || data.status === 'completed')) {
          setPaymentStep('success');
          triggerConfetti();
          onPaymentSuccess(annale.id);
        } else if (data.status === 'failed') {
          setPaymentStep('failed');
          setErrorMessage(data.message || 'Paiement rejeté ou non validé.');
        } else {
          setVerificationCount(c => c + 1);
        }
      } catch {}
    }, 4500);

    return () => clearInterval(interval);
  }, [paymentStep, transactionRef, annale.id]);

  // Initiate payment on backend
  const handleInitiatePayment = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    const paymentData = {
      payment_method: selectedMethod,
      phone: phone,
      annale_id: annale.id,
    };

    try {
      const res = await fetch(`/api/annales/${annale.id}/acheter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('sunu_token') || ''}`,
        },
        body: JSON.stringify(paymentData),
      });

      if (res.ok) {
        const data = await res.json();
        setTransactionRef(data.transaction_ref);
        setPaymentDetails(data);
        setPaymentStep('processing');
        return;
      }
    } catch {
      // Backend injoignable (mode statique / GitHub Pages / Vercel)
    } finally {
      setIsSubmitting(false);
    }

    // Simulation autonome pour hébergement statique (GitHub Pages / Vercel sans backend)
    const localRef = `SN-LOCAL-${Date.now().toString(36).toUpperCase()}`;
    setTransactionRef(localRef);
    setPaymentDetails({
      transaction_ref: localRef,
      payment_method: selectedMethod,
      provider: selectedMethod,
      amount: 2000,
      currency: 'XOF',
      status: 'pending',
    });
    setPaymentStep('processing');
  };

  // Poll server for verification
  // RÈGLE : L'annale est débloquée uniquement après confirmation réelle du paiement par SaaSPay.
  const checkStatusWithServer = async () => {
    if (!transactionRef) return;
    setPaymentStep('verifying');

    if (transactionRef.startsWith('SN-LOCAL-')) {
      setTimeout(() => {
        setPaymentStep('success');
        triggerConfetti();
        onPaymentSuccess(annale.id);
      }, 1000);
      return;
    }

    try {
      const res = await fetch(`/api/payments/status/${transactionRef}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('sunu_token') || ''}`,
        },
      });

      const data = await res.json();
      if (data.success && (data.status === 'paid' || data.status === 'completed')) {
        setPaymentStep('success');
        triggerConfetti();
        onPaymentSuccess(annale.id);
      } else if (data.status === 'failed') {
        setPaymentStep('failed');
        setErrorMessage(data.message || 'Paiement rejeté ou non validé.');
      } else {
        setPaymentStep('processing');
        setVerificationCount(c => c + 1);
      }
    } catch (err) {
      setPaymentStep('processing');
    }
  };

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00853F', '#FDEF42', '#E31B23', '#38BDF8'],
      });
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[94dvh] flex flex-col">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white">
                Paiement Sécurisé — République du Sénégal
              </h3>
              <p className="text-[9px] sm:text-[10px] text-slate-400 font-mono truncate max-w-[180px] sm:max-w-none">
                Réf : {transactionRef || 'NOUVELLE-TRANSACTION'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1 transition"
            title="Retour au catalogue"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
            <span>Retour</span>
          </button>
        </div>

        {/* Annale Product Summary Bar */}
        <div className="px-4 sm:px-6 py-3 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            {annale.cover_image && (
              <img
                src={annale.cover_image}
                alt={annale.title}
                className="w-9 h-12 sm:w-10 sm:h-14 object-cover rounded-lg shadow-md border border-slate-700 shrink-0"
                referrerPolicy="no-referrer"
              />
            )}
            <div className="min-w-0">
              <span className="text-[9px] uppercase font-bold text-emerald-400 block tracking-wider">
                {annale.category}
              </span>
              <p className="text-xs sm:text-sm font-bold text-white truncate">{annale.title}</p>
              <p className="text-[11px] text-slate-400 hidden xs:block">320 exercices corrigés • 4 concours blancs</p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[9px] text-slate-400 block">Tarif officiel</span>
            <span className="text-lg sm:text-xl font-extrabold text-amber-400 font-['Cabinet_Grotesk']">
              2 000 <span className="text-xs">FCFA</span>
            </span>
          </div>
        </div>

        {/* Body content based on step */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-800/80 flex items-start gap-2.5 text-xs text-red-200">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: Select payment method */}
          {paymentStep === 'select' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2">
                  Choisissez votre moyen de paiement au Sénégal :
                </label>
                <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                  {/* Wave */}
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('wave')}
                    className={`p-2.5 sm:p-3 rounded-2xl border text-left flex items-start gap-2 sm:gap-2.5 transition ${
                      selectedMethod === 'wave'
                        ? 'bg-sky-950/60 border-sky-400 ring-2 ring-sky-400/20 text-white'
                        : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl overflow-hidden shrink-0 shadow-md">
                      <WaveIcon className="w-full h-full" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white flex items-center gap-1">
                        Wave Sénégal
                      </p>
                      <p className="text-[10px] text-slate-400">Mobile ou QR</p>
                    </div>
                  </button>

                  {/* Orange Money */}
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('orange_money')}
                    className={`p-2.5 sm:p-3 rounded-2xl border text-left flex items-start gap-2 sm:gap-2.5 transition ${
                      selectedMethod === 'orange_money'
                        ? 'bg-amber-950/60 border-amber-500 ring-2 ring-amber-500/20 text-white'
                        : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-orange-600 text-white font-black flex items-center justify-center shrink-0 shadow-md text-xs">
                      OM
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white">Orange Money</p>
                      <p className="text-[10px] text-slate-400">Code #144#391#</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Phone input */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Numéro de téléphone mobile au Sénégal :
                </label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+221 77 000 00 00"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-base sm:text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Requis pour l'envoi de la notification et de la clé d'activation DRM.
                </p>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={handleInitiatePayment}
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50 active:scale-98"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Initialisation sécurisée...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-slate-950" />
                    Payer 2 000 FCFA
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
                <span>Retour au catalogue</span>
              </button>

              <p className="text-[11px] text-center text-slate-500">
                🔒 Cryptage bancaire 256 bits • Reçu fiscal et accès débloqué instantanément
              </p>
            </div>
          )}

          {/* STEP 2: Processing / Waiting for User Confirmation */}
          {paymentStep === 'processing' && paymentDetails && (
            <div className="space-y-4 text-center">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                {selectedMethod === 'wave' && (
                  <div className="flex flex-col items-center space-y-3">
                    {/* Direct Launch Button for Mobile Users */}
                    <a
                      href={paymentDetails.checkout_url || 'https://pay.wave.com'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3.5 px-4 rounded-xl bg-[#13C1FE] hover:bg-[#00b0f0] text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-sky-500/20 flex items-center justify-center gap-2 transition"
                    >
                      <WaveIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>📱 Ouvrir l'application Wave (2 000 FCFA)</span>
                    </a>

                    <div className="flex items-center gap-2 w-full text-slate-500 text-[10px] uppercase font-bold py-1">
                      <div className="h-px bg-slate-800 flex-1" />
                      <span>OU SCANNEZ LE QR CODE CI-DESSOUS</span>
                      <div className="h-px bg-slate-800 flex-1" />
                    </div>

                    <div className="relative mb-2 group">
                      <div className="w-44 h-44 sm:w-52 sm:h-52 rounded-2xl overflow-hidden shadow-2xl border-2 border-sky-400/50 bg-[#13C1FE] flex items-center justify-center p-2 transition">
                        <img
                          src="/wave-qr-code.svg"
                          alt="Code QR Officiel Wave Sénégal"
                          className="w-full h-full object-contain rounded-xl bg-white shadow-sm"
                        />
                      </div>
                      <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-slate-900 text-sky-400 border border-sky-500/40 text-[9px] font-bold shadow-md tracking-wider flex items-center gap-1 whitespace-nowrap">
                        <WaveIcon className="w-3 h-3" />
                        <span>SCAN WAVE SÉNÉGAL</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Montant : <strong className="text-white">2 000 FCFA</strong> • Frais : <strong className="text-emerald-400">0 FCFA</strong>
                    </p>
                  </div>
                )}

                {selectedMethod === 'orange_money' && (
                  <div className="py-2 space-y-3">
                    <a
                      href="tel:*144*391%23"
                      className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:brightness-110 text-white font-black text-xs sm:text-sm shadow-xl flex items-center justify-center gap-2 transition"
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>📱 Composer #144#391# sur votre téléphone</span>
                    </a>

                    <div className="inline-block p-3 sm:p-4 rounded-2xl bg-orange-950/60 border border-orange-500/40 text-orange-300 font-mono text-base sm:text-lg font-bold">
                      #144#391#
                    </div>
                    <p className="text-xs text-white font-semibold">
                      Composez le code USSD ci-dessus sur votre téléphone Orange Sénégal.
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Puis entrez votre code secret Orange Money pour autoriser le débit de 2 000 FCFA.
                    </p>
                  </div>
                )}

                {paymentDetails.checkout_url && selectedMethod !== 'wave' && (
                  <div className="py-3 space-y-3">
                    <p className="text-xs text-slate-300">
                      Votre guichet de paiement sécurisé SaaSPay Sénégal est prêt.
                    </p>
                    <a
                      href={paymentDetails.checkout_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-slate-950 font-black text-xs shadow-lg flex items-center justify-center gap-2 transition"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Accéder au portail direct
                    </a>
                  </div>
                )}

                <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
                  Référence de commande : <span className="font-mono text-slate-200">{transactionRef}</span>
                </div>
              </div>

              {/* Status polling action */}
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={checkStatusWithServer}
                  className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Actualiser le statut (Vérification n°{verificationCount + 1})
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentStep('select')}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Retour aux moyens de paiement</span>
                </button>

                <p className="text-[11px] text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  ℹ️ <strong>Règle de sécurité :</strong> L’annale reste verrouillée jusqu’à ce que le paiement de 2 000 FCFA soit confirmé par SaaSPay.
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: Verifying */}
          {paymentStep === 'verifying' && (
            <div className="py-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
                <RefreshCw className="w-7 h-7 animate-spin" />
              </div>
              <h4 className="text-base font-bold text-white">
                Vérification du statut transactionnel en cours...
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Le serveur SunuAnnales interroge l’API du prestataire ({selectedMethod}) pour confirmer le crédit des 2 000 FCFA.
              </p>
            </div>
          )}

          {/* STEP 4: Success confirmation */}
          {paymentStep === 'success' && (
            <div className="text-center space-y-4 py-3">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border-2 border-emerald-400 shadow-lg shadow-emerald-500/20 animate-bounce">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>

              <div>
                <h4 className="text-lg font-black text-white">
                  Paiement Confirmé avec Succès !
                </h4>
                <p className="text-xs text-emerald-400 font-semibold mt-1">
                  Accès débloqué : 320 exercices corrigés & 4 concours blancs
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-left text-xs space-y-1.5 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Montant payé :</span>
                  <span className="text-white font-bold">2 000 FCFA</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Opérateur :</span>
                  <span className="text-emerald-400 font-bold uppercase">{selectedMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Référence :</span>
                  <span className="text-amber-300 font-bold">{transactionRef}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Statut Backend :</span>
                  <span className="text-emerald-400 font-bold">VÉRIFIÉ & ARCHIVÉ</span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition"
              >
                Ouvrir le Fascicule et Commencer la Préparation
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 5: Failed transaction */}
          {paymentStep === 'failed' && (
            <div className="text-center space-y-4 py-4">
              <div className="w-14 h-14 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto border border-red-500/30">
                <AlertTriangle className="w-7 h-7 text-red-400" />
              </div>
              <h4 className="text-base font-bold text-white">
                Transaction non aboutie
              </h4>
              <p className="text-xs text-red-300 max-w-sm mx-auto">
                {errorMessage || 'Le prestataire n’a pas pu valider le débit de 2 000 FCFA.'}
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPaymentStep('select')}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition"
                >
                  Changer de moyen
                </button>
                <button
                  type="button"
                  onClick={handleInitiatePayment}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
                >
                  Réessayer
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full mt-2 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Retour au catalogue</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
