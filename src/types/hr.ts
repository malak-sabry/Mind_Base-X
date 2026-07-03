export interface Employee {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  department: string;
  role: string;
  salary: number;
  joinDate: string;
  gender: "male" | "female";
  skills: string[];
  languages: string[];
  photo?: string;
  nationality: string;
  address: string;
  status: "active" | "inactive";
  attendance: AttendanceRecord[];
  password?: string;
  isOnline?: boolean;
  lastLoginAt?: string;
  lastLogoutAt?: string;
}

export interface AttendanceRecord {
  date: string;
  present: boolean;
  note?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  notes: string;
  assignedTo: string;
  createdAt: string;
  deadline: string;
  status: "pending" | "done" | "late";
  completedAt?: string;
  priority: "low" | "medium" | "high";
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  managerNote?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  targetRole: string;
  targetEmployeeId?: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  isRead: boolean;
  createdAt: string;
}

export type Department = "engineering" | "design" | "marketing" | "hr" | "finance" | "operations" | "sales";

export const DEPARTMENTS: { value: Department; label: string }[] = [
  { value: "engineering", label: "الهندسة" },
  { value: "design", label: "التصميم" },
  { value: "marketing", label: "التسويق" },
  { value: "hr", label: "الموارد البشرية" },
  { value: "finance", label: "المالية" },
  { value: "operations", label: "العمليات" },
  { value: "sales", label: "المبيعات" },
];

export const LEAVE_TYPES = [
  { value: "annual", label: "سنوية" },
  { value: "sick", label: "مرضية" },
  { value: "emergency", label: "طارئة" },
  { value: "unpaid", label: "بدون راتب" },
];
