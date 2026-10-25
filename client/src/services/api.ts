const API_BASE = '/api';

class ApiClient {
  private getHeaders(): HeadersInit {
    const token = localStorage.getItem('hcm_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    });

    if (res.status === 401) {
      // If unauthorized and not checking login, clear token
      if (!endpoint.includes('/auth/login') && !endpoint.includes('/auth/status')) {
        localStorage.removeItem('hcm_token');
        localStorage.removeItem('hcm_user');
      }
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || `HTTP ${res.status}: ${res.statusText}`);
    }

    return data as T;
  }

  // Auth
  getStatus() {
    return this.request<{ setupCompleted: boolean; companyName?: string }>('/auth/status');
  }

  setup(data: any) {
    return this.request<{ success: boolean; token: string; user: any }>('/auth/setup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  login(data: any) {
    return this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  changePassword(data: any) {
    return this.request<{ success: boolean; message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  getMe() {
    return this.request<any>('/auth/me');
  }

  // Org
  getSettings() {
    return this.request<any>('/org/settings');
  }

  updateSettings(data: any) {
    return this.request<any>('/org/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  getDepartments() {
    return this.request<any[]>('/org/departments');
  }

  createDepartment(data: any) {
    return this.request<any>('/org/departments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  getDesignations() {
    return this.request<any[]>('/org/designations');
  }

  createDesignation(data: any) {
    return this.request<any>('/org/designations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  getLeaveTypes() {
    return this.request<any[]>('/org/leave-types');
  }

  getHolidays() {
    return this.request<any[]>('/org/holidays');
  }

  createHoliday(data: any) {
    return this.request<any>('/org/holidays', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  createHrLogin(data: any) {
    return this.request<any>('/org/create-hr-login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  getUsers() {
    return this.request<any[]>('/org/users');
  }

  // Employees
  getEmployees(query?: { search?: string; departmentId?: string }) {
    const params = new URLSearchParams();
    if (query?.search) params.append('search', query.search);
    if (query?.departmentId) params.append('departmentId', query.departmentId);
    return this.request<any[]>(`/employees?${params.toString()}`);
  }

  getEmployee(id: string) {
    return this.request<any>(`/employees/${id}`);
  }

  registerEmployee(data: any) {
    return this.request<any>('/employees', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateEmployee(id: string, data: any) {
    return this.request<any>(`/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Attendance
  getAttendance(date?: string) {
    const q = date ? `?date=${date}` : '';
    return this.request<any[]>(`/attendance${q}`);
  }

  checkIn(data: any = {}) {
    return this.request<any>('/attendance/check-in', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  checkOut(data: any = {}) {
    return this.request<any>('/attendance/check-out', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  submitCorrection(data: any) {
    return this.request<any>('/attendance/corrections', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  getCorrections() {
    return this.request<any[]>('/attendance/corrections');
  }

  reviewCorrection(id: string, data: any) {
    return this.request<any>(`/attendance/corrections/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Leave
  getLeaveBalances(employeeId?: string) {
    const q = employeeId ? `?employeeId=${employeeId}` : '';
    return this.request<any[]>(`/leave/balances${q}`);
  }

  getLeaveRequests() {
    return this.request<any[]>('/leave/requests');
  }

  applyLeave(data: any) {
    return this.request<any>('/leave/apply', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  smartParseLeave(text: string) {
    return this.request<any>('/leave/smart-parse', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  }

  reviewLeave(id: string, data: any) {
    return this.request<any>(`/leave/requests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  cancelLeave(id: string) {
    return this.request<any>(`/leave/cancel/${id}`, {
      method: 'POST',
    });
  }

  // Payroll
  getPayrolls() {
    return this.request<any[]>('/payroll');
  }

  getPayroll(month: string) {
    return this.request<any>(`/payroll/${month}`);
  }

  generatePayrollDraft(month: string) {
    return this.request<any>('/payroll/generate', {
      method: 'POST',
      body: JSON.stringify({ month }),
    });
  }

  finalizePayroll(month: string) {
    return this.request<any>('/payroll/finalize', {
      method: 'POST',
      body: JSON.stringify({ month }),
    });
  }

  // AI
  chatAI(messages: any[]) {
    return this.request<any>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ messages }),
    });
  }

  getAISummary() {
    return this.request<{ role: string; observations: string[]; timestamp: string }>('/ai/summary');
  }

  // Comms & Audit
  getAnnouncements() {
    return this.request<any[]>('/comms/announcements');
  }

  postAnnouncement(data: any) {
    return this.request<any>('/comms/announcements', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  getNotifications() {
    return this.request<any[]>('/comms/notifications');
  }

  markNotificationRead(id: string) {
    return this.request<any>(`/comms/notifications/${id}/read`, {
      method: 'PUT',
    });
  }

  markAllNotificationsRead() {
    return this.request<any>('/comms/notifications/read-all', {
      method: 'PUT',
    });
  }

  getAuditLogs() {
    return this.request<any[]>('/audit');
  }

  // Analytics
  getKPIs() {
    return this.request<any>('/analytics/kpis');
  }
}

export const api = new ApiClient();
