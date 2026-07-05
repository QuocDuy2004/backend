import React, { useState, useEffect } from 'react';
import { Customer } from '../../../types';
import CustomSelect from '../../shared/ui/CustomSelect';

interface UserFormProps {
  user?: Customer | null;
  onSave: (user: Customer) => void;
  onCancel: () => void;
}

export default function UserForm({ user, onSave, onCancel }: UserFormProps) {
  const [formData, setFormData] = useState<Partial<Customer>>(user || {});

  useEffect(() => {
    setFormData(user || {});
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData as Customer);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl p-6 w-full max-w-md space-y-4 animate-scale-up">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-800">
            {user ? 'Edit User' : 'Create User'}
          </h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-500 uppercase mb-1">Username</label>
              <input
                type="text"
                name="username"
                required
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
                value={formData.username || ''}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-slate-500 uppercase mb-1">Name</label>
              <input
                type="text"
                name="name"
                required
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
                value={formData.name || ''}
                onChange={handleChange}
              />
            </div>
          </div>
          <div>
            <label className="block text-slate-500 uppercase mb-1">Email</label>
            <input
              type="email"
              name="email"
              required
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
              value={formData.email || ''}
              onChange={handleChange}
            />
          </div>
          {!user && (
            <div>
              <label className="block text-slate-500 uppercase mb-1">Password</label>
              <input
                type="password"
                name="password"
                required
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
                onChange={handleChange}
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-500 uppercase mb-1">Phone</label>
              <input
                type="text"
                name="phone"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
                value={formData.phone || ''}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-slate-500 uppercase mb-1">Address</label>
              <input
                type="text"
                name="address"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
                value={formData.address || ''}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-500 uppercase mb-1">Role</label>
              <CustomSelect
                value={formData.role || 'member'}
                onChange={value => setFormData(prev => ({ ...prev, role: value as any }))}
                options={[
                  { value: 'member', label: 'Member' },
                  { value: 'seller', label: 'Seller' },
                  { value: 'admin', label: 'Admin' },
                ]}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-slate-500 uppercase mb-1">Status</label>
              <CustomSelect
                value={formData.status || 'active'}
                onChange={value => setFormData(prev => ({ ...prev, status: value as any }))}
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'blocked', label: 'Blocked' },
                  { value: 'deleted', label: 'Deleted' },
                ]}
                className="w-full"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 text-xs">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm cursor-pointer"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


