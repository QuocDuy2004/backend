import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRef } from 'react';
import { BadgePercent, CalendarClock, Eye, Megaphone, Pencil, Plus, Search, ShieldCheck, Sparkles, Trash2, X } from 'lucide-react';
import type { Banner, BannerStatus, Category } from '../../../types';
import { CustomSelect } from '../../shared';

type BannerForm = {
  id?: string;
  categoryId: string;
  tag: string;
  title: string;
  description: string;
  note: string;
  cta: string;
  targetPath: string;
  bgClassName: string;
  chipClassName: string;
  chipTextClassName: string;
  buttonClassName: string;
  buttonTextColor: string;
  iconName: string;
  detailIconName: string;
  detailLabel: string;
  status: BannerStatus;
  sortOrder: number;
  startsAt: string;
  expiresAt: string;
};

const hexColorPattern = /^#[0-9a-f]{6}$/i;

function hslToHex(h: number, s: number, l: number) {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

const colorPalette = Array.from({ length: 12 }, (_, row) =>
  Array.from({ length: 28 }, (_, col) => hslToHex((col / 28) * 360, 0.92, 0.94 - row * 0.07))
);

const normalizeHexColor = (value: string) => {
  const text = value.trim();
  const normalized = text.startsWith('#') ? text : `#${text}`;
  return hexColorPattern.test(normalized) ? normalized.toUpperCase() : '';
};

const isHexColor = (value?: string) => Boolean(value && hexColorPattern.test(value));

function bannerBgClassName(value: string) {
  return isHexColor(value) ? '' : value;
}

function bannerBgStyle(value: string) {
  return isHexColor(value) ? { backgroundColor: value } : undefined;
}

function readableTextColor(hex: string) {
  const normalized = normalizeHexColor(hex);
  if (!normalized) return '#0f172a';
  const r = Number.parseInt(normalized.slice(1, 3), 16);
  const g = Number.parseInt(normalized.slice(3, 5), 16);
  const b = Number.parseInt(normalized.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#0f172a' : '#ffffff';
}

const emptyForm: BannerForm = {
  categoryId: '',
  tag: 'HOT SALE',
  title: '',
  description: '',
  note: '',
  cta: 'Xem ngay',
  targetPath: '/(tabs)/catalog',
  bgClassName: 'bg-amber-700',
  chipClassName: 'bg-amber-300',
  chipTextClassName: 'text-amber-950',
  buttonClassName: 'bg-white',
  buttonTextColor: '#18181b',
  iconName: 'BadgePercent',
  detailIconName: 'ShieldCheck',
  detailLabel: 'Ưu đãi nổi bật',
  status: 'active',
  sortOrder: 0,
  startsAt: '',
  expiresAt: '',
};

const stylePresets = [
  {
    label: 'Amber',
    description: 'Ấm, nổi bật cho khuyến mãi',
    hexColor: '#B45309',
    bgClassName: 'bg-amber-700',
    chipClassName: 'bg-amber-300',
    chipTextClassName: 'text-amber-950',
    buttonClassName: 'bg-white',
    buttonTextColor: '#18181b',
  },
  {
    label: 'Rose',
    description: 'Mạnh, hợp flash sale',
    hexColor: '#BE123C',
    bgClassName: 'bg-rose-700',
    chipClassName: 'bg-rose-200',
    chipTextClassName: 'text-rose-950',
    buttonClassName: 'bg-zinc-950',
    buttonTextColor: '#ffffff',
  },
  {
    label: 'Emerald',
    description: 'Tin cậy, hợp ưu đãi xanh',
    hexColor: '#047857',
    bgClassName: 'bg-emerald-700',
    chipClassName: 'bg-emerald-200',
    chipTextClassName: 'text-emerald-950',
    buttonClassName: 'bg-white',
    buttonTextColor: '#064e3b',
  },
  {
    label: 'Blue',
    description: 'Sạch, hợp banner công nghệ',
    hexColor: '#1D4ED8',
    bgClassName: 'bg-blue-700',
    chipClassName: 'bg-blue-200',
    chipTextClassName: 'text-blue-950',
    buttonClassName: 'bg-white',
    buttonTextColor: '#1d4ed8',
  },
  {
    label: 'Indigo',
    description: 'Đậm, hợp chiến dịch cao cấp',
    hexColor: '#4338CA',
    bgClassName: 'bg-indigo-700',
    chipClassName: 'bg-indigo-200',
    chipTextClassName: 'text-indigo-950',
    buttonClassName: 'bg-white',
    buttonTextColor: '#3730a3',
  },
  {
    label: 'Slate',
    description: 'Trung tính, hợp thông báo',
    hexColor: '#1E293B',
    bgClassName: 'bg-slate-800',
    chipClassName: 'bg-slate-200',
    chipTextClassName: 'text-slate-950',
    buttonClassName: 'bg-white',
    buttonTextColor: '#0f172a',
  },
];

function toInputDate(value?: string) {
  if (!value) return '';
  return value.slice(0, 16);
}

function bannerToForm(banner: Banner): BannerForm {
  return {
    id: banner.id,
    categoryId: banner.categoryId || '',
    tag: banner.tag,
    title: banner.title,
    description: banner.description,
    note: banner.note || '',
    cta: banner.cta,
    targetPath: banner.targetPath,
    bgClassName: banner.bgClassName,
    chipClassName: banner.chipClassName,
    chipTextClassName: banner.chipTextClassName,
    buttonClassName: banner.buttonClassName,
    buttonTextColor: banner.buttonTextColor,
    iconName: banner.iconName,
    detailIconName: banner.detailIconName,
    detailLabel: banner.detailLabel,
    status: banner.status,
    sortOrder: banner.sortOrder,
    startsAt: toInputDate(banner.startsAt),
    expiresAt: toInputDate(banner.expiresAt),
  };
}

function toPayload(form: BannerForm, categories: Category[]) {
  const category = categories.find(item => item.id === form.categoryId);
  return {
    categoryId: form.categoryId || null,
    tag: form.tag,
    title: form.title,
    description: form.description,
    note: form.note || null,
    cta: form.cta,
    targetPath: form.targetPath,
    targetParams: category?.slug ? { categorySlug: category.slug } : {},
    bgClassName: form.bgClassName,
    chipClassName: form.chipClassName,
    chipTextClassName: form.chipTextClassName,
    buttonClassName: form.buttonClassName,
    buttonTextColor: form.buttonTextColor,
    iconName: form.iconName,
    detailIconName: form.detailIconName,
    detailLabel: form.detailLabel,
    status: form.status,
    sortOrder: Number(form.sortOrder || 0),
    startsAt: form.startsAt || null,
    expiresAt: form.expiresAt || null,
  };
}

function statusLabel(status: BannerStatus) {
  if (status === 'active') return 'Đang hiển thị';
  if (status === 'scheduled') return 'Đã lên lịch';
  return 'Tạm ẩn';
}

function statusClassName(status: BannerStatus) {
  if (status === 'active') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'scheduled') return 'border-amber-200 bg-amber-50 text-amber-700';
  return 'border-slate-200 bg-slate-50 text-slate-500';
}

function formatDateTime(value?: string) {
  if (!value) return 'Không giới hạn';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function targetParamsSummary(params: Record<string, unknown>) {
  const entries = Object.entries(params || {});
  if (entries.length === 0) return 'Không có tham số';
  return entries.map(([key, value]) => `${key}: ${String(value)}`).join(' · ');
}

async function readJsonResponse(response: Response) {
  const text = await response.text();
  if (!text.trim()) {
    return { ok: response.ok };
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      ok: false,
      message: response.ok
        ? 'Máy chủ trả dữ liệu không đúng định dạng JSON.'
        : `Máy chủ trả lỗi ${response.status}.`,
    };
  }
}

export default function BannersView({ categories }: { categories: Category[] }) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [form, setForm] = useState<BannerForm>(emptyForm);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | BannerStatus>('all');
  const [selectedBannerIds, setSelectedBannerIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeBanner, setActiveBanner] = useState<Banner | null>(null);
  const [stylePickerBanner, setStylePickerBanner] = useState<Banner | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState<'overview' | 'routing' | 'style'>('overview');
  const [isDetailEditing, setIsDetailEditing] = useState(false);
  const [savingStyleKey, setSavingStyleKey] = useState('');
  const [pendingStyleColor, setPendingStyleColor] = useState('#3ADF00');
  const [recentStyleColors, setRecentStyleColors] = useState<string[]>(['#3ADF00', '#40FF00', '#2EFEC8', '#A901DB', '#81F7BE', '#F7D358']);
  const detailBodyRef = useRef<HTMLDivElement | null>(null);

  const loadBanners = async () => {
    const response = await fetch('/api/banners?includeInactive=true');
    const data = await readJsonResponse(response);
    if (!data.ok) throw new Error(data.message || 'Không tải được danh sách banner.');
    setBanners(Array.isArray(data.banners) ? data.banners : []);
  };

  useEffect(() => {
    loadBanners().catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    if (!stylePickerBanner) return;
    const currentColor = normalizeHexColor(stylePickerBanner.bgClassName);
    const presetColor = stylePresets.find(preset => preset.bgClassName === stylePickerBanner.bgClassName)?.hexColor;
    setPendingStyleColor(currentColor || presetColor || '#3ADF00');
  }, [stylePickerBanner]);

  useEffect(() => {
    if (!isDetailEditing) return;
    detailBodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [isDetailEditing]);

  const filteredBanners = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return banners.filter((banner) => {
      const matchStatus = statusFilter === 'all' || banner.status === statusFilter;
      const matchKeyword =
        !keyword ||
        banner.title.toLowerCase().includes(keyword) ||
        banner.tag.toLowerCase().includes(keyword) ||
        banner.cta.toLowerCase().includes(keyword);
      return matchStatus && matchKeyword;
    });
  }, [banners, search, statusFilter]);

  const visibleBannerIds = filteredBanners.map(banner => banner.id);
  const allVisibleSelected = visibleBannerIds.length > 0 && visibleBannerIds.every(id => selectedBannerIds.includes(id));
  const selectedBanners = banners.filter(banner => selectedBannerIds.includes(banner.id));

  const stats = {
    total: banners.length,
    active: banners.filter(item => item.status === 'active').length,
    scheduled: banners.filter(item => item.status === 'scheduled').length,
    inactive: banners.filter(item => item.status === 'inactive').length,
  };

  const updateForm = <K extends keyof BannerForm>(key: K, value: BannerForm[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setIsSaving(true);

    try {
      const response = await fetch(form.id ? `/api/banners/${form.id}` : '/api/banners', {
        method: form.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toPayload(form, categories)),
      });
      const data = await readJsonResponse(response);
      if (!data.ok) throw new Error(data.message || 'Không lưu được banner.');
      if (!data.banner) throw new Error('Máy chủ chưa trả dữ liệu banner sau khi lưu.');

      setBanners(prev => {
        if (form.id) return prev.map(item => item.id === data.banner.id ? data.banner : item);
        return [data.banner, ...prev];
      });
      if (activeBanner?.id === data.banner.id) {
        setActiveBanner(data.banner);
      }
      setIsFormOpen(false);
      setForm(emptyForm);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (banner: Banner) => {
    if (!window.confirm(`Bạn có chắc muốn xóa banner "${banner.title}"?`)) return;

    try {
      const response = await fetch(`/api/banners/${banner.id}`, { method: 'DELETE' });
      const data = await readJsonResponse(response);
      if (!data.ok) throw new Error(data.message || 'Không xóa được banner.');
      setBanners(prev => prev.filter(item => item.id !== banner.id));
      if (form.id === banner.id) setForm(emptyForm);
      if (activeBanner?.id === banner.id) setActiveBanner(null);
      if (activeBanner?.id === banner.id) setIsDetailEditing(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleQuickStatus = async (banner: Banner) => {
    const response = await fetch(`/api/banners/${banner.id}/toggle`, {
      method: 'PATCH',
    });
    const data = await readJsonResponse(response);
    if (data.ok) {
      if (!data.banner) return;
      setBanners(prev => prev.map(item => item.id === banner.id ? data.banner : item));
      if (activeBanner?.id === banner.id) setActiveBanner(data.banner);
    }
  };

  const toggleBannerSelection = (id: string, checked: boolean) => {
    setSelectedBannerIds(prev => checked ? Array.from(new Set([...prev, id])) : prev.filter(item => item !== id));
  };

  const toggleAllVisibleBanners = (checked: boolean) => {
    setSelectedBannerIds(prev => {
      if (!checked) return prev.filter(id => !visibleBannerIds.includes(id));
      return Array.from(new Set([...prev, ...visibleBannerIds]));
    });
  };

  const handleBulkDelete = async () => {
    if (selectedBanners.length === 0) return;
    if (!window.confirm(`Bạn có chắc muốn xóa ${selectedBanners.length} banner đã chọn?`)) return;

    setError('');
    try {
      await Promise.all(selectedBanners.map(async (banner) => {
        const response = await fetch(`/api/banners/${banner.id}`, { method: 'DELETE' });
        const data = await readJsonResponse(response);
        if (!data.ok) throw new Error(data.message || `Không xóa được banner ${banner.title}.`);
      }));
      const selectedSet = new Set(selectedBannerIds);
      setBanners(prev => prev.filter(item => !selectedSet.has(item.id)));
      if (activeBanner && selectedSet.has(activeBanner.id)) {
        setActiveBanner(null);
        setIsDetailEditing(false);
      }
      if (form.id && selectedSet.has(form.id)) setForm(emptyForm);
      setSelectedBannerIds([]);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleBulkSetActive = async () => {
    if (selectedBanners.length === 0) return;

    setError('');
    try {
      const updated = await Promise.all(selectedBanners.map(async (banner) => {
        const response = await fetch(`/api/banners/${banner.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(toPayload({ ...bannerToForm(banner), status: 'active' }, categories)),
        });
        const data = await readJsonResponse(response);
        if (!data.ok) throw new Error(data.message || `Không kích hoạt được banner ${banner.title}.`);
        if (!data.banner) throw new Error(`Máy chủ chưa trả dữ liệu banner ${banner.title}.`);
        return data.banner as Banner;
      }));
      setBanners(prev => prev.map(item => updated.find(banner => banner.id === item.id) || item));
      if (activeBanner) {
        const refreshed = updated.find(banner => banner.id === activeBanner.id);
        if (refreshed) setActiveBanner(refreshed);
      }
      setSelectedBannerIds([]);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleApplyStylePreset = async (banner: Banner, preset: (typeof stylePresets)[number]) => {
    const styleKey = `${banner.id}-${preset.label}`;
    setError('');
    setSavingStyleKey(styleKey);

    try {
      const payload = toPayload(
        {
          ...bannerToForm(banner),
          bgClassName: preset.bgClassName,
          chipClassName: preset.chipClassName,
          chipTextClassName: preset.chipTextClassName,
          buttonClassName: preset.buttonClassName,
          buttonTextColor: preset.buttonTextColor,
        },
        categories
      );
      const response = await fetch(`/api/banners/${banner.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await readJsonResponse(response);
      if (!data.ok) throw new Error(data.message || 'Không cập nhật được màu banner.');
      if (!data.banner) throw new Error('Máy chủ chưa trả dữ liệu banner sau khi cập nhật màu.');

      setBanners(prev => prev.map(item => item.id === banner.id ? data.banner : item));
      if (activeBanner?.id === banner.id) setActiveBanner(data.banner);
      if (stylePickerBanner?.id === banner.id) setStylePickerBanner(data.banner);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingStyleKey('');
    }
  };

  const handleSaveStyleColor = async () => {
    if (!stylePickerBanner) return;
    const selectedColor = normalizeHexColor(pendingStyleColor);
    if (!selectedColor) {
      setError('Mã màu không hợp lệ. Vui lòng nhập dạng #RRGGBB.');
      return;
    }

    const styleKey = `${stylePickerBanner.id}-custom`;
    setError('');
    setSavingStyleKey(styleKey);

    try {
      const payload = toPayload(
        {
          ...bannerToForm(stylePickerBanner),
          bgClassName: selectedColor,
          chipClassName: 'bg-white/90',
          chipTextClassName: 'text-slate-950',
          buttonClassName: 'bg-white',
          buttonTextColor: readableTextColor(selectedColor),
        },
        categories
      );
      const response = await fetch(`/api/banners/${stylePickerBanner.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await readJsonResponse(response);
      if (!data.ok) throw new Error(data.message || 'Không lưu được màu banner.');
      if (!data.banner) throw new Error('Máy chủ chưa trả dữ liệu banner sau khi lưu màu.');

      setBanners(prev => prev.map(item => item.id === stylePickerBanner.id ? data.banner : item));
      if (activeBanner?.id === stylePickerBanner.id) setActiveBanner(data.banner);
      setRecentStyleColors(prev => [selectedColor, ...prev.filter(color => color !== selectedColor)].slice(0, 8));
      setStylePickerBanner(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingStyleKey('');
    }
  };

  const openDetailEditor = (banner: Banner) => {
    setForm(bannerToForm(banner));
    setActiveDetailTab('overview');
    setIsDetailEditing(true);
    window.setTimeout(() => {
      detailBodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }, 0);
  };

  const handleDetailSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.id) return;
    setError('');
    setIsSaving(true);

    try {
      const response = await fetch(`/api/banners/${form.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toPayload(form, categories)),
      });
      const data = await readJsonResponse(response);
      if (!data.ok) throw new Error(data.message || 'Không lưu được banner.');
      if (!data.banner) throw new Error('Máy chủ chưa trả dữ liệu banner sau khi lưu.');

      setBanners(prev => prev.map(item => item.id === data.banner.id ? data.banner : item));
      setActiveBanner(data.banner);
      setIsDetailEditing(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 rounded-2xl border border-blue-100/60 bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-transparent p-5 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-blue-600" />
            <h2 className="text-base font-extrabold text-slate-900">Quản lý banner trang chủ</h2>
          </div>
          <p className="text-xs leading-relaxed text-slate-500">
            Quản lý banner theo bảng database `banners`: nội dung, CTA, điều hướng Expo, danh mục liên kết, màu giao diện và lịch hiển thị.
          </p>
        </div>
        <button
          onClick={() => {
            setForm(emptyForm);
            setIsFormOpen(true);
          }}
          className="flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> Tạo banner mới
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Tổng banner', value: stats.total, icon: Megaphone, tone: 'border-blue-100 bg-blue-50 text-blue-700' },
          { label: 'Đang hiển thị', value: stats.active, icon: Eye, tone: 'border-emerald-100 bg-emerald-50 text-emerald-700' },
          { label: 'Đã lên lịch', value: stats.scheduled, icon: CalendarClock, tone: 'border-amber-100 bg-amber-50 text-amber-700' },
          { label: 'Tạm ẩn', value: stats.inactive, icon: ShieldCheck, tone: 'border-slate-100 bg-slate-50 text-slate-600' },
        ].map(item => (
          <div key={item.label} className="flex min-h-[92px] items-center justify-between rounded-lg border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <div>
              <p className="block text-[10px] font-semibold uppercase text-[#64748B]">{item.label}</p>
              <p className="mt-1.5 block text-xl font-bold text-[#0F172A]">{item.value.toLocaleString('vi-VN')}</p>
            </div>
            <div className={`flex h-11 w-11 items-center justify-center rounded-lg border ${item.tone}`}>
              <item.icon className="h-5 w-5" />
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm lg:flex-row lg:items-center lg:justify-between">
            <div className="flex h-10 w-full items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3 shadow-xs lg:max-w-[420px]">
              <Search className="h-4.5 w-4.5 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm banner theo tiêu đề, tag hoặc CTA..."
                className="w-full bg-transparent text-xs text-slate-800 outline-none"
              />
            </div>
            <CustomSelect
              value={statusFilter}
              onChange={(value) => setStatusFilter(value as typeof statusFilter)}
              options={[
                { value: 'all', label: 'Tất cả trạng thái' },
                { value: 'active', label: 'Đang hiển thị' },
                { value: 'scheduled', label: 'Đã lên lịch' },
                { value: 'inactive', label: 'Tạm ẩn' },
              ]}
            />
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-[1380px] w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase text-slate-400">
                    <th className="px-4 py-3 w-[240px]">Preview</th>
                    <th className="px-4 py-3">Nội dung banner</th>
                    <th className="px-4 py-3 w-[180px]">Danh mục</th>
                    <th className="px-4 py-3 w-[250px]">Điều hướng</th>
                    <th className="px-4 py-3 w-[210px]">Lịch hiển thị</th>
                    <th className="px-4 py-3 w-[170px]">Style</th>
                    <th className="px-4 py-3 text-center w-[88px]">Thứ tự</th>
                    <th className="px-5 py-3 text-center">Trạng thái</th>
                    <th className="px-5 py-3 text-center w-[110px]">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredBanners.map(banner => (
                    <tr
                      key={banner.id}
                      className="cursor-pointer align-top transition hover:bg-blue-50/35"
                      onClick={() => {
                        setActiveBanner(banner);
                        setActiveDetailTab('overview');
                        setIsDetailEditing(false);
                      }}
                    >
                      <td className="px-4 py-4">
                        <div className={`${bannerBgClassName(banner.bgClassName)} min-h-[118px] overflow-hidden rounded-xl p-3 text-white shadow-sm`} style={bannerBgStyle(banner.bgClassName)}>
                          <div className="flex items-center justify-between gap-2">
                            <span className={`${banner.chipClassName} ${banner.chipTextClassName} max-w-[130px] truncate rounded-full px-2 py-0.5 text-[9px] font-black`}>
                              {banner.tag}
                            </span>
                            <span className="text-[9px] font-black text-white/70">#{banner.sortOrder}</span>
                          </div>
                          <p className="mt-2 line-clamp-2 text-[13px] font-black leading-4">{banner.title}</p>
                          <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-white/75">{banner.description}</p>
                          <div className="mt-3 flex items-center justify-between gap-2">
                            <span
                              className={`${banner.buttonClassName} max-w-[130px] truncate rounded-full px-2.5 py-1.5 text-[10px] font-black`}
                              style={{ color: banner.buttonTextColor }}
                            >
                              {banner.cta}
                            </span>
                            <span className="truncate text-[9px] font-bold text-white/70">{banner.detailLabel}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="max-w-[320px]">
                          <div className="mb-1 flex items-center gap-2">
                            <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-600">{banner.tag}</span>
                            <span className="font-mono text-[10px] font-bold text-slate-400">ID {banner.id}</span>
                          </div>
                          <p className="font-extrabold text-slate-950">{banner.title}</p>
                          <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-slate-500">{banner.description}</p>
                          {banner.note && (
                            <p className="mt-2 line-clamp-1 rounded-md bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-500">
                              {banner.note}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-bold text-slate-700">{banner.categoryName || 'Tất cả danh mục'}</p>
                        <p className="mt-1 font-mono text-[10px] text-slate-400">{banner.categorySlug || 'global'}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="inline-flex rounded-md bg-slate-100 px-2 py-1 font-mono text-[10px] font-bold text-slate-700">{banner.targetPath}</p>
                        <p className="mt-2 text-[10px] font-semibold text-slate-500">{targetParamsSummary(banner.targetParams)}</p>
                        <p className="mt-1 text-[10px] font-bold text-blue-600">CTA: {banner.cta}</p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-2 text-[10px]">
                          <div>
                            <span className="block font-bold uppercase text-slate-400">Bắt đầu</span>
                            <span className="font-mono font-semibold text-slate-700">{formatDateTime(banner.startsAt)}</span>
                          </div>
                          <div>
                            <span className="block font-bold uppercase text-slate-400">Kết thúc</span>
                            <span className="font-mono font-semibold text-slate-700">{formatDateTime(banner.expiresAt)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4" onClick={(event) => event.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setStylePickerBanner(banner)}
                          className="block w-full cursor-pointer rounded-lg border border-slate-200 bg-white p-2 text-left transition hover:border-blue-300 hover:bg-blue-50/40"
                          title="Chọn màu banner"
                        >
                          <span className={`${bannerBgClassName(banner.bgClassName)} block h-5 rounded-md border border-white shadow-sm`} style={bannerBgStyle(banner.bgClassName)} title={banner.bgClassName} />
                          <p className="mt-1.5 font-mono text-[10px] font-semibold text-slate-500">{banner.bgClassName}</p>
                          <p className="mt-0.5 text-[10px] font-bold text-blue-600">Style</p>
                        </button>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-2 font-mono font-black text-slate-700">
                          {banner.sortOrder}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase ${statusClassName(banner.status)}`}>
                          {statusLabel(banner.status)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center" onClick={(event) => event.stopPropagation()}>
                        <div className="flex items-center justify-center">
                          <button
                            onClick={() => handleQuickStatus(banner)}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              banner.status === 'active' ? 'bg-emerald-500' : 'bg-slate-200'
                            }`}
                            title={banner.status === 'active' ? 'Ẩn banner' : 'Hiện banner'}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                banner.status === 'active' ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredBanners.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-sm text-slate-400">Không tìm thấy banner nào phù hợp.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 p-3 md:hidden">
              {filteredBanners.map(banner => (
                <div
                  key={banner.id}
                  onClick={() => {
                    setActiveBanner(banner);
                    setActiveDetailTab('overview');
                    setIsDetailEditing(false);
                  }}
                  className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs cursor-pointer hover:border-slate-300"
                >
                  <div className={`${bannerBgClassName(banner.bgClassName)} overflow-hidden rounded-xl p-3 text-white`} style={bannerBgStyle(banner.bgClassName)}>
                    <div className="flex items-center justify-between gap-2">
                      <span className={`${banner.chipClassName} ${banner.chipTextClassName} rounded-full px-2 py-0.5 text-[9px] font-black`}>{banner.tag}</span>
                      <span className="text-[9px] font-black text-white/70">#{banner.sortOrder}</span>
                    </div>
                    <h3 className="mt-2 line-clamp-2 text-sm font-black leading-5">{banner.title}</h3>
                    <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-white/75">{banner.description}</p>
                    <span
                      className={`${banner.buttonClassName} mt-3 inline-flex rounded-full px-2.5 py-1.5 text-[10px] font-black`}
                      style={{ color: banner.buttonTextColor }}
                    >
                      {banner.cta}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-extrabold text-slate-950">{banner.categoryName || 'Tất cả danh mục'}</p>
                      <p className="mt-1 font-mono text-[10px] text-slate-400">{banner.targetPath}</p>
                      <p className="mt-1 text-[10px] font-semibold text-slate-500">{targetParamsSummary(banner.targetParams)}</p>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusClassName(banner.status)}`}>
                      {statusLabel(banner.status)}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-2 rounded-lg bg-slate-50 p-3 text-[10px] sm:grid-cols-2">
                    <div>
                      <span className="block font-bold uppercase text-slate-400">Bắt đầu</span>
                      <span className="font-mono font-semibold text-slate-700">{formatDateTime(banner.startsAt)}</span>
                    </div>
                    <div>
                      <span className="block font-bold uppercase text-slate-400">Kết thúc</span>
                      <span className="font-mono font-semibold text-slate-700">{formatDateTime(banner.expiresAt)}</span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3" onClick={(event) => event.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => setStylePickerBanner(banner)}
                      className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] font-bold text-slate-600 shadow-xs"
                    >
                      <span className={`${bannerBgClassName(banner.bgClassName)} h-4 w-8 rounded-md border border-white shadow-sm`} style={bannerBgStyle(banner.bgClassName)} />
                      Style
                    </button>
                    <button
                      onClick={() => handleQuickStatus(banner)}
                      className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        banner.status === 'active' ? 'bg-emerald-500' : 'bg-slate-200'
                      }`}
                      title={banner.status === 'active' ? 'Ẩn banner' : 'Hiện banner'}
                    >
                      <span
                        className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          banner.status === 'active' ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs">
            <button
              type="button"
              className="absolute inset-0"
              onClick={() => {
                setIsFormOpen(false);
                setForm(emptyForm);
              }}
              aria-label="Đóng form banner"
            />
            <form onSubmit={handleSubmit} className="relative max-h-[92vh] w-full max-w-3xl space-y-4 overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 shadow-2xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-950">{form.id ? 'Cập nhật banner' : 'Tạo banner mới'}</h3>
              <p className="mt-1 text-[11px] leading-5 text-slate-500">Các trường này ghi trực tiếp vào bảng `banners`.</p>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setForm(emptyForm)} className="rounded-lg bg-slate-100 px-3 py-2 text-[11px] font-bold text-slate-600">Làm mới</button>
              <button
                type="button"
                onClick={() => {
                  setIsFormOpen(false);
                  setForm(emptyForm);
                }}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className={`${bannerBgClassName(form.bgClassName)} overflow-hidden rounded-2xl p-4 text-white shadow-sm`} style={bannerBgStyle(form.bgClassName)}>
            <div className="flex items-center gap-2">
              <span className={`${form.chipClassName} ${form.chipTextClassName} rounded-full px-2 py-0.5 text-[10px] font-black`}>{form.tag || 'TAG'}</span>
              <Sparkles className="h-4 w-4 text-white/80" />
            </div>
            <h4 className="mt-3 text-lg font-black leading-6">{form.title || 'Tiêu đề banner'}</h4>
            <p className="mt-2 text-xs leading-5 text-white/80">{form.description || 'Mô tả ngắn của banner sẽ hiển thị tại đây.'}</p>
            <div className="mt-4 flex items-center justify-between gap-3">
              <button type="button" className={`${form.buttonClassName} rounded-full px-3 py-2 text-xs font-black`} style={{ color: form.buttonTextColor }}>
                {form.cta || 'CTA'}
              </button>
              <span className="flex items-center gap-1 text-[10px] font-bold text-white/80">
                <BadgePercent className="h-3.5 w-3.5" /> {form.detailLabel}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field label="Tag" value={form.tag} onChange={value => updateForm('tag', value)} required />
            <Field label="CTA" value={form.cta} onChange={value => updateForm('cta', value)} required />
            <div className="md:col-span-2">
              <Field label="Tiêu đề" value={form.title} onChange={value => updateForm('title', value)} required />
            </div>
            <label className="md:col-span-2">
              <span className="mb-1 block text-[10px] font-bold uppercase text-slate-500">Mô tả</span>
              <textarea
                value={form.description}
                onChange={event => updateForm('description', event.target.value)}
                rows={3}
                required
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <div className="md:col-span-2">
              <Field label="Ghi chú" value={form.note} onChange={value => updateForm('note', value)} />
            </div>
            <label>
              <span className="mb-1 block text-[10px] font-bold uppercase text-slate-500">Danh mục liên kết</span>
              <select
                value={form.categoryId}
                onChange={event => updateForm('categoryId', event.target.value)}
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Tất cả danh mục</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="mb-1 block text-[10px] font-bold uppercase text-slate-500">Trạng thái</span>
              <select
                value={form.status}
                onChange={event => updateForm('status', event.target.value as BannerStatus)}
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
              >
                <option value="active">Đang hiển thị</option>
                <option value="scheduled">Đã lên lịch</option>
                <option value="inactive">Tạm ẩn</option>
              </select>
            </label>
            <Field label="Target path" value={form.targetPath} onChange={value => updateForm('targetPath', value)} />
            <Field label="Thứ tự" type="number" value={String(form.sortOrder)} onChange={value => updateForm('sortOrder', Number(value))} />
            <Field label="Icon chính" value={form.iconName} onChange={value => updateForm('iconName', value)} />
            <Field label="Icon phụ" value={form.detailIconName} onChange={value => updateForm('detailIconName', value)} />
            <Field label="Nhãn phụ" value={form.detailLabel} onChange={value => updateForm('detailLabel', value)} />
            <Field label="Màu chữ nút" value={form.buttonTextColor} onChange={value => updateForm('buttonTextColor', value)} />
            <Field label="Bắt đầu" type="datetime-local" value={form.startsAt} onChange={value => updateForm('startsAt', value)} />
            <Field label="Kết thúc" type="datetime-local" value={form.expiresAt} onChange={value => updateForm('expiresAt', value)} />
          </div>

          <div>
            <span className="mb-2 block text-[10px] font-bold uppercase text-slate-500">Mẫu màu giao diện</span>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {stylePresets.map(preset => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, ...preset }))}
                  className={`${preset.bgClassName} rounded-lg px-3 py-2 text-left text-[11px] font-black text-white`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <button
            disabled={isSaving}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? 'Đang lưu...' : form.id ? 'Lưu thay đổi' : 'Tạo banner'}
          </button>
        </form>
          </div>
        )}
      </div>

      {stylePickerBanner && createPortal((
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-slate-950/45 p-4 backdrop-blur-xs">
          <button
            type="button"
            className="absolute inset-0"
            onClick={() => setStylePickerBanner(null)}
            aria-label="Đóng bảng màu banner"
          />
          <div className="relative flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/80 px-4 py-3 sm:px-5">
              <div className="min-w-0">
                <span className="block text-[10px] font-bold uppercase text-slate-400">Bảng màu banner</span>
                <h3 className="truncate text-sm font-extrabold text-slate-950">{stylePickerBanner.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setStylePickerBanner(null)}
                className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Đóng"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 sm:p-5">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="grid grid-cols-[1fr_auto] gap-3">
                  <div
                    className="min-h-[96px] overflow-hidden rounded-lg p-4 text-white shadow-sm"
                    style={{ backgroundColor: normalizeHexColor(pendingStyleColor) || '#3ADF00' }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-black text-slate-950">
                        {stylePickerBanner.tag}
                      </span>
                      <span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-black" style={{ color: readableTextColor(pendingStyleColor) }}>
                        {stylePickerBanner.cta}
                      </span>
                    </div>
                    <h4 className="mt-3 text-base font-black leading-6">{stylePickerBanner.title}</h4>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/75">{stylePickerBanner.description}</p>
                  </div>
                  <div className="flex w-24 flex-col items-center justify-center rounded-lg border border-slate-200 bg-white p-2">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Đang chọn</span>
                    <span className="mt-2 h-10 w-14 rounded-md border border-slate-200 shadow-inner" style={{ backgroundColor: normalizeHexColor(pendingStyleColor) || '#3ADF00' }} />
                    <span className="mt-2 font-mono text-[10px] font-black text-slate-700">{normalizeHexColor(pendingStyleColor) || '#3ADF00'}</span>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
                <div className="grid grid-cols-[repeat(28,minmax(0,1fr))] gap-0">
                  {colorPalette.flat().map((color, index) => (
                    <button
                      key={`${color}-${index}`}
                      type="button"
                      onClick={() => setPendingStyleColor(color)}
                      className={`aspect-square min-h-4 transition hover:scale-125 hover:ring-2 hover:ring-slate-950/20 ${
                        normalizeHexColor(pendingStyleColor) === color ? 'z-10 ring-2 ring-slate-950' : ''
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                      aria-label={`Chọn màu ${color}`}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-600">Các mã màu đã chọn gần đây:</p>
                <div className="flex flex-wrap gap-3">
                  {recentStyleColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setPendingStyleColor(color)}
                      className={`relative rounded-lg border bg-white p-2 shadow-xs transition hover:border-blue-300 ${
                        normalizeHexColor(pendingStyleColor) === color ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200'
                      }`}
                    >
                      <span className="block h-9 w-12 rounded-md" style={{ backgroundColor: color }} />
                      <span className="mt-1 block font-mono text-[10px] font-bold text-slate-700">{color}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <label className="flex flex-1 items-center gap-2">
                    <span className="shrink-0 text-xs font-semibold text-slate-700">Mã màu</span>
                    <span className="text-xl font-black text-slate-400">#</span>
                    <input
                      value={(pendingStyleColor || '').replace('#', '')}
                      onChange={(event) => setPendingStyleColor(`#${event.target.value.replace(/[^0-9a-f]/gi, '').slice(0, 6)}`)}
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 font-mono text-sm font-bold uppercase text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="3ADF00"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleSaveStyleColor}
                    disabled={Boolean(savingStyleKey) || !normalizeHexColor(pendingStyleColor)}
                    className="h-10 rounded-lg bg-blue-600 px-5 text-xs font-black text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingStyleKey ? 'Đang lưu...' : 'Lưu màu'}
                  </button>
                </div>
                <p className="mt-2 text-[11px] font-semibold text-slate-500">Màu sẽ được lưu trực tiếp vào banner và dùng lại khi tải lại trang.</p>
              </div>
            </div>
          </div>
        </div>
      ), document.body)}

      {activeBanner && createPortal((
        <div className="fixed inset-0 z-[100] flex justify-end overflow-hidden bg-slate-950/35 backdrop-blur-xs">
          <button
            className="hidden flex-1 md:block"
            onClick={() => {
              setActiveBanner(null);
              setIsDetailEditing(false);
            }}
            aria-label="Đóng chi tiết banner"
          />
          <aside className="flex h-[100dvh] max-h-[100dvh] min-h-0 w-full max-w-xl flex-col overflow-hidden border-l border-slate-200 bg-white shadow-2xl animate-slide-left">
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 bg-slate-50/50 px-4 py-3 sm:items-center sm:px-6 sm:py-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className={`${bannerBgClassName(activeBanner.bgClassName)} flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-[10px] font-black text-white shadow-sm`} style={bannerBgStyle(activeBanner.bgClassName)}>
                  {activeBanner.tag.slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <span className="block text-[10px] font-mono uppercase text-slate-400">BNR-{activeBanner.id}</span>
                  <h2 className="max-w-[120px] truncate text-base font-extrabold text-slate-900 min-[390px]:max-w-[180px] sm:max-w-xs">{activeBanner.title}</h2>
                  {isDetailEditing && <span className="mt-0.5 inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-black uppercase text-blue-700">Đang sửa</span>}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                {isDetailEditing ? (
                  <>
                    <button
                      type="submit"
                      form="banner-detail-edit-form"
                      disabled={isSaving}
                      className="flex cursor-pointer items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                      title="Lưu thay đổi"
                    >
                      {isSaving ? 'Đang lưu' : 'Lưu'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setForm(bannerToForm(activeBanner));
                        setIsDetailEditing(false);
                      }}
                      className="flex cursor-pointer items-center gap-1 rounded-lg p-1.5 text-xs font-bold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                      title="Hủy sửa"
                    >
                      Hủy
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        openDetailEditor(activeBanner);
                      }}
                      className="flex cursor-pointer items-center gap-1 rounded-lg p-1.5 text-xs font-bold text-slate-500 transition-colors hover:bg-blue-50 hover:text-blue-600"
                      title="Sửa thông tin"
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="hidden sm:inline">Sửa</span>
                    </button>
                    <button
                      onClick={() => handleDelete(activeBanner)}
                      className="flex cursor-pointer items-center gap-1 rounded-lg p-1.5 text-xs font-bold text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600"
                      title="Xóa banner"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="hidden sm:inline">Xóa</span>
                    </button>
                  </>
                )}
                <div className="mx-1 h-6 w-px bg-slate-200" />
                <button
                  onClick={() => {
                    setActiveBanner(null);
                    setIsDetailEditing(false);
                  }}
                  className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {!isDetailEditing && (
            <div className="flex shrink-0 overflow-x-auto border-b border-slate-100 bg-white px-4 sm:px-6">
              {[
                { id: 'overview', label: 'Thông số banner' },
                { id: 'routing', label: 'Điều hướng & lịch' },
                { id: 'style', label: 'Giao diện' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveDetailTab(tab.id as typeof activeDetailTab)}
                  className={`mr-5 shrink-0 cursor-pointer border-b-2 px-1 py-3 text-sm font-semibold transition-all sm:mr-6 ${
                    activeDetailTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            )}

            <div ref={detailBodyRef} className="min-h-0 flex-1 space-y-6 overflow-y-auto p-4 sm:p-6">
              {isDetailEditing ? (
                <form id="banner-detail-edit-form" onSubmit={handleDetailSubmit} className="space-y-5">
                  <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                    <p className="text-xs font-extrabold text-blue-700">Đang sửa banner trực tiếp trong phần chi tiết</p>
                    <p className="mt-1 text-[11px] font-semibold text-blue-600/80">Thay đổi nội dung bên dưới rồi bấm Lưu ở góc trên.</p>
                  </div>

                  <div className={`${bannerBgClassName(form.bgClassName)} overflow-hidden rounded-xl p-4 text-white shadow-sm`} style={bannerBgStyle(form.bgClassName)}>
                    <div className="flex items-center justify-between gap-2">
                      <span className={`${form.chipClassName} ${form.chipTextClassName} rounded-full px-2 py-0.5 text-[10px] font-black`}>{form.tag || 'TAG'}</span>
                      <span className="rounded-full bg-white/15 px-2 py-1 text-[10px] font-black text-white/80">#{form.sortOrder}</span>
                    </div>
                    <h3 className="mt-3 text-lg font-black leading-6">{form.title || 'Tiêu đề banner'}</h3>
                    <p className="mt-2 text-xs leading-5 text-white/80">{form.description || 'Mô tả banner'}</p>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field label="Tag hiển thị" value={form.tag} onChange={value => updateForm('tag', value)} required />
                      <Field label="Nút CTA" value={form.cta} onChange={value => updateForm('cta', value)} required />
                    </div>

                    <div>
                      <Field label="Tiêu đề banner" value={form.title} onChange={value => updateForm('title', value)} required />
                    </div>

                    <label className="block">
                      <span className="mb-1 block text-[10px] font-bold uppercase text-slate-500">Mô tả</span>
                      <textarea
                        value={form.description}
                        onChange={event => updateForm('description', event.target.value)}
                        rows={4}
                        className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </label>

                    <div>
                      <Field label="Ghi chú vận hành" value={form.note} onChange={value => updateForm('note', value)} />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <label>
                        <span className="mb-1 block text-[10px] font-bold uppercase text-slate-500">Danh mục</span>
                        <select
                          value={form.categoryId}
                          onChange={event => updateForm('categoryId', event.target.value)}
                          className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">Tất cả danh mục</option>
                          {categories.map(category => (
                            <option key={category.id} value={category.id}>{category.name}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        <span className="mb-1 block text-[10px] font-bold uppercase text-slate-500">Trạng thái</span>
                        <select
                          value={form.status}
                          onChange={event => updateForm('status', event.target.value as BannerStatus)}
                          className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="active">Đang hiển thị</option>
                          <option value="scheduled">Đã lên lịch</option>
                          <option value="inactive">Tạm ẩn</option>
                        </select>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field label="Target path" value={form.targetPath} onChange={value => updateForm('targetPath', value)} />
                      <Field label="Thứ tự hiển thị" type="number" value={String(form.sortOrder)} onChange={value => updateForm('sortOrder', Number(value))} />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field label="Bắt đầu" type="datetime-local" value={form.startsAt} onChange={value => updateForm('startsAt', value)} />
                      <Field label="Kết thúc" type="datetime-local" value={form.expiresAt} onChange={value => updateForm('expiresAt', value)} />
                    </div>

                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                      <h4 className="mb-3 text-xs font-bold uppercase text-slate-700">Giao diện phụ</h4>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field label="Icon chính" value={form.iconName} onChange={value => updateForm('iconName', value)} />
                      <Field label="Icon phụ" value={form.detailIconName} onChange={value => updateForm('detailIconName', value)} />
                      <Field label="Nhãn phụ" value={form.detailLabel} onChange={value => updateForm('detailLabel', value)} />
                      <Field label="Màu chữ nút" value={form.buttonTextColor} onChange={value => updateForm('buttonTextColor', value)} />
                      </div>
                    </div>
                  </div>
                </form>
              ) : (
              <>
              {activeDetailTab === 'overview' && (
                <div className="space-y-6">
                  <div className={`${bannerBgClassName(activeBanner.bgClassName)} overflow-hidden rounded-xl p-4 text-white shadow-sm`} style={bannerBgStyle(activeBanner.bgClassName)}>
                    <div className="flex items-center justify-between gap-3">
                      <span className={`${activeBanner.chipClassName} ${activeBanner.chipTextClassName} rounded-full px-2 py-0.5 text-[10px] font-black`}>{activeBanner.tag}</span>
                      <span className="rounded-full bg-white/15 px-2 py-1 text-[10px] font-black text-white/80">#{activeBanner.sortOrder}</span>
                    </div>
                    <h3 className="mt-3 text-lg font-black leading-6">{activeBanner.title}</h3>
                    <p className="mt-2 text-xs leading-5 text-white/80">{activeBanner.description}</p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <InfoTile label="Tiêu đề banner" value={activeBanner.title} />
                    <InfoTile label="Mã banner" value={`BNR-${activeBanner.id}`} mono />
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <InfoTile label="Tag hiển thị" value={activeBanner.tag} />
                    <InfoTile label="Danh mục liên kết" value={activeBanner.categoryName || 'Tất cả danh mục'} />
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <InfoTile label="Thứ tự" value={String(activeBanner.sortOrder)} center />
                    <InfoTile label="CTA" value={activeBanner.cta} center />
                    <div className="flex flex-col items-center justify-center rounded-xl border border-slate-150 bg-slate-50/50 p-4 text-center">
                      <span className="mb-1 block text-[10px] font-bold uppercase text-slate-400">Trạng thái</span>
                      <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase ${statusClassName(activeBanner.status)}`}>
                        {statusLabel(activeBanner.status)}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <span className="block text-[10px] font-bold uppercase text-slate-400">Mô tả banner</span>
                    <div className="rounded-xl border border-slate-150 bg-slate-50 p-4 text-xs font-medium leading-relaxed text-slate-600">
                      {activeBanner.description}
                    </div>
                  </div>
                  {activeBanner.note && (
                    <div className="space-y-1.5">
                      <span className="block text-[10px] font-bold uppercase text-slate-400">Ghi chú vận hành</span>
                      <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-xs font-medium leading-relaxed text-amber-900">
                        {activeBanner.note}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeDetailTab === 'routing' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <InfoTile label="Target path" value={activeBanner.targetPath} mono />
                    <InfoTile label="Slug danh mục" value={activeBanner.categorySlug || 'global'} mono />
                  </div>
                  <div className="space-y-1.5">
                    <span className="block text-[10px] font-bold uppercase text-slate-400">Target params</span>
                    <div className="rounded-xl border border-slate-150 bg-slate-50 p-4 font-mono text-xs font-medium leading-relaxed text-slate-600">
                      {targetParamsSummary(activeBanner.targetParams)}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-150 bg-slate-50 p-4">
                    <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5 text-xs font-bold uppercase text-slate-400">
                      <span>Lịch hiển thị</span>
                      <span>Thời gian</span>
                    </div>
                    <div className="flex items-center justify-between py-2 text-xs font-semibold text-slate-600">
                      <span>Bắt đầu</span>
                      <span className="font-mono font-bold text-slate-800">{formatDateTime(activeBanner.startsAt)}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-200/60 pt-2 text-xs font-semibold text-slate-600">
                      <span>Kết thúc</span>
                      <span className="font-mono font-bold text-slate-800">{formatDateTime(activeBanner.expiresAt)}</span>
                    </div>
                  </div>
                </div>
              )}

              {activeDetailTab === 'style' && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <span className="block text-[10px] font-bold uppercase text-slate-400">Bảng màu banner</span>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {stylePresets.map((preset) => {
                        const isCurrent =
                          activeBanner.bgClassName === preset.bgClassName &&
                          activeBanner.chipClassName === preset.chipClassName &&
                          activeBanner.buttonTextColor === preset.buttonTextColor;
                        const styleKey = `${activeBanner.id}-${preset.label}`;
                        const isSavingPreset = savingStyleKey === styleKey;

                        return (
                          <button
                            key={preset.label}
                            type="button"
                            disabled={Boolean(savingStyleKey)}
                            onClick={() => handleApplyStylePreset(activeBanner, preset)}
                            className={`group rounded-xl border bg-white p-3 text-left shadow-2xs transition-all hover:border-blue-300 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-70 ${
                              isCurrent ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200'
                            }`}
                          >
                            <div className={`${preset.bgClassName} overflow-hidden rounded-lg p-3 text-white`}>
                              <div className="flex items-center justify-between gap-2">
                                <span className={`${preset.chipClassName} ${preset.chipTextClassName} rounded-full px-2 py-0.5 text-[9px] font-black`}>
                                  {activeBanner.tag}
                                </span>
                                <span className={`${preset.buttonClassName} rounded-full px-2 py-1 text-[9px] font-black`} style={{ color: preset.buttonTextColor }}>
                                  {activeBanner.cta}
                                </span>
                              </div>
                              <div className="mt-3 truncate text-sm font-black">{activeBanner.title}</div>
                            </div>
                            <div className="mt-3 flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <div className="text-xs font-extrabold text-slate-900">{preset.label}</div>
                                <div className="mt-0.5 truncate text-[10px] font-semibold text-slate-500">{preset.description}</div>
                              </div>
                              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                isCurrent ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600'
                              }`}>
                                {isSavingPreset ? 'Đang lưu' : isCurrent ? 'Đang dùng' : 'Áp dụng'}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Thông số đang áp dụng</span>
                      <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-500">Cập nhật trực tiếp</span>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <InfoTile label="Nền banner" value={activeBanner.bgClassName} mono />
                      <InfoTile label="Màu chữ nút" value={activeBanner.buttonTextColor} mono />
                      <InfoTile label="Chip class" value={activeBanner.chipClassName} mono />
                      <InfoTile label="Chip text" value={activeBanner.chipTextClassName} mono />
                    </div>
                  </div>
                </div>
              )}
              </>
              )}
            </div>
          </aside>
        </div>
      ), document.body)}
    </div>
  );
}

function InfoTile({
  label,
  value,
  mono = false,
  center = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  center?: boolean;
}) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-slate-50/50 p-4 ${center ? 'text-center' : ''}`}>
      <span className="mb-1 block text-[10px] font-bold uppercase text-slate-400">{label}</span>
      <span className={`block truncate text-sm font-extrabold text-slate-800 ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}

function DetailRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2 last:border-b-0 last:pb-0">
      <span className="text-[11px] font-semibold text-slate-500">{label}</span>
      <span className={`max-w-[68%] text-right text-[11px] font-bold text-slate-800 ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label>
      <span className="mb-1 block text-[10px] font-bold uppercase text-slate-500">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        onChange={event => onChange(event.target.value)}
        className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
      />
    </label>
  );
}


