import React, { useMemo, useState } from 'react';
import { CheckSquare, Mail, Send, Square } from 'lucide-react';
import { Customer, MarketingCampaign } from '../../../types';
import { ApiError, marketingApi } from '../../../lib/api';

interface MarketingCenterProps {
  campaigns: MarketingCampaign[];
  onAddCampaign: (campaign: MarketingCampaign) => void;
  onDeleteCampaign: (id: string) => void;
  customers?: Customer[];
}

export function MarketingCenter({ customers = [] }: MarketingCenterProps) {
  const [sendToAll, setSendToAll] = useState(true);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [manualEmails, setManualEmails] = useState('');
  const [emailSubject, setEmailSubject] = useState('Ưu đãi đặc biệt dành cho bạn');
  const [emailContent, setEmailContent] = useState('');
  const [emailStatus, setEmailStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const customerEmails = useMemo(
    () => Array.from(new Set(customers.map((customer) => customer.email?.trim()).filter(Boolean) as string[])),
    [customers]
  );

  const selectedRecipientCount = sendToAll ? customerEmails.length : selectedEmails.length;

  const toggleEmail = (email: string) => {
    setSelectedEmails((prev) => (
      prev.includes(email)
        ? prev.filter((item) => item !== email)
        : [...prev, email]
    ));
  };

  const toggleAll = () => {
    setSendToAll((prev) => !prev);
    if (!sendToAll) setSelectedEmails([]);
  };

  const handleSendPromotionalEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailStatus(null);
    setIsSendingEmail(true);

    try {
      const recipients = [
        ...(sendToAll ? customerEmails : selectedEmails),
        manualEmails,
      ].filter(Boolean).join('\n');

      const result = await marketingApi.sendPromotionalEmail({
        recipients,
        subject: emailSubject,
        content: emailContent,
      });

      setEmailStatus({
        type: 'success',
        message: `Đã gửi email quảng cáo đến ${result.sent}/${result.recipients} địa chỉ hợp lệ.`,
      });
    } catch (error) {
      const message = error instanceof ApiError || error instanceof Error
        ? error.message
        : 'Không thể gửi email quảng cáo.';
      setEmailStatus({ type: 'error', message });
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <form onSubmit={handleSendPromotionalEmail} className="space-y-6 animate-fade-in">
      <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-transparent p-5 rounded-2xl border border-blue-100/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-extrabold text-slate-900">Quảng Cáo Qua Mail</h2>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">Gửi chương trình khuyến mãi đến email khách hàng bằng cấu hình SMTP đã lưu tại /settings.</p>
        </div>
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700">
          {selectedRecipientCount} email khách hàng được chọn
        </div>
      </div>

      {emailStatus && (
        <div className={`rounded-lg border px-4 py-3 text-xs font-semibold ${
          emailStatus.type === 'success'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
            : 'border-rose-200 bg-rose-50 text-rose-700'
        }`}>
          {emailStatus.message}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">
        <section className="xl:col-span-2 bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Chọn email nhận</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Có thể gửi tất cả hoặc chọn từng khách hàng.</p>
            </div>
            <button
              type="button"
              onClick={toggleAll}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-1.5"
            >
              {sendToAll ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4" />}
              Tất cả
            </button>
          </div>

          <div className="max-h-[390px] overflow-y-auto divide-y divide-slate-100">
            {customerEmails.length === 0 ? (
              <div className="p-5 text-xs text-slate-400">Chưa có email khách hàng trong database.</div>
            ) : (
              customerEmails.map((email) => {
                const checked = sendToAll || selectedEmails.includes(email);
                return (
                  <label key={email} className="flex items-center gap-3 px-5 py-3 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={sendToAll}
                      onChange={() => toggleEmail(email)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-600 disabled:opacity-50"
                    />
                    <span className="font-semibold truncate">{email}</span>
                  </label>
                );
              })
            )}
          </div>

          <div className="p-5 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Email nhập thêm</label>
            <textarea
              rows={4}
              placeholder="Mỗi dòng một email, hoặc phân tách bằng dấu phẩy"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
              value={manualEmails}
              onChange={(e) => setManualEmails(e.target.value)}
            />
          </div>
        </section>

        <section className="xl:col-span-3 bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-800">Nội dung quảng cáo</h3>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Tiêu đề email</label>
            <input
              type="text"
              required
              placeholder="Ưu đãi đặc biệt cuối tuần"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-emerald-500"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Nội dung chương trình khuyến mãi</label>
            <textarea
              required
              rows={13}
              placeholder={'Nhập nội dung email tại đây...\nVí dụ: Giảm 20% toàn bộ sản phẩm trong 48 giờ, miễn phí vận chuyển cho đơn từ 500.000đ.'}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
              value={emailContent}
              onChange={(e) => setEmailContent(e.target.value)}
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSendingEmail}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Send className="w-4 h-4" />
              {isSendingEmail ? 'Đang gửi...' : 'Gửi quảng cáo'}
            </button>
          </div>
        </section>
      </div>
    </form>
  );
}

export default MarketingCenter;
