import type { Request, Response } from 'express';
import {
  appendListOrdersToGoogleSheet,
  listSmmkayOrders,
  mapListOrderToSheetRow,
  syncListOrderToGoogleSheet,
} from '../services/smmkay-orders.service';
import { getOrderSheetRows, orderSheetHeaders } from '../services/google-sheets.service';

export async function listOrders(req: Request, res: Response) {
  try {
    const orders = await listSmmkayOrders({
      service: String(req.query.service || ''),
      status: String(req.query.status || ''),
    });

    res.json({ ok: true, orders });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch listOrder.';
    res.status(500).json({ ok: false, message });
  }
}

export async function previewSheetRows(req: Request, res: Response) {
  try {
    const orders = await listSmmkayOrders({
      service: String(req.query.service || ''),
      status: String(req.query.status || ''),
    });

    res.json({
      ok: true,
      headers: orderSheetHeaders,
      rows: orders.map((order) => mapListOrderToSheetRow(order).values),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to preview sheet rows.';
    res.status(500).json({ ok: false, message });
  }
}

export async function getSheetOrders(_req: Request, res: Response) {
  try {
    const rows = await getOrderSheetRows();
    res.json({ ok: true, rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch Google Sheet orders.';
    res.status(500).json({ ok: false, message });
  }
}

export async function syncListOrder(req: Request, res: Response) {
  try {
    const result = await syncListOrderToGoogleSheet({
      service: req.body.service,
      status: req.body.status || 'Pending',
      dryRun: Boolean(req.body.dryRun),
    });

    res.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to sync listOrder to Google Sheet.';
    res.status(500).json({ ok: false, message });
  }
}

export async function appendListOrders(req: Request, res: Response) {
  try {
    const result = await appendListOrdersToGoogleSheet({
      service: req.body.service,
      status: req.body.status || 'Pending',
      dryRun: Boolean(req.body.dryRun),
    });

    res.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to append listOrders to Google Sheet.';
    res.status(500).json({ ok: false, message });
  }
}
