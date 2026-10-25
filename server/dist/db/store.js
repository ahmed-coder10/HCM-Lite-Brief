import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'hcm_store.json');
const DEFAULT_SETTINGS = {
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
const DEFAULT_DATA = {
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
    data;
    constructor() {
        this.data = this.load();
    }
    load() {
        try {
            if (!fs.existsSync(DATA_DIR)) {
                fs.mkdirSync(DATA_DIR, { recursive: true });
            }
            if (fs.existsSync(DB_FILE)) {
                const raw = fs.readFileSync(DB_FILE, 'utf-8');
                return JSON.parse(raw);
            }
        }
        catch (err) {
            console.error('Failed to load database file, using clean defaults:', err);
        }
        this.save(DEFAULT_DATA);
        return JSON.parse(JSON.stringify(DEFAULT_DATA));
    }
    save(dataToSave) {
        try {
            if (!fs.existsSync(DATA_DIR)) {
                fs.mkdirSync(DATA_DIR, { recursive: true });
            }
            const tmpFile = `${DB_FILE}.tmp`;
            fs.writeFileSync(tmpFile, JSON.stringify(dataToSave, null, 2), 'utf-8');
            fs.renameSync(tmpFile, DB_FILE);
        }
        catch (err) {
            console.error('Database write error:', err);
        }
    }
    get(key) {
        return this.data[key];
    }
    set(key, val) {
        this.data[key] = val;
        this.save(this.data);
    }
    update(updater) {
        updater(this.data);
        this.save(this.data);
    }
    getSnapshot() {
        return JSON.parse(JSON.stringify(this.data));
    }
    resetAll() {
        this.data = JSON.parse(JSON.stringify(DEFAULT_DATA));
        this.save(this.data);
    }
}
export const db = new DatabaseStore();
