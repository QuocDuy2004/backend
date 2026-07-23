import React, { useState, useEffect, useRef } from 'react';
import { Search, Command, ShoppingBag, Users, AlertTriangle, MessageSquare, Tag, BarChart3, Settings, Star, PanelsTopLeft } from 'lucide-react';
import { formatVnd } from '../../lib/currency';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (section: string) => void;
  products: any[];
  orders: any[];
  onSelectProduct: (product: any) => void;
  onSelectOrder: (order: any) => void;
}

export default function CommandPalette({
  isOpen,
  onClose,
  onNavigate,
  products,
  orders,
  onSelectProduct,
  onSelectOrder
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sections = [
    { name: 'Bảng điều khiển chính', id: 'dashboard', icon: BarChart3 },
    { name: 'Quản lý sản phẩm', id: 'products', icon: ShoppingBag },
    { name: 'Danh sách đơn hàng', id: 'orders', icon: Tag },
    { name: 'Hồ sơ khách hàng', id: 'customers', icon: Users },
    { name: 'Đánh giá khách hàng', id: 'reviews', icon: Star },
    { name: 'Quản lý banner', id: 'banners', icon: PanelsTopLeft },
    { name: 'Vận hành Hỗ trợ AI', id: 'support', icon: MessageSquare },
    { name: 'Trung tâm Marketing', id: 'marketing', icon: Tag },
    { name: 'Cài đặt hệ thống', id: 'settings', icon: Settings }
  ];

  const filteredSections = sections.filter(s =>
    s.name.toLowerCase().includes(query.toLowerCase())
  );

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.sku.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 3);

  const filteredOrders = orders.filter(o =>
    o.id.toLowerCase().includes(query.toLowerCase()) ||
    o.customerName.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 3);

  const totalItemsCount = filteredSections.length + filteredProducts.length + filteredOrders.length;

  const handleSelect = (index: number) => {
    if (index < filteredSections.length) {
      onNavigate(filteredSections[index].id);
      onClose();
    } else if (index < filteredSections.length + filteredProducts.length) {
      const prodIndex = index - filteredSections.length;
      onSelectProduct(filteredProducts[prodIndex]);
      onClose();
    } else {
      const orderIndex = index - filteredSections.length - filteredProducts.length;
      onSelectOrder(filteredOrders[orderIndex]);
      onClose();
    }
    setQuery('');
  };

  const onInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % totalItemsCount);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + totalItemsCount) % totalItemsCount);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (totalItemsCount > 0) {
        handleSelect(selectedIndex);
      }
    }
  };

  return (
    <div id="command-palette-overlay" className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] bg-slate-900/40 backdrop-blur-xs transition-opacity duration-200">
      <div 
        ref={containerRef}
        className="w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl border border-slate-200 ring-1 ring-black/5 flex flex-col max-h-[500px]"
      >
        <div className="flex items-center px-4 py-3 border-b border-slate-100 bg-slate-50">
          <Search className="w-5 h-5 text-slate-400 mr-3" />
          <input
            id="cmd-input"
            autoFocus
            type="text"
            className="w-full text-slate-800 placeholder-slate-400 bg-transparent text-base border-none outline-none focus:ring-0 focus:outline-hidden"
            placeholder="Nhập lệnh điều hướng, tên sản phẩm, mã SKU hoặc mã đơn hàng..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={onInputKeyDown}
          />
          <div className="flex items-center gap-1.5 ml-2">
            <kbd className="px-1.5 py-0.5 text-[10px] font-medium text-slate-500 bg-white border border-slate-200 rounded-sm shadow-xs font-mono">ESC</kbd>
          </div>
        </div>

        <div className="overflow-y-auto p-2 flex-1">
          {totalItemsCount === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              <Command className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-1" />
              Không tìm thấy kết quả nào phù hợp cho "{query}"
            </div>
          ) : (
            <div className="space-y-4">
              {/* Commands Section */}
              {filteredSections.length > 0 && (
                <div>
                  <h3 className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase">Lệnh điều hướng nhanh</h3>
                  <div className="space-y-0.5">
                    {filteredSections.map((sect, i) => {
                      const isAct = selectedIndex === i;
                      const Icon = sect.icon;
                      return (
                        <button
                          key={sect.id}
                          onClick={() => {
                            onNavigate(sect.id);
                            onClose();
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                            isAct ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon className={`w-4.5 h-4.5 ${isAct ? 'text-blue-600' : 'text-slate-400'}`} />
                            <span>Đi tới {sect.name}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold">Chuyển</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Products Search results */}
              {filteredProducts.length > 0 && (
                <div>
                  <h3 className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase">Sản phẩm tìm thấy</h3>
                  <div className="space-y-0.5">
                    {filteredProducts.map((p, idx) => {
                      const globalIdx = filteredSections.length + idx;
                      const isAct = selectedIndex === globalIdx;
                      return (
                        <button
                          key={p.id}
                          onClick={() => {
                            onSelectProduct(p);
                            onClose();
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                            isAct ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <ShoppingBag className={`w-4.5 h-4.5 ${isAct ? 'text-blue-600' : 'text-slate-400'}`} />
                            <div className="truncate min-w-0">
                              <span className="font-medium text-slate-900">{p.name}</span>
                              <span className="text-xs text-slate-400 ml-2 font-mono">{p.sku}</span>
                            </div>
                          </div>
                          <span className="text-xs font-mono font-medium text-slate-500">{formatVnd(p.price)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Orders Search results */}
              {filteredOrders.length > 0 && (
                <div>
                  <h3 className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase">Đơn hàng tìm thấy</h3>
                  <div className="space-y-0.5">
                    {filteredOrders.map((o, idx) => {
                      const globalIdx = filteredSections.length + filteredProducts.length + idx;
                      const isAct = selectedIndex === globalIdx;
                      return (
                        <button
                          key={o.id}
                          onClick={() => {
                            onSelectOrder(o);
                            onClose();
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                            isAct ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Tag className={`w-4.5 h-4.5 ${isAct ? 'text-blue-600' : 'text-slate-400'}`} />
                            <div className="truncate min-w-0">
                              <span className="font-semibold text-slate-950">{o.id}</span>
                              <span className="text-slate-500 ml-2">{o.customerName}</span>
                            </div>
                          </div>
                          <span className="text-xs font-semibold text-emerald-600">{formatVnd(o.total)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


