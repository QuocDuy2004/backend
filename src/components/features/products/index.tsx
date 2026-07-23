import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, History, Edit3, Trash2 } from 'lucide-react';
import { Product } from '../../../types';
import CustomSelect from '../../shared/ui/CustomSelect';
import ImageUpload from '../../shared/ui/ImageUpload';
import { formatVnd } from '../../../lib/currency';
import { productsApi, type EntityChangeLog } from '../../../lib/api';

interface ProductDrawerProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedProduct: Product) => void;
  onDelete?: (productId: string) => void;
  categories: string[];
}

export function ProductDrawer({ product, isOpen, onClose, onSave, onDelete, categories }: ProductDrawerProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'versions'>('details');
  const [isEditing, setIsEditing] = useState(false);
  const [edited, setEdited] = useState<Partial<Product>>({});
  const [changeLogs, setChangeLogs] = useState<EntityChangeLog[]>([]);
  const [changeLogsLoading, setChangeLogsLoading] = useState(false);
  const [changeLogsError, setChangeLogsError] = useState('');

  useEffect(() => {
    if (product) {
      setEdited({ ...product });
      setActiveTab('details');
      setIsEditing(false);
    }
  }, [product]);

  useEffect(() => {
    if (!product || activeTab !== 'versions') return;

    setChangeLogsLoading(true);
    setChangeLogsError('');
    productsApi.changeLogs(product.id)
      .then((data) => setChangeLogs(data.logs || []))
      .catch((error: any) => setChangeLogsError(error.message || 'Không thể tải nhật ký thay đổi.'))
      .finally(() => setChangeLogsLoading(false));
  }, [activeTab, product?.id, product?.updatedAt]);

  if (!isOpen || !product) return null;

  const handleChange = (field: keyof Product, value: any) => {
    setEdited(prev => ({ ...prev, [field]: value }));
  };

  const editedImages = edited.images || [];
  const productImages = product.images || [];
  const primaryImage = editedImages[0] || productImages[0];
  const displayImages = productImages.slice(0, 12);
  const handleImagesChange = (images: string[]) => {
    setEdited(prev => ({ ...prev, images }));
  };
  const handlePrimaryImageChange = (value: string) => {
    setEdited(prev => ({ ...prev, images: value ? [value, ...(prev.images || []).slice(1)] : [] }));
  };
  const productSpecs = Object.entries(product.specification || {});
  const productAttributes = product.attributes || [];
  const actionLabels: Record<EntityChangeLog['action'], string> = {
    create: 'Tạo mới',
    update: 'Cập nhật',
    delete: 'Xóa',
  };

  const handleWarehouseStockChange = (value: number) => {
    const stock = Math.max(0, value);
    setEdited(prev => ({
      ...prev,
      warehouseStock: { MAIN: stock },
      inventory: stock
    }));
  };

  const handleSaveAndCommit = () => {
    const currentVersions = edited.versionHistory || [];
    const newVersionNum = currentVersions.length + 1;
    const newVersion = {
      version: newVersionNum,
      date: new Date().toISOString().split('T')[0],
      author: 'Admin Operative',
      changes: `Đã sửa thông tin, giá bán đặt thành ${formatVnd(edited.price)}`
    };

    const finalProduct: Product = {
      ...product,
      ...(edited as Product),
      versionHistory: [newVersion, ...currentVersions],
      updatedAt: new Date().toISOString()
    };

    onSave(finalProduct);
    setIsEditing(false);
  };

  const handleDeleteClick = () => {
    if (onDelete) {
      onDelete(product.id);
      onClose();
    }
  };

  return createPortal(
    <div id="drawer-overlay" className="fixed inset-0 z-[100] flex justify-end overflow-hidden bg-slate-900/30 backdrop-blur-xs transition-opacity duration-200">
      {/* Click-outside zone */}
      <div className="hidden flex-1 md:block" onClick={onClose}></div>

      {/* Slide Drawer Content */}
      <div className="flex h-[100dvh] max-h-[100dvh] min-h-0 w-full max-w-xl flex-col overflow-hidden border-l border-slate-200 bg-white shadow-2xl animate-slide-left">
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 bg-slate-50/50 px-4 py-3 sm:items-center sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-center gap-3">
            {primaryImage ? (
              <img 
                referrerPolicy="no-referrer" 
                src={primaryImage} 
                alt={edited.name} 
                className="w-11 h-11 rounded-lg object-cover border border-slate-200" 
              />
            ) : (
              <div className="w-11 h-11 rounded-lg bg-blue-100 text-blue-700 font-extrabold flex items-center justify-center text-sm uppercase">
                {edited.name ? edited.name[0] : 'P'}
              </div>
            )}
            <div className="min-w-0">
              <span className="text-[10px] font-mono font-normal normal-case text-slate-400 block">{edited.sku}</span>
              <h2 className="max-w-[120px] truncate text-base font-medium normal-case text-slate-900 min-[390px]:max-w-[180px] sm:max-w-xs">{edited.name}</h2>
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
                    onClick={handleDeleteClick}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-1 text-xs font-bold cursor-pointer"
                    title="Xóa sản phẩm"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Xóa</span>
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={handleSaveAndCommit}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors shadow-xs cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  Lưu
                </button>
                <button
                  onClick={() => {
                    setEdited({ ...product });
                    setIsEditing(false);
                  }}
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

        {/* Navigation Tabs */}
        <div className="flex shrink-0 overflow-x-auto border-b border-slate-100 bg-white px-4 sm:px-6">
          <button
            onClick={() => setActiveTab('details')}
            className={`mr-5 shrink-0 border-b-2 px-1 py-3 text-sm font-semibold transition-all cursor-pointer sm:mr-6 ${
              activeTab === 'details' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Thông tin sản phẩm
          </button>
          <button
            onClick={() => setActiveTab('versions')}
            className={`flex shrink-0 items-center gap-1.5 border-b-2 px-1 py-3 text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'versions' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            Nhật ký thay đổi ({changeLogs.length})
          </button>
        </div>

        {/* Body Content */}
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-4 sm:p-6">
          {activeTab === 'details' && (
            isEditing ? (
              <div className="space-y-5">
                {/* Basic Meta fields */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Tên sản phẩm</label>
                    <input
                      type="text"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-blue-500 outline-none"
                      value={edited.name || ''}
                      onChange={(e) => handleChange('name', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Mã SKU định danh</label>
                    <input
                      type="text"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono font-semibold text-slate-800 focus:ring-1 focus:ring-blue-500 outline-none"
                      value={edited.sku || ''}
                      onChange={(e) => handleChange('sku', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Danh mục sản phẩm</label>
                  <CustomSelect
                    value={edited.category || ''}
                    onChange={(val) => handleChange('category', val)}
                    options={categories.map(cat => ({ value: cat, label: cat }))}
                    className="w-full"
                    showSearch={true}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Giá bán lẻ (đ)</label>
                    <input
                      type="number"
                      step={1000}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono font-semibold text-slate-800 focus:ring-1 focus:ring-blue-500 outline-none"
                      value={edited.price || 0}
                      onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Trạng thái hiển thị</label>
                    <CustomSelect
                      value={edited.status || 'draft'}
                      onChange={(val) => handleChange('status', val)}
                      options={[
                        { value: 'active', label: 'Hoạt động (Active)' },
                        { value: 'draft', label: 'Bản nháp (Draft)' },
                        { value: 'archived', label: 'Lưu trữ (Archived)' }
                      ]}
                      className="w-full"
                    />
                  </div>
                </div>

                <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <span>
                    <span className="block text-xs font-bold uppercase text-slate-700">Sản phẩm bán chạy</span>
                    <span className="mt-0.5 block text-[10px] font-medium text-slate-400">Bật để đánh dấu sản phẩm này trong nhóm bán chạy.</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={Boolean(edited.isBestSeller)}
                    onChange={(event) => handleChange('isBestSeller', event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </label>

                {/* Single warehouse stock */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <h4 className="text-xs font-bold text-slate-700 uppercase mb-3">Tồn kho kho chính</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-600">Kho chính</span>
                      <input
                        type="number"
                        min={0}
                        className="w-24 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-mono font-semibold text-slate-800 focus:ring-1 focus:ring-blue-500 outline-none text-right"
                        value={edited.warehouseStock?.MAIN ?? edited.inventory ?? 0}
                        onChange={(e) => handleWarehouseStockChange(parseInt(e.target.value) || 0)}
                      />
                    </div>
                  <div className="border-t border-slate-200/60 pt-2 flex justify-between text-xs font-medium text-slate-800">
                    <span>Tổng tồn kho</span>
                    <span className="font-normal normal-case">{edited.inventory} sản phẩm</span>
                  </div>
                  </div>
                </div>

                {/* Image upload */}
                <div>
                  <ImageUpload
                    value={primaryImage}
                    values={editedImages}
                    onChange={handlePrimaryImageChange}
                    onChangeMany={handleImagesChange}
                    onClear={() => handleImagesChange([])}
                    label="Hình ảnh sản phẩm"
                    className="w-full"
                    multiple
                    maxFiles={12}
                  />
                  <p className="mt-1 text-[10px] font-medium text-slate-400">
                    Ảnh đầu tiên sẽ dùng làm ảnh đại diện. Có thể thêm nhiều ảnh và xóa từng ảnh trong danh sách bên dưới.
                  </p>
                </div>

                {/* Standard Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Mô tả sản phẩm</label>
                  <textarea
                    rows={4}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                    value={edited.description || ''}
                    onChange={(e) => handleChange('description', e.target.value)}
                  />
                </div>

                {/* Tags list */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Bộ thẻ từ khóa tìm kiếm (Meta Tags)</label>
                  <div className="flex flex-wrap gap-1.5">
                    {edited.tags?.map((t, i) => (
                      <span key={i} className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium font-mono">
                        #{t}
                      </span>
                    ))}
                    {(!edited.tags || edited.tags.length === 0) && (
                      <span className="text-xs text-slate-400 italic">Chưa liên kết thẻ nào.</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                  {productImages.length > 0 ? (
                    <>
                      <div className="bg-slate-50">
                        <img
                          src={productImages[0]}
                          alt={product.name}
                          className="h-56 w-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex items-center justify-between border-t border-slate-100 px-3 py-2">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Thư viện ảnh</span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">{productImages.length} ảnh</span>
                      </div>
                      {displayImages.length > 0 && (
                        <div className="grid grid-cols-4 gap-2 border-t border-slate-100 bg-white p-2 sm:grid-cols-6">
                          {displayImages.map((image, index) => (
                            <img
                              key={`${image.slice(0, 32)}-${index}`}
                              src={image}
                              alt={`${product.name} ${index + 1}`}
                              className={`aspect-square rounded-lg border bg-slate-50 object-cover ${
                                index === 0 ? 'border-blue-300 ring-1 ring-blue-100' : 'border-slate-200'
                              }`}
                              referrerPolicy="no-referrer"
                            />
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex h-44 items-center justify-center bg-slate-50 text-xs font-semibold text-slate-400">
                      Chưa thiết lập hình ảnh sản phẩm.
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase text-slate-400">{product.sku}</p>
                      <h3 className="mt-1 text-base font-bold normal-case text-slate-900">{product.name}</h3>
                      <p className="mt-1 text-xs font-medium text-slate-500">{product.brand || 'Chưa có thương hiệu'} · {product.category || 'Chưa có danh mục'}</p>
                    </div>
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${
                      product.status === 'active'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : product.status === 'draft'
                        ? 'border-amber-200 bg-amber-50 text-amber-700'
                        : 'border-slate-200 bg-slate-50 text-slate-500'
                    }`}>
                      {product.status === 'active' ? 'Hoạt động' : product.status === 'draft' ? 'Bản nháp' : 'Lưu trữ'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    { label: 'Giá bán', value: formatVnd(product.price), tone: 'text-blue-700' },
                    { label: 'Tồn kho', value: `${product.inventory ?? 0} SP`, tone: 'text-emerald-700' },
                    { label: 'Đánh giá', value: `${product.rating || 0}/5`, tone: 'text-amber-700' },
                  ].map((item) => (
                    <div key={item.label} className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                      <span className="block text-[10px] font-bold uppercase text-slate-400">{item.label}</span>
                      <span className={`mt-1 block text-sm font-bold normal-case ${item.tone}`}>{item.value}</span>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <span className="block text-[10px] font-bold uppercase text-slate-400">Tổng quan</span>
                  <div className="mt-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                    {[
                      ['Mã SKU', product.sku],
                      ['Thương hiệu', product.brand || 'Chưa có'],
                      ['Danh mục', product.category || 'Chưa có'],
                      ['Kho chính', `${product.warehouseStock?.MAIN ?? product.inventory ?? 0} sản phẩm`],
                      ['Sản phẩm mới', product.isNew ? 'Có' : 'Không'],
                      ['Bán chạy', product.isBestSeller ? 'Có' : 'Không'],
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
                        <span className="font-semibold text-slate-500">{label}</span>
                        <span className="text-right font-bold text-slate-800">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <span className="block text-[10px] font-bold uppercase text-slate-400">Mô tả sản phẩm</span>
                  <div className="mt-2 whitespace-pre-line text-xs font-normal leading-6 normal-case text-slate-600">
                    {product.description || <span className="italic text-slate-400">Không có mô tả chi tiết.</span>}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <span className="block text-[10px] font-bold uppercase text-slate-400">Thuộc tính sản phẩm</span>
                    <div className="mt-3 space-y-2">
                      {productAttributes.length > 0 ? productAttributes.map((attribute) => (
                        <div key={attribute.name} className="rounded-lg bg-slate-50 p-3">
                          <span className="text-xs font-bold text-slate-700">{attribute.name}</span>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {attribute.values.map((value) => (
                              <span key={value} className="rounded-full bg-white px-2 py-1 text-[10px] font-bold text-slate-600 ring-1 ring-slate-200">
                                {value}
                              </span>
                            ))}
                          </div>
                        </div>
                      )) : (
                        <p className="text-xs italic text-slate-400">Chưa có thuộc tính.</p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <span className="block text-[10px] font-bold uppercase text-slate-400">Thông số kỹ thuật</span>
                    <div className="mt-3 divide-y divide-slate-100 rounded-lg bg-slate-50 px-3">
                      {productSpecs.length > 0 ? productSpecs.map(([key, value]) => (
                        <div key={key} className="flex items-start justify-between gap-3 py-2 text-xs">
                          <span className="font-semibold text-slate-500">{key}</span>
                          <span className="text-right font-bold text-slate-800">{value}</span>
                        </div>
                      )) : (
                        <p className="py-3 text-xs italic text-slate-400">Chưa có thông số kỹ thuật.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <span className="block text-[10px] font-bold uppercase text-slate-400">Bộ thẻ từ khóa tìm kiếm</span>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {product.tags?.map((t, i) => (
                      <span key={i} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold normal-case text-slate-600">
                        #{t}
                      </span>
                    ))}
                    {(!product.tags || product.tags.length === 0) && (
                      <span className="text-xs italic text-slate-400">Không có thẻ từ khóa.</span>
                    )}
                  </div>
                </div>
              </div>
            )
          )}

          {activeTab === 'versions' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-slate-600 mb-2">
                <History className="w-5 h-5 text-blue-600" />
                <h4 className="text-sm font-bold text-slate-800">Nhật ký thay đổi</h4>
              </div>

              <div className="relative border-l-2 border-slate-100 pl-4 ml-2 space-y-6">
                {changeLogsLoading && (
                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs font-semibold text-slate-400">
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
                    <span className={`absolute -left-[25px] top-1 w-3 h-3 rounded-full border-2 border-white ring-4 ${
                      log.action === 'create'
                        ? 'bg-emerald-500 ring-emerald-50'
                        : log.action === 'delete'
                        ? 'bg-rose-500 ring-rose-50'
                        : 'bg-blue-500 ring-blue-50'
                    }`}></span>
                    <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                      <div className="flex items-center justify-between gap-3 text-xs font-medium normal-case text-slate-800">
                        <span>{actionLabels[log.action]} sản phẩm</span>
                        <span className="text-slate-400 font-normal">{log.createdAt ? new Date(log.createdAt).toLocaleString('vi-VN', { hour12: false }) : '---'}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{log.summary}</p>
                      <span className="block text-[10px] text-slate-400 font-semibold mt-2 uppercase tracking-wide">Người sửa đổi: {log.actorName || 'Quản trị viên'}</span>
                    </div>
                  </div>
                ))}

                {!changeLogsLoading && !changeLogsError && changeLogs.length === 0 && (
                  <div className="relative">
                    <span className="absolute -left-[25px] top-1 w-3 h-3 rounded-full bg-slate-300 border-2 border-white ring-4 ring-slate-50"></span>
                    <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100">
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

export default ProductDrawer;
