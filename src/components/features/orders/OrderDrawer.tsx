import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, ShieldAlert, AlertTriangle, HelpCircle, Package, Truck, Clock, RefreshCw, FileText, ChevronDown } from 'lucide-react';
import { Order } from '../../../types';
import CustomSelect from '../../shared/ui/CustomSelect';

interface OrderDrawerProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateOrder: (updatedOrder: Order) => void;
}

export default function OrderDrawer({ order, isOpen, onClose, onUpdateOrder }: OrderDrawerProps) {
  const [internalNotes, setInternalNotes] = useState('');
  const [shippingStatus, setShippingStatus] = useState<'pending' | 'processing' | 'shipping' | 'delivered' | 'refunded' | 'cancelled'>('pending');

  useEffect(() => {
    if (order) {
      setInternalNotes(order.internalNotes || '');
      setShippingStatus(order.status);
    }
  }, [order]);

  if (!isOpen || !order) return null;

  const translateStatus = (status: string) => {
    switch (status) {
      case 'pending': return 'Chờ xử lý';
      case 'processing': return 'Đang đóng gói';
      case 'shipping': return 'Đang vận chuyển';
      case 'delivered': return 'Đã giao hàng';
      case 'refunded': return 'Đã hoàn tiền';
      case 'cancelled': return 'Đã hủy đơn';
      default: return status;
    }
  };

  const handleStatusChange = (newStatus: typeof shippingStatus) => {
    setShippingStatus(newStatus);
    const updatedOrder: Order = {
      ...order,
      status: newStatus,
      timeline: [
        {
          date: new Date().toISOString(),
          status: newStatus,
          title: `Cập nhật trạng thái: ${translateStatus(newStatus)}`,
          description: `Trạng thái vận chuyển đơn hàng được cập nhật thủ công bởi quản trị viên.`
        },
        ...order.timeline
      ]
    };
    onUpdateOrder(updatedOrder);
  };

  const handleSaveNotes = () => {
    const updatedOrder: Order = {
      ...order,
      internalNotes
    };
    onUpdateOrder(updatedOrder);
    alert('Đã cập nhật ghi chú vận hành nội bộ thành công.');
  };

  // Fraud status mapping
  const fraudConfig = {
    low: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'Rủi ro gian lận Thấp' },
    medium: { bg: 'bg-amber-50 text-amber-700 border-amber-200', text: 'Rủi ro Trung bình - Cần kiểm duyệt' },
    high: { bg: 'bg-rose-50 text-rose-700 border-rose-200', text: 'Cảnh báo rủi ro gian lận Cao' }
  };

  const fraudStyle = fraudConfig[order.fraudRisk] || fraudConfig.low;

  return createPortal(
    <div id="order-drawer-overlay" className="fixed inset-0 z-[100] flex justify-end overflow-hidden bg-slate-900/30 backdrop-blur-xs transition-opacity duration-200">
      {/* Backdrop click closer */}
      <div className="hidden flex-1 md:block" onClick={onClose}></div>

      {/* Responsive Slide Drawer Content */}
      <div className="flex h-[100dvh] max-h-[100dvh] min-h-0 w-full max-w-4xl flex-col overflow-hidden border-l border-slate-200 bg-white shadow-2xl animate-slide-left">
        {/* Drawer Header */}
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 bg-slate-50/50 px-4 py-3 sm:items-center sm:px-6 sm:py-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-slate-400 font-mono">{order.id}</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${fraudStyle.bg} border`}>
                {fraudStyle.text} ({order.fraudRiskScore}%)
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5">Hồ Sơ Chi Tiết Đơn Hàng</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AI Copilot Operational Insights Strip */}
        <div className="flex shrink-0 flex-col gap-2 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 text-xs sm:px-6 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-2 text-indigo-950 font-medium">
            <ShieldAlert className="w-4.5 h-4.5 text-indigo-600" />
            <span>AI Đánh giá rủi ro hỗ trợ:</span>
            <span className="text-slate-500 font-normal">
              {order.fraudRisk === 'high' 
                ? 'Phát hiện rủi ro hủy đơn cao. Xác suất hủy đơn dự đoán là 82%.' 
                : 'Chỉ số giao dịch an toàn. Xác suất hủy đơn dự kiến < 5%.'}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-semibold text-slate-500">Rủi ro trễ hạn:</span>
            <span className={`px-2 py-0.5 rounded-full font-bold ${order.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
              {order.status === 'pending' ? 'Dự đoán có thể chậm trễ giao vận 1 ngày' : 'Lộ trình vận chuyển bình thường'}
            </span>
          </div>
        </div>

        {/* 3-Column Responsive Grid Content */}
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 overflow-y-auto p-4 sm:p-6 md:grid-cols-3">
          {/* COLUMN 1: Customer Information, Shipping Address & Timelines */}
          <div className="space-y-6 md:border-r md:border-slate-100 md:pr-2">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Thông tin khách hàng</h3>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100/80 space-y-2.5">
                <div>
                  <span className="block text-[10px] font-semibold text-slate-400 uppercase">Họ và tên</span>
                  <span className="text-sm font-semibold text-slate-800">{order.customerName}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-semibold text-slate-400 uppercase">Địa chỉ Email</span>
                  <span className="text-sm font-medium text-slate-600 break-all">{order.customerEmail}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Địa điểm nhận hàng</h3>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100/80 space-y-1 text-sm text-slate-700">
                <p className="font-medium text-slate-800">{order.shippingAddress.street}</p>
                <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}</p>
                <p className="font-semibold text-slate-400 uppercase text-[10px] mt-1">{order.shippingAddress.country}</p>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Hành trình lịch sử đơn hàng</h3>
              <div className="relative border-l-2 border-slate-100 pl-4 ml-1.5 space-y-4">
                {order.timeline.map((evt, idx) => (
                  <div key={idx} className="relative text-xs">
                    <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-slate-300 border-2 border-white ring-4 ring-slate-100"></span>
                    <div className="font-bold text-slate-700">{evt.title}</div>
                    <div className="text-slate-400 font-mono text-[10px] mt-0.5">{new Date(evt.date).toLocaleString()}</div>
                    <p className="text-slate-500 mt-0.5 leading-relaxed">{evt.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* COLUMN 2: Ordered Items, Quantities & Pricing breakdowns */}
          <div className="space-y-6 md:col-span-1 md:border-r md:border-slate-100 md:pr-2">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Sản phẩm đã mua</h3>
              <div className="space-y-3">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="p-2 bg-white rounded-lg border border-slate-200 shrink-0">
                      <Package className="w-5 h-5 text-slate-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-slate-800 truncate">{item.productName}</h4>
                      <span className="block text-[10px] font-mono text-slate-400 uppercase mt-0.5">{item.sku}</span>
                      <div className="flex items-center justify-between text-xs font-medium text-slate-500 mt-1.5">
                        <span>Số lượng: {item.quantity}</span>
                        <span className="text-slate-700">${item.price.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Chi tiết thanh toán</h3>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Tạm tính</span>
                  <span>${order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Thuế (8%)</span>
                  <span>${order.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Phí giao hàng</span>
                  <span>${order.shipping.toFixed(2)}</span>
                </div>
                <div className="border-t border-slate-200/60 pt-2 flex justify-between text-sm font-extrabold text-slate-900">
                  <span>Tổng tiền thanh toán</span>
                  <span>${order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {order.refundRecommendation && (
              <div className="p-4 rounded-xl bg-orange-50/60 border border-orange-100">
                <h4 className="text-xs font-bold text-orange-950 uppercase flex items-center gap-1.5 mb-1.5">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                  Khuyến nghị hoàn tiền AI
                </h4>
                <p className="text-xs text-orange-900 leading-relaxed font-medium">
                  {order.refundRecommendation}
                </p>
              </div>
            )}
          </div>

          {/* COLUMN 3: Payment, Logistics Actions, Internal Notes */}
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Thanh toán & Vận chuyển</h3>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100/80 space-y-3 text-xs">
                <div>
                  <span className="block text-[10px] font-semibold text-slate-400 uppercase">Kênh thanh toán</span>
                  <span className="text-sm font-semibold text-slate-800">{order.paymentMethod}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-semibold text-slate-400 uppercase">Trạng thái thanh toán</span>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold mt-1 uppercase ${
                    order.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {order.paymentStatus === 'paid' ? 'ĐÃ THANH TOÁN' : 'CHƯA THANH TOÁN'}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-semibold text-slate-400 uppercase mb-1.5">Trạng thái vận đơn</span>
                  <CustomSelect
                    value={shippingStatus}
                    onChange={(val) => handleStatusChange(val as any)}
                    options={[
                      { value: 'pending', label: 'Chờ thanh toán (Pending)' },
                      { value: 'processing', label: 'Đang đóng gói (Processing)' },
                      { value: 'shipping', label: 'Đang vận chuyển (Shipping)' },
                      { value: 'delivered', label: 'Đã giao hàng (Delivered)' },
                      { value: 'refunded', label: 'Đã hoàn tiền (Refunded)' },
                      { value: 'cancelled', label: 'Đã hủy đơn (Cancelled)' }
                    ]}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Ghi chú vận hành nội bộ</h3>
              <div className="space-y-2">
                <textarea
                  rows={4}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-xs text-slate-800 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                  placeholder="Chỉ nhân viên quản trị nội bộ mới có quyền xem các dòng ghi chú này..."
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                />
                <button
                  onClick={handleSaveNotes}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Lưu ghi chú nội bộ
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex gap-3 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 text-center text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Đóng bảng vận hành
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}


