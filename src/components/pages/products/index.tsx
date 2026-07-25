import { useState } from 'react';
import { AlertTriangle, Boxes, CheckCircle2, Download, Package, Plus, Search, Tag, Trash2 } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import type { Category, Product } from '../../../types';
import { CustomSelect } from '../../shared';
import { formatVnd } from '../../../lib/currency';
import { productsApi } from '../../../lib/api';
import { exportProductsToExcel } from '../../../lib/productExcel';

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  categories: Category[];
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onOpenNewProduct: () => void;
  onProductsChanged: (products: Product[]) => void;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function ProductsPage({ categories, products, onSelectProduct, onOpenNewProduct, onProductsChanged }: Props) {
  const [search, setSearch]           = useState('');
  const [catFilter, setCatFilter]     = useState('All');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  const filtered = useMemo(() => products.filter(p => {
    const q = search.toLowerCase();
    return (p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
      && (catFilter === 'All' || p.category === catFilter);
  }), [catFilter, products, search]);

  useEffect(() => {
    const productIds = new Set(products.map(product => product.id));
    setSelectedIds(prev => prev.filter(id => productIds.has(id)));
  }, [products]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const product = products.find(p => p.id === id);
    if (!product) return;
    const nextStatus = currentStatus === 'active' ? 'draft' : 'active';
    try {
      const data = await productsApi.update(id, { ...product, status: nextStatus });
      if (!data.ok) throw new Error(data.message);
      onProductsChanged(products.map(p => p.id === id ? data.product : p));
    } catch (e: any) { alert(e.message); }
  };

  const handleBulkStatus = async (status: Product['status']) => {
    if (!selectedIds.length) return;
    const selectedProducts = products.filter(product => selectedIds.includes(product.id));
    setIsBulkUpdating(true);
    try {
      const results = await Promise.all(
        selectedProducts.map(product => productsApi.update(product.id, { ...product, status }))
      );
      const updatedById = new Map(results.map(result => [result.product.id, result.product]));
      onProductsChanged(products.map(product => updatedById.get(product.id) || product));
      setSelectedIds([]);
    } catch (e: any) {
      alert(e.message || 'Không thể cập nhật trạng thái sản phẩm.');
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    if (!window.confirm(`Xóa ${selectedIds.length} sản phẩm đã chọn?`)) return;
    try {
      await Promise.all(selectedIds.map(id => productsApi.remove(id)));
      onProductsChanged(products.filter(p => !selectedIds.includes(p.id)));
      setSelectedIds([]);
    } catch (e: any) { alert(e.message); }
  };

  const handleExportExcel = async () => {
    try { await exportProductsToExcel(filtered); }
    catch (e: any) { alert(`Không thể xuất Excel: ${e.message}`); }
  };

  const toggleOne = (id: string, checked: boolean) =>
    setSelectedIds(prev => checked ? [...prev, id] : prev.filter(x => x !== id));

  const toggleAll = (checked: boolean) =>
    setSelectedIds(checked ? filtered.map(p => p.id) : []);

  // ── Stats ─────────────────────────────────────────────────────────────────

  const activeCount    = useMemo(() => filtered.filter(p => p.status === 'active').length, [filtered]);
  const lowStockCount  = useMemo(() => filtered.filter(p => p.inventory <= 10).length, [filtered]);
  const totalInventory = useMemo(() => filtered.reduce((s, p) => s + p.inventory, 0), [filtered]);
  const getImg         = (p: Product) => p.images?.[0];

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col gap-4 rounded-2xl border border-blue-100/60 bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-transparent p-5 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            <h2 className="text-base font-extrabold text-slate-900">Quản Lý Sản Phẩm</h2>
          </div>
          <p className="text-xs leading-relaxed text-slate-500">
            Theo dõi danh sách sản phẩm, trạng thái kinh doanh, hình ảnh, giá bán và tồn kho theo từng kho trong hệ thống.
          </p>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Tổng sản phẩm',   value: filtered.length,   icon: Package,       tone: 'border-blue-100 bg-blue-50 text-blue-700' },
          { label: 'Đang kinh doanh', value: activeCount,        icon: CheckCircle2,  tone: 'border-emerald-100 bg-emerald-50 text-emerald-700' },
          { label: 'Tổng tồn kho',    value: totalInventory,     icon: Boxes,         tone: 'border-indigo-100 bg-indigo-50 text-indigo-700' },
          { label: 'Sắp hết hàng',    value: lowStockCount,      icon: AlertTriangle, tone: 'border-amber-100 bg-amber-50 text-amber-700' },
        ].map(item => (
          <div key={item.label} className="flex min-h-[92px] items-center justify-between rounded-lg border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <div>
              <p className="block text-[10px] font-semibold uppercase text-slate-500">{item.label}</p>
              <p className="mt-1.5 block text-xl font-bold text-slate-900">{item.value.toLocaleString('vi-VN')}</p>
            </div>
            <div className={`flex h-11 w-11 items-center justify-center rounded-lg border ${item.tone}`}>
              <item.icon className="h-5 w-5" />
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col items-stretch gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex h-10 w-full items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3 lg:max-w-[440px]">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên, SKU..."
            className="w-full bg-transparent text-xs text-slate-800 outline-none"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <CustomSelect
            value={catFilter}
            onChange={setCatFilter}
            options={[{ value: 'All', label: 'Tất cả danh mục' }, ...categories.map(c => ({ value: c.name, label: c.name }))]}
            icon={<Tag className="h-3.5 w-3.5" />}
            showSearch
          />
          <button onClick={handleExportExcel} className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white p-2 text-xs font-semibold text-slate-600 shadow-sm hover:bg-slate-50">
            <Download className="h-3.5 w-3.5" /> Xuất Excel
          </button>
          <button onClick={onOpenNewProduct} className="flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700">
            <Plus className="h-4 w-4" /> Thêm sản phẩm
          </button>
        </div>
      </div>

      {/* Bulk actions */}
      {selectedIds.length > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3.5 text-xs font-semibold text-blue-900 sm:flex-row sm:items-center sm:justify-between">
          <span>Đã chọn {selectedIds.length} sản phẩm</span>
          <div className="flex flex-wrap gap-2">
            <button disabled={isBulkUpdating} onClick={() => handleBulkStatus('active')} className="rounded bg-blue-600 px-3 py-1 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">Kích hoạt</button>
            <button disabled={isBulkUpdating} onClick={() => handleBulkStatus('archived')} className="rounded bg-slate-800 px-3 py-1 text-slate-200 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60">Lưu trữ</button>
            <button onClick={() => setSelectedIds([])} className="rounded border border-blue-200 bg-white px-3 py-1 text-blue-700 hover:bg-blue-100">Bỏ chọn</button>
            <button disabled={isBulkUpdating} onClick={handleBulkDelete} className="flex items-center gap-1 rounded bg-rose-600 px-3 py-1 text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60">
              <Trash2 className="h-3.5 w-3.5" /> Xóa
            </button>
          </div>
        </div>
      )}

      {/* Table – desktop */}
      <div className="hidden overflow-x-auto rounded-xl border border-slate-200/80 bg-white shadow-sm md:block">
        <table className="min-w-[1180px] w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase text-slate-400">
              <th className="w-10 px-5 py-3">
                <input type="checkbox"
                  checked={selectedIds.length === filtered.length && filtered.length > 0}
                  onChange={e => toggleAll(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
              </th>
              <th className="w-20 px-5 py-3">Hình ảnh</th>
              <th className="px-5 py-3">Sản phẩm & SKU</th>
              <th className="px-5 py-3">Danh mục</th>
              <th className="px-5 py-3 text-right">Giá bán</th>
              <th className="px-5 py-3 text-right">Tồn kho</th>
              <th className="px-5 py-3">Ngày tạo</th>
              <th className="px-5 py-3">Cập nhật</th>
              <th className="px-5 py-3 text-center">Trạng thái</th>
              <th className="px-5 py-3 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filtered.map(prod => (
              <tr key={prod.id} className="cursor-pointer transition-colors hover:bg-blue-50/35" onClick={() => onSelectProduct(prod)}>
                <td className="w-10 px-5 py-3" onClick={e => e.stopPropagation()}>
                  <input type="checkbox" checked={selectedIds.includes(prod.id)}
                    onChange={e => toggleOne(prod.id, e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                </td>
                <td className="w-20 px-5 py-3">
                  {getImg(prod)
                    ? <img src={getImg(prod)} alt={prod.name} referrerPolicy="no-referrer" className="h-10 w-10 rounded-lg border border-slate-200 object-cover" />
                    : <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-[10px] font-bold uppercase text-slate-400">K.ẢNH</div>
                  }
                </td>
                <td className="px-5 py-3">
                  <span className="block font-bold text-slate-900 hover:text-blue-600">{prod.name}</span>
                  <span className="mt-0.5 block font-mono text-[10px] text-slate-400">{prod.sku}</span>
                </td>
                <td className="px-5 py-3 font-semibold text-slate-500">{prod.category}</td>
                <td className="px-5 py-3 text-right font-mono font-bold text-slate-800">{formatVnd(prod.price)}</td>
                <td className="px-5 py-3 text-right">
                  <div className="font-semibold text-slate-800">{prod.inventory} SP</div>
                  <div className="mt-0.5 font-mono text-[9px] text-slate-400">Kho: {prod.warehouseStock?.MAIN ?? prod.inventory}</div>
                </td>
                <td className="px-5 py-3 font-mono text-[10px] text-slate-500">
                  {prod.createdAt ? new Date(prod.createdAt).toLocaleString('vi-VN', { hour12: false }) : '---'}
                </td>
                <td className="px-5 py-3 font-mono text-[10px] text-slate-500">
                  {prod.updatedAt ? new Date(prod.updatedAt).toLocaleString('vi-VN', { hour12: false }) : '---'}
                </td>
                <td className="px-5 py-3 text-center">
                  <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                    prod.status === 'active' ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : prod.status === 'draft' ? 'border-amber-200 bg-amber-50 text-amber-700'
                    : 'border-slate-200 bg-slate-50 text-slate-500'
                  }`}>
                    {prod.status === 'active' ? 'Đang bán' : 'Tạm dừng'}
                  </span>
                </td>
                <td className="px-5 py-3 text-center" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => handleToggleStatus(prod.id, prod.status)}
                    className={`relative inline-flex h-5 w-9 cursor-pointer rounded-full border-2 border-transparent transition-colors ${prod.status === 'active' ? 'bg-emerald-500' : 'bg-slate-200'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition ${prod.status === 'active' ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={10} className="py-12 text-center text-sm text-slate-400">Không tìm thấy sản phẩm nào.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Cards – mobile */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {filtered.map(prod => (
          <div key={prod.id} className="cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-slate-300" onClick={() => onSelectProduct(prod)}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div onClick={e => e.stopPropagation()}>
                  <input type="checkbox" checked={selectedIds.includes(prod.id)}
                    onChange={e => toggleOne(prod.id, e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                </div>
                {getImg(prod)
                  ? <img src={getImg(prod)} alt={prod.name} referrerPolicy="no-referrer" className="h-12 w-12 rounded-lg border border-slate-200 object-cover" />
                  : <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-[10px] font-bold uppercase text-slate-400">K.ẢNH</div>
                }
                <div>
                  <h4 className="line-clamp-1 text-sm font-bold text-slate-900">{prod.name}</h4>
                  <span className="mt-0.5 block font-mono text-[10px] text-slate-400">{prod.sku}</span>
                </div>
              </div>
              <div onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => handleToggleStatus(prod.id, prod.status)}
                  className={`relative inline-flex h-5 w-9 cursor-pointer rounded-full border-2 border-transparent transition-colors ${prod.status === 'active' ? 'bg-emerald-500' : 'bg-slate-200'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition ${prod.status === 'active' ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-xs">
              <div>
                <span className="block text-[10px] font-bold uppercase text-slate-400">Danh mục</span>
                <span className="font-semibold text-slate-700">{prod.category}</span>
              </div>
              <div className="text-right">
                <span className="block text-[10px] font-bold uppercase text-slate-400">Giá bán</span>
                <span className="font-mono font-extrabold text-blue-600">{formatVnd(prod.price)}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold uppercase text-slate-400">Tồn kho</span>
                <span className="font-semibold text-slate-800">{prod.inventory} SP</span>
              </div>
              <div className="text-right">
                <span className="block text-[10px] font-bold uppercase text-slate-400">Trạng thái</span>
                <span className={`inline-block rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase ${
                  prod.status === 'active' ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : prod.status === 'draft' ? 'border-amber-200 bg-amber-50 text-amber-700'
                  : 'border-slate-200 bg-slate-50 text-slate-500'
                }`}>
                  {prod.status === 'active' ? 'Đang bán' : 'Tạm dừng'}
                </span>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400">Không tìm thấy sản phẩm nào.</div>
        )}
      </div>

    </div>
  );
}

export default ProductsPage;
