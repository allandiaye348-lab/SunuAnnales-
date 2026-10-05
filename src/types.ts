export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'student' | 'admin';
}

export interface AnnaleSummarySection {
  title: string;
  count: number;
  description: string;
}

export interface ExamSimulation {
  title: string;
  duration: string;
  questions_count: number;
}

export interface Exercise {
  id: number;
  section: string;
  question: string;
  answer?: string;
  answer_preview?: string;
}

export interface Annale {
  id: string;
  slug: string;
  title: string;
  ministry: string;
  category: 'Police' | 'Gendarmerie' | 'ENSOA' | 'ENA' | 'Douane' | 'Eaux & Forêts' | 'INSEPS' | 'FASTEF' | 'CREM' | 'ENDSS' | string;
  target_corps: string;
  price: number; // 2000
  currency: string;
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
  summary_sections: AnnaleSummarySection[];
  exam_simulations: ExamSimulation[];
  study_plan_days: number;
  sample_exercises?: Exercise[];
  protected_exercises?: Exercise[];
  is_custom_upload?: boolean;
  user_uploaded_at?: string;
  cover_source?: string;
  year?: number;
  created_at?: string;
  wc_product_id?: number;
  format?: string;
}

export type PaymentMethodType = 'saaspay' | 'wave' | 'orange_money' | 'free_money' | 'card' | 'paytech';

export interface PaymentRecord {
  id: string;
  order_id?: string;
  user_id: string;
  user_email: string;
  user_name: string;
  annale_id: string;
  annale_title: string;
  amount: number;
  currency: string;
  transaction_ref: string;
  transaction_reference?: string;
  provider: PaymentMethodType;
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

export interface PurchaseRecord {
  id: string;
  user_id: string;
  user_email: string;
  annale_id: string;
  annale_title: string;
  payment_id: string;
  amount: number;
  currency: string;
  access_token: string;
  purchased_at: string;
  download_count: number;
  last_accessed_at: string;
}

export interface AdminStats {
  totalRevenue: number;
  totalUsers: number;
  totalPurchases: number;
  totalPayments: number;
  successfulPayments: number;
  failedPayments: number;
  pendingPayments: number;
  annalesSoldBreakdown: { title: string; count: number; revenue: number }[];
}

export interface PageVisit {
  id: string;
  visitor_id: string;
  session_id: string;
  path: string;
  referrer: string;
  device_type: 'mobile' | 'desktop' | 'tablet';
  browser: string;
  os: string;
  country: string;
  country_code: string;
  annale_id?: string;
  annale_title?: string;
  search_query?: string;
  timestamp: string;
}

export interface DayMetric {
  date: string;
  day_name: string;
  visitors: number;
  page_views: number;
}

export interface TopPageMetric {
  path: string;
  label: string;
  views: number;
  unique_visitors: number;
  percentage: number;
}

export interface TopAnnaleMetric {
  id: string;
  title: string;
  category: string;
  views: number;
  percentage: number;
}

export interface SearchQueryMetric {
  query: string;
  count: number;
}

export interface DeviceBreakdown {
  mobile: number;
  desktop: number;
  tablet: number;
  mobile_percent: number;
  desktop_percent: number;
  tablet_percent: number;
}

export interface CountryMetric {
  country: string;
  code: string;
  flag: string;
  count: number;
  percent: number;
}

export interface LiveVisitor {
  id: string;
  path: string;
  device_type: 'mobile' | 'desktop' | 'tablet';
  country: string;
  country_code: string;
  time_ago: string;
  timestamp: string;
}

export interface VisitorStats {
  visitors_today: number;
  visitors_yesterday: number;
  visitors_this_week: number;
  visitors_this_month: number;
  total_visitors: number;
  total_page_views: number;
  active_visitors_now: number;
  visitors_growth_today_vs_yesterday: number;
  chart_7_days: DayMetric[];
  chart_30_days: DayMetric[];
  top_pages: TopPageMetric[];
  top_annales: TopAnnaleMetric[];
  top_searches: SearchQueryMetric[];
  device_breakdown: DeviceBreakdown;
  country_breakdown: CountryMetric[];
  recent_live_feed: LiveVisitor[];
  last_updated: string;
}

