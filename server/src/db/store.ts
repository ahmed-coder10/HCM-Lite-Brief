import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'hcm_store.json');

export interface OrgSettings {
  companyName: string;
  officeStart: string; // "09:00"
  graceMinutes: number; // 15
  halfDayMinHours: number; // 5
  weekendDays: number[]; // [0, 6] (Sunday, Saturday)
  officeLat: number; // e.g. 24.8607
  officeLng: number; // e.g. 67.0011
  officeRadiusMeters: number; // 150
  setupCompleted: boolean;
  setupDate?: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
}

export interface Designation {
  id: string;
  title: string;
  departmentId: string;
}

export interface LeaveType {
  id: string;
  name: string;
  quotaDays: number;
  isPaid: boolean;
  color: string;
}

export interface PublicHoliday {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
}

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'ADMIN' | 'HR' | 'EMPLOYEE';
  status: 'ACTIVE' | 'DEACTIVATED';
  forcePasswordChange: boolean;
  employeeId?: string;
  createdAt: string;
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
  designationId: string;
  joiningDate: string;
  status: 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED';
  salary: {
    basic: number;
    hra: number;
    medical: number;
    gross: number;
  };
  emergencyContact?: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  checkIn: string; // ISO
  checkOut: string | null; // ISO
  status: 'PRESENT' | 'LATE' | 'HALF_DAY' | 'ON_LEAVE' | 'ABSENT' | 'MISSING_CHECKOUT';
  method: 'WEB' | 'CAMERA_FACIAL';
  location?: {
    lat: number;
    lng: number;
    distanceMeters: number;
    insideGeofence: boolean;
  };
  durationHours?: number;
}

export interface AttendanceCorrection {
  id: string;
  attendanceId?: string;
  employeeId: string;
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

export interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
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
  month: string; // YYYY-MM
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
  diff?: { before: any; after: any };
  ip?: string;
}

export interface SchemaData {
  settings: OrgSettings;
  departments: Department[];
  designations: Designation[];
  leaveTypes: LeaveType[];
  publicHolidays: PublicHoliday[];
  users: User[];
  employees: Employee[];
  attendance: AttendanceRecord[];
  corrections: AttendanceCorrection[];
  leaves: LeaveRequest[];
  payrolls: PayrollRun[];
  announcements: Announcement[];
  notifications: Notification[];
  auditLogs: AuditLog[];
}

const DEFAULT_SETTINGS: OrgSettings = {
  companyName: '',
  officeStart: '09:00',
  graceMinutes: 15,
  halfDayMinHours: 5,
  weekendDays: [0, 6], // Sunday, Saturday
  officeLat: 24.8607, // Default Karachi
  officeLng: 67.0011,
  officeRadiusMeters: 150,
  setupCompleted: false,
};

const DEFAULT_DATA: SchemaData = {
  settings: DEFAULT_SETTINGS,
  departments: [],
  designations: [],
  leaveTypes: [],
  publicHolidays: [],
  users: [],
  employees: [],
  attendance: [],
  corrections: [],
  leaves: [],
  payrolls: [],
  announcements: [],
  notifications: [],
  auditLogs: [],
};

class DatabaseStore {
  private data: SchemaData;

  constructor() {
    this.data = this.load();
  }

  private load(): SchemaData {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('Failed to load database file, using clean defaults:', err);
    }
    this.save(DEFAULT_DATA);
    return JSON.parse(JSON.stringify(DEFAULT_DATA));
  }

  private save(dataToSave: SchemaData) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tmpFile = `${DB_FILE}.tmp`;
      fs.writeFileSync(tmpFile, JSON.stringify(dataToSave, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DB_FILE);
    } catch (err) {
      console.error('Database write error:', err);
    }
  }

  public get<K extends keyof SchemaData>(key: K): SchemaData[K] {
    return this.data[key];
  }

  public set<K extends keyof SchemaData>(key: K, val: SchemaData[K]) {
    this.data[key] = val;
    this.save(this.data);
  }

  public update(updater: (data: SchemaData) => void) {
    updater(this.data);
    this.save(this.data);
  }

  public getSnapshot(): SchemaData {
    return JSON.parse(JSON.stringify(this.data));
  }

  public resetAll() {
    this.data = JSON.parse(JSON.stringify(DEFAULT_DATA));
    this.save(this.data);
  }
}

export const db = new DatabaseStore();
