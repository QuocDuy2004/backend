import type { Request, Response } from 'express';
import { listPayments, updatePayment } from '../services/payments.service';
import { normalizeText } from '../utils/text';

export async function getPayments(req: Request, res: Response) {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    res.json({ ok: true, payments: await listPayments(includeInactive) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch payments';
    res.status(500).json({ ok: false, message });
  }
}

export async function updatePaymentHandler(req: Request, res: Response) {
  try {
    const payment = await updatePayment(normalizeText(req.params.code), {
      status: normalizeText(req.body.status),
      paymentStatusOnOrder: normalizeText(req.body.paymentStatusOnOrder),
      config: req.body.config && typeof req.body.config === 'object' && !Array.isArray(req.body.config)
        ? req.body.config
        : {},
    });

    if (!payment) {
      return res.status(404).json({ ok: false, message: 'Payment method not found.' });
    }

    res.json({ ok: true, payment });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update payment';
    res.status(500).json({ ok: false, message });
  }
}
