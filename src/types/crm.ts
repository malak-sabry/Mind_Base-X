export type AccountSize = "small" | "medium" | "large" | "enterprise";
export type AccountStatus = "active" | "inactive" | "prospect";
export type ContactStatus = "lead" | "qualified" | "customer" | "inactive";
export type DealStage = "new" | "qualified" | "proposal" | "negotiation" | "won" | "lost";
export type DealPriority = "low" | "medium" | "high";
export type ActivityType = "call" | "meeting" | "email" | "task" | "note";
export type ActivityStatus = "pending" | "completed" | "cancelled";

export interface CrmAccount {
  id: string;
  name: string;
  industry: string;
  website: string;
  country: string;
  city: string;
  size: AccountSize;
  annualRevenue: number;
  status: AccountStatus;
  ownerEmployeeId?: string | null;
  notes: string;
  impactPercent: number;
  outcomeSummary: string;
  onboardedAt?: string | null;
  createdAt: string;
}

export interface CrmContact {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  jobTitle: string;
  accountId?: string | null;
  ownerEmployeeId?: string | null;
  status: ContactStatus;
  source: string;
  tags: string[];
  notes: string;
  lastContactedAt?: string | null;
  createdAt: string;
}

export interface CrmDeal {
  id: string;
  title: string;
  description: string;
  value: number;
  currency: string;
  stage: DealStage;
  probability: number;
  expectedCloseDate?: string | null;
  accountId?: string | null;
  contactId?: string | null;
  ownerEmployeeId?: string | null;
  priority: DealPriority;
  lostReason: string;
  closedAt?: string | null;
  createdAt: string;
}

export interface CrmActivity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  status: ActivityStatus;
  scheduledAt?: string | null;
  completedAt?: string | null;
  durationMinutes: number;
  accountId?: string | null;
  contactId?: string | null;
  dealId?: string | null;
  ownerEmployeeId?: string | null;
  outcome: string;
  createdAt: string;
}

export const INDUSTRIES = [
  "تكنولوجيا", "تعليم", "صحة", "تجارة", "عقارات", "تصنيع",
  "مالية", "خدمات", "سياحة", "إعلام", "أخرى",
];

export const ACCOUNT_SIZES: { value: AccountSize; label: string }[] = [
  { value: "small", label: "صغيرة (1-50)" },
  { value: "medium", label: "متوسطة (51-250)" },
  { value: "large", label: "كبيرة (251-1000)" },
  { value: "enterprise", label: "مؤسسة (+1000)" },
];

export const ACCOUNT_STATUSES: { value: AccountStatus; label: string; color: string }[] = [
  { value: "prospect", label: "محتمل", color: "bg-blue-500/15 text-blue-600 border-blue-500/30" },
  { value: "active", label: "نشط", color: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" },
  { value: "inactive", label: "غير نشط", color: "bg-muted text-muted-foreground border-border" },
];

export const CONTACT_STATUSES: { value: ContactStatus; label: string; color: string }[] = [
  { value: "lead", label: "عميل محتمل", color: "bg-amber-500/15 text-amber-600 border-amber-500/30" },
  { value: "qualified", label: "مؤهل", color: "bg-blue-500/15 text-blue-600 border-blue-500/30" },
  { value: "customer", label: "عميل", color: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" },
  { value: "inactive", label: "غير نشط", color: "bg-muted text-muted-foreground border-border" },
];

export const DEAL_STAGES: { value: DealStage; label: string; color: string; defaultProb: number }[] = [
  { value: "new", label: "جديدة", color: "bg-slate-500/15 text-slate-600 border-slate-500/30", defaultProb: 10 },
  { value: "qualified", label: "مؤهلة", color: "bg-blue-500/15 text-blue-600 border-blue-500/30", defaultProb: 30 },
  { value: "proposal", label: "عرض سعر", color: "bg-violet-500/15 text-violet-600 border-violet-500/30", defaultProb: 50 },
  { value: "negotiation", label: "تفاوض", color: "bg-amber-500/15 text-amber-600 border-amber-500/30", defaultProb: 75 },
  { value: "won", label: "تم الفوز", color: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30", defaultProb: 100 },
  { value: "lost", label: "خسارة", color: "bg-rose-500/15 text-rose-600 border-rose-500/30", defaultProb: 0 },
];

export const DEAL_PRIORITIES: { value: DealPriority; label: string; color: string }[] = [
  { value: "low", label: "منخفضة", color: "bg-muted text-muted-foreground" },
  { value: "medium", label: "متوسطة", color: "bg-blue-500/15 text-blue-600" },
  { value: "high", label: "عالية", color: "bg-rose-500/15 text-rose-600" },
];

export const ACTIVITY_TYPES: { value: ActivityType; label: string; icon: string }[] = [
  { value: "call", label: "مكالمة", icon: "Phone" },
  { value: "meeting", label: "اجتماع", icon: "Users" },
  { value: "email", label: "بريد إلكتروني", icon: "Mail" },
  { value: "task", label: "مهمة", icon: "CheckSquare" },
  { value: "note", label: "ملاحظة", icon: "FileText" },
];

export const ACTIVITY_STATUSES: { value: ActivityStatus; label: string; color: string }[] = [
  { value: "pending", label: "قيد الانتظار", color: "bg-amber-500/15 text-amber-600 border-amber-500/30" },
  { value: "completed", label: "مكتمل", color: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" },
  { value: "cancelled", label: "ملغي", color: "bg-rose-500/15 text-rose-600 border-rose-500/30" },
];

export const ACCESS_LEVELS = [
  { value: "admin", label: "مدير" },
  { value: "supervisor", label: "مشرف" },
  { value: "hr", label: "موارد بشرية" },
  { value: "employee", label: "موظف" },
] as const;