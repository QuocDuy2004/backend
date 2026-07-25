import { useState, type FormEvent } from 'react';
import { ShoppingBag } from 'lucide-react';
import type { Category, Product } from '../../../types';
import { CustomSelect, ImageUpload } from '../../shared';
import { parseProductAttributes } from '../../../lib/productAttributes';
import { productsApi } from '../../../lib/api';

// ─── helpers ──────────────────────────────────────────────────────────────────

const parseSpecification = (text: string): Record<string, string> => {
  const content = text.trim();
  if (!content) return {};
  try {
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return Object.fromEntries(
        Object.entries(parsed as Record<string, unknown>)
          .filter(([k, v]) => k.trim() && String(v).trim())
          .map(([k, v]) => [k.trim(), String(v).trim()]),
      );
    }
  } catch { /* fall through */ }
  return Object.fromEntries(
    content.split('\n')
      .map(l => l.trim()).filter(Boolean)
      .map(l => { const [k, ...v] = l.split(':'); return [k.trim(), v.join(':').trim()]; })
      .filter(([k, v]) => k && v),
  );
};

const getAttr = (text: string, name: string) =>
  parseProductAttributes(text).find(a => a.name.toLowerCase() === name.toLowerCase())?.values.join(', ') ?? '';

const setAttr = (text: string, name: string, value: string) => {
  const others = parseProductAttributes(text).filter(a => a.name !== name);
  const values = value.split(',').map(v => v.trim()).filter(Boolean);
  const all = values.length ? [...others, { name, values }] : others;
  return all.map(a => `${a.name}: ${a.values.join(', ')}`).join('\n');
};

// ─── component ────────────────────────────────────────────────────────────────

type Props = {
  categories: Category[];
  onClose: () => void;
  onCreated: (product: Product) => void;
};

export function NewProductModal({ categories, onClose, onCreated }: Props) {
  const [name, setName]               = useState('');
  const [sku, setSku]                 = useState('');
  const [category, setCategory]       = useState(categories[0]?.name ?? '');
  const [price, setPrice]             = useState(50000);
  const [inventory, setInventory]     = useState(100);
  const [images, setImages]           = useState<string[]>([]);
  const [status, setStatus]           = useState<Product['status']>('active');
  const [isBestSeller, setBestSeller] = useState(false);
  const [description, setDescription] = useState('');
  const [attrText, setAttrText]       = useState('');
  const [specText, setSpecText]       = useState('');
  const [colorInput, setColorInput]   = useState('');
  const [sizeInput, setSizeInput]     = useState('');
  const [attrEnabled, setAttrEnabled] = useState(false);
  const [specEnabled, setSpecEnabled] = useState(false);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState('');

  const attrPreview = attrEnabled ? parseProductAttributes(attrText) : [];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !sku.trim()) return;
    setSaving(true);
    setError('');
    const now = new Date().toISOString();
    const payload: Partial<Product> = {
      id: `prod_${Date.now()}`,
      sku: sku.toUpperCase().replace(/\s+/g, ''),
      name: name.trim(),
      category,
      brand: 'InHouse',
      price, originalPrice: price, discountPrice: price,
      cost: parseFloat((price * 0.4).toFixed(2)),
      inventory, warehouseStock: { MAIN: inventory },
      rating: 0, sales: 0,
      status, createdAt: now, updatedAt: now,
      images, description: description.trim(),
      attributes: parseProductAttributes(attrText),
      specification: parseSpecification(specText),
      isBestSeller, tags: [category.toLowerCase()],
    };
    try {
      const data = await productsApi.create(payload);
      if (!data.ok) throw new Error(data.message || 'Failed to create product');
      onCreated(data.product);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-2xl animate-scale-up space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="flex items-center gap-1.5 text-base font-bold text-slate-800">
            <ShoppingBag className="h-5 w-5 text-blue-600" /> Thêm sản phẩm mới
          </h3>
          <button onClick={onClose} className="font-bold text-slate-400 hover:text-slate-600">✕</button>
        </div>

        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
          <div>
            <label className="mb-1 block uppercase text-slate-500">Tên sản phẩm</label>
            <input required value={name} onChange={e => setName(e.target.value)}
              placeholder="Ví dụ: Tai nghe soundWave"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-blue-500" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block uppercase text-slate-500">Mã SKU</label>
              <input required value={sku} onChange={e => setSku(e.target.value)}
                placeholder="EAR-S1-BLK"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label className="mb-1 block uppercase text-slate-500">Danh mục</label>
              <CustomSelect value={category} onChange={setCategory} showSearch
                options={categories.map(c => ({ value: c.name, label: c.name }))} className="w-full" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block uppercase text-slate-500">Giá bán (đ)</label>
              <input type="number" step="any" value={price}
                onChange={e => setPrice(Number(e.target.value) || 0)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label className="mb-1 block uppercase text-slate-500">Tồn kho</label>
              <input type="number" min={0} value={inventory}
                onChange={e => setInventory(parseInt(e.target.value) || 0)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="mb-1 block uppercase text-slate-500">Trạng thái</label>
              <CustomSelect value={status} onChange={v => setStatus(v as Product['status'])}
                options={[
                  { value: 'active',   label: 'Kinh doanh (Active)' },
                  { value: 'draft',    label: 'Tạm ngưng (Draft)' },
                  { value: 'archived', label: 'Lưu trữ (Archived)' },
                ]} className="w-full" />
            </div>
            <label className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <span className="text-xs font-bold uppercase text-slate-600">Đánh dấu bán chạy</span>
              <input type="checkbox" checked={isBestSeller} onChange={e => setBestSeller(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
            </label>
          </div>

          <div>
            <label className="mb-1 block uppercase text-slate-500">Mô tả</label>
            <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Mô tả chi tiết sản phẩm"
              className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-blue-500" />
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {/* Attributes */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <label className="flex items-center justify-between gap-3">
                <span>
                  <span className="block text-xs font-bold uppercase text-slate-600">Thuộc tính</span>
                  <span className="mt-0.5 block text-[10px] text-slate-400">Màu sắc, size, v.v.</span>
                </span>
                <input type="checkbox" checked={attrEnabled} onChange={e => {
                  setAttrEnabled(e.target.checked);
                  if (!e.target.checked) { setColorInput(''); setSizeInput(''); setAttrText(''); }
                }} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
              </label>
              {attrEnabled && (
                <div className="mt-3 space-y-2">
                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">Màu sắc</label>
                    <input value={colorInput} placeholder="Đỏ, Xanh, Vàng"
                      onChange={e => { setColorInput(e.target.value); setAttrText(t => setAttr(t, 'Mau sac', e.target.value)); }}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">Size</label>
                    <input value={sizeInput} placeholder="M, L, XL"
                      onChange={e => { setSizeInput(e.target.value); setAttrText(t => setAttr(t, 'Size', e.target.value)); }}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                  {attrPreview.length > 0 && (
                    <div className="space-y-1 rounded-lg border border-slate-200 bg-white p-2">
                      {attrPreview.map(a => (
                        <div key={a.name}>
                          <span className="text-[10px] font-bold uppercase text-slate-400">{a.name}</span>
                          <div className="mt-0.5 flex flex-wrap gap-1">
                            {a.values.map(v => (
                              <span key={v} className="rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-600 ring-1 ring-slate-200">{v}</span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Specification */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <label className="flex items-center justify-between gap-3">
                <span>
                  <span className="block text-xs font-bold uppercase text-slate-600">Thông số kỹ thuật</span>
                  <span className="mt-0.5 block text-[10px] text-slate-400">Chi tiết kỹ thuật JSON/text.</span>
                </span>
                <input type="checkbox" checked={specEnabled} onChange={e => {
                  setSpecEnabled(e.target.checked);
                  if (!e.target.checked) setSpecText('');
                }} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
              </label>
              {specEnabled && (
                <textarea rows={4} value={specText} onChange={e => setSpecText(e.target.value)}
                  placeholder={'Chất liệu: Cotton\nBảo hành: 12 tháng'}
                  className="mt-3 w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs outline-none focus:ring-1 focus:ring-blue-500" />
              )}
            </div>
          </div>

          <ImageUpload value={images[0] ?? ''} values={images}
            onChange={v => setImages(v ? [v] : [])} onChangeMany={setImages}
            onClear={() => setImages([])}
            label="Tải lên ảnh sản phẩm" className="w-full" multiple maxFiles={8} />

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
            <button type="button" onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50">
              Hủy bỏ
            </button>
            <button type="submit" disabled={saving}
              className="rounded-lg bg-blue-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60">
              {saving ? 'Đang lưu...' : 'Lưu sản phẩm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NewProductModal;
