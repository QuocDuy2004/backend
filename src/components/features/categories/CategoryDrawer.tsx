import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles, Check, Save, Layers, FolderKanban, ShoppingBag, Eye, EyeOff, Calendar, Edit3, Trash2 } from 'lucide-react';
import { Category, Product } from '../../../types';
import CustomSelect from '../../shared/ui/CustomSelect';
import ImageUpload from '../../shared/ui/ImageUpload';

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
  const [activeTab, setActiveTab] = useState<'details' | 'products'>('details');
  const [isEditing, setIsEditing] = useState(false);
  
  // Edited values
  const [editedName, setEditedName] = useState('');
  const [editedStatus, setEditedStatus] = useState<'active' | 'inactive'>('active');
  const [editedImage, setEditedImage] = useState('');

  useEffect(() => {
    if (category) {
      setEditedName(category.name);
      setEditedStatus(category.status);
      setEditedImage(category.image || '');
      setActiveTab('details');
      setIsEditing(false);
    }
  }, [category]);

  if (!isOpen || !category) return null;

  // Statistics
  const catProducts = products.filter(p => p.category === category.name);
  const totalProducts = catProducts.length;
  const totalStock = catProducts.reduce((sum, p) => sum + p.inventory, 0);
  const avgPrice = totalProducts > 0 
    ? catProducts.reduce((sum, p) => sum + p.price, 0) / totalProducts 
    : 0;

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
              <h2 className="max-w-[120px] truncate text-base font-extrabold text-slate-900 min-[390px]:max-w-[180px] sm:max-w-xs">{isEditing ? editedName : category.name}</h2>
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
            <span className="text-base font-extrabold text-slate-800">{totalProducts}</span>
          </div>
          <div className="p-2 bg-white rounded-xl border border-slate-200/60 shadow-2xs">
            <span className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Tổng tồn kho</span>
            <span className="text-base font-extrabold text-slate-800">{totalStock}</span>
          </div>
          <div className="p-2 bg-white rounded-xl border border-slate-200/60 shadow-2xs">
            <span className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Giá bán TB</span>
            <span className="text-base font-extrabold text-slate-800">${avgPrice.toFixed(2)}</span>
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
            onClick={() => setActiveTab('products')}
            className={`flex-1 py-3 text-xs font-bold border-b-2 text-center transition-colors cursor-pointer ${
              activeTab === 'products'
                ? 'border-blue-600 text-blue-600 bg-blue-50/20'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            Sản phẩm liên kết ({totalProducts})
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
              <div className="space-y-6 text-xs font-semibold">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
                  <h3 className="text-xs font-extrabold text-slate-800 uppercase mb-2 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    <Layers className="w-4 h-4 text-blue-600" /> Thông tin danh mục
                  </h3>

                  <div>
                    <label className="block text-slate-400 uppercase text-[10px] mb-1.5">Tên danh mục</label>
                    <p className="text-sm font-extrabold text-slate-800">{category.name}</p>
                  </div>

                  <div>
                    <label className="block text-slate-400 uppercase text-[10px] mb-1.5">Trạng thái hoạt động</label>
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                      category.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-50 text-slate-500 border-slate-200'
                    }`}>
                      {category.status === 'active' ? 'Hoạt động' : 'Ngưng hoạt động'}
                    </span>
                  </div>

                  <div>
                    <label className="block text-slate-400 uppercase text-[10px] mb-1.5">Hình đại diện</label>
                    {category.image ? (
                      <img 
                        src={category.image} 
                        alt={category.name} 
                        className="w-32 h-32 object-cover rounded-xl border border-slate-200"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <p className="text-slate-400 italic">Chưa có ảnh đại diện</p>
                    )}
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
              </div>
            )
          ) : (
            <div className="space-y-3">
              <div className="bg-white rounded-xl border border-slate-200/60 shadow-3xs p-3 flex justify-between items-center text-xs font-bold text-slate-500">
                <span>DANH SÁCH SẢN PHẨM ({totalProducts})</span>
                <span className="text-slate-400 font-mono text-[10px]">Danh mục: {category.name}</span>
              </div>

              <div className="space-y-2">
                {catProducts.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-150 shadow-3xs hover:border-slate-300 transition-all">
                    <div className="flex items-center gap-3 min-w-0">
                      {p.images?.[0] ? (
                        <img 
                          src={p.images[0]} 
                          alt={p.name} 
                          className="w-10 h-10 object-cover rounded-lg border border-slate-100 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center font-bold text-[10px] border border-slate-150 shrink-0">
                          NO IMG
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-slate-800 text-xs truncate">{p.name}</h4>
                        <span className="block text-[9px] font-mono text-slate-400 mt-0.5">{p.sku}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-bold text-slate-900">${p.price.toFixed(2)}</div>
                      <div className="text-[10px] font-semibold text-slate-500 mt-0.5">Kho: {p.inventory} sp</div>
                    </div>
                  </div>
                ))}

                {totalProducts === 0 && (
                  <div className="bg-white p-12 text-center text-slate-400 rounded-xl border border-dashed border-slate-200/80">
                    <ShoppingBag className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-xs font-semibold">Chưa có sản phẩm nào thuộc danh mục này.</p>
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


