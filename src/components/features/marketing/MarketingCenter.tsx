import React, { useState } from 'react';
import { 
  Tag, Plus, Percent, Mail, Target, ArrowUpRight, TrendingUp, Sparkles, 
  Trash2, Play, Users, Calendar, AlertCircle, ShieldCheck, ChevronDown
} from 'lucide-react';
import { MarketingCampaign } from '../../../types';
import CustomSelect from '../../shared/ui/CustomSelect';

interface MarketingCenterProps {
  campaigns: MarketingCampaign[];
  onAddCampaign: (campaign: MarketingCampaign) => void;
  onDeleteCampaign: (id: string) => void;
}

export default function MarketingCenter({ campaigns, onAddCampaign, onDeleteCampaign }: MarketingCenterProps) {
  const [activeTab, setActiveTab] = useState<'campaigns' | 'coupons'>('campaigns');
  
  // Coupon state
  const [coupons, setCoupons] = useState([
    { code: 'SUMMERACTIVE30', discount: 'Giảm 30%', status: 'Active', clicks: 840, usage: '240 lượt dùng' },
    { code: 'EARBUDSNEW', discount: 'Giảm $20', status: 'Active', clicks: 1200, usage: '410 lượt dùng' },
    { code: 'YOGAZEN15', discount: 'Giảm 15%', status: 'Active', clicks: 310, usage: '92 lượt dùng' }
  ]);
  const [newCode, setNewCode] = useState('');
  const [newDiscount, setNewDiscount] = useState('');

  // New Campaign Form state
  const [showForm, setShowForm] = useState(false);
  const [campName, setCampName] = useState('');
  const [campType, setCampType] = useState<'coupon' | 'flash_sale' | 'email' | 'push_notification' | 'affiliate'>('email');
  const [campBudget, setCampBudget] = useState(1000);

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!campName.trim()) return;

    const newCamp: MarketingCampaign = {
      id: `cmp_${Date.now()}`,
      name: campName,
      type: campType,
      status: 'active',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      clicks: 0,
      conversions: 0,
      revenue: 0,
      budget: campBudget,
      roiPredicted: parseFloat((3 + Math.random() * 5).toFixed(1)),
      aiSuggestions: [
        `Chiến lược đề xuất: Triển khai thông báo đẩy tự động hóa cá nhân dành riêng cho nhóm mua sắm đồ thể thao để tăng tỷ lệ chốt đơn nhanh.`,
        `Theo dõi chặt chẽ mức tồn kho; khuyến nghị lượng phân bổ bán tối đa đạt 200 đơn vị.`
      ]
    };

    onAddCampaign(newCamp);
    setCampName('');
    setShowForm(false);
  };

  const handleAddCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newDiscount.trim()) return;

    setCoupons([
      { code: newCode.toUpperCase().replace(/\s+/g, ''), discount: newDiscount, status: 'Active', clicks: 0, usage: '0 lượt dùng' },
      ...coupons
    ]);
    setNewCode('');
    setNewDiscount('');
  };

  const handleDeleteCoupon = (code: string) => {
    setCoupons(coupons.filter(c => c.code !== code));
  };

  // Helper type translation
  const translateType = (type: string) => {
    switch (type) {
      case 'email': return 'Email Tiếp Thị';
      case 'flash_sale': return 'Flash Sale';
      case 'coupon': return 'Mã Giảm Giá';
      case 'push_notification': return 'Thông Báo Đẩy';
      case 'affiliate': return 'Đối Tác Tiếp Thị';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub tabs */}
      <div className="flex border-b border-slate-200 bg-white px-6 py-1 rounded-xl shadow-xs shrink-0">
        <button
          onClick={() => setActiveTab('campaigns')}
          className={`py-3 text-sm font-bold border-b-2 px-1 mr-6 transition-all ${
            activeTab === 'campaigns' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Chiến dịch Marketing Đa kênh
        </button>
        <button
          onClick={() => setActiveTab('coupons')}
          className={`py-3 text-sm font-bold border-b-2 px-1 flex items-center gap-1.5 transition-all ${
            activeTab === 'coupons' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Percent className="w-4.5 h-4.5 text-indigo-600" />
          Mã khuyến mãi & Giảm giá Flash
        </button>
      </div>

      {activeTab === 'campaigns' && (
        <div className="space-y-6 animate-fade-in">
          {/* Header & Add Button */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Chiến dịch Đa kênh Đang hoạt động</h2>
              <p className="text-xs text-slate-400 mt-0.5">Đánh giá hiệu suất khuyến mãi, ngân sách đã phân bổ và lợi suất ROI dự đoán từ AI.</p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Tạo chiến dịch
            </button>
          </div>

          {/* New Campaign Form */}
          {showForm && (
            <form onSubmit={handleCreateCampaign} className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-md space-y-4 animate-slide-down">
              <h3 className="text-sm font-bold text-slate-800">Bắt đầu Chiến dịch Marketing Mới</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Tên chiến dịch</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Đại Tiệc Công Nghệ Mùa Đông"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
                    value={campName}
                    onChange={(e) => setCampName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Kênh tiếp thị</label>
                  <CustomSelect
                    value={campType}
                    onChange={(val) => setCampType(val as any)}
                    options={[
                      { value: 'email', label: 'Gửi Email Hàng Loạt' },
                      { value: 'flash_sale', label: 'Trang Sự Kiện Flash Sale' },
                      { value: 'coupon', label: 'Mã Giảm Giá Ưu Đãi' },
                      { value: 'push_notification', label: 'Thông Báo Đẩy Ứng Dụng' },
                      { value: 'affiliate', label: 'Tiếp Thị Liên Kết (Affiliate)' }
                    ]}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Ngân sách ($)</label>
                  <input
                    type="number"
                    min={100}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
                    value={campBudget}
                    onChange={(e) => setCampBudget(parseInt(e.target.value) || 100)}
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end text-xs">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm"
                >
                  Kích hoạt ngay
                </button>
              </div>
            </form>
          )}

          {/* Campaigns Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {campaigns.map(camp => (
              <div key={camp.id} className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col justify-between">
                {/* Upper block */}
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="inline-block px-2.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wide rounded-sm border border-blue-100">
                      {translateType(camp.type)}
                    </span>
                    <span className="text-xs text-slate-400 font-mono font-medium">ROI: {camp.roiPredicted}x</span>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-sm leading-snug">{camp.name}</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-mono">Thời gian: {camp.startDate} đến {camp.endDate}</p>
                  </div>

                  {/* Summary performance stats */}
                  <div className="grid grid-cols-2 gap-2 text-center text-xs border-y border-slate-100 py-3">
                    <div>
                      <span className="block text-[9px] font-bold text-slate-400 uppercase">Lượt nhấp</span>
                      <span className="font-extrabold text-slate-800 block mt-1">{camp.clicks.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] font-bold text-slate-400 uppercase">Lượt chuyển đổi</span>
                      <span className="font-extrabold text-slate-800 block mt-1">{camp.conversions.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* AI Suggestions Box */}
                  <div className="space-y-2">
                    <span className="text-[9px] font-bold text-amber-800 uppercase flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Gợi ý Tối ưu từ AI
                    </span>
                    <ul className="text-[11px] text-slate-500 space-y-1.5 list-disc pl-3.5">
                      {camp.aiSuggestions.map((sug, i) => (
                        <li key={i}>{sug}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Footer block */}
                <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-medium">Ngân sách: ${camp.budget.toLocaleString()}</span>
                  <button 
                    onClick={() => onDeleteCampaign(camp.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'coupons' && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Mã giảm giá & Khuyến mãi hiện hoạt</h2>
            <p className="text-xs text-slate-400 mt-0.5">Quản lý và thiết lập mã giảm giá áp dụng trực tiếp khi khách hàng thanh toán.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Create Coupon Card */}
            <form onSubmit={handleAddCoupon} className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4 lg:col-span-1">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-indigo-500" />
                Thêm mã khuyến mãi
              </h3>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Mã giảm giá (Không khoảng trắng)</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: LETSGO50"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Mức giảm giá</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: 20% hoặc $15 OFF"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500"
                  value={newDiscount}
                  onChange={(e) => setNewDiscount(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
              >
                Tạo mã ưu đãi
              </button>
            </form>

            {/* Coupons list table */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden lg:col-span-2">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase">
                    <th className="px-5 py-3">Mã ưu đãi</th>
                    <th className="px-5 py-3">Giá trị giảm</th>
                    <th className="px-5 py-3 text-right">Lượt click</th>
                    <th className="px-5 py-3 text-right">Số lần sử dụng</th>
                    <th className="px-5 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {coupons.map((c, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3 font-mono font-bold text-indigo-700">{c.code}</td>
                      <td className="px-5 py-3 font-semibold text-slate-800">{c.discount}</td>
                      <td className="px-5 py-3 text-right font-mono font-semibold text-slate-500">{c.clicks}</td>
                      <td className="px-5 py-3 text-right text-slate-500 font-semibold">{c.usage}</td>
                      <td className="px-5 py-3 text-right">
                        <button 
                          onClick={() => handleDeleteCoupon(c.code)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


