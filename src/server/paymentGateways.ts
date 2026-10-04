import crypto from 'crypto';
import { db } from './db.js';

export type PaymentMethod = 'saaspay' | 'wave' | 'orange_money' | 'free_money' | 'card' | 'paytech';

export interface InitiatePaymentParams {
  transaction_ref: string;
  amount: number; // 2000 FCFA
  currency: string; // XOF
  annale_id: string;
  annale_title: string;
  user_id: string;
  user_email: string;
  user_name: string;
  phone: string;
  payment_method: PaymentMethod;
  app_url: string;
}

export interface InitiatePaymentResult {
  success: boolean;
  transaction_ref: string;
  checkout_url?: string;
  session_id?: string;
  qr_code_data?: string;
  ussd_code?: string;
  instructions: string;
  provider: 'saaspay' | PaymentMethod;
  provider_data: Record<string, any>;
}

export interface VerificationResult {
  verified: boolean;
  status: 'paid' | 'completed' | 'failed' | 'pending';
  transaction_ref: string;
  provider_reference?: string;
  amount?: number;
  currency?: string;
  failure_reason?: string;
  raw_response: Record<string, any>;
}

export interface WebhookResult {
  isValid: boolean;
  transaction_ref: string;
  status: 'paid' | 'completed' | 'failed' | 'pending';
  amount?: number;
  currency?: string;
  provider_reference?: string;
  failure_reason?: string;
  raw_payload: Record<string, any>;
}

export interface PaymentGateway {
  id: PaymentMethod;
  name: string;
  initiate(params: InitiatePaymentParams): Promise<InitiatePaymentResult>;
  verify(transaction_ref: string, sessionId?: string): Promise<VerificationResult>;
}

/**
 * Passerelle Officielle SaaSPay Sénégal (https://saspay.me)
 * Agrégateur multi-opérateurs : Wave Sénégal, Orange Money, Free Money, Carte Bancaire
 * Documentation officielle : https://docs.saspay.me/
 */
export class SaaSPayGateway implements PaymentGateway {
  id: PaymentMethod = 'saaspay';
  name = 'SaaSPay Sénégal (Wave, Orange Money, Free Money, Carte Bancaire)';

  private getBaseUrl(): string {
    const customUrl = db.getSetting('saaspay_base_url');
    return customUrl || process.env.SAASPAY_BASE_URL || 'https://api.saspay.me/api/v1';
  }

  private getApiKey(): string {
    const customKey = db.getSetting('saaspay_api_key');
    return customKey || process.env.SAASPAY_API_KEY || 'sk_live_sUPuQa34AGQMOavYO-tL4iuApAqj9UUW7r9V_er1KKw';
  }

  private getWebhookSecret(): string {
    const customSecret = db.getSetting('saaspay_webhook_secret');
    return customSecret || process.env.SAASPAY_WEBHOOK_SECRET || '';
  }

  private getEnv(): string {
    const customEnv = db.getSetting('saaspay_env');
    const rawEnv = customEnv || process.env.SAASPAY_ENV || 'production';
    return rawEnv.toLowerCase().includes('test') ? 'test' : 'production';
  }

  /**
   * Création d'une session de paiement hébergée (Hosted Checkout Session)
   * Endpoint officiel : POST https://api.saspay.me/api/v1/checkout-sessions/
   */
  async initiate(params: InitiatePaymentParams): Promise<InitiatePaymentResult> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error(
        'Clé API SaaSPay non configurée sur le serveur. Veuillez renseigner SAASPAY_API_KEY.'
      );
    }

    const baseUrl = this.getBaseUrl();
    const env = this.getEnv();

    // RÈGLE IMPÉRATIVE : 2 000 FCFA imposés par le backend
    const FIXED_AMOUNT = 2000;
    const FIXED_CURRENCY = 'XOF';

    const cleanAppUrl = (params.app_url && !params.app_url.includes('localhost'))
      ? params.app_url.replace('http://', 'https://')
      : (process.env.APP_URL || 'https://ais-dev-rh3ptaij57tub6d3dbuefs-263406869445.europe-west3.run.app');

    const returnUrl = `${cleanAppUrl}/?payment=success&ref=${params.transaction_ref}`;

    // Payload conforme à l'OpenAPI officielle SaaSPay
    const payload = {
      amount: `${FIXED_AMOUNT}.00`,
      currency: FIXED_CURRENCY,
      description: `Achat Annale ${params.annale_title} (SunuAnnales SN)`,
      country: 'SN', // Sénégal
      customer_email: params.user_email || 'candidat@sunuannales.sn',
      customer_name: params.user_name || 'Candidat Concours',
      customer_phone: params.phone || '',
      return_url: returnUrl,
      metadata: {
        reference: params.transaction_ref,
        annale_id: params.annale_id,
        user_id: params.user_id,
        amount: FIXED_AMOUNT,
        currency: FIXED_CURRENCY,
        app: 'SunuAnnales SN',
      },
    };

    // LOGS DE DIAGNOSTIC OBLIGATOIRES (Point 16) — SANS EXPOSER DE CLÉ SECRÈTE
    console.log("=== SAASPAY PAYMENT REQUEST ===");
    console.log("provider: saaspay");
    console.log(`amount: ${FIXED_AMOUNT}`);
    console.log(`currency: ${FIXED_CURRENCY}`);
    console.log(`reference: ${params.transaction_ref}`);
    console.log(`annale_id: ${params.annale_id}`);
    console.log(`env: ${env}`);
    console.log(`customer_email: ${payload.customer_email}`);

    try {
      const response = await fetch(`${baseUrl}/checkout-sessions/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (!response.ok || !responseData.success) {
        const errorDetail = typeof responseData.error === 'object'
          ? JSON.stringify(responseData.error)
          : (responseData.message || responseData.error || 'Échec de création de session SaaSPay');
        throw new Error(`Erreur SaaSPay (${response.status}): ${errorDetail}`);
      }

      const session = responseData.data;

      if (!session || !session.checkout_url) {
        throw new Error('Réponse invalide de SaaSPay : checkout_url manquante.');
      }

      // Sélectionner exclusivement Wave Sénégal ou Orange Money (exclure Free Money et Expresso)
      const targetNetwork = params.payment_method === 'orange_money' ? 'orange_sn' : 'wave_sn';
      let finalCheckoutUrl = session.checkout_url;
      let finalTransactionId = session.id;

      try {
        const directPayRes = await fetch(`${baseUrl}/checkout/${session.slug}/pay/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            country: 'SN',
            network: targetNetwork,
            customer: {
              phone: params.phone || '',
              name: params.user_name || 'Candidat Concours',
              email: params.user_email || 'candidat@sunuannales.sn',
            },
          }),
        });

        const directPayData = await directPayRes.json();
        if (directPayData.success && directPayData.data?.payment_url) {
          finalCheckoutUrl = directPayData.data.payment_url;
          if (directPayData.data.transaction_id) {
            finalTransactionId = directPayData.data.transaction_id;
          }
          console.log(`[SAASPAY DIRECT NETWORK]: Redirection directe vers ${targetNetwork} (${finalCheckoutUrl})`);
        }
      } catch (directErr) {
        console.warn('[SAASPAY DIRECT NETWORK NOTICE]: Utilisation de l’URL de session hébergée:', directErr);
      }

      return {
        success: true,
        transaction_ref: params.transaction_ref,
        session_id: finalTransactionId,
        checkout_url: finalCheckoutUrl,
        instructions: params.payment_method === 'orange_money'
          ? 'Veuillez finaliser votre paiement sécurisé de 2 000 FCFA sur Orange Money.'
          : 'Veuillez finaliser votre paiement sécurisé de 2 000 FCFA sur Wave Sénégal.',
        provider: 'saaspay',
        provider_data: {
          session_id: finalTransactionId,
          slug: session.slug,
          checkout_url: finalCheckoutUrl,
          network: targetNetwork,
          amount: FIXED_AMOUNT,
          currency: FIXED_CURRENCY,
          env: env,
          expires_at: session.expires_at,
          created_at: session.created_at,
        },
      };
    } catch (err: any) {
      console.error('[SAASPAY INITIATE ERROR]:', err);
      throw new Error(err.message || 'Impossible de contacter l’API SaaSPay');
    }
  }

  /**
   * Vérification directe d'une session de paiement auprès de SaaSPay
   * Endpoint officiel : GET https://api.saspay.me/api/v1/checkout-sessions/{id}/status/
   * ou GET https://api.saspay.me/api/v1/checkout-sessions/{id}/
   */
  async verify(transaction_ref: string, sessionId?: string): Promise<VerificationResult> {
    if (!sessionId) {
      return {
        verified: false,
        status: 'pending',
        transaction_ref,
        raw_response: { message: 'Aucun ID de session SaaSPay fourni pour la vérification directe.' },
      };
    }

    const apiKey = this.getApiKey();
    const baseUrl = this.getBaseUrl();

    try {
      const response = await fetch(`${baseUrl}/checkout-sessions/${sessionId}/status/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Fallback vers le détail complet de la session
        const fullRes = await fetch(`${baseUrl}/checkout-sessions/${sessionId}/`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        });
        const fullData = await fullRes.json();
        const session = fullData.data || {};
        const isPaid = session.status === 'PAID' || session.status === 'SUCCESS';
        const sessionAmount = Number(session.amount);

        return {
          verified: isPaid,
          status: isPaid ? 'paid' : (session.status === 'CANCELLED' ? 'failed' : 'pending'),
          transaction_ref,
          provider_reference: session.transaction || session.id,
          amount: sessionAmount,
          currency: session.currency,
          raw_response: fullData,
        };
      }

      const statusData = await response.json();
      const isPaid = statusData.status === 'PAID' || statusData.transaction_status === 'SUCCESS';

      return {
        verified: isPaid,
        status: isPaid ? 'paid' : 'pending',
        transaction_ref,
        provider_reference: statusData.transaction_id || statusData.id,
        raw_response: statusData,
      };
    } catch (err: any) {
      console.error('[SAASPAY VERIFY ERROR]:', err);
      return {
        verified: false,
        status: 'pending',
        transaction_ref,
        failure_reason: err.message,
        raw_response: { error: err.message },
      };
    }
  }

  /**
   * Vérification de la signature cryptographique du Webhook SaaSPay
   * Headers officiels SaaSPay :
   * X-Webhook-Signature: <hex sha256 HMAC>
   * X-Webhook-Timestamp: <horodatage Unix, en secondes>
   * X-Webhook-Event: <event_type, ex "transaction.success" ou "checkout_session.paid">
   */
  verifyWebhookSignature(rawBody: string, signatureHeader?: string, timestampHeader?: string): boolean {
    const secret = this.getWebhookSecret();
    if (!secret) {
      // Si aucun secret de webhook n'est configuré dans l'environnement,
      // la validation se fera par cross-check API direct via GET /checkout-sessions/{id}/status/
      return true;
    }

    if (!signatureHeader || !timestampHeader) {
      return false;
    }

    const TOLERANCE_SECONDS = 300; // 5 minutes
    const now = Math.floor(Date.now() / 1000);
    const ts = Number(timestampHeader);

    if (isNaN(ts) || Math.abs(now - ts) > TOLERANCE_SECONDS) {
      console.warn(`[SAASPAY WEBHOOK SÉCURITÉ]: Horodatage hors tolérance (Diff: ${Math.abs(now - ts)}s)`);
      return false;
    }

    try {
      const expected = crypto
        .createHmac('sha256', secret)
        .update(`${timestampHeader}.${rawBody}`)
        .digest('hex');

      const a = Buffer.from(signatureHeader);
      const b = Buffer.from(expected);
      return a.length === b.length && crypto.timingSafeEqual(a, b);
    } catch (err) {
      console.error('[SAASPAY SIGNATURE ERROR]:', err);
      return false;
    }
  }
}

/**
 * Gestionnaire unifié des paiements SunuAnnales SN
 * Toutes les requêtes (Wave, Orange Money, Free Money, Carte) transitent par SaaSPay
 */
export class PaymentService {
  private saaspayGateway = new SaaSPayGateway();

  getGateway(method?: PaymentMethod): PaymentGateway {
    return this.saaspayGateway;
  }

  listAvailableGateways() {
    return [
      { id: 'saaspay', name: 'SaaSPay Sénégal (Tous opérateurs)' },
      { id: 'wave', name: 'Wave Sénégal (via SaaSPay)' },
      { id: 'orange_money', name: 'Orange Money (via SaaSPay)' },
      { id: 'free_money', name: 'Free Money (via SaaSPay)' },
      { id: 'card', name: 'Carte Bancaire (via SaaSPay)' },
    ];
  }
}

export const paymentService = new PaymentService();
