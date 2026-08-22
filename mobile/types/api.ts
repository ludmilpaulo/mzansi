export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
export type JsonObject = { [key: string]: JsonValue };

export type FieldErrors = Record<string, string[]>;

export interface ApiErrorBody {
  code: string;
  detail: string;
  fields?: FieldErrors;
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

export interface ServiceList {
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
  seo_title: string;
  seo_description: string;
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

export interface ApplicationCreateRequest {
  service: string;
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

export interface DocumentSubmission {
  id: number;
  application: number;
  document_type: DocumentType;
  status: DocumentStatus;
  has_file: boolean;
  original_filename: string;
  uploaded_at: string | null;
  rejection_reason: string;
  client_note: string;
  reviewed_at: string | null;
  expires_at: string | null;
  page_count: number;
  reviews: ClientDocumentReview[];
  created_at: string;
  updated_at: string;
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

export type AppointmentStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "RESCHEDULED";

export interface Appointment {
  id: number;
  client: number;
  client_name: string;
  consultant_name: string;
  consultation_type: ConsultationType;
  application: number | null;
  starts_at: string;
  ends_at: string;
  status: AppointmentStatus;
  meeting_link: string;
  client_notes: string;
  cancelled_reason: string;
  created_at: string;
}

export interface AppointmentCreateRequest {
  consultation_type_id: number;
  consultant_id: number;
  starts_at: string;
  client_notes?: string;
}

export interface AppointmentSlot {
  starts_at: string;
  ends_at: string;
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

export interface DeviceTokenRequest {
  token: string;
  platform: string;
}

export interface DeviceToken {
  id: number;
  token: string;
  platform: string;
  is_active: boolean;
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

export interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: string;
  sort_order: number;
  is_active: boolean;
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

export interface ArticleList {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  category: Category | null;
  cover_image: string | null;
  is_featured: boolean;
  published_at: string | null;
  seo_title: string;
  seo_description: string;
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
