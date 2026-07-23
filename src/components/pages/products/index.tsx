import type { Dispatch, SetStateAction } from 'react';
import { AlertTriangle, Boxes, CheckCircle2, Download, Package, Plus, Search, Tag, Trash2 } from 'lucide-react';
import type { Category, Product } from '../../../types';
import { CustomSelect } from '../../shared';
import { formatVnd } from '../../../lib/currency';

type ProductsPageProps = {
  categories: Category[];
  filteredProducts: Product[];
  prodSearch: string;
  setProdSearch: Dispatch<SetStateAction<string>>;
  prodCatFilter: string;
  setProdCatFilter: Dispatch<SetStateAction<string>>;
  selectedProductIds: string[];
  setSelectedProductIds: Dispatch<SetStateAction<string[]>>;
  onExportExcel: () => void;
  onOpenNewProduct: () => void;
  onBulkActivate: () => void;
  onBulkArchive: () => void;
  onBulkDelete: () => void;
  onSelectProduct: (product: Product) => void;
  onToggleProductStatus: (id: string, currentStatus: string) => void;
  onDeleteProduct: (id: string) => void;
};

export function ProductsPage({
  categories,
  filteredProducts,
  prodSearch,
  setProdSearch,
  prodCatFilter,
  setProdCatFilter,
  selectedProductIds,
  setSelectedProductIds,
  onExportExcel: handleExportExcel,
  onOpenNewProduct,
  onBulkActivate: handleBulkActivate,
  onBulkArchive: handleBulkArchive,
  onBulkDelete: handleBulkDelete,
  onSelectProduct: setActiveProduct,
  onToggleProductStatus: handleToggleProductStatus,
  onDeleteProduct,
}: ProductsPageProps) {
  const activeCount = filteredProducts.filter(product => product.status === 'active').length;
  const lowStockCount = filteredProducts.filter(product => product.inventory <= 10).length;
  const totalInventory = filteredProducts.reduce((total, product) => total + product.inventory, 0);
  const getPrimaryImage = (product: Product) => product.images?.[0];

  return (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-transparent p-5 rounded-2xl border border-blue-100/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  <h2 className="text-base font-extrabold text-slate-900">Quản Lý Sản Phẩm</h2>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Theo dõi danh sách sản phẩm, trạng thái kinh doanh, hình ảnh, giá bán và tồn kho theo từng kho trong hệ thống.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: 'Tổng sản phẩm', value: filteredProducts.length.toLocaleString('vi-VN'), icon: Package, tone: 'border-blue-100 bg-blue-50 text-blue-700' },
                { label: 'Đang kinh doanh', value: activeCount.toLocaleString('vi-VN'), icon: CheckCircle2, tone: 'border-emerald-100 bg-emerald-50 text-emerald-700' },
                { label: 'Tổng tồn kho', value: totalInventory.toLocaleString('vi-VN'), icon: Boxes, tone: 'border-indigo-100 bg-indigo-50 text-indigo-700' },
                { label: 'Sắp hết hàng', value: lowStockCount.toLocaleString('vi-VN'), icon: AlertTriangle, tone: 'border-amber-100 bg-amber-50 text-amber-700' },
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

            {/* Action buttons & Search bar strip */}
            <div className="flex flex-col items-stretch gap-3.5 rounded-lg border border-slate-200 bg-white p-3 shadow-sm lg:flex-row lg:items-center lg:justify-between">
              <div className="flex h-10 w-full items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3 shadow-xs lg:max-w-[440px]">
                <Search className="w-4.5 h-4.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm theo tên, mã SKU..."
                  className="w-full bg-transparent text-xs text-slate-800 outline-none"
                  value={prodSearch}
                  onChange={(e) => setProdSearch(e.target.value)}
                />
              </div>

              <div className="flex w-full flex-wrap items-center justify-end gap-2 lg:w-auto">
                <div className="flex items-center gap-1.5">
                  <CustomSelect
                    value={prodCatFilter}
                    onChange={setProdCatFilter}
                    options={[
                      { value: 'All', label: 'Tất cả danh mục' },
                      ...categories.map(cat => ({ value: cat.name, label: cat.name }))
                    ]}
                    icon={<Tag className="w-3.5 h-3.5" />}
                    showSearch={true}
                  />

                </div>

                <button
                  onClick={handleExportExcel}
                  className="p-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" /> Xuất Excel
                </button>

                <button
                  onClick={() => onOpenNewProduct()}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Thêm sản phẩm
                </button>
              </div>
            </div>

            {/* Bulk Actions overlay info */}
            {selectedProductIds.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-xl flex flex-col gap-3 text-xs font-semibold text-blue-900 animate-slide-down sm:flex-row sm:items-center sm:justify-between">
                <span>Đã chọn {selectedProductIds.length} sản phẩm. Chọn thao tác:</span>
                <div className="flex flex-wrap gap-2">
                  <button onClick={handleBulkActivate} className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">Kích hoạt</button>
                  <button onClick={handleBulkArchive} className="px-3 py-1 bg-slate-800 text-slate-200 rounded hover:bg-slate-700">Lưu trữ</button>
                  <button onClick={() => setSelectedProductIds([])} className="px-3 py-1 bg-white text-blue-700 border border-blue-200 rounded hover:bg-blue-100">Bỏ chọn</button>
                  <button onClick={handleBulkDelete} className="px-3 py-1 bg-rose-600 text-white rounded hover:bg-rose-700 flex items-center gap-1.5">
                    <Trash2 className="h-3.5 w-3.5" /> Xóa đã chọn
                  </button>
                </div>
              </div>
            )}

            {/* Advanced Listing Data Table */}
            <div className="hidden overflow-x-auto rounded-xl border border-slate-200/80 bg-white shadow-sm md:block">
              <table className="min-w-[1180px] w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase">
                    <th className="px-5 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={selectedProductIds.length === filteredProducts.length && filteredProducts.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProductIds(filteredProducts.map(p => p.id));
                          } else {
                            setSelectedProductIds([]);
                          }
                        }}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-5 py-3 w-20">Hình ảnh</th>
                    <th className="px-5 py-3">Sản phẩm & SKU</th>
                    <th className="px-5 py-3">Danh mục</th>
                    <th className="px-5 py-3 text-right">Giá bán</th>
                    <th className="px-5 py-3 text-right">Tồn kho (W1/W2)</th>
                    <th className="px-5 py-3">Ngày tạo</th>
                    <th className="px-5 py-3">Ngày cập nhật</th>
                    <th className="px-5 py-3 text-center">Trạng thái</th>
                    <th className="px-5 py-3 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredProducts.map(prod => {
                    const isChecked = selectedProductIds.includes(prod.id);
                    return (
                      <tr key={prod.id} className="cursor-pointer transition-colors hover:bg-blue-50/35" onClick={() => setActiveProduct(prod)}>
                        <td className="px-5 py-3 w-10" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                                    setSelectedProductIds([...selectedProductIds, prod.id]);
                              } else {
                                setSelectedProductIds(selectedProductIds.filter(id => id !== prod.id));
                              }
                            }}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-5 py-3 w-20">
                          {getPrimaryImage(prod) ? (
                            <img 
                              src={getPrimaryImage(prod)}
                              alt={prod.name}
                              className="w-10 h-10 object-cover rounded-lg border border-slate-200/80 shrink-0"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center font-bold text-[10px] uppercase border border-slate-200 shrink-0">
                              K.ẢNH
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-3 font-semibold text-slate-900">
                          <div>
                            <span className="block hover:text-blue-600 transition-colors text-slate-900 font-bold">{prod.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">{prod.sku}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-slate-500 font-semibold">{prod.category}</td>
                        <td className="px-5 py-3 text-right font-mono font-bold text-slate-800">{formatVnd(prod.price)}</td>
                        <td className="px-5 py-3 text-right">
                          <div className="font-semibold text-slate-800">{prod.inventory} sản phẩm</div>
                          <div className="text-[9px] text-slate-400 font-mono mt-0.5">Kho chính: {prod.warehouseStock?.MAIN ?? prod.inventory ?? 0}</div>
                        </td>
                        <td className="px-5 py-3 text-slate-500 font-mono text-[10px]">
                          {prod.createdAt ? new Date(prod.createdAt).toLocaleString('vi-VN', { hour12: false }) : new Date(prod.updatedAt || Date.now()).toLocaleString('vi-VN', { hour12: false })}
                        </td>
                        <td className="px-5 py-3 text-slate-500 font-mono text-[10px]">
                          {prod.updatedAt ? new Date(prod.updatedAt).toLocaleString('vi-VN', { hour12: false }) : '---'}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                            prod.status === 'active' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : prod.status === 'draft'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-slate-50 text-slate-500 border-slate-200'
                          }`}>
                            {prod.status === 'active' ? 'Đang bán' : 'Tạm dừng'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleToggleProductStatus(prod.id, prod.status)}
                              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                prod.status === 'active' ? 'bg-emerald-500' : 'bg-slate-200'
                              }`}
                              title={prod.status === 'active' ? "Tạm dừng" : "Kích hoạt"}
                            >
                              <span
                                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                  prod.status === 'active' ? 'translate-x-4' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400 text-sm">
                        Không tìm thấy danh sách sản phẩm nào khớp với tìm kiếm hiện tại.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Layout for Products */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
              {filteredProducts.map(prod => {
                const isChecked = selectedProductIds.includes(prod.id);
                return (
                  <div 
                    key={prod.id} 
                    className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-xs hover:border-slate-300 transition-all cursor-pointer"
                    onClick={() => setActiveProduct(prod)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedProductIds([...selectedProductIds, prod.id]);
                              } else {
                                setSelectedProductIds(selectedProductIds.filter(id => id !== prod.id));
                              }
                            }}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                        </div>
                        {getPrimaryImage(prod) ? (
                          <img
                            src={getPrimaryImage(prod)}
                            alt={prod.name}
                            className="w-12 h-12 object-cover rounded-lg border border-slate-200"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center font-bold text-[10px] uppercase border border-slate-200 shrink-0">
                            K.ẢNH
                          </div>
                        )}
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm hover:text-blue-600 transition-colors line-clamp-1">{prod.name}</h4>
                          <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{prod.sku}</span>
                        </div>
                      </div>
                      
                      <div className="flex shrink-0 items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleToggleProductStatus(prod.id, prod.status)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            prod.status === 'active' ? 'bg-emerald-500' : 'bg-slate-200'
                          }`}
                          title={prod.status === 'active' ? "Tạm dừng" : "Kích hoạt"}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                              prod.status === 'active' ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Danh mục</span>
                        <span className="font-semibold text-slate-700">{prod.category}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Giá bán</span>
                        <span className="font-mono font-extrabold text-[#2563EB] text-sm">{formatVnd(prod.price)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Tồn kho</span>
                        <span className="font-semibold text-slate-800">{prod.inventory} SP</span>
                        <span className="text-[9px] text-slate-400 block font-mono">Kho chính: {prod.warehouseStock?.MAIN ?? prod.inventory ?? 0}</span>
                      </div>
                      <div className="text-right flex flex-col justify-between items-end">
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Trạng thái</span>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                          prod.status === 'active' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : prod.status === 'draft'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-50 text-slate-500 border-slate-200'
                        }`}>
                          {prod.status === 'active' ? 'Đang bán' : 'Tạm dừng'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredProducts.length === 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-sm">
                  Không tìm thấy danh sách sản phẩm nào khớp với tìm kiếm hiện tại.
                </div>
              )}
            </div>
          </div>
  );
}

export default ProductsPage;


