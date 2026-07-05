import type { Request, Response } from 'express';
import {
  archiveNotification,
  createNotification,
  listNotifications,
  listUserNotifications,
  markUserNotificationRead,
} from '../services/notifications.service';
import { normalizeText } from '../utils/text';

function normalizeUserIds(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => normalizeText(item)).filter(Boolean);
}

function normalizeTargetParams(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

export async function getNotifications(req: Request, res: Response) {
  try {
    const userId = normalizeText(req.query.userId);
    const notifications = userId
      ? await listUserNotifications(userId)
      : await listNotifications();

    res.json({ ok: true, notifications });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch notifications';
    res.status(500).json({ ok: false, message });
  }
}

export async function createNotificationHandler(req: Request, res: Response) {
  const title = normalizeText(req.body.title);
  const message = normalizeText(req.body.message);
  const audience = normalizeText(req.body.audience) === 'user' ? 'user' : 'all';

  if (!title || !message) {
    return res.status(400).json({
      ok: false,
      message: 'title and message are required.',
    });
  }

  try {
    const notification = await createNotification({
      title,
      message,
      type: normalizeText(req.body.type) || 'system',
      audience,
      targetPath: normalizeText(req.body.targetPath),
      targetParams: normalizeTargetParams(req.body.targetParams),
      userIds: normalizeUserIds(req.body.userIds),
    });

    res.status(201).json({ ok: true, notification });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create notification';
    res.status(500).json({ ok: false, message });
  }
}

export async function markReadHandler(req: Request, res: Response) {
  const userId = normalizeText(req.body.userId || req.query.userId);

  if (!userId) {
    return res.status(400).json({ ok: false, message: 'userId is required.' });
  }

  try {
    await markUserNotificationRead(req.params.id, userId, req.body.isRead !== false);
    res.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update notification';
    res.status(500).json({ ok: false, message });
  }
}

export async function archiveNotificationHandler(req: Request, res: Response) {
  try {
    await archiveNotification(req.params.id);
    res.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to archive notification';
    res.status(500).json({ ok: false, message });
  }
}
