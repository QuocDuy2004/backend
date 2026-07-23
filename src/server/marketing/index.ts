import type { Request, Response } from 'express';
import { sendMarketingEmail } from '../services/marketing-email.service';

export async function sendMarketingEmailHandler(req: Request, res: Response) {
  try {
    const result = await sendMarketingEmail(req.body || {});
    res.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không thể gửi email khuyến mãi.';
    res.status(400).json({ ok: false, message });
  }
}
