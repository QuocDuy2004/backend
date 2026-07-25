import { useState, type Dispatch, type SetStateAction } from 'react';
import { Plus, Search, Shield, Trash2, UserCheck, UserX, Users } from 'lucide-react';
import type { Customer } from '../../../types';
import { CustomSelect } from '../../shared';

type CustomersPageProps = {
  filteredUsers: Customer[];
  custSearch: string;
  setCustSearch: Dispatch<SetStateAction<string>>;
  custTierFilter: string;
  setCustTierFilter: Dispatch<SetStateAction<string>>;
  onOpenNewUser: () => void;
  onSelectCustomer: (customer: Customer) => void;
  onEditUser: (customer: Customer) => void;
  onDeleteUser: (userId: string) => void;
  onBulkUpdateUsers: (userIds: string[], status: NonNullable<Customer['status']>) => Promise<void>;
  onBulkDeleteUsers: (userIds: string[]) => Promise<boolean>;
  onToggleCustomerStatus: (customer: Customer) => void;
};

type CustomerWithDateFields = Customer & {
  createdAt?: string;
  created_at?: string;
};

const formatCustomerDate = (user: Customer) => {
  const record = user as CustomerWithDateFields;
  const rawDate = record.joinedDate || record.createdAt || record.created_at;
  if (!rawDate) return '--';

  const date = new Date(rawDate);
  return Number.isNaN(date.getTime()) ? '--' : date.toLocaleDateString('vi-VN');
};

export function CustomersPage({
  filteredUsers,
  custSearch,
  setCustSearch,
  custTierFilter,
  setCustTierFilter,
  onOpenNewUser,
  onSelectCustomer: setActiveCustomer,
  onBulkUpdateUsers,
  onBulkDeleteUsers,
  onToggleCustomerStatus,
}: CustomersPageProps) {
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  const activeCount = filteredUsers.filter(user => user.status === 'active').length;
  const blockedCount = filteredUsers.filter(user => user.status === 'blocked').length;
  const adminCount = filteredUsers.filter(user => user.role === 'admin').length;
  const visibleCustomerIds = filteredUsers.map(user => user.id);
  const allVisibleSelected = visibleCustomerIds.length > 0 && visibleCustomerIds.every(id => selectedCustomerIds.includes(id));

  const handleToggleAllVisible = (checked: boolean) => {
    if (checked) {
      setSelectedCustomerIds(prev => Array.from(new Set([...prev, ...visibleCustomerIds])));
      return;
    }
    setSelectedCustomerIds(prev => prev.filter(id => !visibleCustomerIds.includes(id)));
  };

  const handleToggleCustomer = (id: string, checked: boolean) => {
    setSelectedCustomerIds(prev => checked ? [...prev, id] : prev.filter(selectedId => selectedId !== id));
  };

  const handleBulkStatus = async (status: NonNullable<Customer['status']>) => {
    await onBulkUpdateUsers(selectedCustomerIds, status);
    setSelectedCustomerIds([]);
  };

  const handleBulkDelete = async () => {
    const didDelete = await onBulkDeleteUsers(selectedCustomerIds);
    if (didDelete) {
      setSelectedCustomerIds([]);
    }
  };

  return (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col justify-between gap-4 p-5 border bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-transparent rounded-2xl border-blue-100/60 md:flex-row md:items-center">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <h2 className="text-base font-extrabold text-slate-900">Quản Lý Khách Hàng & Tài Khoản</h2>
                </div>
                <p className="text-xs leading-relaxed text-slate-500">
                  Quản lý hồ sơ khách hàng, vai trò truy cập, trạng thái tài khoản và lịch sử mua hàng liên quan.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: 'Tổng tài khoản', value: filteredUsers.length.toLocaleString('vi-VN'), icon: Users, tone: 'border-blue-100 bg-blue-50 text-blue-700' },
                { label: 'Đang hoạt động', value: activeCount.toLocaleString('vi-VN'), icon: UserCheck, tone: 'border-emerald-100 bg-emerald-50 text-emerald-700' },
                { label: 'Quản trị viên', value: adminCount.toLocaleString('vi-VN'), icon: Shield, tone: 'border-indigo-100 bg-indigo-50 text-indigo-700' },
                { label: 'Tài khoản bị khóa', value: blockedCount.toLocaleString('vi-VN'), icon: UserX, tone: 'border-amber-100 bg-amber-50 text-amber-700' },
              ].map(item => (
                <div key={item.label} className="flex min-h-[92px] items-center justify-between rounded-lg border border-slate-200 bg-white px-5 py-4 shadow-sm">
                  <div>
                    <p className="text-[10px] font-semibold text-[#64748B] uppercase block">{item.label}</p>
                    <p className="text-xl font-bold text-[#0F172A] mt-1.5 block">{item.value}</p>
                  </div>
                  <div className={`flex h-11 w-11 items-center justify-center rounded-lg border ${item.tone}`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3.5 rounded-lg border border-slate-200 bg-white p-3 shadow-sm lg:flex-row lg:items-center lg:justify-between">
              <div className="flex h-10 w-full items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3 shadow-sm lg:max-w-[440px]">
                <Search className="h-[18px] w-[18px] text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm khách hàng theo tên, email..."
                  className="w-full text-xs font-medium bg-transparent outline-none text-slate-800 placeholder:text-slate-400"
                  value={custSearch}
                  onChange={(e) => setCustSearch(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap items-center justify-end w-full gap-2 lg:w-auto">
                <CustomSelect
                  value={custTierFilter}
                  onChange={setCustTierFilter}
                  options={[
                    { value: 'All', label: 'Tất cả vai trò' },
                    { value: 'admin', label: 'Admin' },
                    { value: 'seller', label: 'Seller' },
                    { value: 'member', label: 'Member' },
                  ]}
                  icon={<Users className="w-3.5 h-3.5" />}
                />
                <button
                  onClick={() => onOpenNewUser()}
                  className="flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-blue-600 px-4 text-xs font-extrabold text-white shadow-sm transition hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" /> Thêm khách hàng
                </button>
              </div>
            </div>

            {selectedCustomerIds.length > 0 && (
              <div className="flex flex-col gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3.5 text-xs font-semibold text-blue-900 animate-slide-down sm:flex-row sm:items-center sm:justify-between">
                <span>Đã chọn {selectedCustomerIds.length} khách hàng. Chọn thao tác:</span>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => handleBulkStatus('active')} className="px-3 py-1 text-white bg-blue-600 rounded hover:bg-blue-700">Kích hoạt</button>
                  <button onClick={() => handleBulkStatus('blocked')} className="px-3 py-1 rounded bg-slate-800 text-slate-100 hover:bg-slate-700">Khóa</button>
                  <button onClick={() => setSelectedCustomerIds([])} className="px-3 py-1 text-blue-700 bg-white border border-blue-200 rounded hover:bg-blue-100">Bỏ chọn</button>
                  <button onClick={handleBulkDelete} className="flex items-center gap-1.5 rounded bg-rose-600 px-3 py-1 text-white hover:bg-rose-700">
                    <Trash2 className="h-3.5 w-3.5" /> Xóa đã chọn
                  </button>
                </div>
              </div>
            )}

            <div className="hidden overflow-x-auto bg-white border shadow-sm rounded-xl border-slate-200/80 md:block">
              <table className="min-w-[1180px] w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase text-slate-400">
                    <th className="w-10 px-5 py-3.5">
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        onChange={(e) => handleToggleAllVisible(e.target.checked)}
                        className="text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-5 py-3.5">Khách hàng</th>
                    <th className="px-5 py-3.5">Vai trò</th>
                    <th className="px-5 py-3.5 text-center">Số đơn</th>
                    <th className="px-5 py-3.5">Ngày tạo</th>
                    <th className="px-5 py-3.5 text-center">Trạng thái</th>
                    <th className="px-5 py-3.5 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-slate-100">
                  {filteredUsers.map(user => {
                    const isChecked = selectedCustomerIds.includes(user.id);
                    return (
                    <tr key={user.id} className="transition-colors cursor-pointer hover:bg-blue-50/35" onClick={() => setActiveCustomer(user)}>
                      <td className="w-10 px-5 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => handleToggleCustomer(user.id, e.target.checked)}
                          className="text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center max-w-full gap-3 text-left">
                          <div className="flex items-center justify-center w-8 h-8 font-extrabold text-blue-700 bg-blue-100 rounded-full shrink-0">
                            {user.name?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <div className="min-w-0">
                            <span className="block font-extrabold truncate text-slate-800">{user.name}</span>
                            <span className="mt-0.5 block truncate font-mono text-[10px] text-slate-400">{user.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 font-bold capitalize text-slate-500">{user.role}</td>
                      <td className="px-5 py-3 font-bold text-center text-slate-700">{user.ordersCount || 0}</td>
                      <td className="px-5 py-3 font-mono text-[10px] font-bold text-slate-500">{formatCustomerDate(user)}</td>
                      <td className="px-5 py-3 text-center">
                        <span className={`inline-block rounded-full border px-3 py-1 text-[10px] font-extrabold uppercase ${
                          user.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-50 text-slate-500 border-slate-200'
                        }`}>
                          {user.status === 'active' ? 'Hoạt động' : user.status || '---'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onToggleCustomerStatus(user)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            user.status === 'active' ? 'bg-emerald-500' : 'bg-slate-200'
                          }`}
                          title={user.status === 'active' ? 'Ngưng hoạt động' : 'Kích hoạt'}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                              user.status === 'active' ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </td>
                    </tr>
                    );
                  })}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-12 text-sm text-center text-slate-400">
                        Không tìm thấy khách hàng nào.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 gap-3 md:hidden">
              {filteredUsers.map(user => {
                const isChecked = selectedCustomerIds.includes(user.id);
                return (
                <div key={user.id} className="p-4 transition-all bg-white border shadow-sm cursor-pointer rounded-xl border-slate-200 hover:border-slate-300" onClick={() => setActiveCustomer(user)}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center min-w-0 gap-3 text-left">
                      <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => handleToggleCustomer(user.id, e.target.checked)}
                          className="text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex items-center justify-center w-10 h-10 font-extrabold text-blue-700 bg-blue-100 rounded-full shrink-0">
                        {user.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-extrabold truncate text-slate-900">{user.name}</p>
                        <p className="truncate font-mono text-[10px] text-slate-400">{user.email}</p>
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase ${
                      user.status === 'active'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 bg-slate-50 text-slate-500'
                    }`}>
                      {user.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3 mt-4 text-xs border-t border-slate-100">
                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-400">Vai trò</p>
                      <p className="mt-1 font-bold capitalize text-slate-700">{user.role}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase text-slate-400">Ngày tạo</p>
                      <p className="mt-1 font-bold text-slate-700">{formatCustomerDate(user)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase text-slate-400">Số đơn</p>
                      <p className="mt-1 font-bold text-slate-700">{user.ordersCount || 0}</p>
                    </div>
                  </div>

                  <div className="flex justify-end mt-4" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onToggleCustomerStatus(user)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        user.status === 'active' ? 'bg-emerald-500' : 'bg-slate-200'
                      }`}
                      title={user.status === 'active' ? 'Ngưng hoạt động' : 'Kích hoạt'}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          user.status === 'active' ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
                );
              })}
              {filteredUsers.length === 0 && (
                <div className="p-8 text-sm text-center bg-white border shadow-sm rounded-xl border-slate-200 text-slate-400">
                  Không tìm thấy khách hàng nào.
                </div>
              )}
            </div>
          </div>
  );
}

export default CustomersPage;




