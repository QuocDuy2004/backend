import type { Product } from '../types';

const statusLabels: Record<Product['status'], string> = {
  active: 'Đang kinh doanh',
  draft: 'Bản nháp',
  archived: 'Lưu trữ',
};

const formatDateTimeForFile = (date = new Date()) => {
  const pad = (value: number) => String(value).padStart(2, '0');
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join('-');
};

const joinAttributes = (product: Product) =>
  (product.attributes || [])
    .map((attribute) => `${attribute.name}: ${attribute.values.join(', ')}`)
    .join('\n');

const joinSpecification = (product: Product) =>
  Object.entries(product.specification || {})
    .map(([name, value]) => `${name}: ${value}`)
    .join('\n');

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

export async function exportProductsToExcel(products: Product[]) {
  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'OmniShop Admin';
  workbook.created = new Date();
  workbook.modified = new Date();

  const summarySheet = workbook.addWorksheet('Tổng quan', {
    views: [{ showGridLines: false }],
  });
  const dataSheet = workbook.addWorksheet('Danh sách sản phẩm', {
    views: [{ state: 'frozen', ySplit: 1, showGridLines: false }],
  });

  const activeCount = products.filter((product) => product.status === 'active').length;
  const bestSellerCount = products.filter((product) => product.isBestSeller).length;
  const totalInventory = products.reduce((total, product) => total + Number(product.inventory || 0), 0);
  const totalValue = products.reduce((total, product) => total + Number(product.price || 0) * Number(product.inventory || 0), 0);

  summarySheet.columns = [
    { width: 26 },
    { width: 24 },
  ];
  summarySheet.mergeCells('A1:B1');
  summarySheet.getCell('A1').value = 'Báo cáo quản lý sản phẩm';
  summarySheet.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
  summarySheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
  summarySheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' };
  summarySheet.getRow(1).height = 28;

  [
    ['Ngày xuất file', new Date().toLocaleString('vi-VN')],
    ['Tổng sản phẩm', products.length],
    ['Đang kinh doanh', activeCount],
    ['Sản phẩm bán chạy', bestSellerCount],
    ['Tổng tồn kho', totalInventory],
    ['Giá trị tồn kho ước tính', totalValue],
  ].forEach((row) => summarySheet.addRow(row));

  summarySheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    row.eachCell((cell, columnNumber) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
      cell.alignment = { vertical: 'middle' };
      if (columnNumber === 1) {
        cell.font = { bold: true, color: { argb: 'FF475569' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      }
      if (rowNumber === 7 && columnNumber === 2) {
        cell.numFmt = '#,##0 [$₫-vi-VN]';
      }
    });
  });

  dataSheet.columns = [
    { header: 'STT', key: 'index', width: 8 },
    { header: 'SKU', key: 'sku', width: 18 },
    { header: 'Tên sản phẩm', key: 'name', width: 34 },
    { header: 'Danh mục', key: 'category', width: 22 },
    { header: 'Giá bán', key: 'price', width: 16 },
    { header: 'Tồn kho', key: 'inventory', width: 12 },
    { header: 'Trạng thái', key: 'status', width: 18 },
    { header: 'Bán chạy', key: 'isBestSeller', width: 12 },
    { header: 'Số ảnh', key: 'imageCount', width: 10 },
    { header: 'Thuộc tính', key: 'attributes', width: 32 },
    { header: 'Thông số kỹ thuật', key: 'specification', width: 36 },
    { header: 'Mô tả', key: 'description', width: 46 },
    { header: 'Cập nhật lúc', key: 'updatedAt', width: 22 },
  ];

  products.forEach((product, index) => {
    dataSheet.addRow({
      index: index + 1,
      sku: product.sku,
      name: product.name,
      category: product.category,
      price: Number(product.price || 0),
      inventory: Number(product.inventory || 0),
      status: statusLabels[product.status] || product.status,
      isBestSeller: product.isBestSeller ? 'Có' : 'Không',
      imageCount: product.images?.length || 0,
      attributes: joinAttributes(product),
      specification: joinSpecification(product),
      description: product.description || '',
      updatedAt: product.updatedAt ? new Date(product.updatedAt).toLocaleString('vi-VN') : '',
    });
  });

  dataSheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: dataSheet.columnCount },
  };

  dataSheet.getRow(1).height = 28;
  dataSheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF1E293B' } },
      left: { style: 'thin', color: { argb: 'FF1E293B' } },
      bottom: { style: 'thin', color: { argb: 'FF1E293B' } },
      right: { style: 'thin', color: { argb: 'FF1E293B' } },
    };
  });

  dataSheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    row.height = 42;
    row.eachCell((cell, columnNumber) => {
      cell.alignment = {
        vertical: 'top',
        horizontal: [1, 5, 6, 8, 9].includes(columnNumber) ? 'center' : 'left',
        wrapText: true,
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
      if (rowNumber % 2 === 0) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      }
    });
  });

  dataSheet.getColumn('price').numFmt = '#,##0 [$₫-vi-VN]';
  dataSheet.getColumn('inventory').numFmt = '#,##0';

  const buffer = await workbook.xlsx.writeBuffer();
  downloadBlob(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    `danh-sach-san-pham-${formatDateTimeForFile()}.xlsx`
  );
}
