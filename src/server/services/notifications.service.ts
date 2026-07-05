import type { ResultSetHeader } from 'mysql2';
import { pool } from '../../lib/mysql';

type NotificationAudience = 'all' | 'user';
type NotificationStatus = 'active' | 'archived';

export type CreateNotificationPayload = {
  title: string;
  message: string;
  type?: string;
  audience: NotificationAudience;
  targetPath?: string;
  targetParams?: Record<string, unknown>;
  userIds?: string[];
};

function parseJsonObject(value: unknown): Record<string, unknown> {
  if (!value) return {};
  if (typeof value === 'object') return value as Record<string, unknown>;
  if (typeof value !== 'string') return {};

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function publicNotification(row: any) {
  return {
    id: String(row.id),
    title: row.title,
    message: row.message,
    type: row.type,
    audience: row.audience as NotificationAudience,
    targetPath: row.target_path,
    targetParams: parseJsonObject(row.target_params),
    status: row.status as NotificationStatus,
    recipientCount: Number(row.recipient_count || 0),
    unreadCount: Number(row.unread_count || 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function publicUserNotification(row: any) {
  return {
    id: String(row.notification_id),
    userNotificationId: String(row.id),
    userId: String(row.user_id),
    title: row.title,
    message: row.message,
    type: row.type,
    audience: row.audience as NotificationAudience,
    targetPath: row.target_path,
    targetParams: parseJsonObject(row.target_params),
    isRead: Boolean(row.is_read),
    readAt: row.read_at,
    deliveredAt: row.delivered_at,
    createdAt: row.created_at,
  };
}

export async function listNotifications() {
  const [rows] = await pool.query<any[]>(
    `SELECT
       n.id, n.title, n.message, n.type, n.audience, n.target_path, n.target_params,
       n.status, n.created_at, n.updated_at,
       COUNT(un.id) AS recipient_count,
       SUM(CASE WHEN un.is_read = FALSE THEN 1 ELSE 0 END) AS unread_count
     FROM notifications n
     LEFT JOIN user_notifications un ON un.notification_id = n.id
     GROUP BY n.id
     ORDER BY n.created_at DESC, n.id DESC`
  );

  return rows.map(publicNotification);
}

export async function listUserNotifications(userId: string) {
  const [rows] = await pool.query<any[]>(
    `SELECT
       un.id, un.user_id, un.notification_id, un.is_read, un.read_at, un.delivered_at,
       n.title, n.message, n.type, n.audience, n.target_path, n.target_params, n.created_at
     FROM user_notifications un
     JOIN notifications n ON n.id = un.notification_id
     WHERE un.user_id = ?
       AND n.status = 'active'
     ORDER BY un.delivered_at DESC, un.id DESC`,
    [userId]
  );

  return rows.map(publicUserNotification);
}

export async function createNotification(payload: CreateNotificationPayload) {
  const audience: NotificationAudience = payload.audience === 'user' ? 'user' : 'all';
  const targetParams = JSON.stringify(payload.targetParams || {});
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [result] = await connection.query<ResultSetHeader>(
      `INSERT INTO notifications
        (title, message, type, audience, target_path, target_params, status)
       VALUES (?, ?, ?, ?, ?, ?, 'active')`,
      [
        payload.title,
        payload.message,
        payload.type || null,
        audience,
        payload.targetPath || null,
        targetParams,
      ]
    );

    const notificationId = result.insertId;

    if (audience === 'all') {
      await connection.query(
        `INSERT INTO user_notifications (user_id, notification_id, is_read)
         SELECT id, ?, FALSE
         FROM users
         WHERE status = 'active'`,
        [notificationId]
      );
    } else {
      const uniqueUserIds = [...new Set((payload.userIds || []).filter(Boolean))];
      if (uniqueUserIds.length === 0) {
        throw new Error('Select at least one user for user audience.');
      }

      await connection.query(
        `INSERT INTO user_notifications (user_id, notification_id, is_read)
         VALUES ${uniqueUserIds.map(() => '(?, ?, FALSE)').join(', ')}`,
        uniqueUserIds.flatMap((userId) => [userId, notificationId])
      );
    }

    await connection.commit();
    const [rows] = await pool.query<any[]>(
      `SELECT
         n.id, n.title, n.message, n.type, n.audience, n.target_path, n.target_params,
         n.status, n.created_at, n.updated_at,
         COUNT(un.id) AS recipient_count,
         SUM(CASE WHEN un.is_read = FALSE THEN 1 ELSE 0 END) AS unread_count
       FROM notifications n
       LEFT JOIN user_notifications un ON un.notification_id = n.id
       WHERE n.id = ?
       GROUP BY n.id`,
      [notificationId]
    );

    return publicNotification(rows[0]);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function markUserNotificationRead(notificationId: string, userId: string, isRead: boolean) {
  await pool.query(
    `UPDATE user_notifications
     SET is_read = ?, read_at = ?
     WHERE notification_id = ?
       AND user_id = ?`,
    [isRead, isRead ? new Date() : null, notificationId, userId]
  );
}

export async function archiveNotification(notificationId: string) {
  await pool.query(
    `UPDATE notifications
     SET status = 'archived', updated_at = NOW()
     WHERE id = ?`,
    [notificationId]
  );
}
