import React, { type FormEvent, useEffect, useMemo, useState } from 'react';
import {
  Archive,
  Bell,
  BellRing,
  CheckCircle2,
  Clock3,
  Inbox,
  Loader2,
  Megaphone,
  RefreshCw,
  Send,
  ShieldCheck,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { AppNotification, Customer } from '../../../types';

type NoticeTab = 'sent' | 'inbox';

type NotificationsViewProps = {
  users: Customer[];
  currentUserId: string;
};

const noticeTypes = [
  { value: 'system', label: 'Hệ thống', icon: ShieldCheck, color: 'text-blue-600 bg-blue-50 border-blue-100' },
  { value: 'promo', label: 'Khuyến mãi', icon: Megaphone, color: 'text-fuchsia-600 bg-fuchsia-50 border-fuchsia-100' },
  { value: 'order', label: 'Đơn hàng', icon: Inbox, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
  { value: 'support', label: 'CSKH', icon: BellRing, color: 'text-amber-600 bg-amber-50 border-amber-100' },
];

const targetPathOptions = [
  { value: '/notifications', label: 'Trang thông báo' },
  { value: '/(tabs)/account', label: 'Tài khoản' },
  { value: '/(tabs)/home', label: 'Trang chủ' },
  { value: '/(tabs)/cart', label: 'Giỏ hàng' },
  { value: '/orders', label: 'Đơn hàng' },
];

function formatDate(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

function getNoticeMeta(type?: string) {
  return noticeTypes.find((item) => item.value === type) || noticeTypes[0];
}

export default function NotificationsView({ users, currentUserId }: NotificationsViewProps) {
  const [tab, setTab] = useState<NoticeTab>('sent');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [inbox, setInbox] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('system');
  const [audience, setAudience] = useState<'all' | 'user'>('all');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [targetPath, setTargetPath] = useState('/notifications');
  const [categorySlug, setCategorySlug] = useState('');

  const activeUsers = useMemo(
    () => users.filter((user) => user.status !== 'blocked' && user.status !== 'deleted'),
    [users]
  );

  const selectedUser = activeUsers.find((user) => user.id === selectedUserId);
  const totalRecipients = audience === 'all' ? activeUsers.length : selectedUserId ? 1 : 0;
  const unreadInboxCount = inbox.filter((item) => !item.isRead).length;
  const totalDelivered = notifications.reduce((sum, item) => sum + (item.recipientCount || 0), 0);
  const totalUnread = notifications.reduce((sum, item) => sum + (item.unreadCount || 0), 0);
  const activeNoticeCount = notifications.filter((item) => item.status !== 'archived').length;
  const list = tab === 'sent' ? notifications : inbox;

  const loadNotifications = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [sentResponse, inboxResponse] = await Promise.all([
        fetch('/api/notifications'),
        currentUserId ? fetch(`/api/notifications?userId=${encodeURIComponent(currentUserId)}`) : Promise.resolve(null),
      ]);

      const sentData = await sentResponse.json();
      if (!sentData.ok) throw new Error(sentData.message || 'Failed to load notifications');
      setNotifications(sentData.notifications || []);

      if (inboxResponse) {
        const inboxData = await inboxResponse.json();
        if (!inboxData.ok) throw new Error(inboxData.message || 'Failed to load inbox');
        setInbox(inboxData.notifications || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [currentUserId]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

    if (!title.trim() || !message.trim()) {
      setError('Nhập tiêu đề và nội dung thông báo.');
      return;
    }

    if (audience === 'user' && !selectedUserId) {
      setError('Chọn user cần nhận thông báo.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          message,
          type,
          audience,
          targetPath,
          targetParams: categorySlug.trim() ? { categorySlug: categorySlug.trim() } : {},
          userIds: audience === 'user' ? [selectedUserId] : [],
        }),
      });
      const data = await response.json();
      if (!data.ok) throw new Error(data.message || 'Failed to create notification');

      setTitle('');
      setMessage('');
      setCategorySlug('');
      setSelectedUserId('');
      setAudience('all');
      await loadNotifications();
    } catch (err: any) {
      setError(err.message || 'Failed to create notification');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchive = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!data.ok) throw new Error(data.message || 'Failed to archive notification');
      await loadNotifications();
    } catch (err: any) {
      setError(err.message || 'Failed to archive notification');
    }
  };

  const handleMarkRead = async (id: string, isRead: boolean) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId, isRead }),
      });
      const data = await response.json();
      if (!data.ok) throw new Error(data.message || 'Failed to update notification');
      await loadNotifications();
    } catch (err: any) {
      setError(err.message || 'Failed to update notification');
    }
  };

  return (
    <section className="space-y-5 font-sans">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[10px] font-semibold uppercase text-blue-700">
            <Bell className="h-3.5 w-3.5" />
            Trung tâm thông báo
          </div>
          <h1 className="text-2xl font-black text-slate-950 md:text-3xl">Quản lý thông báo</h1>
          <p className="mt-1 max-w-3xl text-sm font-medium leading-6 text-slate-500">
            Tạo thông báo cho toàn bộ user hoặc gửi riêng từng tài khoản. Mỗi user có trạng thái đã đọc riêng tại bảng user_notifications.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            onClick={loadNotifications}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-xs font-extrabold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Làm mới
          </button>
          <button
            onClick={() => setTab('inbox')}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-xs font-extrabold text-white shadow-sm transition hover:bg-slate-800"
          >
            <Inbox className="h-4 w-4" />
            Hộp thư của tôi
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
          {error}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Metric icon={Megaphone} label="Thông báo đang hoạt động" value={activeNoticeCount} tone="blue" />
        <Metric icon={Users} label="Lượt nhận đã tạo" value={totalDelivered} tone="emerald" />
        <Metric icon={BellRing} label="Chưa đọc toàn hệ thống" value={totalUnread} tone="amber" />
        <Metric icon={Inbox} label="Chưa đọc của tôi" value={unreadInboxCount} tone="rose" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
        <form onSubmit={handleSubmit} className="self-start rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-black text-slate-950">Soạn thông báo</h2>
              <p className="mt-1 text-xs font-semibold text-slate-500">Dự kiến gửi đến {totalRecipients} người nhận.</p>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Send className="h-4 w-4" />
            </div>
          </div>

          <div className="space-y-4">
            <Field label="Tiêu đề">
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                placeholder="Flash sale cuối tuần"
              />
            </Field>

            <Field label="Nội dung">
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                className="min-h-32 w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium leading-6 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                placeholder="Nhập nội dung hiển thị tại trang /notifications..."
              />
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Loại thông báo">
                <select
                  value={type}
                  onChange={(event) => setType(event.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-bold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                >
                  {noticeTypes.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </Field>

              <Field label="Người nhận">
                <select
                  value={audience}
                  onChange={(event) => setAudience(event.target.value === 'user' ? 'user' : 'all')}
                  className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-bold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                >
                  <option value="all">Tất cả user</option>
                  <option value="user">Một user</option>
                </select>
              </Field>
            </div>

            {audience === 'user' && (
              <Field label="Chọn user">
                <select
                  value={selectedUserId}
                  onChange={(event) => setSelectedUserId(event.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-bold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                >
                  <option value="">Chọn tài khoản</option>
                  {activeUsers.map((user) => (
                    <option key={user.id} value={user.id}>{user.name} - {user.email}</option>
                  ))}
                </select>
                {selectedUser && <p className="mt-1 text-[11px] font-semibold text-slate-500">Sẽ gửi đến {selectedUser.name}.</p>}
              </Field>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Điều hướng">
                <select
                  value={targetPath}
                  onChange={(event) => setTargetPath(event.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-bold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                >
                  {targetPathOptions.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </Field>

              <Field label="Category slug">
                <input
                  value={categorySlug}
                  onChange={(event) => setCategorySlug(event.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                  placeholder="dien-thoai"
                />
              </Field>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-bold uppercase text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Gửi thông báo
            </button>
          </div>
        </form>

        <div className="min-w-0 rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="inline-flex w-full rounded-lg bg-slate-100 p-1 sm:w-auto">
              <TabButton active={tab === 'sent'} onClick={() => setTab('sent')} icon={Megaphone} label="Đã gửi" />
              <TabButton active={tab === 'inbox'} onClick={() => setTab('inbox')} icon={UserRound} label="Hộp thư" />
            </div>
            <div className="flex items-center justify-between gap-3 text-xs font-bold text-slate-500 lg:justify-end">
              <span>{list.length} thông báo</span>
              {isLoading && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {list.map((item) => (
              <React.Fragment key={`${tab}-${item.userNotificationId || item.id}`}>
                <NoticeRow
                  item={item}
                  tab={tab}
                  onArchive={handleArchive}
                  onMarkRead={handleMarkRead}
                />
              </React.Fragment>
            ))}

            {list.length === 0 && (
              <div className="flex min-h-72 flex-col items-center justify-center px-4 py-12 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                  <Bell className="h-5 w-5" />
                </div>
                <p className="text-sm font-black text-slate-950">Chưa có thông báo</p>
                <p className="mt-1 max-w-sm text-xs font-medium leading-5 text-slate-500">
                  Khi tạo thông báo mới, danh sách sẽ được cập nhật tại đây.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase text-[#64748B]">{label}</span>
      {children}
    </label>
  );
}

function NoticeRow({
  item,
  tab,
  onArchive,
  onMarkRead,
}: {
  item: AppNotification;
  tab: NoticeTab;
  onArchive: (id: string) => void;
  onMarkRead: (id: string, isRead: boolean) => void;
}) {
  const meta = getNoticeMeta(item.type);
  const Icon = meta.icon;
  const unreadRatio = item.recipientCount ? Math.round(((item.unreadCount || 0) / item.recipientCount) * 100) : 0;

  return (
    <div className={`p-4 transition hover:bg-slate-50 ${tab === 'inbox' && !item.isRead ? 'bg-blue-50/40' : ''}`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${meta.color}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-black text-slate-950">{item.title}</h3>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase text-slate-600">
                {item.audience === 'user' ? 'Cá nhân' : 'Tất cả'}
              </span>
              {tab === 'inbox' && !item.isRead && (
                <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-black uppercase text-white">Mới</span>
              )}
            </div>
            <p className="mt-1 line-clamp-2 text-xs font-medium leading-5 text-slate-500">{item.message}</p>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-bold text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="h-3.5 w-3.5" />
                {formatDate(tab === 'sent' ? item.createdAt : item.deliveredAt)}
              </span>
              {item.targetPath && <span className="text-blue-600">{item.targetPath}</span>}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 lg:min-w-[220px] lg:justify-end">
          {tab === 'sent' ? (
            <div className="min-w-[112px]">
              <p className="text-right text-[11px] font-black uppercase text-slate-500">Chưa đọc</p>
              <p className="text-right text-sm font-black text-slate-950">
                {item.unreadCount || 0}/{item.recipientCount || 0}
              </p>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-amber-500" style={{ width: `${unreadRatio}%` }} />
              </div>
            </div>
          ) : (
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-black uppercase ${item.isRead ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>
              {item.isRead ? 'Đã đọc' : 'Chưa đọc'}
            </span>
          )}

          {tab === 'sent' ? (
            <button
              onClick={() => onArchive(item.id)}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 text-[11px] font-black text-slate-600 transition hover:bg-slate-100"
            >
              <Archive className="h-3.5 w-3.5" />
              Lưu trữ
            </button>
          ) : (
            <button
              onClick={() => onMarkRead(item.id, !item.isRead)}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 text-[11px] font-black text-slate-600 transition hover:bg-slate-100"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {item.isRead ? 'Chưa đọc' : 'Đã đọc'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value, tone }: { icon: LucideIcon; label: string; value: number; tone: 'blue' | 'emerald' | 'amber' | 'rose' }) {
  const toneClass = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
  }[tone];

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold text-[#64748B] uppercase block">{label}</p>
          <p className="text-xl font-bold text-[#0F172A] mt-1.5 block">{value}</p>
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${toneClass}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-md px-3 text-xs font-black transition sm:flex-none ${
        active ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}




