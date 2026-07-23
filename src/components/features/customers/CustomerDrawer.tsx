import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, TrendingUp, AlertTriangle, Mail, Phone, Calendar, User, MessageSquare, Edit3, Trash2, Check, History, MapPin } from 'lucide-react';
import { Customer, SupportTicket } from '../../../types';
import CustomSelect from '../../shared/ui/CustomSelect';
import { usersApi, type EntityChangeLog } from '../../../lib/api';

interface CustomerDrawerProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  tickets: SupportTicket[];
  onSave?: (customer: Customer) => void;
  onDelete?: (customerId: string) => void;
}

export default function CustomerDrawer({ customer, isOpen, onClose, tickets, onSave, onDelete }: CustomerDrawerProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'history'>('profile');

  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedEmail, setEditedEmail] = useState('');
  const [editedPhone, setEditedPhone] = useState('');
  const [editedAddress, setEditedAddress] = useState('');
  const [editedRole, setEditedRole] = useState<Customer['role']>('member');
  const [editedStatus, setEditedStatus] = useState<NonNullable<Customer['status']>>('active');
  const [changeLogs, setChangeLogs] = useState<EntityChangeLog[]>([]);
  const [changeLogsLoading, setChangeLogsLoading] = useState(false);
  const [changeLogsError, setChangeLogsError] = useState('');
  
  // Delete confirm state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (customer) {
      setEditedName(customer.name);
      setEditedEmail(customer.email);
      setEditedPhone(customer.phone || '');
      setEditedAddress(customer.address || '');
      setEditedRole(customer.role || 'member');
      setEditedStatus(customer.status || 'active');
      setIsEditing(false);
      setShowDeleteConfirm(false);
    }
  }, [customer]);

  useEffect(() => {
    if (!customer || activeTab !== 'history') return;

    setChangeLogsLoading(true);
    setChangeLogsError('');
    usersApi.changeLogs(customer.id)
      .then((data) => setChangeLogs(data.logs || []))
      .catch((error: any) => setChangeLogsError(error.message || 'Không thể tải nhật ký thay đổi.'))
      .finally(() => setChangeLogsLoading(false));
  }, [activeTab, customer?.id, customer?.updatedAt]);

  if (!isOpen || !customer) return null;

  // Filter support tickets related to this customer email
  const customerTickets = tickets.filter(t => t.customerEmail.toLowerCase() === customer.email.toLowerCase());

  const actionLabels: Record<EntityChangeLog['action'], string> = {
    create: 'Tạo mới',
    update: 'Cập nhật',
    delete: 'Xóa',
  };
  const roleLabels: Record<Customer['role'], string> = {
    admin: 'Quản trị viên',
    seller: 'Người bán',
    member: 'Khách hàng',
  };
  const statusLabels: Record<NonNullable<Customer['status']>, string> = {
    active: 'Hoạt động',
    blocked: 'Bị khóa',
    deleted: 'Đã xóa',
  };
  const joinedDate = customer.joinedDate || customer.createdAt || '';
  const updatedDate = customer.updatedAt || '';
  const formatDateTime = (value?: string) => {
    if (!value) return '---';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString('vi-VN', { hour12: false });
  };

  const handleSave = () => {
    if (!editedName.trim()) {
      alert('Tên khách hàng không được để trống!');
      return;
    }
    if (!editedEmail.trim()) {
      alert('Email không được để trống!');
      return;
    }

    if (onSave) {
      onSave({
        ...customer,
        name: editedName.trim(),
        email: editedEmail.trim(),
        phone: editedPhone.trim(),
        address: editedAddress.trim(),
        role: editedRole,
        status: editedStatus,
      });
    }
    setIsEditing(false);
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (onDelete) {
      onDelete(customer.id);
    }
    onClose();
  };

  return createPortal(
    <div id="customer-drawer-overlay" className="fixed inset-0 z-[100] flex justify-end overflow-hidden bg-slate-900/30 backdrop-blur-xs transition-opacity duration-200">
      <div className="hidden flex-1 md:block" onClick={onClose}></div>

      <div className="flex h-[100dvh] max-h-[100dvh] min-h-0 w-full max-w-xl flex-col overflow-hidden border-l border-slate-200 bg-white shadow-2xl animate-slide-left">
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 bg-slate-50/50 px-4 py-3 sm:items-center sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-center gap-3">
            {customer.image ? (
              <img referrerPolicy="no-referrer" src={customer.image} alt={customer.name} className="w-11 h-11 rounded-full object-cover border border-slate-200" />
            ) : (
              <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-base">
                {customer.name[0]}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <h2 className="max-w-[120px] truncate text-base font-medium normal-case text-slate-900 min-[390px]:max-w-[160px] sm:max-w-xs">{isEditing ? editedName : customer.name}</h2>
                <span className="px-2 py-0.5 rounded-sm bg-blue-50 text-blue-700 text-[10px] font-medium normal-case">{roleLabels[isEditing ? editedRole : customer.role] || customer.role}</span>
              </div>
              <span className="block max-w-[140px] truncate text-xs font-normal normal-case text-slate-400 min-[390px]:max-w-[190px] sm:max-w-xs">{isEditing ? editedEmail : customer.email}</span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {!isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-1 text-xs font-bold"
                  title="Sửa thông tin"
                >
                  <Edit3 className="w-4 h-4" />
                  <span className="hidden sm:inline">Sửa</span>
                </button>
                <button
                  onClick={handleDeleteClick}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-1 text-xs font-bold"
                  title="Xóa tài khoản"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Xóa</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  Lưu
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                >
                  Hủy
                </button>
              </>
            )}
            <div className="w-px h-6 bg-slate-200 mx-1"></div>
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex shrink-0 overflow-x-auto border-b border-slate-100 bg-white px-4 sm:px-6">
          <button
            onClick={() => { setActiveTab('profile'); setIsEditing(false); }}
            className={`mr-5 shrink-0 border-b-2 px-1 py-3 text-sm font-medium transition-all sm:mr-6 ${
              activeTab === 'profile' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Thông tin khách hàng
          </button>
          <button
            onClick={() => { setActiveTab('history'); setIsEditing(false); }}
            className={`mr-5 flex shrink-0 items-center gap-1.5 border-b-2 px-1 py-3 text-sm font-medium transition-all sm:mr-6 ${
              activeTab === 'history' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            Nhật ký thay đổi ({changeLogs.length})
          </button>
        </div>

        {/* Scrollable Core Details */}
        <div className="relative min-h-0 flex-1 space-y-6 overflow-y-auto p-4 sm:p-6">
          
          {/* Double-confirmation modal overlay */}
          {showDeleteConfirm && (
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-6 animate-fade-in">
              <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-slate-200 shadow-2xl space-y-4">
                <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="text-center space-y-1.5">
                  <h4 className="text-sm font-bold text-slate-900">Xác nhận xóa tài khoản khách hàng?</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Hành động này sẽ xóa vĩnh viễn tài khoản của <strong>{customer.name}</strong> ra khỏi hệ thống OmniShop. Dữ liệu lịch sử mua hàng liên quan có thể bị ảnh hưởng và không thể khôi phục.
                  </p>
                </div>
                <div className="flex gap-2.5 pt-1">
                  <button
                    onClick={handleConfirmDelete}
                    className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                  >
                    Xóa vĩnh viễn
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                  >
                    Hủy bỏ
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            isEditing ? (
              <div className="space-y-5 animate-fade-in">
                <div className="bg-slate-50/50 p-4.5 rounded-xl border border-slate-200/60 space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-slate-700 uppercase mb-3 flex items-center gap-1.5">
                      <User className="w-4 h-4 text-blue-500" />
                      Thông tin hồ sơ liên lạc
                    </h3>
                    <div className="space-y-3.5">
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Họ và tên khách hàng</label>
                        <input
                          type="text"
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white font-semibold shadow-xs"
                          placeholder="Nhập tên..."
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Email liên lạc</label>
                        <input
                          type="email"
                          value={editedEmail}
                          onChange={(e) => setEditedEmail(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white font-mono shadow-xs"
                          placeholder="name@domain.com"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Số điện thoại</label>
                        <input
                          type="text"
                          value={editedPhone}
                          onChange={(e) => setEditedPhone(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white font-mono shadow-xs"
                          placeholder="Số điện thoại..."
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50/50 p-4.5 rounded-xl border border-slate-200/60 space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-slate-700 uppercase mb-3 flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-indigo-500" />
                      Tài khoản & trạng thái
                    </h3>
                    
                    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Vai trò</label>
                        <CustomSelect
                          value={editedRole}
                          onChange={(val) => setEditedRole(val as Customer['role'])}
                          options={[
                            { value: 'member', label: 'Khách hàng' },
                            { value: 'seller', label: 'Người bán' },
                            { value: 'admin', label: 'Quản trị viên' }
                          ]}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Trạng thái</label>
                        <CustomSelect
                          value={editedStatus}
                          onChange={(val) => setEditedStatus(val as NonNullable<Customer['status']>)}
                          options={[
                            { value: 'active', label: 'Hoạt động' },
                            { value: 'blocked', label: 'Bị khóa' },
                            { value: 'deleted', label: 'Đã xóa' }
                          ]}
                          className="w-full"
                        />
                      </div>
                    </div>

                    <div className="mt-3.5">
                      <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Địa chỉ</label>
                      <textarea
                        value={editedAddress}
                        onChange={(e) => setEditedAddress(e.target.value)}
                        rows={3}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white shadow-xs"
                        placeholder="Nhập địa chỉ khách hàng..."
                      />
                    </div>

                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Summary Stats Grid */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase">Tổng số đơn hàng</span>
                    <span className="text-base font-medium normal-case text-slate-800 mt-1 block">{customer.ordersCount} đơn</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase">Vai trò</span>
                    <span className="text-base font-medium normal-case text-slate-800 mt-1 block">{roleLabels[customer.role] || customer.role}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase">Trạng thái</span>
                    <span className="text-base font-medium normal-case text-slate-800 mt-1 block">{statusLabels[customer.status || 'active']}</span>
                  </div>
                </div>

                {/* Personal details */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase">Thông tin liên lạc</h3>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100/80 space-y-3.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2.5">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="font-medium normal-case text-slate-800">{customer.name}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span className="font-normal normal-case">{customer.email}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span>{customer.phone || 'Chưa ghi nhận số điện thoại'}</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <MapPin className="mt-0.5 w-4 h-4 text-slate-400" />
                      <span>{customer.address || 'Chưa ghi nhận địa chỉ'}</span>
                    </div>
                    <div className="flex items-center gap-2.5 border-t border-slate-200/50 pt-2.5">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span>Ngày tham gia hệ thống: {formatDateTime(joinedDate)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase">Thông tin tài khoản</h3>
                  <div className="grid grid-cols-1 gap-2 rounded-xl border border-slate-100/80 bg-slate-50 p-4 text-xs sm:grid-cols-2">
                    <div className="rounded-lg bg-white p-3 border border-slate-100">
                      <span className="block text-[10px] font-bold uppercase text-slate-400">Mã khách hàng</span>
                      <span className="mt-1 block font-mono font-semibold text-slate-800">{customer.id}</span>
                    </div>
                    <div className="rounded-lg bg-white p-3 border border-slate-100">
                      <span className="block text-[10px] font-bold uppercase text-slate-400">Tên đăng nhập</span>
                      <span className="mt-1 block font-semibold text-slate-800">{customer.username || '---'}</span>
                    </div>
                    <div className="rounded-lg bg-white p-3 border border-slate-100">
                      <span className="block text-[10px] font-bold uppercase text-slate-400">Ngày tạo</span>
                      <span className="mt-1 block font-mono font-semibold text-slate-800">{formatDateTime(customer.createdAt)}</span>
                    </div>
                    <div className="rounded-lg bg-white p-3 border border-slate-100">
                      <span className="block text-[10px] font-bold uppercase text-slate-400">Cập nhật cuối</span>
                      <span className="mt-1 block font-mono font-semibold text-slate-800">{formatDateTime(updatedDate)}</span>
                    </div>
                  </div>
                </div>

                {/* Related Tickets */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase">Yêu cầu hỗ trợ đang hoạt động</h3>
                  <div className="space-y-2">
                    {customerTickets.map((t, i) => (
                      <div key={i} className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          <MessageSquare className="w-4.5 h-4.5 text-slate-400" />
                          <div>
                            <div className="font-medium normal-case text-slate-800">{t.id} - {t.intent}</div>
                            <p className="text-slate-400 truncate max-w-xs mt-0.5">{t.lastMessage}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium normal-case ${
                          t.status === 'solved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {t.status === 'solved' ? 'Đã xử lý' : t.status === 'pending' ? 'Đang chờ' : 'Đang mở'}
                        </span>
                      </div>
                    ))}
                    {customerTickets.length === 0 && (
                      <div className="py-6 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs">
                        Không có yêu cầu hỗ trợ nào. Lịch sử hỗ trợ sạch sẽ.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-slate-600 mb-2">
                <History className="w-5 h-5 text-blue-600" />
                <h4 className="text-sm font-bold text-slate-800">Nhật ký thay đổi</h4>
              </div>

              <div className="relative border-l-2 border-slate-100 pl-4 ml-2 space-y-6">
                {changeLogsLoading && (
                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs font-semibold text-slate-400">
                    Đang tải nhật ký thay đổi...
                  </div>
                )}

                {changeLogsError && (
                  <div className="rounded-lg border border-rose-100 bg-rose-50 p-3 text-xs font-semibold text-rose-600">
                    {changeLogsError}
                  </div>
                )}

                {!changeLogsLoading && !changeLogsError && changeLogs.map((log) => (
                  <div key={log.id} className="relative">
                    <span className={`absolute -left-[25px] top-1 w-3 h-3 rounded-full border-2 border-white ring-4 ${
                      log.action === 'create'
                        ? 'bg-emerald-500 ring-emerald-50'
                        : log.action === 'delete'
                        ? 'bg-rose-500 ring-rose-50'
                        : 'bg-blue-500 ring-blue-50'
                    }`}></span>
                    <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                      <div className="flex items-center justify-between gap-3 text-xs font-medium normal-case text-slate-800">
                        <span>{actionLabels[log.action]} khách hàng</span>
                        <span className="text-slate-400 font-normal">{formatDateTime(log.createdAt)}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{log.summary}</p>
                      <span className="block text-[10px] text-slate-400 font-semibold mt-2 uppercase tracking-wide">Người sửa đổi: {log.actorName || 'Quản trị viên'}</span>
                    </div>
                  </div>
                ))}

                {!changeLogsLoading && !changeLogsError && changeLogs.length === 0 && (
                  <div className="relative">
                    <span className="absolute -left-[25px] top-1 w-3 h-3 rounded-full bg-slate-300 border-2 border-white ring-4 ring-slate-50"></span>
                    <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                      <p className="text-xs text-slate-500">Chưa có nhật ký thay đổi trong database.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 text-center text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Đóng Hồ Sơ Khách Hàng
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}



