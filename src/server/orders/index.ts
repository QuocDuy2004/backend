import type { Request, Response } from 'express';
import { createOrder, findOrderById, listOrders } from '../services/orders.service';
import { normalizeText } from '../utils/text';

export async function getOrders(req: Request, res: Response) {
  try {
    const userId = normalizeText(req.query.userId);
    const email = normalizeText(req.query.email);
    const orders = await listOrders(userId || undefined, email || undefined);
    return res.json({ ok: true, orders });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch orders';
    return res.status(500).json({ ok: false, message });
  }
}

export async function getOrder(req: Request, res: Response) {
  try {
    const order = await findOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ ok: false, message: 'Order not found.' });
    }

    return res.json({ ok: true, order });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch order';
    return res.status(500).json({ ok: false, message });
  }
}

export async function createOrderHandler(req: Request, res: Response) {
  try {
    const order = await createOrder(req.body);
    return res.status(201).json({ ok: true, order });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create order';
    const status = message.includes('not found')
      ? 404
      : message.includes('not have enough stock')
        ? 409
        : message.includes('required')
          ? 400
          : 500;
    return res.status(status).json({ ok: false, message });
  }
}
