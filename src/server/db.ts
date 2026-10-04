import fs from 'fs';
import path from 'path';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  password_hash: string;
  role: 'student' | 'admin';
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  annales_count: number;
}

export interface Concours {
  id: string;
  name: string;
  ministry: string;
  category_id: string;
  year: number;
  description: string;
  session_date?: string;
}

export interface Annale {
  id: string;
  slug: string;
  title: string;
  ministry: string;
  category: 'Police' | 'Gendarmerie' | 'ENSOA' | 'ENA' | 'Douane' | 'INFAS' | 'Concours administratifs' | 'Autres concours' | 'Eaux & Forêts' | 'INSEPS' | 'FASTEF' | 'CREM' | 'ENDSS' | 'Santé' | string;
  category_id?: string;
  year?: number;
  format?: 'PDF' | string;
  target_corps: string;
  price: number; // Exactly 2000 FCFA
  currency: string; // XOF
  edition: string;
  total_exercises: number;
  total_pages: number;
  rating: number;
  reviews_count: number;
  cover_gradient: string;
  cover_image?: string;
  accent_color: string;
  badge: string;
  description: string;
  official_reference: string;
  summary_sections: { title: string; count: number; description: string }[];
  exam_simulations: { title: string; duration: string; questions_count: number }[];
  study_plan_days: number;
  sample_exercises: { id: number; question: string; answer_preview: string; section: string }[];
  protected_exercises: { id: number; question: string; answer: string; section: string }[];
  wc_product_id?: number;
  created_at: string;
  is_custom_upload?: boolean;
  user_uploaded_at?: string;
  cover_source?: string;
}

export interface Order {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  customer_phone: string;
  total_amount: number; // 2000
  currency: string; // XOF
  status: 'pending' | 'completed' | 'paid' | 'cancelled' | 'failed';
  transaction_ref: string;
  items: OrderItem[];
  wc_order_id?: number;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  annale_id: string;
  annale_title: string;
  unit_price: number;
  quantity: number;
}

export interface Payment {
  id: string;
  order_id?: string;
  user_id: string;
  user_email: string;
  user_name: string;
  annale_id: string;
  annale_title: string;
  amount: number; // 2000
  currency: string; // XOF
  transaction_ref: string;
  transaction_reference?: string;
  provider: 'saaspay' | 'wave' | 'orange_money' | 'free_money' | 'card' | 'paytech';
  payment_provider?: string;
  status: 'pending' | 'paid' | 'completed' | 'failed' | 'refunded';
  customer_phone: string;
  provider_reference?: string;
  provider_transaction_id?: string;
  failure_reason?: string;
  provider_response: Record<string, any>;
  created_at: string;
  updated_at: string;
  paid_at?: string;
}

export interface Purchase {
  id: string;
  user_id: string;
  user_email: string;
  annale_id: string;
  annale_title: string;
  order_id?: string;
  payment_id: string;
  amount: number;
  currency: string;
  access_token: string;
  purchased_at: string;
  download_count: number;
  last_accessed_at: string;
}

export interface Download {
  id: string;
  user_id: string;
  annale_id: string;
  purchase_id: string;
  download_token: string;
  expires_at: string;
  download_count: number;
  ip_address: string;
  created_at: string;
}

export interface Review {
  id: string;
  annale_id: string;
  user_name: string;
  rating: number;
  comment: string;
  concours: string;
  admis: boolean;
  verified_buyer: boolean;
  date: string;
}

export interface PaymentEvent {
  id: string;
  ref_command: string;
  event_type: string;
  status: 'success' | 'failed' | 'rejected' | 'duplicate';
  raw_payload_sanitized: Record<string, any>;
  ip_address: string;
  created_at: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  concours?: string;
  message: string;
  created_at: string;
  status: 'new' | 'read' | 'replied';
}

interface DatabaseSchema {
  users: User[];
  categories: Category[];
  concours: Concours[];
  annales: Annale[];
  orders: Order[];
  order_items: OrderItem[];
  payments: Payment[];
  purchases: Purchase[];
  downloads: Download[];
  reviews: Review[];
  payment_events: PaymentEvent[];
  contact_messages?: ContactMessage[];
  settings?: Record<string, any>;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');
const LEGACY_DATA_DIR = path.resolve(process.cwd(), '.data');
const LEGACY_DB_FILE = path.join(LEGACY_DATA_DIR, 'database.json');

const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'cat-police',
    name: 'Police',
    slug: 'police',
    description: "Épreuves et corrigés officiels pour Sous-Officiers, Officiers et Élèves Agents de la Police Nationale du Sénégal.",
    image: '/covers/police.jpg',
    annales_count: 1,
  },
  {
    id: 'cat-gendarmerie',
    name: 'Gendarmerie',
    slug: 'gendarmerie',
    description: "Préparation intensive pour Élèves Gendarmes et Gendarmes Adjoints. Épreuves écrites et barèmes sportifs.",
    image: '/covers/gendarmerie.jpg',
    annales_count: 1,
  },
  {
    id: 'cat-douanes',
    name: 'Douane',
    slug: 'douane',
    description: "Fascicules complets pour Préposés, Contrôleurs et Inspecteurs des Douanes sénégalaises.",
    image: '/covers/douane.jpg',
    annales_count: 1,
  },
  {
    id: 'cat-ena',
    name: 'ENA',
    slug: 'ena',
    description: "Concours direct et professionnel Cycles A & B de l'École Nationale d'Administration du Sénégal.",
    image: '/covers/ena.jpg',
    annales_count: 1,
  },
  {
    id: 'cat-ensoa',
    name: 'ENSOA',
    slug: 'ensoa',
    description: "École Nationale des Sous-Officiers d'Active de Koutal. Préparation militaire et épreuves académiques.",
    image: '/covers/ensoa.jpg',
    annales_count: 1,
  },
  {
    id: 'cat-eaux-forets',
    name: 'Eaux & Forêts',
    slug: 'eaux-forets',
    description: "Concours du Corps des Eaux et Forêts, Chasses et Parcs Nationaux du Sénégal.",
    image: '/covers/eaux_forets.jpg',
    annales_count: 1,
  },
  {
    id: 'cat-inseps',
    name: 'INSEPS',
    slug: 'inseps',
    description: "Institut National Supérieur de l'Éducation Populaire et du Sport (STAPS Dakar).",
    image: '/covers/inseps.jpg',
    annales_count: 1,
  },
  {
    id: 'cat-fastef',
    name: 'FASTEF',
    slug: 'fastef',
    description: "Faculté des Sciences et Technologies de l'Éducation et de la Formation (UCAD) — CAES, CAPES et PES.",
    image: '/covers/fastef.jpg',
    annales_count: 1,
  },
  {
    id: 'cat-crem',
    name: 'CREM',
    slug: 'crem',
    description: "Concours de Recrutement des Élèves-Maîtres (CRFPE) pour l'enseignement élémentaire au Sénégal.",
    image: '/covers/crem.jpg',
    annales_count: 1,
  },
  {
    id: 'cat-endss',
    name: 'ENDSS',
    slug: 'endss',
    description: "École Nationale de Développement Sanitaire et Social — Infirmiers d'État, Sages-Femmes et Paramédical.",
    image: '/covers/endss.jpg',
    annales_count: 1,
  },
  {
    id: 'cat-bts-transit',
    name: 'BTS Transit',
    slug: 'bts-transit',
    description: "Brevet de Technicien Supérieur en Transit, Douane, Transport maritime et Commerce international au Sénégal.",
    image: '/covers/bts_transit.jpg',
    annales_count: 1,
  },
  {
    id: 'cat-bts-secretariat',
    name: 'BTS Secrétariat',
    slug: 'bts-secretariat',
    description: "BTS Secrétariat-Bureautique : communication, rédaction administrative, Word, Excel, gestion documentaire et archivage.",
    image: '/covers/bts_secretariat.jpg',
    annales_count: 1,
  },
  {
    id: 'cat-bts-logistique',
    name: 'BTS Gestion Chaine Approvisionnement Logistique',
    slug: 'bts-gestion-chaine-approvisionnement-logistique',
    description: "BTS Gestion de la Chaîne d'Approvisionnement et Logistique : achats, stocks, entreposage, transport, calculs logistiques et KPI.",
    image: '/covers/bts_logistique.jpg',
    annales_count: 1,
  },
  {
    id: 'cat-magistrature',
    name: 'Magistrature',
    slug: 'magistrature',
    description: "Concours direct d'accès au Centre de Formation Judiciaire (CFJ) — Section Magistrature (siège et parquet).",
    image: '/covers/magistrature.jpg',
    annales_count: 1,
  },
  {
    id: 'cat-greffe',
    name: 'Greffe',
    slug: 'greffe',
    description: "Concours d'accès au CFJ Section Greffe : techniques de greffe, actes judiciaires, procédures et organisation.",
    image: '/covers/greffe.jpg',
    annales_count: 1,
  },
  {
    id: 'cat-esp',
    name: 'ESP Dakar',
    slug: 'esp',
    description: "Concours d'entrée à l'École Supérieure Polytechnique (ESP UCAD) : ingénieurs et techniciens supérieurs.",
    image: '/covers/esp.jpg',
    annales_count: 1,
  },
  {
    id: 'cat-bts-genie-civil',
    name: 'BTS Génie Civil',
    slug: 'bts-genie-civil',
    description: "BTS Génie Civil : RDM, béton armé, topographie, fondations, géotechnique, routes, VRD, métrés et conduite de travaux.",
    image: '/covers/bts_genie_civil.jpg',
    annales_count: 1,
  },
  {
    id: 'cat-bts-comptabilite',
    name: 'BTS Comptabilité',
    slug: 'bts-comptabilite',
    description: "BTS Comptabilité et Gestion : opérations courantes, TVA, paie, immobilisations, inventaire, analyse financière et contrôle de gestion.",
    image: '/covers/bts_comptabilite.jpg',
    annales_count: 1,
  },
  {
    id: 'cat-bt-secretariat',
    name: 'BT Secrétariat',
    slug: 'bt-secretariat',
    description: "Brevet de Technicien (BT) Secrétariat-Bureautique : accueil, correspondance, Word, Excel, gestion administrative et bilingue.",
    image: '/covers/bt_secretariat.jpg',
    annales_count: 1,
  },
  {
    id: 'cat-probatoire',
    name: 'Probatoire',
    slug: 'probatoire',
    description: "Fascicule complet de préparation au Probatoire sénégalais : 10 matières fondamentales et 4 concours blancs.",
    image: '/covers/probatoire.jpg',
    annales_count: 1,
  },
  {
    id: 'cat-iface',
    name: 'IFACE Dakar',
    slug: 'iface',
    description: "Concours d'admission à l'Institut de Formation en Administration et Création d'Entreprise (IFACE - UCAD).",
    image: '/covers/iface.jpg',
    annales_count: 1,
  },
  {
    id: 'cat-eaa',
    name: "Agriculture de l'Armée",
    slug: 'agriculture-armee',
    description: "Préparation aux concours et formations de l'École d'Agriculture de l'Armée et régies agro-pastorales militaires du Sénégal.",
    image: '/covers/agriculture_armee.jpg',
    annales_count: 1,
  },
];

const INITIAL_REVIEWS: Review[] = [
  {
    id: 'rev-1',
    annale_id: 'annale-police-sn',
    user_name: 'Mamadou Ndiaye',
    concours: 'Police Nationale 2025',
    rating: 5,
    admis: true,
    verified_buyer: true,
    comment: 'Admis au concours d’Élève Officier de Police ! Les 320 exercices corrigés m’ont permis d’obtenir 17,5/20 à l’épreuve de droit public. Reçu et téléchargement immédiat par Wave en 30 secondes.',
    date: '14 février 2026',
  },
  {
    id: 'rev-2',
    annale_id: 'annale-gendarmerie-sn',
    user_name: 'Ousmane Sow',
    concours: 'Gendarmerie Nationale',
    rating: 5,
    admis: true,
    verified_buyer: true,
    comment: 'Très grande clarté sur la déontologie militaire et les questions pièges d’arithmétique. À 2 000 FCFA par PayTech, c’est le meilleur investissement pour réussir.',
    date: '28 janvier 2026',
  },
  {
    id: 'rev-3',
    annale_id: 'annale-douane-sn',
    user_name: 'Fatou Bintou Diop',
    concours: 'Douanes Sénégalaises',
    rating: 5,
    admis: true,
    verified_buyer: true,
    comment: 'Le classement tarifaire et les calculs de valeur en douane sont expliqués pas à pas. Reçu officiel délivré avec mon nom en filigrane sur le PDF.',
    date: '03 mars 2026',
  },
  {
    id: 'rev-4',
    annale_id: 'annale-ena-sn',
    user_name: 'Cheikh Ibrahima Fall',
    concours: 'ENA Cycle A Diplomatie',
    rating: 5,
    admis: true,
    verified_buyer: true,
    comment: 'La méthodologie de la note de synthèse et les fiches de gestion axée sur les résultats (GAR) sont d’un niveau d’excellence républicaine remarquable.',
    date: '19 février 2026',
  },
];

class Database {
  private data: DatabaseSchema = {
    users: [],
    categories: INITIAL_CATEGORIES,
    concours: [],
    annales: [],
    orders: [],
    order_items: [],
    payments: [],
    purchases: [],
    downloads: [],
    reviews: INITIAL_REVIEWS,
    payment_events: [],
  };

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      const fileToLoad = fs.existsSync(DB_FILE)
        ? DB_FILE
        : (fs.existsSync(LEGACY_DB_FILE) ? LEGACY_DB_FILE : null);

      if (fileToLoad) {
        const raw = fs.readFileSync(fileToLoad, 'utf-8');
        const parsed = JSON.parse(raw);
        this.data = {
          users: parsed.users || [],
          categories: parsed.categories?.length > 0 ? parsed.categories : INITIAL_CATEGORIES,
          concours: parsed.concours || [],
          annales: parsed.annales || [],
          orders: parsed.orders || [],
          order_items: parsed.order_items || [],
          payments: parsed.payments || [],
          purchases: parsed.purchases || [],
          downloads: parsed.downloads || [],
          reviews: parsed.reviews?.length > 0 ? parsed.reviews : INITIAL_REVIEWS,
          payment_events: parsed.payment_events || [],
          settings: parsed.settings || {},
        };
      }
      this.save();
    } catch (err) {
      console.error('Error initializing database file:', err);
    }
  }

  getSetting(key: string, defaultValue?: any): any {
    if (!this.data.settings) {
      this.data.settings = {};
    }
    return this.data.settings[key] !== undefined ? this.data.settings[key] : defaultValue;
  }

  setSetting(key: string, value: any): void {
    if (!this.data.settings) {
      this.data.settings = {};
    }
    this.data.settings[key] = value;
    this.save();
  }

  private save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const serialized = JSON.stringify(this.data, null, 2);
      fs.writeFileSync(DB_FILE, serialized, 'utf-8');

      // Also ensure .data/database.json is kept in sync
      if (!fs.existsSync(LEGACY_DATA_DIR)) {
        fs.mkdirSync(LEGACY_DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(LEGACY_DB_FILE, serialized, 'utf-8');
    } catch (err) {
      console.error('Error saving database:', err);
    }
  }

  // --- USERS ---
  findUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  findUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  createUser(user: User): User {
    this.data.users.push(user);
    this.save();
    return user;
  }

  getAllUsers(): User[] {
    return this.data.users;
  }

  // --- CATEGORIES & CONCOURS ---
  getAllCategories(): Category[] {
    return this.data.categories;
  }

  getCategoryById(id: string): Category | undefined {
    return this.data.categories.find(c => c.id === id || c.slug === id);
  }

  getAllConcours(): Concours[] {
    return this.data.concours;
  }

  // --- ANNALES ---
  getAllAnnales(): Annale[] {
    return this.data.annales;
  }

  getAnnaleById(id: string): Annale | undefined {
    return this.data.annales.find(a => a.id === id || a.slug === id);
  }

  upsertAnnales(annales: Annale[]) {
    for (const newAnnale of annales) {
      const idx = this.data.annales.findIndex(a => a.id === newAnnale.id);
      if (idx >= 0) {
        const existing = this.data.annales[idx];
        // Permanently preserve any cover uploaded or modified by the user
        const preservedCover = (existing.is_custom_upload || existing.cover_source === 'user_original_poster')
          ? existing.cover_image
          : (existing.cover_image || newAnnale.cover_image);

        this.data.annales[idx] = { 
          ...newAnnale, 
          ...existing,
          cover_image: preservedCover,
          is_custom_upload: existing.is_custom_upload ?? false,
          cover_source: existing.cover_source ?? 'official',
        };
      } else {
        this.data.annales.push(newAnnale);
      }
    }
    // Update annale count in categories
    for (const cat of this.data.categories) {
      cat.annales_count = this.data.annales.filter(a => a.category.toLowerCase().includes(cat.name.toLowerCase()) || a.category_id === cat.id).length;
    }
    this.save();
  }

  createAnnale(annale: Annale): Annale {
    this.data.annales.push(annale);
    this.save();
    return annale;
  }

  updateAnnale(id: string, updates: Partial<Annale>): Annale | undefined {
    const annale = this.getAnnaleById(id);
    if (!annale) return undefined;
    Object.assign(annale, updates);
    this.save();
    return annale;
  }

  deleteAnnale(id: string): boolean {
    const idx = this.data.annales.findIndex(a => a.id === id);
    if (idx >= 0) {
      this.data.annales.splice(idx, 1);
      this.save();
      return true;
    }
    return false;
  }

  // --- ORDERS & ORDER ITEMS ---
  createOrder(order: Order): Order {
    this.data.orders.push(order);
    if (order.items && order.items.length > 0) {
      this.data.order_items.push(...order.items);
    }
    this.save();
    return order;
  }

  getOrderById(id: string): Order | undefined {
    return this.data.orders.find(o => o.id === id || o.transaction_ref === id);
  }

  getOrderByRef(ref: string): Order | undefined {
    return this.data.orders.find(o => o.transaction_ref === ref);
  }

  getUserOrders(userId: string): Order[] {
    return this.data.orders.filter(o => o.user_id === userId);
  }

  getAllOrders(): Order[] {
    return this.data.orders;
  }

  updateOrderStatus(orderId: string, status: Order['status']): Order | undefined {
    const order = this.getOrderById(orderId);
    if (order) {
      order.status = status;
      order.updated_at = new Date().toISOString();
      this.save();
    }
    return order;
  }

  // --- PAYMENTS ---
  createPayment(payment: Payment): Payment {
    this.data.payments.push(payment);
    this.save();
    return payment;
  }

  getPaymentById(id: string): Payment | undefined {
    return this.data.payments.find(p => p.id === id);
  }

  getPaymentByRef(ref: string): Payment | undefined {
    return this.data.payments.find(p => p.transaction_ref === ref);
  }

  getAllPayments(): Payment[] {
    return this.data.payments;
  }

  updatePayment(id: string, updates: Partial<Payment>): Payment | undefined {
    const payment = this.getPaymentById(id);
    if (!payment) return undefined;
    Object.assign(payment, updates);
    this.save();
    return payment;
  }

  // --- PURCHASES (DRM-PROTECTED ACCESS) ---
  createPurchase(purchase: Purchase): Purchase {
    const existing = this.getPurchase(purchase.user_id, purchase.annale_id);
    if (existing) {
      return existing;
    }
    this.data.purchases.push(purchase);
    this.save();
    return purchase;
  }

  getPurchase(userId: string, annaleId: string): Purchase | undefined {
    return this.data.purchases.find(p => p.user_id === userId && p.annale_id === annaleId);
  }

  getUserPurchases(userId: string): Purchase[] {
    return this.data.purchases.filter(p => p.user_id === userId);
  }

  getPurchasesByUser(userId: string): Purchase[] {
    return this.getUserPurchases(userId);
  }

  getPaymentsByUser(userId: string): Payment[] {
    return this.data.payments.filter(p => p.user_id === userId);
  }

  getAllPurchases(): Purchase[] {
    return this.data.purchases;
  }

  clearPurchases(userId?: string): void {
    if (userId) {
      this.data.purchases = this.data.purchases.filter(p => p.user_id !== userId);
    } else {
      this.data.purchases = [];
    }
    this.save();
  }

  hasPurchased(userId: string, annaleId: string): boolean {
    return Boolean(this.getPurchase(userId, annaleId));
  }

  incrementDownloadCount(purchaseId: string): void {
    const p = this.data.purchases.find(item => item.id === purchaseId);
    if (p) {
      p.download_count = (p.download_count || 0) + 1;
      p.last_accessed_at = new Date().toISOString();
      this.save();
    }
  }

  // --- DOWNLOADS & TIMED TOKENS ---
  createDownload(download: Download): Download {
    this.data.downloads.push(download);
    this.save();
    return download;
  }

  getDownloadByToken(token: string): Download | undefined {
    return this.data.downloads.find(d => d.download_token === token);
  }

  getUserDownloads(userId: string): Download[] {
    return this.data.downloads.filter(d => d.user_id === userId);
  }

  // --- REVIEWS ---
  getAllReviews(): Review[] {
    return this.data.reviews;
  }

  getReviewsByAnnale(annaleId: string): Review[] {
    return this.data.reviews.filter(r => r.annale_id === annaleId);
  }

  // --- PAYMENT AUDIT EVENTS ---
  logPaymentEvent(event: Omit<PaymentEvent, 'id' | 'created_at'>): PaymentEvent {
    const entry: PaymentEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      ...event,
      created_at: new Date().toISOString(),
    };
    this.data.payment_events.push(entry);
    this.save();
    return entry;
  }

  getPaymentEvents(limit = 100): PaymentEvent[] {
    return [...this.data.payment_events].reverse().slice(0, limit);
  }

  // --- STATS ---
  getStats() {
    const totalPayments = this.data.payments.length;
    const completedPayments = this.data.payments.filter(p => p.status === 'completed');
    const failedPayments = this.data.payments.filter(p => p.status === 'failed');
    const totalRevenue = completedPayments.reduce((sum, p) => sum + (p.amount || 2000), 0);
    const totalDownloads = this.data.purchases.reduce((sum, p) => sum + (p.download_count || 0), 0);

    const todayStr = new Date().toISOString().slice(0, 10);
    const todaySales = completedPayments.filter(p => p.created_at.startsWith(todayStr));
    const todayRevenue = todaySales.reduce((sum, p) => sum + (p.amount || 2000), 0);

    const monthStr = new Date().toISOString().slice(0, 7);
    const monthSales = completedPayments.filter(p => p.created_at.startsWith(monthStr));
    const monthRevenue = monthSales.reduce((sum, p) => sum + (p.amount || 2000), 0);

    return {
      total_revenue: totalRevenue,
      today_revenue: todayRevenue,
      month_revenue: monthRevenue,
      today_sales_count: todaySales.length,
      month_sales_count: monthSales.length,
      completed_orders_count: completedPayments.length,
      failed_orders_count: failedPayments.length,
      total_users: this.data.users.length,
      total_annales: this.data.annales.length,
      total_downloads: totalDownloads,
      totalUsers: this.data.users.length,
      totalPurchases: completedPayments.length,
      totalRevenue: totalRevenue,
      conversion_rate: totalPayments > 0 ? Math.round((completedPayments.length / totalPayments) * 100) : 0,
      recent_orders: this.data.orders.slice(-10).reverse(),
      recent_payments: this.data.payments.slice(-10).reverse(),
      recent_events: this.data.payment_events.slice(-10).reverse(),
    };
  }

  resetUserPurchases(userId: string) {
    this.data.purchases = this.data.purchases.filter(p => p.user_id !== userId);
    this.data.payments = this.data.payments.filter(p => p.user_id !== userId || p.status !== 'completed');
    this.data.orders = this.data.orders.filter(o => o.user_id !== userId || o.status !== 'completed');
    this.save();
  }

  createContactMessage(msg: { name: string; email: string; phone?: string; subject: string; concours?: string; message: string }): ContactMessage {
    if (!this.data.contact_messages) {
      this.data.contact_messages = [];
    }
    const newMsg: ContactMessage = {
      id: `contact-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      name: msg.name,
      email: msg.email,
      phone: msg.phone,
      subject: msg.subject,
      concours: msg.concours,
      message: msg.message,
      created_at: new Date().toISOString(),
      status: 'new',
    };
    this.data.contact_messages.unshift(newMsg);
    this.save();
    return newMsg;
  }

  getContactMessages(): ContactMessage[] {
    return this.data.contact_messages || [];
  }
}

export const db = new Database();
