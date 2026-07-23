import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, Layers, Calendar, Edit3, Trash2, History } from 'lucide-react';
import { Category, Product } from '../../../types';
import CustomSelect from '../../shared/ui/CustomSelect';
import ImageUpload from '../../shared/ui/ImageUpload';
import { formatVnd } from '../../../lib/currency';
import { categoriesApi, type EntityChangeLog } from '../../../lib/api';

interface CategoryDrawerProps {
  category: Category | null;
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  categories: Category[];
  onSave: (updatedCategory: Category) => void;
  onDelete?: (category: Category) => void;
}

export default function CategoryDrawer({
  category,
  isOpen,
  onClose,
  products,
  categories,
  onSave,
  onDelete
}: CategoryDrawerProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');
  const [isEditing, setIsEditing] = useState(false);
  
  // Edited values
  const [editedName, setEditedName] = useState('');
  const [editedStatus, setEditedStatus] = useState<'active' | 'inactive'>('active');
  const [editedImage, setEditedImage] = useState('');
  const [changeLogs, setChangeLogs] = useState<EntityChangeLog[]>([]);
  const [changeLogsLoading, setChangeLogsLoading] = useState(false);
  const [changeLogsError, setChangeLogsError] = useState('');

  useEffect(() => {
    if (category) {
      setEditedName(category.name);
      setEditedStatus(category.status);
      setEditedImage(category.image || '');
      setActiveTab('details');
      setIsEditing(false);
    }
  }, [category]);

  useEffect(() => {
    if (!category || activeTab !== 'history') return;

    setChangeLogsLoading(true);
    setChangeLogsError('');
    categoriesApi.changeLogs(category.id)
      .then((data) => setChangeLogs(data.logs || []))
      .catch((error: any) => setChangeLogsError(error.message || 'Không thể tải nhật ký thay đổi.'))
      .finally(() => setChangeLogsLoading(false));
  }, [activeTab, category?.id, category?.updatedAt]);

  if (!isOpen || !category) return null;

  // Statistics
  const catProducts = products.filter(p => p.category === category.name);
  const totalProducts = catProducts.length;
  const totalStock = catProducts.reduce((sum, p) => sum + p.inventory, 0);
  const activeProducts = catProducts.filter(p => p.status === 'active').length;
  const draftProducts = catProducts.filter(p => p.status === 'draft').length;
  const archivedProducts = catProducts.filter(p => p.status === 'archived').length;
  const bestSellerProducts = catProducts.filter(p => p.isBestSeller).length;
  const lowStockProducts = catProducts.filter(p => p.inventory <= 10).length;
  const totalInventoryValue = catProducts.reduce((sum, p) => sum + (p.price || 0) * (p.inventory || 0), 0);
  const avgPrice = totalProducts > 0 
    ? catProducts.reduce((sum, p) => sum + p.price, 0) / totalProducts 
    : 0;
  const newestProduct = catProducts
    .slice()
    .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime())[0];
  const formattedCreatedAt = category.createdAt ? new Date(category.createdAt).toLocaleString('vi-VN', { hour12: false }) : '---';
  const formattedUpdatedAt = category.updatedAt ? new Date(category.updatedAt).toLocaleString('vi-VN', { hour12: false }) : '---';
  const actionLabels: Record<EntityChangeLog['action'], string> = {
    create: 'Tạo mới',
    update: 'Cập nhật',
    delete: 'Xóa',
  };

  const handleSaveClick = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = editedName.trim();
    if (!trimmed) {
      alert('Tên danh mục không được để trống!');
      return;
    }

    // Check duplicate name if name changed
    if (trimmed.toLowerCase() !== category.name.toLowerCase() &&
        categories.some(c => c.id !== category.id && c.name.toLowerCase() === trimmed.toLowerCase())) {
      alert('Tên danh mục mới bị trùng lặp!');
      return;
    }

    onSave({
      ...category,
      name: trimmed,
      status: editedStatus,
      image: editedImage || undefined,
      updatedAt: new Date().toISOString()
    });
    
    setIsEditing(false);
  };

  return createPortal(
    <div 
      id="category-drawer-overlay" 
      className="fixed inset-0 z-[100] flex justify-end overflow-hidden bg-slate-900/40 backdrop-blur-xs transition-opacity duration-200"
    >
      {/* Click outside to close */}
      <div className="hidden flex-1 md:block" onClick={onClose}></div>

      {/* Drawer content */}
      <div className="flex h-[100dvh] max-h-[100dvh] min-h-0 w-full max-w-xl flex-col overflow-hidden border-l border-slate-200 bg-white shadow-2xl animate-slide-left">
        
        {/* HEADER BLOCK */}
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 bg-slate-50/50 px-4 py-3 sm:items-center sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-center gap-3">
            {isEditing ? (
              editedImage ? (
                <img referrerPolicy="no-referrer" src={editedImage} alt={editedName} className="w-11 h-11 rounded-lg object-cover border border-slate-200" />
              ) : (
                <div className="w-11 h-11 rounded-lg bg-blue-100 text-blue-700 font-extrabold flex items-center justify-center text-sm uppercase">
                  {editedName ? editedName[0] : 'C'}
                </div>
              )
            ) : (
              category.image ? (
                <img referrerPolicy="no-referrer" src={category.image} alt={category.name} className="w-11 h-11 rounded-lg object-cover border border-slate-200" />
              ) : (
                <div className="w-11 h-11 rounded-lg bg-blue-100 text-blue-700 font-extrabold flex items-center justify-center text-sm uppercase">
                  {category.name[0]}
                </div>
              )
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${category.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
                <span className="text-[10px] font-mono text-slate-400 uppercase">{category.id}</span>
              </div>
              <h2 className="max-w-[120px] truncate text-base font-medium normal-case text-slate-900 min-[390px]:max-w-[180px] sm:max-w-xs">{isEditing ? editedName : category.name}</h2>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {!isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-1 text-xs font-bold cursor-pointer"
                  title="Sửa thông tin"
                >
                  <Edit3 className="w-4 h-4" />
                  <span className="hidden sm:inline">Sửa</span>
                </button>
                {onDelete && (
                  <button
                    onClick={() => { onDelete(category); onClose(); }}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-1 text-xs font-bold cursor-pointer"
                    title="Xóa danh mục"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Xóa</span>
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={() => handleSaveClick()}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors shadow-xs cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  Lưu
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Hủy
                </button>
              </>
            )}
            <div className="w-px h-6 bg-slate-200 mx-1"></div>
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* METRICS & QUICK SUMMARY */}
        <div className="grid shrink-0 grid-cols-1 gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3 text-center sm:grid-cols-3 sm:px-6 sm:py-4">
          <div className="p-2 bg-white rounded-xl border border-slate-200/60 shadow-2xs">
            <span className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Số sản phẩm</span>
            <span className="text-base font-medium normal-case text-slate-800">{totalProducts}</span>
          </div>
          <div className="p-2 bg-white rounded-xl border border-slate-200/60 shadow-2xs">
            <span className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Tổng tồn kho</span>
            <span className="text-base font-medium normal-case text-slate-800">{totalStock}</span>
          </div>
          <div className="p-2 bg-white rounded-xl border border-slate-200/60 shadow-2xs">
            <span className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Giá bán TB</span>
            <span className="text-base font-medium normal-case text-slate-800">{formatVnd(avgPrice)}</span>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex border-b border-slate-100 shrink-0 bg-white">
          <button
            onClick={() => setActiveTab('details')}
            className={`flex-1 py-3 text-xs font-bold border-b-2 text-center transition-colors cursor-pointer ${
              activeTab === 'details'
                ? 'border-blue-600 text-blue-600 bg-blue-50/20'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            Thông tin chi tiết
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3 text-xs font-bold border-b-2 text-center transition-colors cursor-pointer ${
              activeTab === 'history'
                ? 'border-blue-600 text-blue-600 bg-blue-50/20'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            Nhật ký thay đổi
          </button>
        </div>

        {/* TAB BODY SCROLL CONTAINER */}
        <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/30 p-4 sm:p-6">
          {activeTab === 'details' ? (
            isEditing ? (
              <form onSubmit={handleSaveClick} className="space-y-6 text-xs font-semibold">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
                  <h3 className="text-xs font-extrabold text-slate-800 uppercase mb-2 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    <Layers className="w-4 h-4 text-blue-600" /> Cập nhật chi tiết
                  </h3>

                  <div>
                    <label className="block text-slate-400 uppercase text-[10px] mb-1.5">Tên danh mục</label>
                    <input
                      type="text"
                      required
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      placeholder="Nhập tên danh mục..."
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 uppercase text-[10px] mb-1.5">Trạng thái hoạt động</label>
                    <CustomSelect
                      value={editedStatus}
                      onChange={(val) => setEditedStatus(val as any)}
                      options={[
                        { value: 'active', label: 'Hoạt động (Active)' },
                        { value: 'inactive', label: 'Ngưng hoạt động (Inactive)' }
                      ]}
                      className="w-full"
                    />
                  </div>

                  <div className="pt-2">
                    <ImageUpload
                      value={editedImage}
                      onChange={setEditedImage}
                      onClear={() => setEditedImage('')}
                      label="Hình đại diện danh mục"
                      className="w-full"
                    />
                  </div>
                </div>

                {/* METADATA HISTORY */}
                <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-3xs space-y-2 text-slate-500 font-medium">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" /> Ngày tạo:
                    </span>
                    <span className="font-mono text-slate-700">
                      {category.createdAt ? new Date(category.createdAt).toLocaleString('vi-VN', { hour12: false }) : '---'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] pt-1.5 border-t border-slate-100">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" /> Cập nhật lần cuối:
                    </span>
                    <span className="font-mono text-slate-700">
                      {category.updatedAt ? new Date(category.updatedAt).toLocaleString('vi-VN', { hour12: false }) : '---'}
                    </span>
                  </div>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                  {category.image ? (
                    <img
                      src={category.image}
                      alt={category.name}
                      className="h-44 w-full bg-slate-50 object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex h-32 items-center justify-center bg-slate-50 text-xs font-semibold text-slate-400">
                      Chưa thiết lập hình đại diện danh mục.
                    </div>
                  )}
                  <div className="flex flex-wrap items-start justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase text-slate-400">{category.id}</p>
                      <h3 className="mt-1 text-base font-bold normal-case text-slate-900">{category.name}</h3>
                      <p className="mt-1 text-xs font-medium text-slate-500">{category.slug ? `/${category.slug}` : 'Chưa có slug'}</p>
                    </div>
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${
                      category.status === 'active'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 bg-slate-50 text-slate-500'
                    }`}>
                      {category.status === 'active' ? 'Hoạt động' : 'Ngưng hoạt động'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {[
                    { label: 'Sản phẩm', value: totalProducts.toLocaleString('vi-VN') },
                    { label: 'Đang bán', value: activeProducts.toLocaleString('vi-VN') },
                    { label: 'Tồn kho', value: totalStock.toLocaleString('vi-VN') },
                    { label: 'Bán chạy', value: bestSellerProducts.toLocaleString('vi-VN') },
                    { label: 'Sắp hết', value: lowStockProducts.toLocaleString('vi-VN') },
                    { label: 'Giá TB', value: formatVnd(avgPrice) },
                  ].map((item) => (
                    <div key={item.label} className="rounded-lg border border-slate-200 bg-white p-3">
                      <span className="block text-[10px] font-bold uppercase text-slate-400">{item.label}</span>
                      <span className="mt-1 block text-sm font-bold normal-case text-slate-800">{item.value}</span>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <span className="block text-[10px] font-bold uppercase text-slate-400">Tổng quan danh mục</span>
                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {[
                      ['Mã danh mục', category.id],
                      ['Tên danh mục', category.name],
                      ['Slug', category.slug || 'Chưa có'],
                      ['Trạng thái', category.status === 'active' ? 'Hoạt động' : 'Ngưng hoạt động'],
                      ['Sản phẩm nháp', draftProducts.toLocaleString('vi-VN')],
                      ['Sản phẩm lưu trữ', archivedProducts.toLocaleString('vi-VN')],
                      ['Giá trị tồn kho', formatVnd(totalInventoryValue)],
                      ['Sản phẩm mới cập nhật', newestProduct?.name || 'Chưa có'],
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
                        <span className="font-semibold text-slate-500">{label}</span>
                        <span className="text-right font-bold text-slate-800">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <span className="block text-[10px] font-bold uppercase text-slate-400">Thời gian</span>
                  <div className="mt-3 divide-y divide-slate-100 rounded-lg bg-slate-50 px-3">
                    <div className="flex items-center justify-between gap-3 py-2">
                      <span className="flex items-center gap-1 font-semibold text-slate-500">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" /> Ngày tạo
                      </span>
                      <span className="text-right font-mono font-bold text-slate-800">{formattedCreatedAt}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 py-2">
                      <span className="flex items-center gap-1 font-semibold text-slate-500">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" /> Cập nhật cuối
                      </span>
                      <span className="text-right font-mono font-bold text-slate-800">{formattedUpdatedAt}</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-slate-600">
                <History className="h-5 w-5 text-blue-600" />
                <h4 className="text-sm font-bold text-slate-800">Nhật ký thay đổi</h4>
              </div>

              <div className="relative ml-2 space-y-6 border-l-2 border-slate-100 pl-4">
                {changeLogsLoading && (
                  <div className="rounded-lg border border-slate-100 bg-white p-3 text-xs font-semibold text-slate-400">
                    Đang tải nhật ký thay đổi...
                  </div>
                )}

                {changeLogsError && (
                  <div className="rounded-lg border border-rose-100 bg-rose-50 p-3 text-xs font-semibold text-rose-600">
                    {changeLogsError}
                  </div>
                )}

                {!changeLogsLoading && !changeLogsError && changeLogs.map((log) => (
                  <div key={log.id} className="relative">
                    <span className={`absolute -left-[25px] top-1 h-3 w-3 rounded-full border-2 border-white ring-4 ${
                      log.action === 'create'
                        ? 'bg-emerald-500 ring-emerald-50'
                        : log.action === 'delete'
                        ? 'bg-rose-500 ring-rose-50'
                        : 'bg-blue-500 ring-blue-50'
                    }`}></span>
                    <div className="rounded-lg border border-slate-100 bg-white p-3.5">
                      <div className="flex items-center justify-between gap-3 text-xs font-medium normal-case text-slate-800">
                        <span>{actionLabels[log.action]} danh mục</span>
                        <span className="font-normal text-slate-400">{log.createdAt ? new Date(log.createdAt).toLocaleString('vi-VN', { hour12: false }) : '---'}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{log.summary}</p>
                      <span className="mt-2 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Người sửa đổi: {log.actorName || 'Quản trị viên'}</span>
                    </div>
                  </div>
                ))}

                {!changeLogsLoading && !changeLogsError && changeLogs.length === 0 && (
                  <div className="relative">
                    <span className="absolute -left-[25px] top-1 h-3 w-3 rounded-full border-2 border-white bg-slate-300 ring-4 ring-slate-50"></span>
                    <div className="rounded-lg border border-slate-100 bg-white p-3.5">
                      <p className="text-xs text-slate-500">Chưa có nhật ký thay đổi trong database.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}


