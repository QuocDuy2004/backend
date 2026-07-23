import type { ResultSetHeader } from 'mysql2';
import { pool } from '../../lib/mysql';

function parseJsonObject(value: unknown): Record<string, unknown> {
  if (!value) return {};
  if (typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>;
  if (typeof value !== 'string') return {};

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function publicSetting(row: any) {
  return {
    id: String(row.id),
    key: row.setting_key,
    settingKey: row.setting_key,
    group: row.setting_group,
    settingGroup: row.setting_group,
    title: row.title,
    value: parseJsonObject(row.value),
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listSettings(includeInactive = false) {
  const [rows] = await pool.query<any[]>(
    `SELECT id, setting_key, setting_group, title, value, status, created_at, updated_at
     FROM settings
     ${includeInactive ? '' : "WHERE status = 'active'"}
     ORDER BY setting_group ASC, id ASC`
  );

  return rows.map(publicSetting);
}

export async function findSettingByKey(settingKey: string) {
  const [rows] = await pool.query<any[]>(
    `SELECT id, setting_key, setting_group, title, value, status, created_at, updated_at
     FROM settings
     WHERE setting_key = ?
     LIMIT 1`,
    [settingKey]
  );

  return rows[0] ? publicSetting(rows[0]) : null;
}

export async function upsertSetting(payload: {
  settingKey: string;
  settingGroup: string;
  title: string;
  value: Record<string, unknown>;
  status?: string;
}) {
  const status = payload.status === 'inactive' ? 'inactive' : 'active';
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO settings (setting_key, setting_group, title, value, status)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       setting_group = VALUES(setting_group),
       title = VALUES(title),
       value = VALUES(value),
       status = VALUES(status),
       updated_at = NOW()`,
    [
      payload.settingKey,
      payload.settingGroup,
      payload.title,
      JSON.stringify(payload.value || {}),
      status,
    ]
  );

  const [rows] = await pool.query<any[]>(
    `SELECT id, setting_key, setting_group, title, value, status, created_at, updated_at
     FROM settings
     WHERE setting_key = ?
     LIMIT 1`,
    [payload.settingKey]
  );

  return publicSetting(rows[0] || { id: result.insertId, ...payload, status });
}
