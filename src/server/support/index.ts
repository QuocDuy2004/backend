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
    const message = error instanceof Error ? error.message : 'Failed to fetch support tickets';
    res.status(500).json({ ok: false, message });
  }
}

export async function getSupportTicket(req: Request, res: Response) {
  try {
    const ticket = await findSupportTicket(req.params.id);
    if (!ticket) return res.status(404).json({ ok: false, message: 'Support ticket not found.' });
    res.json({ ok: true, ticket });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch support ticket';
    res.status(500).json({ ok: false, message });
  }
}

export async function upsertSupportTicketHandler(req: Request, res: Response) {
  try {
    const ticket = await upsertSupportTicket(req.body);
    res.json({ ok: true, ticket });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save support ticket';
    res.status(500).json({ ok: false, message });
  }
}

export async function updateSupportTicketHandler(req: Request, res: Response) {
  try {
    const ticket = await updateSupportTicket(req.params.id, req.body);
    if (!ticket) return res.status(404).json({ ok: false, message: 'Support ticket not found.' });
    res.json({ ok: true, ticket });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update support ticket';
    res.status(500).json({ ok: false, message });
  }
}

export async function addSupportMessageHandler(req: Request, res: Response) {
  try {
    if (!req.body?.id || !req.body?.sender || !req.body?.text) {
      return res.status(400).json({ ok: false, message: 'id, sender and text are required.' });
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
    const message = error instanceof Error ? error.message : 'Failed to add support message';
    res.status(500).json({ ok: false, message });
  }
}
