export type Priority = 'Critical' | 'High' | 'Medium' | 'Low';
export type IssueStatus = 'Open' | 'In Progress' | 'Pending' | 'Resolved' | 'Closed';
export type UserRole = 'Admin' | 'Supervisor' | 'Agent';

export interface IssueComment {
  id: string;
  user: string;
  avatar?: string;
  text: string;
  time: string;
  attachment?: {
    name: string;
    url: string;
    size?: string;
  };
}

export interface TimelineEvent {
  id: string;
  time: string;
  actor: string;
  title: string;
  details: string;
  type: 'create' | 'status' | 'assign' | 'comment' | 'resolve' | 'timer' | 'sla' | 'merge';
}

export interface ExternalVendor {
  id: string;
  name: string; // اسم المسؤول أو جهة الاتصال
  company: string; // اسم الشركة أو الجهة الخارجية (مثل: فودافون / AWS / البنك / شركة الصيانة)
  role: string; // صفة الطرف الخارجي: مورد (Vendor) • مقاول (Contractor) • مزود خدمة (Provider) • شريك (Partner) • ممثل عميل (Client Rep)
  phone?: string; // هاتف / واتساب للتواصل السريع
  email?: string; // بريد إلكتروني رسمي
  notes?: string; // تعليمات التنسيق ومواعيد العمل
}

export interface ExternalOwnerDetails {
  name: string; // اسم المسؤول أو الشخص الخارجي
  company?: string; // اسم الشركة أو الجهة الخارجية (مثل: فودافون / AWS / البنك / شركة الصيانة)
  role?: string; // صفة الطرف الخارجي: مورد (Vendor) • مقاول (Contractor) • مزود خدمة (Provider) • شريك (Partner) • ممثل عميل (Client Rep)
  phone?: string; // رقم هاتف / واتساب للمتابعة المباشرة
  email?: string; // بريد إلكتروني للتواصل
  externalTicketId?: string; // رقم البلاغ / التذكرة لدى الطرف الخارجي (External Case Ref)
  notes?: string; // ملاحظات أو تعليمات التنسيق مع الطرف الخارجي
  vendorId?: string; // معرّف الجهة الخارجية المسجلة بالدليل إن وجد
}

export interface Issue {
  id: string;
  client: string;
  clientEmail?: string;
  clientPhone?: string;
  tag: string;
  type: string; // Category
  desc: string;
  assigned: string; // Team
  owner: string; // Assignee name
  isExternalOwner?: boolean; // هل المسؤول من خارج الشركة (طرف خارجي / مورد / مقاول)
  externalOwnerDetails?: ExternalOwnerDetails; // تفاصيل المسؤول والجهة الخارجية
  priority: Priority;
  status: IssueStatus;
  createdAt: string; // ISO string with full timestamp
  dueDate: string; // ISO string for SLA deadline
  workTime: number; // In seconds
  isWorkingNow?: boolean;
  activeWorker?: string | null;
  csat: number; // 1-5
  resolutionReason?: string;
  resolvedAt?: string;
  attachment?: {
    name: string;
    url: string;
    size?: string;
  };
  comments: IssueComment[];
  timeline: TimelineEvent[];
  mergedIntoTicketId?: string; // If this ticket is merged into another
  mergedTicketIds?: string[]; // IDs of tickets that were merged into this one
  clientNotes?: string;
  slaPaused?: boolean; // هل تم تجميد عداد المهلة (بسبب الطرف الخارجي أو انتظار العميل)
  slaPausedReason?: string; // سبب تجميد العداد
  slaPausedAt?: string; // توقيت تجميد العداد
  slaExtendedHours?: number; // ساعات التمديد الإضافية المعتمدة
  slaExtensionReason?: string; // سبب التمديد الاستثنائي
  submittedByClient?: boolean; // هل تم فتح التذكرة بواسطة العميل مباشرة من بوابة العملاء
}

export interface AppUser {
  id: string;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  department: string;
  avatar: string;
  permissions?: string[];
  password?: string;
}

export interface CategoryRule {
  id: string;
  name: string;
  assignedTeam: string;
  defaultOwner: string;
  description?: string;
  color?: string;
  active?: boolean;
  routingStrategy?: 'direct' | 'round_robin' | 'least_busy';
  keywords?: string[];
  escalationEmail?: string;
  businessHoursOnly?: boolean;
  slaHours: {
    Critical: number;
    High: number;
    Medium: number;
    Low: number;
  };
}

export interface AuditLog {
  id: string;
  time: string;
  user: string;
  action: string;
  details: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  desc: string;
  time: string;
  type: 'warning' | 'info' | 'success' | 'danger';
  ticketId?: string;
}

export interface SoundSettings {
  muted: boolean;
  alarmUrl: string;
  customNotificationUrl?: string;
  alarmStyle: 'pulse-red' | 'dark-rose' | 'amber-warning';
  volume: number;
}

export interface SupabaseConfig {
  url: string;
  key: string;
  connected: boolean;
  lastSync?: string;
}

export type BadgeStyleType = 'clean-arabic' | 'bilingual' | 'modern-pill';

export type CabDesignStyle = 'dynamic_table' | 'itil_cards';

export interface GeneralSettings {
  appName: string;
  appBadge: string;
  appSubtitle: string;
  companyName: string;
  copyrightText: string;
  appLogoIcon: string; // e.g. 'Headset' | 'ShieldCheck' | 'Briefcase' | 'Cpu' | 'LifeBuoy' | 'Sparkles'
  headerColorPreset: string; // 'indigo-emerald' | 'blue-cyan' | 'violet-fuchsia' | 'rose-orange' | 'amber-yellow' | 'emerald-teal'
  showBadge: boolean;
  showSubtitle: boolean;
  showFooterCopyright: boolean;
  customFooterNote: string;
  badgeStyle?: BadgeStyleType;
  cabDesignStyle?: CabDesignStyle;
  lightThemeBgColor?: string; // 'default' | 'pure_white' | 'soft_gray' | 'warm_beige' | 'ice_blue' | 'soft_mint' | 'custom'
  lightCardBgColor?: string; // 'default' | 'custom'
  lightHeaderBgColor?: string; // 'default' | 'custom'
  customLightBgHex?: string;
  customCardBgHex?: string;
  customHeaderBgHex?: string;
}

export interface SlaSettings {
  businessHoursOnly: boolean; // احتساب ساعات العمل الرسمية فقط أم 24/7
  workStartHour: number; // ساعة بدء الدوام (مثلاً 9)
  workEndHour: number; // ساعة نهاية الدوام (مثلاً 17)
  workDays: number[]; // أيام العمل: 0=الأحد, 1=الإثنين, ..., 4=الخميس
  pauseOnExternalPending: boolean; // إيقاف العداد تلقائياً عند إسناد التذكرة لطرف خارجي
  pauseOnCustomerPending: boolean; // إيقاف العداد عند انتظار إفادة العميل
  warningThresholdMinutes: number; // عتبة الإنذار المبكر قبل الانتهاء (مثلاً 120 دقيقة)
  autoEscalateOnBreach: boolean; // تصعيد الأولوية تلقائياً عند تجاوز المهلة
  soundAlertOnRisk: boolean; // تشغيل إنذار صوتي عند اقتراب انتهاء SLA
  activePreset?: 'enterprise' | 'standard' | 'relaxed' | 'custom';
}

export interface SystemBackupData {
  version: string;
  exportedAt: string;
  exportedBy?: string;
  systemName?: string;
  issues: Issue[];
  users: AppUser[];
  categories: CategoryRule[];
  tags: string[];
  cannedResponses: string[];
  soundSettings: SoundSettings;
  generalSettings: GeneralSettings;
  auditLogs: AuditLog[];
  externalVendors?: ExternalVendor[];
  slaSettings?: SlaSettings;
}

export interface ScheduledReport {
  id: string;
  title: string;
  frequency: 'weekly' | 'monthly' | 'daily';
  dayOfWeek?: number; // 0 for Sunday, 6 for Saturday, etc.
  dayOfMonth?: number; // 1-31
  time: string; // e.g. "09:00"
  recipients: string[];
  includeMttr: boolean;
  includeCsat: boolean;
  includeSla: boolean;
  includeCategories: boolean;
  status: 'active' | 'paused';
  format: 'email_digest' | 'pdf_summary' | 'csv_data';
  lastRun?: string;
  nextRun: string;
  createdAt: string;
}

export interface CabComment {
  id: string;
  author: string;
  content: string;
  createdAt: string;
  type?: 'general' | 'rollback_reason' | 'completion_note';
}

export interface CabAuditLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  details: string;
}

export interface CabBusinessActivity {
  id: string;
  activityName: string; // Business Activity
  scope: string; // Scope / Change Description
  impactedServices: string; // Impacted Services
  serviceImpact: string; // Brief description of expected impact
  downtimeRequired: 'Yes' | 'No'; // Downtime Required
  date: string; // Day, DD/MM/YYYY
  startTime: string; // HH:MM AM/PM
  endTime: string; // HH:MM AM/PM
  maintenanceWindow: string; // [Start Time] - [End Time]
  requestor: string; // Full Name
  tpm: string; // Full Name
  changeManagement: string; // IT Change Management
  status?: 'Draft' | 'Pending Approval' | 'Approved' | 'Completed' | 'Rolled Back' | 'Rejected';
  riskLevel?: 'Low' | 'Medium' | 'High' | 'Critical';
  rollbackPlan?: string;
  rollbackReason?: string;
  stopServiceTargetSystem?: string; // اسم السيستم الذي سيتم إيقاف الخدمة عليه
  stoppedSystemName?: string; // اسم السيستم الذي سيتوقف
  comments?: CabComment[];
  auditTrail?: CabAuditLog[];
  createdAt?: string;
}

