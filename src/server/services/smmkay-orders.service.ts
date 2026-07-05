import { env } from '../config/env';
import {
  appendOrderSheetRows,
  getOrderSheetRows,
  upsertOrderSheetRow,
} from './google-sheets.service';

export type SmmkayOrder = Record<string, any>;

function assertSmmkayConfig() {
  if (!env.smmkayApiKey) {
    throw new Error('Missing SMMKAY_API_KEY.');
  }
}

function pickValue(order: SmmkayOrder, keys: string[]) {
  for (const key of keys) {
    const value = order[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return value;
    }
  }

  return '';
}

function toNumber(value: any) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

function nowText() {
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date());
}

export function normalizeListOrderResponse(data: any): SmmkayOrder[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.orders)) return data.orders;
  if (Array.isArray(data?.result)) return data.result;

  return [];
}

export async function listSmmkayOrders(options: { service?: string; status?: string } = {}) {
  assertSmmkayConfig();

  const body = new URLSearchParams({
    key: env.smmkayApiKey,
    action: 'listOrder',
    service: options.service || env.smmkayServiceId,
  });

  if (options.status) {
    body.set('status', options.status);
  }

  const response = await fetch(env.smmkayApiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || data?.error || 'Failed to fetch listOrder.');
  }

  return normalizeListOrderResponse(data);
}

export function mapListOrderToSheetRow(order: SmmkayOrder) {
  const id = String(pickValue(order, ['id', 'ID', 'order', 'order_id'])).trim();
  const uid = pickValue(order, ['uid', 'UID', 'user_id']);
  const link = pickValue(order, ['link', 'url', 'Đường dẫn']);
  const startCount = toNumber(pickValue(order, ['start_count', 'startCount', 'start', 'Ban đầu']));
  const quantity = toNumber(pickValue(order, ['quantity', 'amount', 'Số lượng']));
  const target = toNumber(pickValue(order, ['target', 'Target'])) || startCount + quantity;
  const status = pickValue(order, ['status', 'Status']) || 'Pending';

  return {
    id,
    values: [
      id,
      uid,
      link,
      startCount,
      quantity,
      target,
      nowText(),
      status,
      JSON.stringify(order),
    ],
  };
}

export async function syncListOrderToGoogleSheet(options: {
  service?: string;
  status?: string;
  dryRun?: boolean;
} = {}) {
  const orders = await listSmmkayOrders(options);
  const sheetRows = await getOrderSheetRows();
  const existingIds = new Set(sheetRows.map((row) => row.id).filter(Boolean));
  const result = {
    fetched: orders.length,
    saved: 0,
    updated: 0,
    skipped: 0,
    invalid: 0,
    orders: [] as Array<{ id: string; action: 'inserted' | 'updated' | 'skipped' | 'invalid' }>,
  };

  for (const order of orders) {
    const row = mapListOrderToSheetRow(order);

    if (!row.id) {
      result.invalid += 1;
      result.orders.push({ id: '', action: 'invalid' });
      continue;
    }

    const exists = existingIds.has(row.id);

    if (options.dryRun) {
      result.skipped += 1;
      result.orders.push({ id: row.id, action: 'skipped' });
      continue;
    }

    await upsertOrderSheetRow(row.id, row.values);

    if (exists) {
      result.updated += 1;
      result.orders.push({ id: row.id, action: 'updated' });
    } else {
      result.saved += 1;
      result.orders.push({ id: row.id, action: 'inserted' });
      existingIds.add(row.id);
    }
  }

  return result;
}

export async function appendListOrdersToGoogleSheet(options: {
  service?: string;
  status?: string;
  dryRun?: boolean;
} = {}) {
  const orders = await listSmmkayOrders(options);
  const sheetRows = await getOrderSheetRows();
  const existingIds = new Set(sheetRows.map((row) => row.id).filter(Boolean));
  const pendingRows: any[][] = [];
  const result = {
    fetched: orders.length,
    appended: 0,
    skippedExisting: 0,
    skippedDuplicate: 0,
    invalid: 0,
    orders: [] as Array<{
      id: string;
      action: 'appended' | 'skipped_existing' | 'skipped_duplicate' | 'invalid' | 'dry_run';
    }>,
  };

  for (const order of orders) {
    const row = mapListOrderToSheetRow(order);

    if (!row.id) {
      result.invalid += 1;
      result.orders.push({ id: '', action: 'invalid' });
      continue;
    }

    if (existingIds.has(row.id)) {
      result.skippedExisting += 1;
      result.orders.push({ id: row.id, action: 'skipped_existing' });
      continue;
    }

    if (pendingRows.some((values) => String(values[0]) === row.id)) {
      result.skippedDuplicate += 1;
      result.orders.push({ id: row.id, action: 'skipped_duplicate' });
      continue;
    }

    if (options.dryRun) {
      result.appended += 1;
      result.orders.push({ id: row.id, action: 'dry_run' });
      continue;
    }

    pendingRows.push(row.values);
    result.orders.push({ id: row.id, action: 'appended' });
  }

  if (!options.dryRun && pendingRows.length) {
    await appendOrderSheetRows(pendingRows);
    result.appended = pendingRows.length;
  }

  return result;
}
