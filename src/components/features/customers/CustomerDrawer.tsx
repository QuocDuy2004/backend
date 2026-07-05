import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles, TrendingUp, AlertTriangle, ShieldCheck, Mail, Phone, Calendar, User, ShoppingBag, MessageSquare, Edit3, Trash2, Check, RefreshCw, ChevronDown } from 'lucide-react';
import { Customer, SupportTicket } from '../../../types';
import CustomSelect from '../../shared/ui/CustomSelect';

interface CustomerDrawerProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  tickets: SupportTicket[];
  onSave?: (customer: Customer) => void;
  onDelete?: (customerId: string) => void;
}

export default function CustomerDrawer({ customer, isOpen, onClose, tickets, onSave, onDelete }: CustomerDrawerProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'journey' | 'ai'>('profile');

  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedEmail, setEditedEmail] = useState('');
  const [editedPhone, setEditedPhone] = useState('');
  const [editedTier, setEditedTier] = useState<'VIP' | 'Regular' | 'New' | 'Loyal'>('Regular');
  const [editedChurnRisk, setEditedChurnRisk] = useState<'low' | 'medium' | 'high'>('low');
  
  // Delete confirm state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (customer) {
      setEditedName(customer.name);
      setEditedEmail(customer.email);
      setEditedPhone(customer.phone || '');
      setEditedTier(customer.tier);
      setEditedChurnRisk(customer.churnRisk);
      setIsEditing(false);
      setShowDeleteConfirm(false);
    }
  }, [customer]);

  if (!isOpen || !customer) return null;

  // Filter support tickets related to this customer email
  const customerTickets = tickets.filter(t => t.customerEmail.toLowerCase() === customer.email.toLowerCase());

  const riskLabel = {
    low: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: ShieldCheck, text: 'Rủi ro rời bỏ Thấp' },
    medium: { bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: AlertTriangle, text: 'Rủi ro rời bỏ Trung bình' },
    high: { bg: 'bg-rose-50 text-rose-700 border-rose-200', icon: AlertTriangle, text: 'Rủi ro rời bỏ Cao' }
  };

  const currentRisk = riskLabel[isEditing ? editedChurnRisk : customer.churnRisk] || riskLabel.low;
  const RiskIcon = currentRisk.icon;

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
        tier: editedTier,
        churnRisk: editedChurnRisk,
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
                <h2 className="max-w-[120px] truncate text-base font-bold text-slate-900 min-[390px]:max-w-[160px] sm:max-w-xs">{isEditing ? editedName : customer.name}</h2>
                <span className="px-2 py-0.5 rounded-sm bg-blue-50 text-blue-700 text-[10px] font-bold uppercase">{isEditing ? editedTier : customer.tier} Tier</span>
              </div>
              <span className="block max-w-[140px] truncate text-xs font-mono text-slate-400 min-[390px]:max-w-[190px] sm:max-w-xs">{isEditing ? editedEmail : customer.email}</span>
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
            Hồ sơ khách hàng 360°
          </button>
          <button
            onClick={() => { setActiveTab('journey'); setIsEditing(false); }}
            className={`mr-5 shrink-0 border-b-2 px-1 py-3 text-sm font-medium transition-all sm:mr-6 ${
              activeTab === 'journey' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Hành trình trải nghiệm
          </button>
          <button
            onClick={() => { setActiveTab('ai'); setIsEditing(false); }}
            className={`flex shrink-0 items-center gap-1.5 border-b-2 px-1 py-3 text-sm font-medium transition-all ${
              activeTab === 'ai' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            Dự báo thông minh AI
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
                      Thông số hoạt động & Phân loại
                    </h3>
                    
                    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Phân khúc (Tier)</label>
                        <CustomSelect
                          value={editedTier}
                          onChange={(val) => setEditedTier(val as any)}
                          options={[
                            { value: 'VIP', label: 'VIP' },
                            { value: 'Loyal', label: 'Loyal (Thành viên Thân thiết)' },
                            { value: 'Regular', label: 'Regular (Thành viên Thường)' },
                            { value: 'New', label: 'New (Khách hàng Mới)' }
                          ]}
                          className="w-full"
                        />
                      </div>

                    </div>

                    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 mt-3.5">
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Rủi ro rời bỏ</label>
                        <CustomSelect
                          value={editedChurnRisk}
                          onChange={(val) => setEditedChurnRisk(val as any)}
                          options={[
                            { value: 'low', label: 'Thấp (Low Churn Risk)' },
                            { value: 'medium', label: 'Trung bình (Medium Risk)' },
                            { value: 'high', label: 'Cao (Critical Churn Risk)' }
                          ]}
                          className="w-full"
                        />
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Summary Stats Grid */}
                <div className="grid grid-cols-1 gap-3">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase">Tổng số đơn hàng</span>
                    <span className="text-base font-extrabold text-slate-800 mt-1 block">{customer.ordersCount} đơn</span>
                  </div>
                </div>

                {/* Personal details */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase">Thông tin liên lạc</h3>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100/80 space-y-3.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2.5">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="font-semibold text-slate-800">{customer.name}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span className="font-medium font-mono">{customer.email}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span>{customer.phone || 'Chưa ghi nhận số điện thoại'}</span>
                    </div>
                    <div className="flex items-center gap-2.5 border-t border-slate-200/50 pt-2.5">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span>Ngày tham gia hệ thống: {customer.joinedDate}</span>
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
                            <div className="font-bold text-slate-800">{t.id} - {t.intent}</div>
                            <p className="text-slate-400 truncate max-w-xs mt-0.5">{t.lastMessage}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          t.status === 'solved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {t.status.toUpperCase()}
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

          {activeTab === 'journey' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase">Lịch sử tương tác và gắn kết</h3>
              <div className="relative border-l-2 border-slate-100 pl-4 ml-2.5 space-y-6">
                {customer.journey?.map((j, i) => (
                  <div key={i} className="relative text-xs">
                    <span className="absolute -left-[24.5px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-white ring-4 ring-blue-50"></span>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{j.event}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{j.date}</span>
                    </div>
                    <span className="inline-block mt-0.5 px-2 py-0.5 bg-slate-100 text-slate-500 font-medium rounded-sm text-[10px]">
                      {j.channel}
                    </span>
                    <p className="text-slate-500 mt-1 leading-relaxed">{j.details}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-5">
              {/* Risk scores */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-700 font-semibold text-xs uppercase tracking-wide">
                    <TrendingUp className="w-4 h-4 text-slate-400" />
                    Chỉ số rủi ro khách hàng rời bỏ
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 border ${currentRisk.bg}`}>
                    <RiskIcon className="w-3.5 h-3.5" />
                    {currentRisk.text}
                  </span>
                </div>

                {/* Score bar */}
                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                    <span>Khả năng tái mua hàng</span>
                    <span className="font-bold text-slate-800">{(customer.repurchaseProbability * 100).toFixed(0)}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
                      style={{ width: `${customer.repurchaseProbability * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Recommenders */}
              <div className="p-4 rounded-xl bg-amber-50/40 border border-amber-100/80 space-y-3.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <h4 className="text-sm font-bold text-amber-950">Gợi ý bán thêm cá nhân hóa bằng AI</h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Mô hình AI dự đoán sản phẩm khách hàng quan tâm dựa trên danh mục yêu thích (<strong>{customer.preferredCategories?.join(', ')}</strong>):
                </p>

                <div className="space-y-2">
                  {customer.upsellOpportunities?.map((item, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-lg border border-slate-100 text-xs font-bold text-slate-700 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-slate-400" />
                        {item}
                      </div>
                      <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">AI đề xuất</span>
                    </div>
                  ))}
                  {(!customer.upsellOpportunities || customer.upsellOpportunities.length === 0) && (
                    <p className="text-xs text-slate-400 italic">Chưa có đề xuất bán thêm nào.</p>
                  )}
                </div>
              </div>

              {/* Category tags */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-slate-400 uppercase">Danh mục sản phẩm ưa thích</h4>
                <div className="flex flex-wrap gap-1.5">
                  {customer.preferredCategories?.map((cat, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold">
                      {cat}
                    </span>
                  ))}
                </div>
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



