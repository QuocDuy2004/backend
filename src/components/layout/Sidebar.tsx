import { useEffect, useState } from 'react';
import {
  BarChart3,
  Box,
  Bell,
  ChevronLeft,
  ChevronRight,
  Command,
  LayoutGrid,
  LogOut,
  Menu,
  MessageSquare,
  Megaphone,
  Omega,
  PanelsTopLeft,
  Search,
  Settings,
  Star,
  Tag,
  Users,
  X,
} from 'lucide-react';

interface SidebarProps {
  currentSection: string;
  onNavigate: (section: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenCommandPalette: () => void;
  onLogout: () => void;
  userEmail?: string;
  userName?: string;
  userRole?: string;
  mobileTitle?: string;
}

const menuItems = [
  { id: 'dashboard', label: 'Trang tổng quan', icon: BarChart3 },
  { id: 'products', label: 'Sản phẩm & Tồn kho', icon: Box },
  { id: 'categories', label: 'Danh mục sản phẩm', icon: LayoutGrid },
  { id: 'orders', label: 'Quản lý đơn hàng', icon: Tag },
  { id: 'customers', label: 'Quản lý khách hàng', icon: Users },
  { id: 'reviews', label: 'Đánh giá khách hàng', icon: Star },
  { id: 'banners', label: 'Quản lý banner', icon: PanelsTopLeft },
  { id: 'marketing', label: 'Chiến dịch Marketing', icon: Megaphone },
  { id: 'support', label: 'Hỗ trợ khách hàng AI', icon: MessageSquare, badge: 'AI' },
  { id: 'settings', label: 'Cấu hình hệ thống', icon: Settings },
];

const navigationItems = menuItems.flatMap((item) =>
  item.id === 'settings' ? [{ id: 'notifications', label: 'Thông báo', icon: Bell }, item] : [item]
);

export default function Sidebar({
  currentSection,
  onNavigate,
  isCollapsed,
  onToggleCollapse,
  onOpenCommandPalette,
  onLogout,
  userEmail = 'admin@omnishop.com',
  userName = 'Quản trị viên',
  userRole = 'admin',
  mobileTitle = 'Bảng điều khiển',
}: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [storeName, setStoreName] = useState('VeloCart');
  const initial = userName
    .split(' ')
    .filter(Boolean)
    .map(part => part[0])
    .join('')
    .slice(0, 3)
    .toUpperCase() || 'A';

  const handleNav = (id: string) => {
    onNavigate(id);
    setMobileOpen(false);
  };

  useEffect(() => {
    let mounted = true;

    const loadStoreName = async () => {
      try {
        const response = await fetch('/api/settings?includeInactive=true');
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) return;

        const data = await response.json();
        const contact = (data.settings || []).find((item: any) => item.settingKey === 'contact_information');
        const nextStoreName = contact?.value?.storeName;

        if (mounted && typeof nextStoreName === 'string' && nextStoreName.trim()) {
          setStoreName(nextStoreName.trim());
        }
      } catch {
        // Keep the schema default while the API is unavailable.
      }
    };

    loadStoreName();
    return () => {
      mounted = false;
    };
  }, []);

  const NavList = ({ mobile = false }: { mobile?: boolean }) => (
    <nav className="space-y-1">
      {navigationItems.map(item => {
        const isActive = currentSection === item.id;
        const Icon = item.icon;

        return (
          <button
            key={item.id}
            onClick={() => handleNav(item.id)}
            title={!mobile && isCollapsed ? item.label : undefined}
            className={[
              'group relative flex w-full items-center justify-between rounded-lg text-left text-xs font-bold transition-all',
              mobile || !isCollapsed ? 'h-10 px-3' : 'h-10 justify-center px-0',
              isActive
                ? 'bg-blue-50 text-blue-600'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950',
              isActive && (mobile || !isCollapsed) ? 'rounded-l-none border-l-4 border-blue-600 pl-2' : '',
            ].join(' ')}
          >
            <span className="flex min-w-0 items-center gap-3">
              <Icon className={`h-[18px] w-[18px] shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-500'}`} />
              {(mobile || !isCollapsed) && <span className="truncate">{item.label}</span>}
            </span>
            {(mobile || !isCollapsed) && item.badge && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold text-amber-700">
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );

  return (
    <>
      <div className="sticky top-0 z-30 flex min-h-16 shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-3 py-2 md:hidden">
        <button onClick={() => setMobileOpen(true)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600">
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
            <Omega className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold leading-5 text-slate-950">{storeName}</p>
            <p className="text-[9px] font-black uppercase text-slate-400">Bản điều khiển</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            onClick={onOpenCommandPalette}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm"
            aria-label="Tìm kiếm"
          >
            <Search className="h-4.5 w-4.5" />
          </button>
          <button
            onClick={() => handleNav('notifications')}
            className="relative hidden h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm min-[390px]:flex"
            aria-label="Thông báo"
          >
            <Bell className="h-4.5 w-4.5" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-rose-600" />
          </button>
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-slate-100 text-[10px] font-black text-slate-700 shadow-sm">
            {initial}
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button className="absolute inset-0 bg-slate-950/35" onClick={() => setMobileOpen(false)} aria-label="Close menu" />
          <aside className="relative flex h-full w-[280px] flex-col bg-white p-5 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
                  <Omega className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-slate-950">{storeName}</p>
                  <p className="text-[9px] font-black uppercase text-slate-400">Bản điều khiển</p>
                </div>
              </div>
              <button onClick={() => setMobileOpen(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <button
              onClick={onOpenCommandPalette}
              className="mb-6 flex h-9 items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-500"
            >
              <span className="flex items-center gap-2">
                <Command className="h-4 w-4" />
                Tìm lệnh nhanh
              </span>
              <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px]">⌘K</kbd>
            </button>

            <div className="min-h-0 flex-1 overflow-y-auto">
              <NavList mobile />
            </div>

            <div className="border-t border-slate-100 pt-4">
              <AccountFooter initial={initial} userEmail={userEmail} userName={userName} onLogout={onLogout} />
            </div>
          </aside>
        </div>
      )}

      <aside
        className={[
          'sticky top-0 hidden h-screen shrink-0 flex-col justify-between border-r border-slate-200 bg-white transition-all duration-300 md:flex',
          isCollapsed ? 'w-20 p-4' : 'w-64 p-5',
        ].join(' ')}
      >
        <div className="space-y-7">
          <div className={`flex border-b border-slate-100 pb-4 ${isCollapsed ? 'flex-col items-center gap-3' : 'items-center justify-between'}`}>
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
                <Omega className="h-5 w-5" />
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold text-slate-950">{storeName}</p>
                  <p className="truncate text-[9px] font-black uppercase text-slate-400">Bản điều khiển</p>
                </div>
              )}
            </div>
            <button onClick={onToggleCollapse} className="rounded-md p-1.5 text-slate-300 hover:bg-slate-50 hover:text-slate-600">
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>

          <button
            onClick={onOpenCommandPalette}
            className={`flex h-9 w-full items-center rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 ${
              isCollapsed ? 'justify-center px-0' : 'justify-between px-3'
            }`}
          >
            <span className="flex min-w-0 items-center gap-2">
              <Command className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span className="truncate">Tìm lệnh nhanh</span>}
            </span>
            {!isCollapsed && <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px]">⌘K</kbd>}
          </button>

          <NavList />
        </div>

        <div className="space-y-4 border-t border-slate-100 pt-4">
          {!isCollapsed && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="mb-2 text-[10px] font-black uppercase text-slate-500">Trạng thái sử dụng AI</p>
              <div className="mb-2 h-1.5 rounded-full bg-slate-200">
                <div className="h-1.5 w-[72%] rounded-full bg-blue-600" />
              </div>
              <p className="text-[10px] font-bold text-slate-950">7,241 / 10,000 yêu cầu</p>
            </div>
          )}
          <AccountFooter
            compact={isCollapsed}
            initial={initial}
            userEmail={userEmail}
            userName={userName}
            onLogout={onLogout}
          />
        </div>
      </aside>
    </>
  );
}

function AccountFooter({
  compact = false,
  initial,
  userEmail,
  userName,
  onLogout,
}: {
  compact?: boolean;
  initial: string;
  userEmail: string;
  userName: string;
  onLogout: () => void;
}) {
  return (
    <div className={`flex items-center gap-3 ${compact ? 'justify-center' : ''}`}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-extrabold text-blue-700">
        {initial}
      </div>
      {!compact && (
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-extrabold text-slate-950">{userName}</p>
          <p className="truncate text-[10px] font-mono text-slate-400">{userEmail}</p>
        </div>
      )}
      <button onClick={onLogout} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600">
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}



