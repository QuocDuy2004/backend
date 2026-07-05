import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles, Languages, Check, ArrowRight, Save, History, RefreshCw, AlertCircle, ChevronDown, Edit3, Trash2, Calendar, ShieldCheck, Tag } from 'lucide-react';
import { Product } from '../../../types';
import CustomSelect from '../../shared/ui/CustomSelect';
import ImageUpload from '../../shared/ui/ImageUpload';

interface ProductDrawerProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedProduct: Product) => void;
  onDelete?: (productId: string) => void;
  categories: string[];
}

export default function ProductDrawer({ product, isOpen, onClose, onSave, onDelete, categories }: ProductDrawerProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'ai' | 'versions'>('details');
  const [isEditing, setIsEditing] = useState(false);
  const [edited, setEdited] = useState<Partial<Product>>({});
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiFeaturesText, setAiFeaturesText] = useState('');
  const [seoGenerating, setSeoGenerating] = useState(false);
  const [selectedLang, setSelectedLang] = useState('es');
  const [translatedText, setTranslatedText] = useState<{ name: string; description: string } | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    if (product) {
      setEdited({ ...product });
      setActiveTab('details');
      setTranslatedText(null);
      setIsEditing(false);
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const handleChange = (field: keyof Product, value: any) => {
    setEdited(prev => ({ ...prev, [field]: value }));
  };

  const primaryImage = edited.images?.[0];
  const productPrimaryImage = product.images?.[0];
  const handlePrimaryImageChange = (value: string) => {
    setEdited(prev => ({ ...prev, images: value ? [value] : [] }));
  };

  const handleWarehouseStockChange = (warehouseId: string, value: number) => {
    const updatedStock = { ...(edited.warehouseStock || {}), [warehouseId]: value };
    const totalStock = Object.values(updatedStock).reduce((sum: number, val) => sum + (val as number), 0);
    setEdited(prev => ({
      ...prev,
      warehouseStock: updatedStock,
      inventory: totalStock
    }));
  };

  // AI Description and Tag Generator
  const generateAIDescription = async () => {
    setAiGenerating(true);
    try {
      const response = await fetch('/api/ai/describe-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: edited.name,
          category: edited.category,
          brand: edited.brand,
          keyFeatures: aiFeaturesText || 'premium materials, durable, stylish design'
        })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setEdited(prev => ({
        ...prev,
        description: data.description,
        tags: data.tags
      }));
    } catch (err: any) {
      alert(`AI Generation failed: ${err.message}`);
    } finally {
      setAiGenerating(false);
    }
  };

  // SEO Optimization Tool
  const optimizeSEO = async () => {
    setSeoGenerating(true);
    try {
      const response = await fetch('/api/ai/seo-optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: edited.name,
          description: edited.description,
          brand: edited.brand
        })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setEdited(prev => ({
        ...prev,
        seoTitle: data.seoTitle,
        seoDescription: data.seoMetaDescription
      }));
    } catch (err: any) {
      alert(`SEO Optimization failed: ${err.message}`);
    } finally {
      setSeoGenerating(false);
    }
  };

  // Automated Localization / Translation
  const translateProduct = async () => {
    setIsTranslating(true);
    try {
      // Simulate highly natural localization with premium presets based on requested language
      setTimeout(() => {
        const langMap: { [key: string]: { name: string; description: string } } = {
          es: {
            name: `${edited.name} - Edición Premium`,
            description: `Rendimiento de primer nivel con ${edited.name}. Diseñado meticulosamente para garantizar la máxima durabilidad y una estética moderna.`
          },
          fr: {
            name: `${edited.name} - Édition Spéciale`,
            description: `Performance de haut niveau avec ${edited.name}. Conçu avec précision pour garantir une durabilité maximale et un design épuré.`
          },
          de: {
            name: `${edited.name} - Premium-Ausführung`,
            description: `Herausragende Leistung mit ${edited.name}. Präzise gefertigt für höchste Langlebigkeit und zeitgemäßes Industriedesign.`
          }
        };

        const result = langMap[selectedLang] || {
          name: `${edited.name} - Global`,
          description: `Excellent performance featuring ${edited.name}. Crafted with precision for ultimate endurance.`
        };

        setTranslatedText(result);
        const updatedTranslations = { ...(edited.translations || {}), [selectedLang]: result };
        setEdited(prev => ({ ...prev, translations: updatedTranslations }));
        setIsTranslating(false);
      }, 1000);
    } catch (err) {
      setIsTranslating(false);
    }
  };

  const handleSaveAndCommit = () => {
    const currentVersions = edited.versionHistory || [];
    const newVersionNum = currentVersions.length + 1;
    const newVersion = {
      version: newVersionNum,
      date: new Date().toISOString().split('T')[0],
      author: 'Admin Operative',
      changes: `Modified details, price set to $${edited.price}`
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
              <span className="text-[10px] font-mono text-slate-400 uppercase block">{edited.sku}</span>
              <h2 className="max-w-[120px] truncate text-base font-extrabold text-slate-900 min-[390px]:max-w-[180px] sm:max-w-xs">{edited.name}</h2>
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
            Thông số sản phẩm
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`mr-5 flex shrink-0 items-center gap-1.5 border-b-2 px-1 py-3 text-sm font-semibold transition-all cursor-pointer sm:mr-6 ${
              activeTab === 'ai' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            Công cụ AI hỗ trợ
          </button>
          <button
            onClick={() => setActiveTab('versions')}
            className={`flex shrink-0 items-center gap-1.5 border-b-2 px-1 py-3 text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'versions' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            Nhật ký phiên bản ({edited.versionHistory?.length || 1})
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

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Thương hiệu</label>
                    <input
                      type="text"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-blue-500 outline-none"
                      value={edited.brand || ''}
                      onChange={(e) => handleChange('brand', e.target.value)}
                    />
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
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Giá bán lẻ ($)</label>
                    <input
                      type="number"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono font-semibold text-slate-800 focus:ring-1 focus:ring-blue-500 outline-none"
                      value={edited.price || 0}
                      onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Giá vốn kho ($)</label>
                    <input
                      type="number"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono font-semibold text-slate-800 focus:ring-1 focus:ring-blue-500 outline-none"
                      value={edited.cost || 0}
                      onChange={(e) => handleChange('cost', parseFloat(e.target.value) || 0)}
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

                {/* Multi-Warehouse Stock Section */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <h4 className="text-xs font-bold text-slate-700 uppercase mb-3">Tồn kho chi nhánh phân phối</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-600">Kho W1 - Miền Tây (West Depot)</span>
                      <input
                        type="number"
                        className="w-24 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-mono font-semibold text-slate-800 focus:ring-1 focus:ring-blue-500 outline-none text-right"
                        value={edited.warehouseStock?.['W1-West'] || 0}
                        onChange={(e) => handleWarehouseStockChange('W1-West', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-600">Kho W2 - Miền Đông (East Depot)</span>
                      <input
                        type="number"
                        className="w-24 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-mono font-semibold text-slate-800 focus:ring-1 focus:ring-blue-500 outline-none text-right"
                        value={edited.warehouseStock?.['W2-East'] || 0}
                        onChange={(e) => handleWarehouseStockChange('W2-East', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="border-t border-slate-200/60 pt-2 flex justify-between text-xs font-bold text-slate-800">
                      <span>Tổng sản lượng tồn kho hợp nhất</span>
                      <span>{edited.inventory} sản phẩm</span>
                    </div>
                  </div>
                </div>

                {/* Image upload */}
                <div>
                  <ImageUpload
                    value={primaryImage}
                    onChange={handlePrimaryImageChange}
                    onClear={() => handlePrimaryImageChange('')}
                    label="Hình ảnh đại diện sản phẩm"
                    className="w-full"
                  />
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
                      <span className="text-xs text-slate-400 italic">Chưa liên kết thẻ nào. Vui lòng sử dụng Công cụ AI hỗ trợ.</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Visual Metadata Grid */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-150">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tên sản phẩm</span>
                    <span className="text-sm font-extrabold text-slate-800 block">{product.name}</span>
                  </div>
                  <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-150">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Mã SKU định danh</span>
                    <span className="text-sm font-mono font-bold text-slate-800 block">{product.sku}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-150">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Thương hiệu</span>
                    <span className="text-sm font-bold text-slate-800 block">{product.brand || '---'}</span>
                  </div>
                  <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-150">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Danh mục sản phẩm</span>
                    <span className="text-sm font-bold text-slate-800 block">{product.category || '---'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-150 text-center">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Giá bán lẻ</span>
                    <span className="text-base font-mono font-extrabold text-slate-800 block">${product.price.toFixed(2)}</span>
                  </div>
                  <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-150 text-center">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Giá vốn kho</span>
                    <span className="text-base font-mono font-extrabold text-slate-800 block">${(product.cost || 0).toFixed(2)}</span>
                  </div>
                  <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-150 text-center flex flex-col justify-center items-center">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Trạng thái</span>
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                      product.status === 'active' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : product.status === 'draft'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-slate-50 text-slate-500 border-slate-200'
                    }`}>
                      {product.status === 'active' ? 'Hoạt động' : product.status === 'draft' ? 'Bản nháp' : 'Lưu trữ'}
                    </span>
                  </div>
                </div>

                {/* Warehouse Stock summary */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase border-b border-slate-200/60 pb-1.5">
                    <span>Phân kho</span>
                    <span>Số lượng tồn</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                    <span>Kho W1 - Miền Tây (West Depot)</span>
                    <span className="font-mono font-bold text-slate-800">{product.warehouseStock?.['W1-West'] || 0} sản phẩm</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                    <span>Kho W2 - Miền Đông (East Depot)</span>
                    <span className="font-mono font-bold text-slate-800">{product.warehouseStock?.['W2-East'] || 0} sản phẩm</span>
                  </div>
                  <div className="border-t border-slate-200/60 pt-2 flex justify-between text-xs font-bold text-slate-800">
                    <span>Tổng sản lượng tồn kho hợp nhất</span>
                    <span className="text-blue-600 font-mono">{product.inventory} sản phẩm</span>
                  </div>
                </div>

                {/* Product Image */}
                <div className="space-y-1.5">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Hình ảnh đại diện</span>
                  {productPrimaryImage ? (
                    <img 
                      src={productPrimaryImage} 
                      alt={product.name} 
                      className="w-40 h-40 object-cover rounded-xl border border-slate-150 shadow-2xs"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <p className="text-xs text-slate-400 italic">Chưa thiết lập hình ảnh đại diện.</p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Mô tả sản phẩm</span>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 text-xs text-slate-600 leading-relaxed font-medium">
                    {product.description || <span className="italic text-slate-400">Không có mô tả chi tiết.</span>}
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-1.5">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Bộ thẻ từ khóa tìm kiếm (Meta Tags)</span>
                  <div className="flex flex-wrap gap-1.5">
                    {product.tags?.map((t, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold font-mono">
                        #{t}
                      </span>
                    ))}
                    {(!product.tags || product.tags.length === 0) && (
                      <span className="text-xs text-slate-400 italic">Không có thẻ từ khóa.</span>
                    )}
                  </div>
                </div>
              </div>
            )
          )}

          {activeTab === 'ai' && (
            <div className="space-y-6">
              {/* Co-pilot block */}
              <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/40 space-y-4">
                <div className="flex items-start gap-2.5">
                  <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">AI Biên soạn mô tả & Gán nhãn thẻ tự động</h4>
                    <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                      Điền một vài đặc tính nổi bật của sản phẩm. Mô hình AI của chúng tôi sẽ thiết lập bài viết thuyết phục khách hàng và phân tích từ khóa tìm kiếm tự động.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <textarea
                    rows={2}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 focus:ring-1 focus:ring-amber-500 outline-none resize-none bg-white font-medium"
                    placeholder="Ví dụ: chất liệu cotton Ai Cập thêu tay kép, khóa kéo chống rỉ YKK, hoàn thiện nhám mờ đen"
                    value={aiFeaturesText}
                    onChange={(e) => setAiFeaturesText(e.target.value)}
                  />
                  <button
                    onClick={generateAIDescription}
                    disabled={aiGenerating}
                    className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                  >
                    {aiGenerating ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Đang tạo nội dung thông minh...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        Tạo Bài Viết & Gán Nhãn Thẻ
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* SEO Optimizer block */}
              <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/30 space-y-4">
                <div className="flex items-start gap-2.5">
                  <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Tối ưu hóa thẻ SEO Metadata</h4>
                    <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                      Phân tích nội dung chi tiết để tự động lập dàn ý thẻ tiêu đề và mô tả chuẩn hóa thân thiện với Google Search, Bing.
                    </p>
                  </div>
                </div>

                <div className="space-y-3 bg-white p-3 rounded-lg border border-slate-200/60 text-xs">
                  <div>
                    <span className="block font-semibold text-slate-400 uppercase text-[10px]">Giao diện hiển thị trên Google Search</span>
                    <div className="mt-1 space-y-0.5">
                      <div className="text-blue-700 font-medium text-sm hover:underline cursor-pointer truncate font-bold">
                        {edited.seoTitle || 'Draft SEO Title | Store Listing'}
                      </div>
                      <div className="text-slate-400 font-mono text-[10px]">www.store.com/p/{edited.sku?.toLowerCase()}</div>
                      <div className="text-slate-600 text-[11px] leading-relaxed">
                        {edited.seoDescription || 'Thẻ mô tả meta sẽ hiển thị tự động tại đây sau khi biên tập nội dung hoàn tất.'}
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={optimizeSEO}
                  disabled={seoGenerating}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  {seoGenerating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Đang phân tích cấu trúc SEO...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                      Tối ưu hóa thẻ Meta SEO
                    </>
                  )}
                </button>
              </div>

              {/* Localization translation block */}
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-4">
                <div className="flex items-start gap-2.5">
                  <Languages className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Bản địa hóa thị trường ngoại quốc</h4>
                    <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                      Dịch thuật tên sản phẩm, thông số đặc tính để dễ dàng mở rộng sang các phân khúc thị trường quốc tế.
                    </p>
                  </div>
                </div>

                <div className="flex gap-2.5">
                  <CustomSelect
                    value={selectedLang}
                    onChange={setSelectedLang}
                    options={[
                      { value: 'es', label: 'Tiếng Tây Ban Nha (Español)' },
                      { value: 'fr', label: 'Tiếng Pháp (Français)' },
                      { value: 'de', label: 'Tiếng Đức (Deutsch)' }
                    ]}
                    className="flex-1"
                  />
                  <button
                    onClick={translateProduct}
                    disabled={isTranslating}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors shrink-0 cursor-pointer"
                  >
                    {isTranslating ? 'Đang dịch...' : 'Dịch thuật'}
                  </button>
                </div>

                {translatedText && (
                  <div className="bg-white p-3 rounded-lg border border-indigo-100 space-y-2">
                    <div className="text-xs font-bold text-indigo-900 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      Đã dịch thuật hoàn tất ({selectedLang.toUpperCase()})
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-semibold text-slate-800">{translatedText.name}</div>
                      <div className="text-xs text-slate-500 leading-relaxed">{translatedText.description}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'versions' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-slate-600 mb-2">
                <History className="w-5 h-5 text-blue-600" />
                <h4 className="text-sm font-bold text-slate-800">Kiểm soát lịch sử và các phiên bản</h4>
              </div>

              <div className="relative border-l-2 border-slate-100 pl-4 ml-2 space-y-6">
                {edited.versionHistory?.map((v, i) => (
                  <div key={i} className="relative">
                    <span className="absolute -left-[25px] top-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-white ring-4 ring-blue-50"></span>
                    <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                        <span>Phiên bản #{v.version}</span>
                        <span className="text-slate-400 font-normal">{v.date}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 font-mono">{v.changes}</p>
                      <span className="block text-[10px] text-slate-400 font-semibold mt-2 uppercase tracking-wide">Người sửa đổi: {v.author === 'Admin Operative' ? 'Quản trị viên' : v.author}</span>
                    </div>
                  </div>
                ))}
                
                {/* Seed v1 if history was empty */}
                {(!edited.versionHistory || edited.versionHistory.length === 0) && (
                  <div className="relative">
                    <span className="absolute -left-[25px] top-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-white ring-4 ring-blue-50"></span>
                    <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                        <span>Phiên bản #1</span>
                        <span className="text-slate-400 font-normal">2026-06-20</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Cấu hình khởi tạo ban đầu</p>
                      <span className="block text-[10px] text-slate-400 font-semibold mt-2 uppercase tracking-wide">Người sửa đổi: Bản mẫu hệ thống</span>
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



