import { useState } from 'react';
import { CreditCard, DollarSign, Download, Layers, Search, ShoppingCart, Truck } from 'lucide-react';
import type { Order } from '../../../types';
import { CustomSelect } from '../../shared';
import { formatVnd } from '../../../lib/currency';

// ─── Props ────────────────────────────────────────────────────────────────────

type OrdersPageProps = {
  orders: Order[];
  onSelectOrder: (order: Order) => void;
  onExportExcel: (orders: Order[]) => void;
};

const formatOrderDateTime = (value: string) =>
  new Date(value).toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

// ─── Component ────────────────────────────────────────────────────────────────

export function OrdersPage({ orders, onSelectOrder, onExportExcel }: OrdersPageProps) {
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // ── Filter logic ──────────────────────────────────────────────────────────

  const filtered = orders.filter(order => {
    const q = search.toLowerCase();
    const matchesSearch =
      order.id.toLowerCase().includes(q) ||
      order.customerName.toLowerCase().includes(q) ||
      order.customerEmail.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'All' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // ── KPI calculations ──────────────────────────────────────────────────────

  const shippingCount = filtered.filter(order => order.status === 'shipping').length;
  const pendingCount = filtered.filter(order => order.status === 'pending').length;
  const totalRevenue = filtered.reduce((total, order) => total + order.total, 0);

  return (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-transparent p-5 rounded-2xl border border-blue-100/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-blue-600" />
                  <h2 className="text-base font-extrabold text-slate-900">Quản Lý Đơn Hàng</h2>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Theo dõi trạng thái xử lý, vận chuyển, thanh toán và rủi ro AI của từng đơn hàng trong hệ thống.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: 'Tổng đơn hàng', value: filtered.length.toLocaleString('vi-VN'), icon: ShoppingCart, tone: 'border-blue-100 bg-blue-50 text-blue-700' },
                { label: 'Doanh thu', value: formatVnd(totalRevenue), icon: DollarSign, tone: 'border-emerald-100 bg-emerald-50 text-emerald-700' },
                { label: 'Đang giao', value: shippingCount.toLocaleString('vi-VN'), icon: Truck, tone: 'border-indigo-100 bg-indigo-50 text-indigo-700' },
                { label: 'Chờ xử lý', value: `${pendingCount} đơn`, icon: CreditCard, tone: 'border-amber-100 bg-amber-50 text-amber-700' },
              ].map(item => (
                <div key={item.label} className="flex min-h-[92px] items-center justify-between rounded-lg border border-slate-200 bg-white px-5 py-4 shadow-sm">
                  <div>
                    <p className="text-[10px] font-semibold text-[#64748B] uppercase block">{item.label}</p>
                    <p className="text-xl font-bold text-[#0F172A] mt-1.5 block">{item.value}</p>
                  </div>
                  <div className={`flex h-11 w-11 items-center justify-center rounded-lg border ${item.tone}`}>
                    <item.icon className="h-5 w-5" />
                  </div>
                </div>
              ))}
            </div>

            {/* Filter segments & search */}
            <div className="flex flex-col items-stretch gap-3.5 rounded-lg border border-slate-200 bg-white p-3 shadow-sm lg:flex-row lg:items-center lg:justify-between">
              <div className="flex h-10 w-full items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3 shadow-xs lg:max-w-[440px]">
                <Search className="w-4.5 h-4.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm đơn hàng theo mã giao dịch, khách hàng..."
                  className="w-full bg-transparent text-xs text-slate-800 outline-none"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="flex w-full flex-wrap items-center justify-end gap-2 lg:w-auto">
                  <CustomSelect
                    value={statusFilter}
                    onChange={setStatusFilter}
                    options={[
                      { value: 'All', label: 'Tất cả trạng thái' },
                      { value: 'pending', label: 'Chờ xử lý (Pending)' },
                      { value: 'processing', label: 'Đang chuẩn bị (Processing)' },
                      { value: 'shipping', label: 'Đang giao hàng (Shipping)' },
                      { value: 'delivered', label: 'Đã hoàn thành (Delivered)' },
                      { value: 'refunded', label: 'Đã hoàn tiền (Refunded)' },
                      { value: 'cancelled', label: 'Đã hủy đơn (Cancelled)' }
                    ]}
                    icon={<Layers className="w-3.5 h-3.5" />}
                  />

                <button
                  onClick={() => onExportExcel(filtered)}
                  className="p-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Xuất nhật ký
                </button>
              </div>
            </div>

            {/* Orders list table */}
            <div className="hidden overflow-x-auto rounded-xl border border-slate-200/80 bg-white shadow-sm md:block">
              <table className="min-w-[1120px] w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase">
                    <th className="px-5 py-3">Mã giao dịch</th>
                    <th className="px-5 py-3">Ngày đặt</th>
                    <th className="px-5 py-3">Khách hàng</th>
                    <th className="px-5 py-3">Danh sách mua</th>
                    <th className="px-5 py-3 text-right">Tổng tiền</th>
                    <th className="px-5 py-3 text-center">Đánh giá rủi ro AI</th>
                    <th className="px-5 py-3 text-center">Vận chuyển</th>
                    <th className="px-5 py-3 text-center">Thanh toán</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filtered.map(order => (
                    <tr key={order.id} className="cursor-pointer transition-colors hover:bg-blue-50/35" onClick={() => onSelectOrder(order)}>
                      <td className="px-5 py-3 font-mono font-bold text-blue-700 hover:underline">{order.id}</td>
                      <td className="px-5 py-3 text-slate-500 font-semibold">{formatOrderDateTime(order.date)}</td>
                      <td className="px-5 py-3">
                        <div className="font-bold text-slate-800">{order.customerName}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{order.customerEmail}</div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="font-medium text-slate-600 truncate max-w-[150px]">
                          {order.items.map(it => `${it.productName} (x${it.quantity})`).join(', ')}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right font-mono font-extrabold text-slate-900">{formatVnd(order.total)}</td>
                      <td className="px-5 py-3 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                          order.fraudRisk === 'high'
                            ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                            : order.fraudRisk === 'medium'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {order.fraudRisk === 'high' ? 'RỦI RO CAO' : order.fraudRisk === 'medium' ? 'TRUNG BÌNH' : 'AN TOÀN'} ({order.fraudRiskScore}%)
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                          order.status === 'delivered'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : order.status === 'shipping'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : order.status === 'refunded'
                            ? 'bg-orange-50 text-orange-700 border-orange-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {order.status === 'pending' ? 'Chờ xử lý' :
                           order.status === 'processing' ? 'Đang đóng gói' :
                           order.status === 'shipping' ? 'Đang vận chuyển' :
                           order.status === 'delivered' ? 'Đã giao' :
                           order.status === 'refunded' ? 'Đã hoàn tiền' : 'Đã hủy'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className={`inline-block px-1.5 py-0.5 rounded-sm text-[9px] font-extrabold uppercase tracking-wide border ${
                          order.paymentStatus === 'paid'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : 'bg-amber-100 text-amber-800 border-amber-200'
                        }`}>
                          {order.paymentStatus === 'paid' ? 'ĐÃ TRẢ' : 'CHƯA TRẢ'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400 text-sm">
                        Không có lịch sử đơn hàng nào khớp với tìm kiếm hiện tại.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Layout for Orders */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
              {filtered.map(order => (
                <div
                  key={order.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-xs hover:border-slate-300 transition-all cursor-pointer"
                  onClick={() => onSelectOrder(order)}
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block uppercase">Mã giao dịch</span>
                      <span className="font-mono font-bold text-blue-700 text-sm hover:underline">{order.id}</span>
                    </div>
                    <span className="text-slate-500 font-semibold text-xs">{formatOrderDateTime(order.date)}</span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-semibold">Khách hàng</span>
                      <div className="font-bold text-slate-800">{order.customerName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{order.customerEmail}</div>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-semibold">Sản phẩm mua</span>
                      <div className="font-medium text-slate-600 truncate max-w-full mt-0.5">
                        {order.items.map(it => `${it.productName} (x${it.quantity})`).join(', ')}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Tổng tiền</span>
                      <span className="font-mono font-extrabold text-[#0F172A] text-sm">{formatVnd(order.total)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Rủi ro AI</span>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border mt-0.5 ${
                        order.fraudRisk === 'high'
                          ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                          : order.fraudRisk === 'medium'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {order.fraudRisk === 'high' ? 'RỦI RO CAO' : order.fraudRisk === 'medium' ? 'TRUNG BÌNH' : 'AN TOÀN'} ({order.fraudRiskScore}%)
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Vận chuyển</span>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border mt-0.5 ${
                        order.status === 'delivered'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : order.status === 'shipping'
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : order.status === 'refunded'
                          ? 'bg-orange-50 text-orange-700 border-orange-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {order.status === 'pending' ? 'Chờ xử lý' :
                         order.status === 'processing' ? 'Đang chuẩn bị' :
                         order.status === 'shipping' ? 'Đang giao' :
                         order.status === 'delivered' ? 'Đã giao' :
                         order.status === 'refunded' ? 'Đã hoàn tiền' : 'Đã hủy'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Thanh toán</span>
                      <span className={`inline-block px-1.5 py-0.5 rounded-sm text-[8px] font-extrabold uppercase tracking-wide border mt-1 ${
                        order.paymentStatus === 'paid'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : 'bg-amber-100 text-amber-800 border-amber-200'
                      }`}>
                        {order.paymentStatus === 'paid' ? 'ĐÃ TRẢ' : 'CHƯA TRẢ'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-sm">
                  Không có lịch sử đơn hàng nào khớp với tìm kiếm hiện tại.
                </div>
              )}
            </div>
          </div>
  );
}

export default OrdersPage;

