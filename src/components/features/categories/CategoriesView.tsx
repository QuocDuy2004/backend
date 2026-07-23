import React, { useState } from 'react';
import { Product, Category } from '../../../types';
import CustomSelect from '../../shared/ui/CustomSelect';
import ImageUpload from '../../shared/ui/ImageUpload';
import CategoryDrawer from './CategoryDrawer';
import { 
  Archive, Boxes, CheckCircle2, FolderKanban, Plus, Search, Tag, Trash2
} from 'lucide-react';
import { categoriesApi } from '../../../lib/api';

interface CategoriesViewProps {
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

export default function CategoriesView({
  categories,
  setCategories,
  products,
  setProducts
}: CategoriesViewProps) {
  // Input states for adding new category (now in modal)
  const [newCatName, setNewCatName] = useState('');
  const [newCatImage, setNewCatImage] = useState('');
  const [newCatStatus, setNewCatStatus] = useState<'active' | 'inactive'>('active');

  // Modal open state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Drawer selected category
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);

  // Delete category overlay states
  const [deletingCat, setDeletingCat] = useState<Category | null>(null);
  const [transferTarget, setTransferTarget] = useState<string>('Uncategorized');
  const [categorySearch, setCategorySearch] = useState('');
  const [categoryStatusFilter, setCategoryStatusFilter] = useState('All');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  // Add Category Handler
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed) return;

    if (categories.some(cat => cat.name.toLowerCase() === trimmed.toLowerCase())) {
      alert('Danh mục này đã tồn tại!');
      return;
    }

    try {
      const data = await categoriesApi.create({
          name: trimmed,
          image: newCatImage || undefined,
          status: newCatStatus,
      });

      setCategories(prev => [...prev, data.category]);
      setNewCatName('');
      setNewCatImage('');
      setNewCatStatus('active');
      setIsAddModalOpen(false);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  // Toggle active/inactive status from list
  const handleToggleStatus = async (id: string, currentStatus: 'active' | 'inactive') => {
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const category = categories.find(cat => cat.id === id);
    if (!category) return;

    try {
      const data = await categoriesApi.update(id, { ...category, status: nextStatus });

      setCategories(prev => prev.map(cat => cat.id === id ? data.category : cat));
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  const handleBulkCategoryStatus = async (status: 'active' | 'inactive') => {
    const selectedCategories = categories.filter(cat => selectedCategoryIds.includes(cat.id));

    try {
      const updatedCategories = await Promise.all(
        selectedCategories.map(async (category) =>
          (await categoriesApi.update(category.id, { ...category, status })).category as Category
        )
      );

      setCategories(prev => prev.map(cat => updatedCategories.find(updated => updated.id === cat.id) || cat));
      setSelectedCategoryIds([]);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  // Save changes from CategoryDrawer
  const handleSaveCategory = async (updatedCategory: Category) => {
    const oldCategory = categories.find(c => c.id === updatedCategory.id);
    if (!oldCategory) return;

    const trimmedName = updatedCategory.name.trim();
    const now = new Date().toISOString();

    try {
      const data = await categoriesApi.update(updatedCategory.id, { ...updatedCategory, name: trimmedName });

      setCategories(prev => prev.map(cat => cat.id === updatedCategory.id ? data.category : cat));
      setActiveCategory(data.category);

      if (trimmedName !== oldCategory.name) {
        setProducts(prevProducts =>
          prevProducts.map(prod => {
            if (prod.category === oldCategory.name) {
              return { ...prod, category: trimmedName, updatedAt: now };
            }
            return prod;
          })
        );
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  // Open Delete Dialog
  const handleOpenDelete = (cat: Category) => {
    setDeletingCat(cat);
    // Suggest first available category that is not the one being deleted
    const available = categories.filter(c => c.id !== cat.id);
    setTransferTarget(available[0]?.name || 'Uncategorized');
  };

  // Confirm Delete and migrate products
  const handleConfirmDelete = async () => {
    if (!deletingCat) return;

    try {
      await categoriesApi.remove(deletingCat.id, transferTarget);

      setCategories(prev => prev.filter(c => c.id !== deletingCat.id));

      const now = new Date().toISOString();
      setProducts(prevProducts =>
        prevProducts.map(prod => {
          if (prod.category === deletingCat.name) {
            return { ...prod, category: transferTarget, updatedAt: now };
          }
          return prod;
        })
      );

      setDeletingCat(null);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  const handleBulkCategoryDelete = async () => {
    if (selectedCategoryIds.length === 0) return;

    const selectedCategories = categories.filter(cat => selectedCategoryIds.includes(cat.id));
    const confirmed = window.confirm(`Bạn có chắc muốn xóa ${selectedCategories.length} danh mục đã chọn? Sản phẩm thuộc các danh mục này sẽ chuyển sang Uncategorized.`);
    if (!confirmed) return;

    try {
      await Promise.all(
        selectedCategories.map((category) => categoriesApi.remove(category.id, 'Uncategorized'))
      );

      const selectedNames = new Set(selectedCategories.map(category => category.name));
      const now = new Date().toISOString();

      setCategories(prev => prev.filter(category => !selectedCategoryIds.includes(category.id)));
      setProducts(prevProducts =>
        prevProducts.map(product =>
          selectedNames.has(product.category)
            ? { ...product, category: 'Uncategorized', updatedAt: now }
            : product
        )
      );
      if (activeCategory && selectedCategoryIds.includes(activeCategory.id)) {
        setActiveCategory(null);
      }
      setSelectedCategoryIds([]);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  // Calculate statistics for each category
  const getCategoryStats = (catName: string) => {
    const catProducts = products.filter(p => p.category === catName);
    const count = catProducts.length;
    const totalInventory = catProducts.reduce((sum, p) => sum + p.inventory, 0);
    const avgPrice = count > 0 
      ? catProducts.reduce((sum, p) => sum + p.price, 0) / count 
      : 0;
    
    return {
      count,
      totalInventory,
      avgPrice
    };
  };

  const filteredCategories = categories.filter(cat => {
    const matchSearch =
      cat.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
      cat.id.toLowerCase().includes(categorySearch.toLowerCase());
    const matchStatus = categoryStatusFilter === 'All' || cat.status === categoryStatusFilter;
    return matchSearch && matchStatus;
  });

  const activeCount = filteredCategories.filter(cat => cat.status === 'active').length;
  const filteredProductCount = filteredCategories.reduce((total, cat) => total + getCategoryStats(cat.name).count, 0);
  const filteredInventoryCount = filteredCategories.reduce((total, cat) => total + getCategoryStats(cat.name).totalInventory, 0);
  const visibleCategoryIds = filteredCategories.map(cat => cat.id);
  const allVisibleSelected = visibleCategoryIds.length > 0 && visibleCategoryIds.every(id => selectedCategoryIds.includes(id));

  const handleToggleAllVisibleCategories = (checked: boolean) => {
    if (checked) {
      setSelectedCategoryIds(prev => Array.from(new Set([...prev, ...visibleCategoryIds])));
      return;
    }
    setSelectedCategoryIds(prev => prev.filter(id => !visibleCategoryIds.includes(id)));
  };

  const handleToggleCategorySelection = (id: string, checked: boolean) => {
    setSelectedCategoryIds(prev => checked ? [...prev, id] : prev.filter(selectedId => selectedId !== id));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* HEADER SECTION */}
      <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-transparent p-5 rounded-2xl border border-blue-100/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-extrabold text-slate-900">Quản Lý Danh Mục Sản Phẩm</h2>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Phân loại hàng hóa giúp khách hàng dễ tìm kiếm. Đổi tên danh mục tự động đồng bộ sang tất cả sản phẩm liên quan.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Tổng danh mục', value: filteredCategories.length.toLocaleString('vi-VN'), icon: FolderKanban, tone: 'border-blue-100 bg-blue-50 text-blue-700' },
          { label: 'Đang hoạt động', value: activeCount.toLocaleString('vi-VN'), icon: CheckCircle2, tone: 'border-emerald-100 bg-emerald-50 text-emerald-700' },
          { label: 'Sản phẩm liên kết', value: filteredProductCount.toLocaleString('vi-VN'), icon: Boxes, tone: 'border-indigo-100 bg-indigo-50 text-indigo-700' },
          { label: 'Tổng tồn kho', value: filteredInventoryCount.toLocaleString('vi-VN'), icon: Archive, tone: 'border-amber-100 bg-amber-50 text-amber-700' },
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

      <div className="flex flex-col items-stretch gap-3.5 rounded-lg border border-slate-200 bg-white p-3 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex h-10 w-full items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3 shadow-xs lg:max-w-[440px]">
          <Search className="h-[18px] w-[18px] text-slate-400" />
          <input
            type="text"
            placeholder="Tìm danh mục theo tên, mã ID..."
            className="w-full bg-transparent text-xs text-slate-800 outline-none placeholder:text-slate-400"
            value={categorySearch}
            onChange={(e) => setCategorySearch(e.target.value)}
          />
        </div>

        <div className="flex w-full flex-wrap items-center justify-end gap-2 lg:w-auto">
          <CustomSelect
            value={categoryStatusFilter}
            onChange={setCategoryStatusFilter}
            options={[
              { value: 'All', label: 'Tất cả trạng thái' },
              { value: 'active', label: 'Hoạt động' },
              { value: 'inactive', label: 'Tạm dừng' },
            ]}
            icon={<Tag className="w-3.5 h-3.5" />}
          />
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-blue-600 px-4 text-xs font-bold text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" /> Thêm danh mục
          </button>
        </div>
      </div>

      {/* NEW CATEGORY MODAL DIALOG */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl p-6 w-full max-w-md space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                <FolderKanban className="w-5 h-5 text-blue-600" /> Thêm danh mục mới vào danh mục
              </h3>
              <button 
                onClick={() => setIsAddModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleAddCategory} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-500 uppercase mb-1">Tên Danh Mục</label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Ví dụ: Điện thoại, Đồ gia dụng..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-slate-500 uppercase mb-1">Trạng Thái Ban Đầu</label>
                <CustomSelect
                  value={newCatStatus}
                  onChange={(val) => setNewCatStatus(val as any)}
                  options={[
                    { value: 'active', label: 'Hoạt động (Active)' },
                    { value: 'inactive', label: 'Ngưng hoạt động (Inactive)' }
                  ]}
                  className="w-full"
                />
              </div>

              <div>
                <ImageUpload
                  value={newCatImage}
                  onChange={setNewCatImage}
                  onClear={() => setNewCatImage('')}
                  label="Hình đại diện danh mục"
                  className="w-full"
                />
              </div>
              
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-bold cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm cursor-pointer"
                >
                  Tạo danh mục
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE & TRANSFER DIALOG OVERLAY */}
      {deletingCat && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            
            <div className="text-center space-y-2">
              <h4 className="text-sm font-extrabold text-slate-900">Xác nhận xóa danh mục "{deletingCat.name}"?</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Có <strong>{products.filter(p => p.category === deletingCat.name).length}</strong> sản phẩm đang thuộc danh mục này. Bạn cần chọn danh mục mới để chuyển các sản phẩm này sang trước khi xóa.
              </p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2" onClick={(e) => e.stopPropagation()}>
              <label className="block text-[10px] font-bold text-slate-400 uppercase">Chuyển sản phẩm sang:</label>
              
              <CustomSelect
                value={transferTarget}
                onChange={setTransferTarget}
                options={[
                  { value: 'Uncategorized', label: 'Không phân loại (Uncategorized)' },
                  ...categories.filter(c => c.id !== deletingCat.id).map(cat => ({ value: cat.name, label: cat.name }))
                ]}
                icon={<FolderKanban className="w-3.5 h-3.5" />}
                className="w-full"
                showSearch={true}
              />
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm cursor-pointer"
              >
                Xác nhận xóa & chuyển
              </button>
              <button
                onClick={() => setDeletingCat(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedCategoryIds.length > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3.5 text-xs font-semibold text-blue-900 animate-slide-down sm:flex-row sm:items-center sm:justify-between">
          <span>Đã chọn {selectedCategoryIds.length} danh mục. Chọn thao tác:</span>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => handleBulkCategoryStatus('active')} className="rounded bg-blue-600 px-3 py-1 text-white hover:bg-blue-700">Kích hoạt</button>
            <button onClick={() => handleBulkCategoryStatus('inactive')} className="rounded bg-slate-800 px-3 py-1 text-slate-100 hover:bg-slate-700">Tạm dừng</button>
            <button onClick={() => setSelectedCategoryIds([])} className="rounded border border-blue-200 bg-white px-3 py-1 text-blue-700 hover:bg-blue-100">Bỏ chọn</button>
            <button onClick={handleBulkCategoryDelete} className="flex items-center gap-1.5 rounded bg-rose-600 px-3 py-1 text-white hover:bg-rose-700">
              <Trash2 className="h-3.5 w-3.5" /> Xóa đã chọn
            </button>
          </div>
        </div>
      )}

      {/* CATEGORIES DATA TABLE */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase">Danh Sách Danh Mục Hiện Tại</span>
          <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{categories.length} Nhóm</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase">
                <th className="px-5 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={(e) => handleToggleAllVisibleCategories(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-5 py-3 w-20">Hình ảnh</th>
                <th className="px-5 py-3">Danh mục & Mã ID</th>
                <th className="px-5 py-3 text-center">Số sản phẩm</th>
                <th className="px-5 py-3 text-right">Tổng tồn kho</th>
                <th className="px-5 py-3">Ngày tạo</th>
                <th className="px-5 py-3">Ngày cập nhật</th>
                <th className="px-5 py-3 text-center">Trạng thái</th>
                <th className="px-5 py-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredCategories.map((cat) => {
                const stats = getCategoryStats(cat.name);
                const isChecked = selectedCategoryIds.includes(cat.id);

                return (
                  <tr 
                    key={cat.id} 
                    className="hover:bg-slate-50/40 cursor-pointer transition-colors"
                    onClick={() => setActiveCategory(cat)}
                  >
                    <td className="px-5 py-3 w-10" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => handleToggleCategorySelection(cat.id, e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    {/* Image Column */}
                    <td className="px-5 py-3 w-20">
                      {cat.image ? (
                        <img 
                          src={cat.image} 
                          alt={cat.name} 
                          className="w-10 h-10 object-cover rounded-lg border border-slate-200/80 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center font-bold text-[10px] uppercase border border-slate-200 shrink-0">
                          {cat.name[0]?.toUpperCase() || 'DM'}
                        </div>
                      )}
                    </td>
                    
                    {/* Name & ID Column */}
                    <td className="px-5 py-3 font-semibold text-slate-900">
                      <div>
                        <span className="block hover:text-blue-600 transition-colors text-slate-900 font-bold">{cat.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">{cat.id}</span>
                      </div>
                    </td>

                    {/* Stats Product Count Column */}
                    <td className="px-5 py-3 text-center">
                      <span className="font-extrabold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg text-xs">
                        {stats.count}
                      </span>
                    </td>

                    {/* Total Inventory Column */}
                    <td className="px-5 py-3 text-right font-semibold text-slate-800">
                      {stats.totalInventory} sản phẩm
                    </td>

                    {/* Created Date Column */}
                    <td className="px-5 py-3 text-slate-500 font-mono text-[10px]">
                      {cat.createdAt ? new Date(cat.createdAt).toLocaleString('vi-VN', { hour12: false }) : '---'}
                    </td>

                    {/* Updated Date Column */}
                    <td className="px-5 py-3 text-slate-500 font-mono text-[10px]">
                      {cat.updatedAt ? new Date(cat.updatedAt).toLocaleString('vi-VN', { hour12: false }) : '---'}
                    </td>

                    {/* Status Column */}
                    <td className="px-5 py-3 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                        cat.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-50 text-slate-500 border-slate-200'
                      }`}>
                        {cat.status === 'active' ? 'Hoạt động' : 'Tạm dừng'}
                      </span>
                    </td>

                    {/* Action controls Column (Toggle Switch) */}
                    <td className="px-5 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleToggleStatus(cat.id, cat.status)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            cat.status === 'active' ? 'bg-emerald-500' : 'bg-slate-200'
                          }`}
                          title={cat.status === 'active' ? 'Ngưng hoạt động' : 'Kích hoạt'}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                              cat.status === 'active' ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredCategories.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-400 font-semibold">
                    Không tìm thấy danh mục nào. Hãy thêm một danh mục mới phía trên.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card Layout for Categories */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {filteredCategories.map((cat) => {
          const stats = getCategoryStats(cat.name);
          const isChecked = selectedCategoryIds.includes(cat.id);
          return (
            <div
              key={cat.id}
              className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-xs hover:border-slate-300 transition-all cursor-pointer"
              onClick={() => setActiveCategory(cat)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => handleToggleCategorySelection(cat.id, e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  {cat.image ? (
                    <img 
                      src={cat.image} 
                      alt={cat.name} 
                      className="w-12 h-12 object-cover rounded-lg border border-slate-200/80 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center font-bold text-xs uppercase border border-slate-200 shrink-0">
                      {cat.name[0]?.toUpperCase() || 'DM'}
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm hover:text-blue-600 transition-colors line-clamp-1">{cat.name}</h4>
                    <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{cat.id}</span>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleToggleStatus(cat.id, cat.status)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      cat.status === 'active' ? 'bg-emerald-500' : 'bg-slate-200'
                    }`}
                    title={cat.status === 'active' ? 'Ngưng hoạt động' : 'Kích hoạt'}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        cat.status === 'active' ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Số sản phẩm</span>
                  <span className="font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-lg text-xs mt-0.5 inline-block">
                    {stats.count}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Tổng tồn kho</span>
                  <span className="font-semibold text-slate-800">{stats.totalInventory} SP</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Ngày tạo</span>
                  <span className="text-slate-500 font-mono text-[10px] block mt-0.5">
                    {cat.createdAt ? new Date(cat.createdAt).toLocaleDateString('vi-VN') : '---'}
                  </span>
                </div>
                <div className="text-right flex flex-col justify-between items-end">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Trạng thái</span>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border mt-0.5 ${
                    cat.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-50 text-slate-500 border-slate-200'
                  }`}>
                    {cat.status === 'active' ? 'Hoạt động' : 'Tạm dừng'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {filteredCategories.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-sm">
            Không tìm thấy danh mục nào. Hãy thêm một danh mục mới phía trên.
          </div>
        )}
      </div>

      {/* CATEGORY DETAIL SIDE DRAWER */}
      <CategoryDrawer
        category={activeCategory}
        isOpen={activeCategory !== null}
        onClose={() => setActiveCategory(null)}
        products={products}
        categories={categories}
        onSave={handleSaveCategory}
        onDelete={handleOpenDelete}
      />
    </div>
  );
}



