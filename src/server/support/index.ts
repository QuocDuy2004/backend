import type { Request, Response } from 'express';
import {
  addSupportMessage,
  findSupportTicket,
  listSupportTickets,
  updateSupportTicket,
  upsertSupportTicket,
} from '../services/support.service';

export async function getSupportTickets(_req: Request, res: Response) {
  try {
    res.json({ ok: true, tickets: await listSupportTickets() });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không thể lấy danh sách ticket hỗ trợ.';
    res.status(500).json({ ok: false, message });
  }
}

export async function getSupportTicket(req: Request, res: Response) {
  try {
    const ticket = await findSupportTicket(req.params.id);
    if (!ticket) return res.status(404).json({ ok: false, message: 'Không tìm thấy ticket hỗ trợ.' });
    res.json({ ok: true, ticket });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không thể lấy ticket hỗ trợ.';
    res.status(500).json({ ok: false, message });
  }
}

export async function upsertSupportTicketHandler(req: Request, res: Response) {
  try {
    const ticket = await upsertSupportTicket(req.body);
    res.json({ ok: true, ticket });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không thể lưu ticket hỗ trợ.';
    res.status(500).json({ ok: false, message });
  }
}

export async function updateSupportTicketHandler(req: Request, res: Response) {
  try {
    const ticket = await updateSupportTicket(req.params.id, req.body);
    if (!ticket) return res.status(404).json({ ok: false, message: 'Không tìm thấy ticket hỗ trợ.' });
    res.json({ ok: true, ticket });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không thể cập nhật ticket hỗ trợ.';
    res.status(500).json({ ok: false, message });
  }
}

export async function addSupportMessageHandler(req: Request, res: Response) {
  try {
    if (!req.body?.id || !req.body?.sender || !req.body?.text) {
      return res.status(400).json({ ok: false, message: 'id, sender và text là bắt buộc.' });
    }

    const ticket = await addSupportMessage({
      id: req.body.id,
      ticketId: req.params.id,
      sender: req.body.sender,
      text: req.body.text,
      timestamp: req.body.timestamp,
      metadata: req.body.metadata,
    });

    res.status(201).json({ ok: true, ticket });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không thể thêm tin nhắn hỗ trợ.';
    res.status(500).json({ ok: false, message });
  }
}
