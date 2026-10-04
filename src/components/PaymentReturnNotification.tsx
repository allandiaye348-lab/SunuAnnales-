import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, Clock, AlertTriangle, RefreshCw, BookOpen, DownloadCloud, X, ArrowRight, ShieldCheck } from 'lucide-react';

interface PaymentReturnNotificationProps {
  onPaymentConfirmed: (annaleId: string) => void;
  onOpenReader: (annaleId: string) => void;
  onClose: () => void;
}

export const PaymentReturnNotification: React.FC<PaymentReturnNotificationProps> = ({
  onPaymentConfirmed,
  onOpenReader,
  onClose,
}) => {
  const [params, setParams] = useState<{ payment: string; ref: string } | null>(null);
  const [status, setStatus] = useState<'checking' | 'completed' | 'pending' | 'failed' | 'cancelled'>('checking');
  const [pollCount, setPollCount] = useState(0);
  const [paymentData, setPaymentData] = useState<any | null>(null);
  const [message, setMessage] = useState<string>('Vérification de la confirmation SaaSPay auprès du serveur...');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const payment = urlParams.get('payment');
    const ref = urlParams.get('ref');

    if (payment && ref) {
      setParams({ payment, ref });
      if (payment === 'cancelled') {
        setStatus('cancelled');
        setMessage('Vous avez annulé la procédure de paiement sur la page SaaSPay.');
      } else {
        checkStatus(ref, true);
      }
    }
  }, []);

  // Poll server for webhook confirmation
  useEffect(() => {
    if (!params || status === 'completed' || status === 'cancelled' || status === 'failed') return;

    const timer = setInterval(() => {
      if (pollCount < 20) {
        checkStatus(params.ref, false);
        setPollCount(prev => prev + 1);
      } else {
        setStatus('pending');
        setMessage('La confirmation SaaSPay est en cours de transmission. Vous pouvez actualiser manuellement ou vérifier dans votre espace client.');
      }
    }, 3000);

    return () => clearInterval(timer);
  }, [params, status, pollCount]);

  const checkStatus = async (ref: string, initial: boolean) => {
    if (initial) setStatus('checking');

    try {
      const res = await fetch(`/api/payments/status/${ref}`);
      const data = await res.json();

      if (data.status === 'paid' || data.status === 'completed') {
        setStatus('completed');
        setPaymentData(data.payment);
        setMessage('Paiement confirmé avec succès par SaaSPay ! Votre fascicule PDF et les 320 exercices sont débloqués.');
        onPaymentConfirmed(data.payment.annale_id);
        triggerConfetti();
      } else if (data.status === 'failed') {
        setStatus('failed');
        setMessage(data.message || 'Le paiement n’a pas pu être validé par le prestataire SaaSPay.');
      } else {
        setStatus('pending');
        setMessage('En attente de la notification SaaSPay officielle sur le serveur...');
      }
    } catch (err) {
      console.error('Erreur vérification statut:', err);
    }
  };

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#00853F', '#FDEF42', '#E31B23', '#38BDF8'],
      });
    } catch {}
  };

  if (!params) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">
              Vérification Sécurisée SaaSPay Sénégal
            </h3>
          </div>
          <button
            onClick={() => {
              // Clean URL query params
              window.history.replaceState({}, document.title, window.location.pathname);
              onClose();
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Indicator */}
        <div className="text-center space-y-3 py-2">
          {status === 'checking' && (
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
              <RefreshCw className="w-7 h-7 animate-spin" />
            </div>
          )}

          {status === 'pending' && (
            <div className="w-14 h-14 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
              <Clock className="w-7 h-7 animate-pulse" />
            </div>
          )}

          {status === 'completed' && (
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border-2 border-emerald-400 shadow-lg shadow-emerald-500/20 animate-bounce">
              <CheckCircle2 className="w-9 h-9 text-emerald-400" />
            </div>
          )}

          {(status === 'failed' || status === 'cancelled') && (
            <div className="w-14 h-14 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto border border-red-500/30">
              <AlertTriangle className="w-7 h-7 text-red-400" />
            </div>
          )}

          <div>
            <h4 className="text-base font-black text-white">
              {status === 'completed'
                ? 'Paiement Confirmé par l’IPN Serveur !'
                : status === 'cancelled'
                ? 'Procédure Annulée'
                : status === 'failed'
                ? 'Échec de Validation'
                : 'En attente de la confirmation serveur...'}
            </h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-md mx-auto">
              {message}
            </p>
          </div>
        </div>

        {/* Transaction details card */}
        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-1.5">
          <div className="flex justify-between">
            <span className="text-slate-500">Référence PayTech :</span>
            <span className="text-amber-300 font-bold">{params.ref}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Montant :</span>
            <span className="text-white font-bold">2 000 FCFA</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Statut en base :</span>
            <span
              className={`font-bold ${
                status === 'completed' ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {status.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Rule explanation notice */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>
            <strong>Règle de sécurité :</strong> L'arrivée sur la page de succès ne débloque jamais le PDF par elle-même. Le déblocage dépend rigoureusement de la notification IPN PayTech reçue et auditée par notre serveur.
          </span>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          {status === 'completed' ? (
            <div className="space-y-2">
              <button
                onClick={() => {
                  window.history.replaceState({}, document.title, window.location.pathname);
                  onClose();
                  if (paymentData?.annale_id) {
                    onOpenReader(paymentData.annale_id);
                  }
                }}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-slate-950 font-black text-xs shadow-lg flex items-center justify-center gap-2 transition"
              >
                <BookOpen className="w-4 h-4" />
                Ouvrir le Lecteur Interactif
                <ArrowRight className="w-4 h-4" />
              </button>

              {paymentData?.annale_id && (
                <button
                  onClick={() => {
                    const token = localStorage.getItem('sunu_token') || '';
                    window.location.href = `/api/annales/${paymentData.annale_id}/download-pdf?token=${encodeURIComponent(token)}`;
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-white font-bold text-xs border border-amber-500/30 flex items-center justify-center gap-2 transition"
                >
                  <DownloadCloud className="w-4 h-4 text-amber-400" />
                  Télécharger le Fascicule PDF Officiel (320 Exercices)
                </button>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => checkStatus(params.ref, false)}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Vérifier maintenant
              </button>
              <button
                onClick={() => {
                  window.history.replaceState({}, document.title, window.location.pathname);
                  onClose();
                }}
                className="py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-xs border border-slate-700 transition"
              >
                Continuer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
