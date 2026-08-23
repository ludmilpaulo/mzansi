export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
export type JsonObject = { [key: string]: JsonValue };

export type FieldErrors = Record<string, string[]>;

export interface ApiErrorBody {
  code: string;
  detail: string;
  fields?: FieldErrors;
  alternatives?: AppointmentSlot[];
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiFailure {
  success: false;
  error: ApiErrorBody;
}

export type ApiEnvelope<T> = ApiSuccess<T> | ApiFailure;

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export type Role =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "CONSULTANT"
  | "DOCUMENT_REVIEWER"
  | "FINANCE"
  | "SUPPORT"
  | "CLIENT";

export const STAFF_ROLES: readonly Role[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "CONSULTANT",
  "DOCUMENT_REVIEWER",
  "FINANCE",
  "SUPPORT",
] as const;

export const FINANCE_ROLES: readonly Role[] = ["SUPER_ADMIN", "ADMIN", "FINANCE"] as const;

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string;
  role: Role;
  preferred_language: string;
  is_email_verified: boolean;
  is_staff_role: boolean;
  date_joined?: string;
}

export interface ClientProfile {
  id: number;
  nationality: string;
  current_country: string;
  date_of_birth: string | null;
  passport_number: string;
  residential_address: string;
  city: string;
  postal_code: string;
  occupation: string;
  employer: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  completion_percent: number;
}

export interface StaffClientProfile extends ClientProfile {
  profile_notes: string;
}

export interface StaffProfileSummary {
  id: number;
  job_title: string;
  bio: string;
  accepts_consultations: boolean;
}

export interface MeUser extends Omit<User, "date_joined"> {
  client_profile: ClientProfile | null;
  staff_profile: StaffProfileSummary | null;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface RegisterResponse {
  user: MeUser;
  tokens: AuthTokens;
}

export interface TokenRefreshResponse {
  access: string;
  refresh?: string;
}

export interface RegisterRequest {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  country_of_nationality: string;
  current_country: string;
  date_of_birth?: string | null;
  passport_number?: string;
  preferred_language: string;
  password: string;
  password_confirm: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface PasswordChangeRequest {
  current_password: string;
  new_password: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirmRequest {
  uid: string;
  token: string;
  new_password: string;
}

export interface DetailResponse {
  detail: string;
}

export interface SeoFields {
  seo_title: string;
  seo_description: string;
  og_title: string;
  og_description: string;
  og_image_url: string;
  canonical_path: string;
  robots: string;
  focus_keyword: string;
  related_keywords: string[];
  locale: string;
}

export interface OfficialSource {
  label: string;
  url: string;
}

export interface LandingFaq {
  question: string;
  answer: string;
}

export interface ServiceList extends SeoFields {
  id: number;
  name: string;
  slug: string;
  short_description: string;
  icon: string;
  image: string | null;
  consultation_available: boolean;
  estimated_processing: string;
  is_active: boolean;
  sort_order: number;
}

export interface ServiceRequirement {
  id: number;
  document_type: number;
  document_type_name: string;
  document_type_code: string;
  description: string;
  is_required: boolean;
  sort_order: number;
}

export interface ServiceFAQ {
  id: number;
  question: string;
  answer: string;
  sort_order: number;
  is_active: boolean;
}

export interface ServiceDetail extends ServiceList {
  description: string;
  who_its_for: string;
  process_overview: string;
  how_we_help: string;
  official_sources: OfficialSource[] | JsonValue;
  related_service_slugs: string[];
  requirements: ServiceRequirement[];
  faqs: ServiceFAQ[];
}

export interface ApplicationStatus {
  id: number;
  code: string;
  label: string;
  description: string;
  category: string;
  sort_order: number;
  progress_weight: number;
  is_terminal: boolean;
  client_action_required: boolean;
  is_active: boolean;
}

export interface DocumentCounts {
  total: number;
  verified: number;
  pending: number;
  under_review: number;
}

export interface TimelineEvent {
  id: number;
  status: ApplicationStatus;
  title: string;
  description: string;
  staff_name: string | null;
  client_action_required: boolean;
  is_visible_to_client: boolean;
  occurred_at: string;
}

export interface ApplicationNote {
  id: number;
  body: string;
  is_visible_to_client: boolean;
  author_name: string | null;
  created_at: string;
}

export interface ApplicationTask {
  id: number;
  title: string;
  description: string;
  assigned_to: number | null;
  assigned_name: string | null;
  status: string;
  due_date: string | null;
  created_at: string;
}

export type TrackingStatus =
  | "APPLICATION_RECEIVED"
  | "APPLICATION_UNDER_PROCESS"
  | "DECISION_RETURNED"
  | "READY_FOR_COLLECTION"
  | "UNKNOWN";

export type TrackingProviderCode = "VFS" | "DHA" | "MANUAL";
export type TrackingSource = "API" | "MANUAL" | "UNAVAILABLE";
export type TrackingJourneyState = "complete" | "current" | "upcoming";
export type TrackingHealth = "connected" | "manual" | "fallback" | "error" | "not_configured";

export interface InternalStatusSummary {
  code: string;
  label: string;
}

export interface ExternalTrackingSummary {
  enabled: boolean;
  provider: TrackingProviderCode | string;
  reference_number: string;
  status: TrackingStatus | null;
  status_label: string;
  source: TrackingSource | null;
  source_label: string;
  manually_updated: boolean;
  checked_at: string | null;
  automatic_available: boolean;
  fallback_url: string;
}

export interface TrackingJourneyStep {
  code: string;
  label: string;
  state: TrackingJourneyState;
}

export interface ApplicationTracking {
  application_id: number;
  application_reference: string;
  service_name: string;
  client_name: string;
  internal_status: InternalStatusSummary;
  provider: TrackingProviderCode | string;
  reference_number: string;
  passport_masked: string;
  has_date_of_birth: boolean;
  country: string;
  application_centre: string;
  tracking_enabled: boolean;
  status: TrackingStatus | null;
  status_label: string;
  source: TrackingSource | null;
  source_label: string;
  manually_updated: boolean;
  updated_by_name: string | null;
  manual_note: string;
  checked_at: string | null;
  status_changed_at: string | null;
  next_refresh_at: string | null;
  automatic_available: boolean;
  fallback_url: string;
  error_code: string | null;
  error_detail: string | null;
  journey: TrackingJourneyStep[];
  can_refresh: boolean;
  can_edit_details: boolean;
  can_manual_update: boolean;
}

export interface ApplicationTrackingHistoryItem {
  id: number;
  provider: string;
  status: TrackingStatus | string;
  status_label: string;
  source: TrackingSource | string;
  source_label: string;
  manually_updated: boolean;
  updated_by_name: string | null;
  note: string;
  checked_at: string;
  created_at: string;
}

export interface ExternalTrackingAdminRow {
  id: number;
  tracking_id: number;
  client_name: string;
  application_reference: string;
  service_name: string;
  reference_number: string;
  status: TrackingStatus | null;
  status_label: string;
  source: TrackingSource | null;
  checked_at: string | null;
  health: TrackingHealth;
  health_label: string;
  tracking_enabled: boolean;
}

export interface TrackingDetailsUpdate {
  reference_number?: string;
  passport_number?: string;
  date_of_birth?: string;
  country?: string;
  application_centre?: string;
  tracking_enabled?: boolean;
  provider?: TrackingProviderCode;
}

export interface ManualTrackingUpdate {
  status_code: TrackingStatus;
  status_label?: string;
  note?: string;
}

export interface ExternalTrackingSettings {
  provider: string;
  automatic_tracking: boolean;
  automatic_check_interval_hours: number;
  manual_refresh_cooldown_minutes: number;
  fallback_url: string;
  store_raw_status: boolean;
  status_mapping: Record<string, TrackingStatus | string>;
}

export interface ApplicationList {
  id: number;
  reference: string;
  client: number;
  client_name: string;
  client_email: string;
  service: ServiceList;
  status: ApplicationStatus;
  assigned_consultant: number | null;
  consultant_name: string | null;
  progress: number;
  next_action: string;
  document_counts: DocumentCounts;
  external_tracking: ExternalTrackingSummary | null;
  created_at: string;
  updated_at: string;
}

export interface ApplicationDetail extends ApplicationList {
  assigned_reviewer: number | null;
  reviewer_name: string | null;
  submitted_at: string | null;
  completed_at: string | null;
  decision_notes: string;
  timeline: TimelineEvent[];
  notes: ApplicationNote[];
  tasks: ApplicationTask[];
}

export interface ApplicationDashboard {
  active_application: ApplicationDetail | null;
  counts: {
    active: number;
    completed: number;
    pending: number;
  };
}

export type ApplicationBucket = "active" | "completed" | "pending" | "cancelled";

export type StaffApplicationBucket =
  | "new"
  | "in_progress"
  | "awaiting_client"
  | "documents_review"
  | "submitted"
  | "completed";

export interface ApplicationCreateRequest {
  service: string;
  client_id?: number;
}

export interface ApplicationTransitionRequest {
  status_code: string;
  note?: string;
}

export interface ApplicationAssignRequest {
  consultant_id?: number | null;
  reviewer_id?: number | null;
}

export interface ApplicationNoteCreateRequest {
  body: string;
  is_visible_to_client?: boolean;
}

export type DocumentStatus =
  | "REQUESTED"
  | "UPLOADED"
  | "UNDER_REVIEW"
  | "VERIFIED"
  | "REJECTED"
  | "EXPIRED"
  | "REPLACEMENT_REQUIRED";

export interface DocumentType {
  id: number;
  code: string;
  name: string;
  description: string;
  is_active: boolean;
}

export interface ClientDocumentReview {
  id: number;
  outcome: string;
  reason: string;
  client_visible_note: string;
  created_at: string;
}

export interface StaffDocumentReview extends ClientDocumentReview {
  internal_note: string;
  reviewer_name: string | null;
}

interface DocumentFields {
  id: number;
  application: number;
  document_type: DocumentType;
  has_file: boolean;
  original_filename: string;
  uploaded_at: string | null;
  rejection_reason: string;
  client_note: string;
  reviewed_at: string | null;
  expires_at: string | null;
  page_count: number;
  reviews: ClientDocumentReview[] | StaffDocumentReview[];
  created_at: string;
  updated_at: string;
  internal_note?: string;
}

export type DocumentSubmission = {
  [S in DocumentStatus]: DocumentFields & { status: S };
}[DocumentStatus];

export type DocumentReviewOutcome = "VERIFIED" | "REJECTED" | "REPLACEMENT_REQUIRED";

export interface DocumentReviewRequest {
  outcome: DocumentReviewOutcome;
  reason?: string;
  client_visible_note?: string;
  internal_note?: string;
}

export interface DocumentRequestRecord {
  id: number;
  application: number;
  document_type: DocumentType;
  description: string;
  due_date: string | null;
  is_required: boolean;
  notify_email: boolean;
  notify_push: boolean;
  notify_in_app: boolean;
  is_open: boolean;
  created_at: string;
}

export interface DocumentRequestCreate {
  application: number;
  document_type_id: number;
  description: string;
  due_date?: string | null;
  is_required: boolean;
  notify_email: boolean;
  notify_push: boolean;
  notify_in_app: boolean;
}

export interface ConsultationType {
  id: number;
  name: string;
  slug: string;
  description: string;
  duration_minutes: number;
  price_cents: number;
  price: string;
  currency: string;
  is_active: boolean;
  sort_order: number;
}

export type AppointmentStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "RESCHEDULED" | "NO_SHOW";

export interface Appointment {
  id: number;
  reference_number?: string;
  client: number;
  client_name: string;
  consultant_name: string;
  consultation_type: ConsultationType;
  application: number | null;
  starts_at: string;
  ends_at: string;
  timezone_name?: string;
  status: AppointmentStatus;
  meeting_link: string;
  client_notes: string;
  staff_notes?: string;
  cancelled_reason: string;
  calendar_token?: string;
  created_at: string;
}

export interface AppointmentSlot {
  starts_at: string;
  ends_at: string;
  timezone?: string;
  label_sast?: string;
}

export interface PublicSlotsResponse {
  timezone: string;
  slots: AppointmentSlot[];
}

export interface SlotHoldResponse {
  hold_id: string;
  starts_at: string;
  expires_at: string;
  expires_in_seconds: number;
}

export interface PublicBookRequest {
  consultation_type_id: number;
  consultant_id: number;
  starts_at: string;
  hold_id?: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  nationality: string;
  current_country: string;
  matter_summary: string;
  preferred_language?: string;
  additional_message?: string;
  timezone_name?: string;
  terms_version: string;
  accept_terms: boolean;
}

export interface PublicBookResponse {
  appointment: {
    id: number;
    reference_number: string;
    status: AppointmentStatus;
    starts_at: string;
    ends_at: string;
    timezone_name: string;
    consultation_type: string;
    duration_minutes: number;
    consultant_name: string;
    calendar_token: string;
  };
  client: {
    email: string;
    first_name: string;
    last_name: string;
  };
  account_created: boolean;
  activation_required: boolean;
  activation_expires_at: string | null;
  message: string;
}

export interface CurrentTermsDocument {
  version: string;
  title: string;
  effective_date: string | null;
  summary: string;
  body: string;
}

export interface ActivateAccountRequest {
  email: string;
  token: string;
  password: string;
  password_confirm: string;
}

export interface AppointmentCreateRequest {
  consultation_type_id: number;
  consultant_id: number;
  starts_at: string;
  client_notes?: string;
}

export interface PublicConsultant {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  job_title: string;
  bio: string;
}

export interface MessageAttachment {
  id: number;
  original_filename: string;
  content_type: string;
  created_at: string;
}

export interface Message {
  id: number;
  sender: number | null;
  sender_name: string | null;
  sender_role: string | null;
  kind: "TEXT" | "SYSTEM";
  body: string;
  read_at: string | null;
  attachments: MessageAttachment[];
  created_at: string;
}

export interface Conversation {
  id: number;
  application: number;
  application_reference: string;
  subject: string;
  unread_count: number;
  last_message: Message | null;
  updated_at: string;
}

export interface SendMessageRequest {
  body: string;
}

export type InquiryCategory = "APPLICATION" | "DOCUMENTS" | "PAYMENT" | "CONSULTATION" | "GENERAL";
export type InquiryStatus = "OPEN" | "IN_PROGRESS" | "WAITING_FOR_CLIENT" | "RESOLVED" | "CLOSED";

export interface InquiryReply {
  id: number;
  author: number | null;
  author_name: string | null;
  body: string;
  created_at: string;
}

export interface Inquiry {
  id: number;
  client: number;
  client_name: string;
  assigned_to: number | null;
  subject: string;
  category: InquiryCategory;
  message: string;
  status: InquiryStatus;
  application: number | null;
  replies: InquiryReply[];
  created_at: string;
  updated_at: string;
}

export interface InquiryCreateRequest {
  subject: string;
  category: InquiryCategory;
  message: string;
  application?: number | null;
}

export interface InquirySetStatusRequest {
  status: InquiryStatus;
  assigned_to?: number;
}

export interface Notification {
  id: number;
  title: string;
  body: string;
  category: string;
  is_read: boolean;
  link: string;
  metadata: JsonObject;
  created_at: string;
}

export interface MarkAllReadResponse {
  updated: number;
}

export type InvoiceStatus = "DRAFT" | "ISSUED" | "PAID" | "VOID" | "OVERDUE";
export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";

export interface Payment {
  id: number;
  provider: string;
  provider_reference: string;
  amount_cents: number;
  currency: string;
  status: PaymentStatus;
  received_at: string | null;
  created_at: string;
}

export interface Invoice {
  id: number;
  number: string;
  client: number;
  client_name: string;
  application: number | null;
  appointment: number | null;
  description: string;
  amount_cents: number;
  amount: string;
  currency: string;
  status: InvoiceStatus;
  due_date: string | null;
  payments: Payment[];
  created_at: string;
}

export interface InvoiceCreateRequest {
  client: number;
  application?: number | null;
  appointment?: number | null;
  description: string;
  amount_cents: number;
  currency: string;
  status?: InvoiceStatus;
  due_date?: string | null;
}

export interface RecordPaymentRequest {
  provider?: string;
  provider_reference?: string;
  amount_cents?: number;
}

export interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: string;
  related_service?: number | null;
  related_service_slug?: string | null;
  sort_order: number;
  is_active: boolean;
  last_reviewed_at?: string | null;
  next_review_at?: string | null;
  reviewed_by?: string;
}

export interface Testimonial {
  id: number;
  name: string;
  role: string;
  quote: string;
  rating: number;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
}

export interface ArticleList extends SeoFields {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  category: Category | null;
  cover_image: string | null;
  is_featured: boolean;
  published_at: string | null;
  last_reviewed_at: string | null;
  author_name: string;
  reviewer_name: string;
  updated_at: string;
}

export interface ArticleDetail extends ArticleList {
  body: string;
  is_published: boolean;
}

export interface CmsPage extends SeoFields {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  is_published: boolean;
  updated_at: string;
}

export interface SeoLandingList extends SeoFields {
  id: number;
  kind: "country" | "location";
  slug: string;
  title: string;
  excerpt: string;
  is_published: boolean;
  updated_at: string;
}

export interface SeoLandingDetail extends SeoLandingList {
  body: string;
  audience: string;
  pathways: string;
  documents: string;
  official_sources: OfficialSource[] | JsonValue;
  faqs: LandingFaq[] | JsonValue;
  related_service_slugs: string[];
  related_article_slugs: string[];
}

export interface PublicSeoIndex {
  settings: { [key: string]: JsonValue };
  pages: CmsPage[];
  services: ServiceList[];
  articles: ArticleList[];
  landings: SeoLandingList[];
}

export interface SiteSetting {
  id: number;
  key: string;
  value: JsonValue;
  description: string;
  updated_at: string;
}

export interface BrandSocial {
  linkedin: string;
  facebook: string;
  instagram: string;
}

export interface BrandSettings {
  name: string;
  tagline: string;
  primary_color: string;
  phone: string;
  email: string;
  address: string;
  whatsapp: string;
  social: BrandSocial;
}

export interface HomeContent {
  settings: { [key: string]: JsonValue };
  services: ServiceList[];
  faqs: FAQ[];
  testimonials: Testimonial[];
  featured_articles: ArticleList[];
  country_landings?: SeoLandingList[];
  location_landings?: SeoLandingList[];
}

export interface ClientProfileUpdate {
  nationality?: string;
  current_country?: string;
  date_of_birth?: string | null;
  passport_number?: string;
  residential_address?: string;
  city?: string;
  postal_code?: string;
  occupation?: string;
  employer?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}

export interface MeUpdate {
  first_name?: string;
  last_name?: string;
  phone?: string;
  preferred_language?: string;
}

export interface StaffProfile {
  id: number;
  user: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: Role;
  job_title: string;
  bio: string;
  specialisations: JsonValue;
  accepts_consultations: boolean;
  working_hours: JsonValue;
  timezone_name: string;
}

export interface StaffUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string;
  role: Role;
  is_active: boolean;
  staff_profile: StaffProfile | null;
}

export interface StaffClient {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string;
  preferred_language: string;
  is_active: boolean;
  is_email_verified: boolean;
  date_joined: string;
  last_login: string | null;
  client_profile: StaffClientProfile | null;
}

export interface ClientActivity {
  id: number;
  action: string;
  actor_email: string | null;
  created_at: string;
  metadata: JsonObject;
}

export interface AuditLog {
  id: number;
  actor: number | null;
  action: string;
  target_user: number | null;
  metadata: JsonObject;
  ip_address: string | null;
  created_at: string;
}

export interface MonthCount {
  month: string | null;
  count: number;
}

export interface ServiceCount {
  service__name: string;
  count: number;
}

export interface StatusCount {
  status__label: string;
  status__code: string;
  count: number;
}

export interface StaffWorkload {
  assigned_consultant__first_name: string;
  assigned_consultant__last_name: string;
  assigned_consultant__email: string;
  count: number;
}

export interface DashboardTotals {
  clients: number;
  active_applications: number;
  pending_documents: number;
  consultations: number;
  completed_applications: number;
  revenue_cents: number;
  outstanding_invoices: number;
}

export interface DashboardStats {
  totals: DashboardTotals;
  applications_over_time: MonthCount[];
  applications_by_service: ServiceCount[];
  applications_by_status: StatusCount[];
  document_verification: {
    verified: number;
    rejected: number;
    rejection_rate: number;
  };
  new_clients: MonthCount[];
  staff_workload: StaffWorkload[];
}

export interface ApplicationQuery {
  bucket?: ApplicationBucket | StaffApplicationBucket | string;
  search?: string;
  page?: number;
  status__code?: string;
  service__slug?: string;
}

export interface DocumentQuery {
  application?: number;
  status?: DocumentStatus;
  page?: number;
}

export interface InvoiceQuery {
  status?: InvoiceStatus;
  client?: number;
  page?: number;
  search?: string;
}
