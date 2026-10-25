import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Download,
  Filter,
  Eye,
  Edit2,
  Mail,
  Phone,
  Building2,
  DollarSign,
  Calendar,
} from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { Employee } from '../types/index.js';
import { Modal } from '../components/Modal.js';

export const Employees: React.FC = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  // Register Modal
  const [registerModal, setRegisterModal] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [designationId, setDesignationId] = useState('');
  const [basicSalary, setBasicSalary] = useState(60000);
  const [tempPassword, setTempPassword] = useState('Welcome@2026');
  const [regError, setRegError] = useState<string | null>(null);

  // Employee 360 Modal
  const [selectedEmp, setSelectedEmp] = useState<any | null>(null);

  // Edit Contact Modal (for Employee role)
  const [editContactModal, setEditContactModal] = useState(false);
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const [empList, depts, desgs] = await Promise.all([
        api.getEmployees({ search, departmentId: deptFilter }),
        api.getDepartments(),
        api.getDesignations(),
      ]);
      setEmployees(empList);
      setDepartments(depts);
      setDesignations(desgs);
      if (depts.length > 0 && !departmentId) setDepartmentId(depts[0].id);
      if (desgs.length > 0 && !designationId) setDesignationId(desgs[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [search, deptFilter]);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    try {
      await api.registerEmployee({
        firstName,
        lastName,
        email,
        phone,
        address,
        departmentId,
        designationId,
        basicSalary,
        temporaryPassword: tempPassword,
      });
      setRegisterModal(false);
      // Reset form
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setAddress('');
      fetchEmployees();
    } catch (err: any) {
      setRegError(err.message || 'Failed to register employee');
    }
  };

  const handleOpen360 = async (id: string) => {
    try {
      const data = await api.getEmployee(id);
      setSelectedEmp(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.employeeId) return;
    try {
      await api.updateEmployee(user.employeeId, {
        phone: editPhone,
        address: editAddress,
      });
      setEditContactModal(false);
      fetchEmployees();
    } catch (err) {
      console.error(err);
    }
  };

  const role = user?.role || 'EMPLOYEE';

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-white/10">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-aurora-cyan">
            Module 03 · People Directory
          </span>
          <h1 className="text-2xl font-bold font-heading text-white">Employee Directory & 360</h1>
          <p className="text-xs text-aurora-muted mt-1">
            Search, manage profiles, salary structures, and credentials.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {role !== 'EMPLOYEE' && (
            <a
              href="/api/employees/actions/export-csv"
              download
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl glass-card text-xs font-semibold text-aurora-cyan hover:border-aurora-cyan/40 transition-all"
            >
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </a>
          )}

          {role === 'HR' && (
            <button
              onClick={() => setRegisterModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-aurora-btnViolet hover:bg-aurora-violet text-white text-xs font-bold shadow-lg shadow-aurora-violet/25 hover:scale-[1.02] transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Register Employee</span>
            </button>
          )}

          {role === 'EMPLOYEE' && (
            <button
              onClick={() => {
                const myEmp = employees.find((e) => e.id === user?.employeeId);
                if (myEmp) {
                  setEditPhone(myEmp.phone);
                  setEditAddress(myEmp.address);
                  setEditContactModal(true);
                }
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-aurora-cyan/20 border border-aurora-cyan/40 text-aurora-cyan text-xs font-bold hover:bg-aurora-cyan/30 transition-all"
            >
              <Edit2 className="h-3.5 w-3.5" />
              <span>Edit My Contact Info</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-aurora-muted" />
          <input
            type="text"
            placeholder="Search by employee name, code, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-aurora-muted focus:outline-none focus:border-aurora-violet transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-aurora-muted shrink-0" />
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="bg-black/50 border border-white/10 rounded-2xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-aurora-violet"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Directory Table */}
      <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-[10px] font-mono uppercase tracking-wider text-aurora-muted bg-white/5">
                <th className="py-3.5 px-6">Employee</th>
                <th className="py-3.5 px-6">Code</th>
                <th className="py-3.5 px-6">Department & Role</th>
                <th className="py-3.5 px-6">Monthly Gross</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs text-white">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-aurora-muted">
                    No employees registered yet. Click 'Register Employee' to add staff.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-semibold text-white">
                        {emp.firstName} {emp.lastName}
                      </div>
                      <div className="text-[11px] text-aurora-muted">{emp.email}</div>
                    </td>
                    <td className="py-4 px-6 font-mono font-bold text-aurora-cyan">
                      {emp.employeeCode}
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-medium text-white">{emp.departmentName}</div>
                      <div className="text-[11px] text-aurora-muted">{emp.designationTitle}</div>
                    </td>
                    <td className="py-4 px-6 font-mono font-bold text-aurora-mint">
                      {role === 'EMPLOYEE' && user?.employeeId !== emp.id
                        ? '••••••'
                        : `PKR ${emp.salary.gross.toLocaleString()}`}
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-aurora-mint/20 text-aurora-mint border border-aurora-mint/30">
                        {emp.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleOpen360(emp.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-aurora-violet/20 border border-white/10 hover:border-aurora-violet/40 text-xs font-semibold text-aurora-cyan transition-all"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>360 Profile</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register Employee Modal */}
      <Modal
        isOpen={registerModal}
        onClose={() => setRegisterModal(false)}
        title="Register New Employee (Creates User Login)"
        maxWidth="lg"
      >
        {regError && (
          <div className="mb-4 p-3 rounded-xl bg-aurora-rose/10 border border-aurora-rose/30 text-rose-300 text-xs">
            {regError}
          </div>
        )}

        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-aurora-text uppercase mb-1 font-mono">
                First Name *
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Ali"
                className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-aurora-violet"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-aurora-text uppercase mb-1 font-mono">
                Last Name *
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Khan"
                className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-aurora-violet"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-aurora-text uppercase mb-1 font-mono">
                Work Email *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ali@company.com"
                className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-aurora-violet"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-aurora-text uppercase mb-1 font-mono">
                Phone Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+92 300 1234567"
                className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-aurora-violet"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-aurora-text uppercase mb-1 font-mono">
              Residential Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Clifton Block 4, Karachi"
              className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-aurora-violet"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-aurora-text uppercase mb-1 font-mono">
                Department *
              </label>
              <select
                required
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-aurora-violet"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-aurora-text uppercase mb-1 font-mono">
                Designation *
              </label>
              <select
                required
                value={designationId}
                onChange={(e) => setDesignationId(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-aurora-violet"
              >
                {designations.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-aurora-violet/10 border border-aurora-violet/30 space-y-2">
            <span className="text-[10px] font-mono font-bold uppercase text-aurora-cyan block">
              Salary Structure Rules: Gross = 1.5 × Basic (HRA 40%, Medical 10%)
            </span>
            <div>
              <label className="block text-xs font-semibold text-aurora-text mb-1">
                Basic Monthly Salary (PKR)
              </label>
              <input
                type="number"
                value={basicSalary}
                onChange={(e) => setBasicSalary(Number(e.target.value))}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-aurora-violet font-mono"
              />
            </div>
            <div className="flex justify-between text-xs text-aurora-muted pt-1">
              <span>HRA: PKR {Math.round(basicSalary * 0.4).toLocaleString()}</span>
              <span>Medical: PKR {Math.round(basicSalary * 0.1).toLocaleString()}</span>
              <span className="text-white font-bold font-mono">
                Gross: PKR {Math.round(basicSalary * 1.5).toLocaleString()}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-aurora-text uppercase mb-1 font-mono">
              Temporary Password (Forced Change on Login)
            </label>
            <input
              type="text"
              required
              value={tempPassword}
              onChange={(e) => setTempPassword(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-aurora-violet font-mono"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-aurora-btnViolet hover:bg-aurora-violet text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-aurora-violet/25 transition-all"
          >
            Register & Generate Employee Login
          </button>
        </form>
      </Modal>

      {/* Employee 360 Drawer / Modal */}
      {selectedEmp && (
        <Modal
          isOpen={!!selectedEmp}
          onClose={() => setSelectedEmp(null)}
          title={`Employee 360 · ${selectedEmp.employee.firstName} ${selectedEmp.employee.lastName}`}
          maxWidth="xl"
        >
          <div className="space-y-5">
            <div className="flex items-center justify-between p-4 rounded-2xl glass-card border border-white/10">
              <div>
                <span className="text-[10px] font-mono text-aurora-cyan font-bold uppercase">
                  {selectedEmp.employee.employeeCode}
                </span>
                <h3 className="text-lg font-bold text-white">
                  {selectedEmp.employee.firstName} {selectedEmp.employee.lastName}
                </h3>
                <p className="text-xs text-aurora-muted">{selectedEmp.employee.email}</p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-aurora-mint/20 text-aurora-mint border border-aurora-mint/30">
                {selectedEmp.employee.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-black/30 border border-white/5">
                <span className="text-aurora-muted block text-[10px] uppercase font-mono">Department</span>
                <span className="font-semibold text-white">{selectedEmp.department?.name}</span>
              </div>
              <div className="p-3 rounded-xl bg-black/30 border border-white/5">
                <span className="text-aurora-muted block text-[10px] uppercase font-mono">Designation</span>
                <span className="font-semibold text-white">{selectedEmp.designation?.title}</span>
              </div>
              <div className="p-3 rounded-xl bg-black/30 border border-white/5">
                <span className="text-aurora-muted block text-[10px] uppercase font-mono">Contact Phone</span>
                <span className="font-semibold text-white">{selectedEmp.employee.phone || 'N/A'}</span>
              </div>
              <div className="p-3 rounded-xl bg-black/30 border border-white/5">
                <span className="text-aurora-muted block text-[10px] uppercase font-mono">Joining Date</span>
                <span className="font-semibold text-white">{selectedEmp.employee.joiningDate}</span>
              </div>
            </div>

            {/* Salary Breakdown (Hidden from other employees) */}
            {role !== 'EMPLOYEE' || user?.employeeId === selectedEmp.employee.id ? (
              <div className="p-4 rounded-2xl bg-aurora-mint/5 border border-aurora-mint/20">
                <h4 className="text-xs font-bold text-aurora-mint uppercase font-mono mb-2">
                  Salary Structure (PKR)
                </h4>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2 rounded-lg bg-black/30">
                    <span className="text-[10px] text-aurora-muted block">Basic</span>
                    <span className="font-mono font-bold text-white">
                      {selectedEmp.employee.salary?.basic?.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-black/30">
                    <span className="text-[10px] text-aurora-muted block">HRA (40%)</span>
                    <span className="font-mono font-bold text-white">
                      {selectedEmp.employee.salary?.hra?.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-black/30">
                    <span className="text-[10px] text-aurora-muted block">Medical (10%)</span>
                    <span className="font-mono font-bold text-white">
                      {selectedEmp.employee.salary?.medical?.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-aurora-mint/20 border border-aurora-mint/30">
                    <span className="text-[10px] text-aurora-mint font-bold block">Gross</span>
                    <span className="font-mono font-bold text-aurora-mint">
                      {selectedEmp.employee.salary?.gross?.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ) : null}

            <div>
              <h4 className="text-xs font-bold text-white uppercase font-mono mb-2">
                Recent Attendance Logs
              </h4>
              <div className="max-h-36 overflow-y-auto space-y-1">
                {selectedEmp.recentAttendance?.length === 0 ? (
                  <p className="text-xs text-aurora-muted">No attendance events logged yet.</p>
                ) : (
                  selectedEmp.recentAttendance.map((att: any) => (
                    <div key={att.id} className="flex justify-between p-2 rounded-lg bg-white/5 text-xs">
                      <span>{att.date}</span>
                      <span className="font-bold text-aurora-cyan">{att.status}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Employee Edit Contact Modal */}
      <Modal
        isOpen={editContactModal}
        onClose={() => setEditContactModal(false)}
        title="Update Contact Details"
      >
        <form onSubmit={handleUpdateContact} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-aurora-text uppercase mb-1 font-mono">
              Phone Number
            </label>
            <input
              type="text"
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-aurora-violet"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-aurora-text uppercase mb-1 font-mono">
              Residential Address
            </label>
            <input
              type="text"
              value={editAddress}
              onChange={(e) => setEditAddress(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-aurora-violet"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-aurora-violet text-white font-bold text-xs uppercase"
          >
            Save Changes
          </button>
        </form>
      </Modal>
    </div>
  );
};
