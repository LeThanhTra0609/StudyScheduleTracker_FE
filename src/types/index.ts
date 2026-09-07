// ─── User ───────────────────────────────────────────────────────────────────
export type UserRole = 'PARENT' | 'STUDENT';

export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  linkCode?: string;
  children?: User[];
  parents?: User[];
  notificationPreferences: {
    reminderTimes: number[];
    emailNotifications: boolean;
  };
}

// ─── Subject ─────────────────────────────────────────────────────────────────
export interface Subject {
  _id: string;
  userId: string;
  name: string;
  code?: string;
  description?: string;
  teacher?: string;
  color: string;
  createdAt: string;
}

// ─── Location ─────────────────────────────────────────────────────────────────
export interface Location {
  _id: string;
  userId: string;
  name: string;
  address?: string;
  description?: string;
  mapLink?: string;
  meetingLink?: string;
}

// ─── Schedule ────────────────────────────────────────────────────────────────
export type ScheduleType = 'ACADEMIC' | 'EXTRA_CLASS';
export type LearningMethod = 'OFFLINE' | 'ONLINE';
export type ScheduleStatus = 'UPCOMING' | 'COMPLETED' | 'ABSENT' | 'EXCUSED' | 'CANCELLED';
export type PaymentMethod = 'PER_SESSION' | 'MONTHLY' | 'COURSE';

export interface TuitionSetting {
  enabled: boolean;
  paymentMethod: PaymentMethod;
  pricePerSession?: number;
  monthlyFee?: number;
  courseFee?: number;
  chargeOnAbsent: boolean;
}

export interface Schedule {
  _id: string;
  userId: string;
  subjectId: Subject | string;
  locationId?: Location | string;
  type: ScheduleType;
  date: string;
  startTime: string;
  endTime: string;
  learningMethod: LearningMethod;
  teacher?: string;
  notes?: string;
  color?: string;
  status: ScheduleStatus;
  isRecurring: boolean;
  recurringGroupId?: string;
  recurringDays?: number[];
  tuition: TuitionSetting;
  createdAt: string;
  updatedAt: string;
}

// ─── Attendance ───────────────────────────────────────────────────────────────
export type AttendanceStatus = 'UPCOMING' | 'COMPLETED' | 'ABSENT' | 'EXCUSED' | 'CANCELLED';

export interface Attendance {
  _id: string;
  scheduleId: Schedule | string;
  userId: string;
  date: string;
  status: AttendanceStatus;
  durationMinutes: number;
  notes?: string;
  markedAt?: string;
}

// ─── Payment ──────────────────────────────────────────────────────────────────
export type PaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID';

export interface Transaction {
  _id: string;
  amount: number;
  paidAt: string;
  method: string;
  notes?: string;
}

export interface Payment {
  _id: string;
  userId: string;
  scheduleId?: Schedule | string;
  subjectId?: Subject | string;
  periodLabel: string;
  periodStart?: string;
  periodEnd?: string;
  dueDate?: string;
  paidAt?: string;
  notes?: string;
  totalSessions: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: PaymentStatus;
  transactions: Transaction[];
  createdAt: string;
}

// ─── API Response ─────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// ─── Statistics ───────────────────────────────────────────────────────────────
export interface StudyStats {
  total: number;
  completed: number;
  absent: number;
  upcoming: number;
  cancelled: number;
  totalMinutes: number;
}

export interface PaymentSummary {
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  unpaidCount: number;
  partialCount: number;
  paidCount: number;
  overdueCount?: number;
  dueSoonCount?: number;
}
