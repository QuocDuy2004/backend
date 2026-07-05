import type { Dispatch, FormEvent, SetStateAction } from 'react';
import { ShoppingBag } from 'lucide-react';
import type { Category, Product } from '../../../types';
import { CustomSelect, ImageUpload } from '../../shared';

type ProductStatus = Product['status'];

type NewProductModalProps = {
  categories: Category[];
  newProdName: string;
  setNewProdName: Dispatch<SetStateAction<string>>;
  newProdSKU: string;
  setNewProdSKU: Dispatch<SetStateAction<string>>;
  newProdCategory: string;
  setNewProdCategory: Dispatch<SetStateAction<string>>;
  newProdPrice: number;
  setNewProdPrice: Dispatch<SetStateAction<number>>;
  newProdInventory: number;
  setNewProdInventory: Dispatch<SetStateAction<number>>;
  newProdImage: string;
  setNewProdImage: Dispatch<SetStateAction<string>>;
  newProdStatus: ProductStatus;
  setNewProdStatus: Dispatch<SetStateAction<ProductStatus>>;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
};

export function NewProductModal({
  categories,
  newProdName,
  setNewProdName,
  newProdSKU,
  setNewProdSKU,
  newProdCategory,
  setNewProdCategory,
  newProdPrice,
  setNewProdPrice,
  newProdInventory,
  setNewProdInventory,
  newProdImage,
  setNewProdImage,
  newProdStatus,
  setNewProdStatus,
  onClose,
  onSubmit: handleCreateProduct,
}: NewProductModalProps) {
  return (
        <div id="new-product-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl p-6 w-full max-w-md space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                <ShoppingBag className="w-5 h-5 text-blue-600" /> Thêm sản phẩm mới vào danh mục
              </h3>
              <button onClick={() => onClose()} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-500 uppercase mb-1">Tên sản phẩm</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Tai nghe chụp tai soundWave"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 uppercase mb-1">Mã SKU</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: EAR-S1-BLK"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
                    value={newProdSKU}
                    onChange={(e) => setNewProdSKU(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-slate-500 uppercase mb-1">Danh mục</label>
                  <CustomSelect
                    value={newProdCategory}
                    onChange={setNewProdCategory}
                    options={categories.map(cat => ({ value: cat.name, label: cat.name }))}
                    className="w-full"
                    showSearch={true}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 uppercase mb-1">Giá bán lẻ ($)</label>
                  <input
                    type="number"
                    min={1}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(parseInt(e.target.value) || 1)}
                  />
                </div>
                <div>
                  <label className="block text-slate-500 uppercase mb-1">Tồn kho ban đầu</label>
                  <input
                    type="number"
                    min={0}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
                    value={newProdInventory}
                    onChange={(e) => setNewProdInventory(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-slate-500 uppercase mb-1">Trạng thái hoạt động</label>
                  <CustomSelect
                    value={newProdStatus}
                    onChange={(val) => setNewProdStatus(val as any)}
                    options={[
                      { value: 'active', label: 'Kinh doanh (Active)' },
                      { value: 'draft', label: 'Tạm ngưng/Nháp (Inactive)' },
                      { value: 'archived', label: 'Lưu trữ (Archived)' }
                    ]}
                    className="w-full"
                  />
                </div>
              </div>

              <ImageUpload
                value={newProdImage}
                onChange={setNewProdImage}
                onClear={() => setNewProdImage('')}
                label="Tải lên ảnh sản phẩm"
                className="w-full"
              />

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 text-xs">
                <button
                  type="button"
                  onClick={() => onClose()}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-bold cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm cursor-pointer"
                >
                  Lưu sản phẩm
                </button>
              </div>
            </form>
          </div>
        </div>
  );
}


