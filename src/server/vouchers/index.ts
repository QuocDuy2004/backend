import type { Request, Response } from 'express';
import { listUserVouchers, resolveVoucherUserIdByEmail } from '../services/vouchers.service';
import { normalizeText } from '../utils/text';

export async function getVouchers(req: Request, res: Response) {
  try {
    const userId = normalizeText(req.query.userId);
    const email = normalizeText(req.query.email);
    const resolvedUserId = userId || (email ? await resolveVoucherUserIdByEmail(email) : '');
    const vouchers = await listUserVouchers(resolvedUserId || undefined);

    res.json({ ok: true, vouchers });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch vouchers';
    res.status(500).json({ ok: false, message });
  }
}
