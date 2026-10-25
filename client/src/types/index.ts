export type Role = 'ADMIN' | 'HR' | 'EMPLOYEE';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  forcePasswordChange?: boolean;
  employeeId?: string;
}

export interface Employee {
  id: string;
  userId: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  departmentId: string;
  departmentName?: string;
  designationId: string;
  designationTitle?: string;
  joiningDate: string;
  status: 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED';
  salary: {
    basic: number;
    hra: number;
    medical: number;
    gross: number;
  };
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName?: string;
  employeeCode?: string;
  date: string;
  checkIn: string;
  checkOut: string | null;
  status: 'PRESENT' | 'LATE' | 'HALF_DAY' | 'ON_LEAVE' | 'ABSENT' | 'MISSING_CHECKOUT';
  method: 'WEB' | 'CAMERA_FACIAL';
  durationHours?: number;
  location?: {
    lat: number;
    lng: number;
    distanceMeters: number;
    insideGeofence: boolean;
  };
}

export interface AttendanceCorrection {
  id: string;
  attendanceId?: string;
  employeeId: string;
  employeeName?: string;
  employeeCode?: string;
  date: string;
  requestedCheckIn: string;
  requestedCheckOut: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewComment?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface LeaveType {
  id: string;
  name: string;
  quotaDays: number;
  isPaid: boolean;
  color: string;
}

export interface LeaveBalance {
  leaveTypeId: string;
  name: string;
  quota: number;
  used: number;
  remaining: number;
  isPaid: boolean;
  color: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName?: string;
  employeeCode?: string;
  leaveTypeId: string;
  leaveTypeName?: string;
  color?: string;
  startDate: string;
  endDate: string;
  daysCount: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  reviewComment?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface PayrollItem {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  department: string;
  designation: string;
  basic: number;
  hra: number;
  medical: number;
  gross: number;
  totalWorkingDays: number;
  presentDays: number;
  lateDays: number;
  halfDays: number;
  absentDays: number;
  unpaidLeaveDays: number;
  payableDays: number;
  earnedGross: number;
  unpaidDeductions: number;
  annualizedGross: number;
  monthlyTax: number;
  netPay: number;
}

export interface PayrollRun {
  id: string;
  month: string;
  status: 'DRAFT' | 'FINALIZED';
  totalGross: number;
  totalNet: number;
  totalTax: number;
  totalEmployees: number;
  createdAt: string;
  finalizedBy?: string;
  finalizedAt?: string;
  items: PayrollItem[];
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'NORMAL' | 'URGENT';
  authorName: string;
  authorRole: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'LEAVE' | 'PAYROLL' | 'ATTENDANCE' | 'SYSTEM';
  read: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  entity: string;
  entityId?: string;
  details: string;
}

export interface OrgSettings {
  companyName: string;
  officeStart: string;
  graceMinutes: number;
  halfDayMinHours: number;
  weekendDays: number[];
  officeLat: number;
  officeLng: number;
  officeRadiusMeters: number;
  setupCompleted: boolean;
}
