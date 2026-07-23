import { useState, type Dispatch, type FormEvent, type SetStateAction } from 'react';
import { ShoppingBag } from 'lucide-react';
import type { Category, Product } from '../../../types';
import { CustomSelect, ImageUpload } from '../../shared';
import { parseProductAttributes } from '../../../lib/productAttributes';

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
  newProdImages: string[];
  setNewProdImages: Dispatch<SetStateAction<string[]>>;
  newProdStatus: ProductStatus;
  setNewProdStatus: Dispatch<SetStateAction<ProductStatus>>;
  newProdIsBestSeller: boolean;
  setNewProdIsBestSeller: Dispatch<SetStateAction<boolean>>;
  newProdDescription: string;
  setNewProdDescription: Dispatch<SetStateAction<string>>;
  newProdAttributesText: string;
  setNewProdAttributesText: Dispatch<SetStateAction<string>>;
  newProdSpecificationText: string;
  setNewProdSpecificationText: Dispatch<SetStateAction<string>>;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
};

const parseMoneyInput = (value: string) => {
  if (value.trim() === '') return 0;
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
};

function getAttributeInputValue(text: string, attributeName: string) {
  const targetName = attributeName.toLowerCase();
  const attribute = parseProductAttributes(text).find((item) => item.name.toLowerCase() === targetName);
  return attribute?.values.join(', ') || '';
}

function setAttributeInputValue(text: string, attributeName: 'Mau sac' | 'Size', value: string) {
  const attributes = parseProductAttributes(text).filter((item) => item.name !== attributeName);
  const values = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  if (values.length > 0) {
    attributes.push({ name: attributeName, values });
  }

  return attributes.map((item) => `${item.name}: ${item.values.join(', ')}`).join('\n');
}

export default NewProductModal;

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
  newProdImages,
  setNewProdImages,
  newProdStatus,
  setNewProdStatus,
  newProdIsBestSeller,
  setNewProdIsBestSeller,
  newProdDescription,
  setNewProdDescription,
  newProdAttributesText,
  setNewProdAttributesText,
  newProdSpecificationText,
  setNewProdSpecificationText,
  onClose,
  onSubmit: handleCreateProduct,
}: NewProductModalProps) {
  const [attributesEnabled, setAttributesEnabled] = useState(false);
  const [specificationEnabled, setSpecificationEnabled] = useState(false);
  const [colorInputValue, setColorInputValue] = useState(() => getAttributeInputValue(newProdAttributesText, 'Mau sac'));
  const [sizeInputValue, setSizeInputValue] = useState(() => getAttributeInputValue(newProdAttributesText, 'Size'));
  const attributePreview = attributesEnabled ? parseProductAttributes(newProdAttributesText) : [];

  return (
        <div id="new-product-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-2xl animate-scale-up space-y-4">
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
                  <label className="block text-slate-500 uppercase mb-1">Giá bán lẻ (đ)</label>
                  <input
                    type="number"
                    step="any"
                    inputMode="decimal"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(parseMoneyInput(e.target.value))}
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
                <label className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <span className="text-xs font-bold uppercase text-slate-600">Đánh dấu bán chạy</span>
                  <input
                    type="checkbox"
                    checked={newProdIsBestSeller}
                    onChange={(event) => setNewProdIsBestSeller(event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </label>
              </div>

              <div>
                <label className="block text-slate-500 uppercase mb-1">Mô tả sản phẩm</label>
                <textarea
                  value={newProdDescription}
                  onChange={(event) => setNewProdDescription(event.target.value)}
                  rows={3}
                  placeholder="Nhập mô tả chi tiết sản phẩm"
                  className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <label className="flex items-center justify-between gap-3">
                    <span>
                      <span className="block text-xs font-bold uppercase text-slate-600">Thuộc tính sản phẩm</span>
                      <span className="mt-0.5 block text-[10px] font-medium text-slate-400">Bật nếu sản phẩm có biến thể như màu, size.</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={attributesEnabled}
                      onChange={(event) => {
                        setAttributesEnabled(event.target.checked);
                        if (!event.target.checked) {
                          setColorInputValue('');
                          setSizeInputValue('');
                          setNewProdAttributesText('');
                        }
                      }}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </label>

                  {attributesEnabled && (
                    <div className="mt-3 space-y-3">
                      <div className="space-y-2">
                        <div>
                          <label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">Màu sắc</label>
                          <input
                            value={colorInputValue}
                            onChange={(event) => {
                              const value = event.target.value;
                              setColorInputValue(value);
                              setNewProdAttributesText((current) => setAttributeInputValue(current, 'Mau sac', value));
                            }}
                            placeholder="Đỏ, Xanh, Vàng"
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <p className="mt-1 text-[10px] font-medium text-slate-400">Nhập từng màu và phân cách bằng dấu phẩy. Ví dụ: Đỏ, Xanh, Vàng.</p>
                        </div>
                        <div>
                          <label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">Size</label>
                          <input
                            value={sizeInputValue}
                            onChange={(event) => {
                              const value = event.target.value;
                              setSizeInputValue(value);
                              setNewProdAttributesText((current) => setAttributeInputValue(current, 'Size', value));
                            }}
                            placeholder="M, L, XL"
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <p className="mt-1 text-[10px] font-medium text-slate-400">Nhập từng size và phân cách bằng dấu phẩy. Ví dụ: M, L, XL.</p>
                        </div>
                      </div>
                      {attributePreview.length > 0 && (
                        <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-2">
                          {attributePreview.map((attribute) => (
                            <div key={attribute.name}>
                              <span className="text-[10px] font-bold uppercase text-slate-400">{attribute.name}</span>
                              <div className="mt-1 flex flex-wrap gap-1">
                                {attribute.values.map((value) => (
                                  <span key={`${attribute.name}-${value}`} className="rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-600 ring-1 ring-slate-200">
                                    {value}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <label className="flex items-center justify-between gap-3">
                    <span>
                      <span className="block text-xs font-bold uppercase text-slate-600">Thông số kỹ thuật</span>
                      <span className="mt-0.5 block text-[10px] font-medium text-slate-400">Bật nếu cần thông số kỹ thuật chi tiết.</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={specificationEnabled}
                      onChange={(event) => {
                        setSpecificationEnabled(event.target.checked);
                        if (!event.target.checked) setNewProdSpecificationText('');
                      }}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </label>

                  {specificationEnabled && (
                    <div className="mt-3 space-y-2">
                      <textarea
                        value={newProdSpecificationText}
                        onChange={(event) => setNewProdSpecificationText(event.target.value)}
                        rows={4}
                        placeholder={'Chất liệu: Cotton\nBảo hành: 12 tháng\n\nHoặc JSON: {"Chất liệu":"Cotton","Bảo hành":"12 tháng"}'}
                        className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <p className="text-[10px] font-medium text-slate-400">Mỗi dòng là một thông số theo dạng Tên thông số: Nội dung. Nội dung này sẽ lưu vào cột specification dạng JSON.</p>
                    </div>
                  )}
                </div>
              </div>

              <ImageUpload
                value={newProdImages[0] || ''}
                values={newProdImages}
                onChange={(value) => setNewProdImages(value ? [value] : [])}
                onChangeMany={setNewProdImages}
                onClear={() => setNewProdImages([])}
                label="Tải lên nhiều ảnh sản phẩm"
                className="w-full"
                multiple
                maxFiles={8}
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


