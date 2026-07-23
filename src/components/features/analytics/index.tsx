import {
  BarChart, Bar, AreaChart, Area, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  BarChart3, ShoppingBag, Users, ArrowUpRight, ArrowDownRight, AlertTriangle
} from 'lucide-react';
import { Product, Order, Customer, SupportTicket } from '../../../types';
import { formatVnd } from '../../../lib/currency';

interface AnalyticsViewProps {
  products: Product[];
  orders: Order[];
  customers: Customer[];
  tickets: SupportTicket[];
  onNavigate: (section: string) => void;
  onOpenAddProduct: () => void;
}

const formatPercent = (value: number) => Number.isFinite(value) ? value.toFixed(1) : '0.0';
const isSameDay = (date: Date, target: Date) =>
  date.getFullYear() === target.getFullYear() &&
  date.getMonth() === target.getMonth() &&
  date.getDate() === target.getDate();
const isSameMonth = (date: Date, target: Date) =>
  date.getFullYear() === target.getFullYear() && date.getMonth() === target.getMonth();
const getValidDate = (value?: string) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export function AnalyticsView({
  products,
  orders,
  customers,
  onNavigate,
  onOpenAddProduct
}: AnalyticsViewProps) {
  const COLORS = ['#2563EB', '#16A34A', '#F59E0B', '#DC2626'];


  const now = new Date();
  const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const normalizedOrders = orders.map(order => ({
    ...order,
    parsedDate: getValidDate(order.date),
    amount: Number(order.totalAmount ?? order.total ?? 0),
  }));
  const todayOrders = normalizedOrders.filter(order => order.parsedDate && isSameDay(order.parsedDate, now));
  const monthOrders = normalizedOrders.filter(order => order.parsedDate && isSameMonth(order.parsedDate, now));
  const previousMonthOrders = normalizedOrders.filter(order => order.parsedDate && isSameMonth(order.parsedDate, previousMonth));
  const deliveredOrders = normalizedOrders.filter(order => order.status === 'delivered' || order.orderStatus === 'completed' || order.orderStatus === 'delivered');
  const refundedOrders = normalizedOrders.filter(order => order.status === 'refunded' || order.paymentStatus === 'refunded' || order.orderStatus === 'refunded');
  const newCustomersThisMonth = customers.filter(customer => {
    const joinedDate = getValidDate(customer.joinedDate);
    return joinedDate ? isSameMonth(joinedDate, now) : false;
  });
  const revenueToday = todayOrders.reduce((total, order) => total + order.amount, 0);
  const monthlyRevenue = monthOrders.reduce((total, order) => total + order.amount, 0);
  const previousMonthlyRevenue = previousMonthOrders.reduce((total, order) => total + order.amount, 0);
  const monthlyRevenueDelta = previousMonthlyRevenue > 0
    ? ((monthlyRevenue - previousMonthlyRevenue) / previousMonthlyRevenue) * 100
    : monthlyRevenue > 0 ? 100 : 0;
  const orderCompletionRate = normalizedOrders.length > 0 ? (deliveredOrders.length / normalizedOrders.length) * 100 : 0;
  const returnRate = normalizedOrders.length > 0 ? (refundedOrders.length / normalizedOrders.length) * 100 : 0;
  const pendingOrders = normalizedOrders.filter(order => ['pending', 'processing'].includes(order.status));
  const totalSoldItems = normalizedOrders.reduce(
    (total, order) => total + order.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    0
  );
  const actualRevenueTrendData = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now);
    date.setDate(now.getDate() - (6 - index));
    const ordersInDay = normalizedOrders.filter(order => order.parsedDate && isSameDay(order.parsedDate, date));
    return {
      name: date.toLocaleDateString('vi-VN', { weekday: 'short' }),
      revenue: ordersInDay.reduce((total, order) => total + order.amount, 0),
      sales: ordersInDay.length,
    };
  });
  const actualConversionFunnelData = [
    { name: 'Sản phẩm đang bán', value: products.filter(product => product.status === 'active').length },
    { name: 'Sản phẩm đã bán', value: totalSoldItems },
    { name: 'Đơn hàng đã tạo', value: normalizedOrders.length },
    { name: 'Đơn hoàn tất', value: deliveredOrders.length }
  ];
  const actualLowStock = [...products].filter(p => p.inventory < 10).sort((a, b) => a.inventory - b.inventory).slice(0, 3);
  const actualVipCustomers = [...customers].filter(c => c.tier === 'VIP' || c.ordersCount > 0).sort((a, b) => (b.ordersCount || 0) - (a.ordersCount || 0)).slice(0, 3);
  const actualLatestOrders = [...orders].sort((a, b) => (getValidDate(b.date)?.getTime() || 0) - (getValidDate(a.date)?.getTime() || 0)).slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-transparent p-5 rounded-2xl border border-blue-100/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-extrabold text-slate-900">Thống Kê & Báo Cáo Tổng Quan</h2>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">Theo dõi doanh thu, đơn hàng, khách hàng, tồn kho và hiệu suất bán hàng trong hệ thống.</p>
        </div>
      </div>

      <div className="space-y-6">
          {/* KPI Card grid */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            {/* CARD 1 */}
            <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-semibold text-[#64748B] uppercase block">Doanh thu hôm nay</span>
                <span className="text-xl font-bold text-[#0F172A] mt-1.5 block">{formatVnd(revenueToday)}</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-bold mt-2">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>{todayOrders.length} đơn hôm nay</span>
              </div>
            </div>

            {/* CARD 2 */}
            <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-semibold text-[#64748B] uppercase block">Doanh thu tháng này</span>
                <span className="text-xl font-bold text-[#0F172A] mt-1.5 block">{formatVnd(monthlyRevenue)}</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-bold mt-2">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>{monthlyRevenueDelta >= 0 ? '+' : ''}{formatPercent(monthlyRevenueDelta)}% so với tháng trước</span>
              </div>
            </div>

            {/* CARD 3 */}
            <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-semibold text-[#64748B] uppercase block">Tổng đơn hàng</span>
                <span className="text-xl font-bold text-[#0F172A] mt-1.5 block">{normalizedOrders.length}</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-bold mt-2">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>{pendingOrders.length} đơn đang xử lý</span>
              </div>
            </div>

            {/* CARD 4 */}
            <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-semibold text-[#64748B] uppercase block">Khách hàng mới</span>
                <span className="text-xl font-bold text-[#0F172A] mt-1.5 block">{newCustomersThisMonth.length}</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-bold mt-2">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>{customers.length} tổng tài khoản</span>
              </div>
            </div>

            {/* CARD 5 */}
            <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-semibold text-[#64748B] uppercase block">Tỷ lệ hoàn tất đơn</span>
                <span className="text-xl font-bold text-[#0F172A] mt-1.5 block">{formatPercent(orderCompletionRate)}%</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-amber-600 font-bold mt-2">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>{deliveredOrders.length} đơn hoàn tất</span>
              </div>
            </div>

            {/* CARD 6 */}
            <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-semibold text-[#64748B] uppercase block">Tỷ lệ hoàn hàng</span>
                <span className="text-xl font-bold text-[#0F172A] mt-1.5 block">{formatPercent(returnRate)}%</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-bold mt-2">
                <ArrowDownRight className="w-3.5 h-3.5" />
                <span>{refundedOrders.length} đơn hoàn tiền</span>
              </div>
            </div>
          </div>


          {/* Main Core Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Area Chart: Revenue trends */}
            <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-sm lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A]">Theo dõi hiệu suất doanh thu</h3>
                  <p className="text-xs text-[#64748B] mt-0.5">Thống kê giá trị giao dịch ròng trong ngày</p>
                </div>
                <div className="flex items-center gap-4 text-xs font-bold text-[#64748B]">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]"></span> Doanh thu gộp (đ)</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-300"></span> Số lượng đơn</span>
                </div>
              </div>
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={actualRevenueTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0.01}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
                    <Area type="monotone" dataKey="revenue" name="Doanh thu" stroke="#2563EB" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bar Chart: Sales conversion funnel */}
            <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">Phễu chuyển đổi thanh toán</h3>
                <p className="text-xs text-[#64748B] mt-0.5">Số liệu theo sản phẩm đang bán, số lượng bán ra và đơn hoàn tất</p>
              </div>
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={actualConversionFunnelData} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                    <XAxis type="number" stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis dataKey="name" type="category" stroke="#0F172A" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
                    <Bar dataKey="value" name="Số lượng" fill="#2563EB" radius={[0, 6, 6, 0]} barSize={20}>
                      {actualConversionFunnelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Widgets Grid: Low Stock, Best Sellers, VIPs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Low stock panel */}
            <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-1.5">
                  <AlertTriangle className="w-4.5 h-4.5 text-amber-500" />
                  Cảnh báo tồn kho thấp
                </h3>
                <button onClick={() => onNavigate('products')} className="text-xs font-bold text-[#2563EB] hover:underline">Quản lý</button>
              </div>

              <div className="space-y-3.5">
                {actualLowStock.map(p => (
                  <div key={p.id} className="flex items-center justify-between text-xs font-medium">
                    <div>
                      <span className="font-bold text-slate-800 block truncate max-w-[150px]">{p.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">{p.sku}</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold border border-rose-200">
                      Còn {p.inventory} cái
                    </span>
                  </div>
                ))}
                {actualLowStock.length === 0 && (
                  <p className="text-xs text-slate-400 italic text-center py-4">Tồn kho ở mức an toàn.</p>
                )}
              </div>
            </div>

            {/* VIP Customers */}
            <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-1.5">
                  <Users className="w-4.5 h-4.5 text-[#2563EB]" />
                  Khách hàng VIP mua nhiều
                </h3>
                <button onClick={() => onNavigate('customers')} className="text-xs font-bold text-[#2563EB] hover:underline">Xem hết</button>
              </div>

              <div className="space-y-3">
                {actualVipCustomers.map(c => (
                  <div key={c.id} className="flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-800 block">{c.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono block truncate max-w-[150px]">{c.email}</span>
                    </div>
                    <span className="font-extrabold text-slate-900">{c.ordersCount || 0} đơn</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent transactions timeline */}
            <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-1.5">
                  <ShoppingBag className="w-4.5 h-4.5 text-[#2563EB]" />
                  Đơn hàng mới nhất
                </h3>
                <button onClick={() => onNavigate('orders')} className="text-xs font-bold text-[#2563EB] hover:underline">Duyệt nhanh</button>
              </div>

              <div className="space-y-3">
                {actualLatestOrders.map(o => (
                  <div key={o.id} className="flex items-center justify-between text-xs font-medium">
                    <div>
                      <span className="font-bold text-slate-800 block">{o.id} - {o.customerName}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{new Date(o.date).toLocaleDateString()}</span>
                    </div>
                    <span className="font-extrabold text-emerald-600">{formatVnd(o.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
      </div>
    </div>
  );
}

export default AnalyticsView;

