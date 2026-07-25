import type { Order } from '../types';

const statusLabels: Record<Order['status'], string> = {
  pending: 'Cho xu ly',
  processing: 'Dang chuan bi',
  shipping: 'Dang giao',
  delivered: 'Da giao',
  refunded: 'Da hoan tien',
  cancelled: 'Da huy',
};

const paymentStatusLabels: Record<Order['paymentStatus'], string> = {
  paid: 'Da tra',
  pending: 'Chua tra',
  failed: 'That bai',
  refunded: 'Da hoan tien',
};

const formatDateForFile = (date = new Date()) => {
  const pad = (value: number) => String(value).padStart(2, '0');
  return [date.getFullYear(), pad(date.getMonth() + 1), pad(date.getDate())].join('-');
};

const formatDateTime = (value: string) =>
  value ? new Date(value).toLocaleString('vi-VN') : '';

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

export async function exportOrdersToExcel(orders: Order[]) {
  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Velocart Admin';
  workbook.created = new Date();
  workbook.modified = new Date();

  const summarySheet = workbook.addWorksheet('Tong quan', {
    views: [{ showGridLines: false }],
  });
  const dataSheet = workbook.addWorksheet('Danh sach don hang', {
    views: [{ state: 'frozen', ySplit: 1, showGridLines: false }],
  });

  const totalRevenue = orders.reduce((total, order) => total + Number(order.total || 0), 0);
  const paidCount = orders.filter((order) => order.paymentStatus === 'paid').length;
  const pendingCount = orders.filter((order) => order.status === 'pending').length;
  const shippingCount = orders.filter((order) => order.status === 'shipping').length;

  summarySheet.columns = [{ width: 26 }, { width: 24 }];
  summarySheet.mergeCells('A1:B1');
  summarySheet.getCell('A1').value = 'Bao cao don hang';
  summarySheet.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
  summarySheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
  summarySheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' };
  summarySheet.getRow(1).height = 28;

  [
    ['Ngay xuat file', new Date().toLocaleString('vi-VN')],
    ['Tong don hang', orders.length],
    ['Tong doanh thu', totalRevenue],
    ['Da thanh toan', paidCount],
    ['Cho xu ly', pendingCount],
    ['Dang giao', shippingCount],
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
      if (rowNumber === 4 && columnNumber === 2) {
        cell.numFmt = '#,##0 [$VND-vi-VN]';
      }
    });
  });

  dataSheet.columns = [
    { header: 'STT', key: 'index', width: 8 },
    { header: 'Ma giao dich', key: 'id', width: 22 },
    { header: 'Ngay dat', key: 'date', width: 22 },
    { header: 'Khach hang', key: 'customerName', width: 26 },
    { header: 'Email', key: 'customerEmail', width: 30 },
    { header: 'San pham', key: 'items', width: 46 },
    { header: 'Tong tien', key: 'total', width: 16 },
    { header: 'Van chuyen', key: 'status', width: 18 },
    { header: 'Thanh toan', key: 'paymentStatus', width: 16 },
    { header: 'Phuong thuc', key: 'paymentMethod', width: 18 },
    { header: 'Rui ro AI', key: 'fraudRisk', width: 14 },
    { header: 'Diem rui ro', key: 'fraudRiskScore', width: 12 },
  ];

  orders.forEach((order, index) => {
    dataSheet.addRow({
      index: index + 1,
      id: order.id,
      date: formatDateTime(order.date),
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      items: order.items.map((item) => `${item.productName} (x${item.quantity})`).join('\n'),
      total: Number(order.total || 0),
      status: statusLabels[order.status] || order.status,
      paymentStatus: paymentStatusLabels[order.paymentStatus] || order.paymentStatus,
      paymentMethod: order.paymentMethod,
      fraudRisk: order.fraudRisk,
      fraudRiskScore: Number(order.fraudRiskScore || 0),
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
        horizontal: [1, 7, 11, 12].includes(columnNumber) ? 'center' : 'left',
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

  dataSheet.getColumn('total').numFmt = '#,##0 [$VND-vi-VN]';

  const buffer = await workbook.xlsx.writeBuffer();
  downloadBlob(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    `danh-sach-don-hang-${formatDateForFile()}.xlsx`,
  );
}
