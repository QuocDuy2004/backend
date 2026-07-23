import type { PoolConnection } from 'mysql2/promise';
import { pool } from '../../lib/mysql';

type ChangeLogEntityType = 'product' | 'category' | 'customer' | 'banner';
type ChangeLogAction = 'create' | 'update' | 'delete';

type ChangeLogPayload = {
  entityType: ChangeLogEntityType;
  entityId: string | number;
  entityName?: string | null;
  action: ChangeLogAction;
  summary: string;
  changes?: Record<string, unknown>;
  actorId?: string | number | null;
  actorName?: string | null;
};

type QueryExecutor = Pick<typeof pool, 'query'> | PoolConnection;

let ensured = false;

export async function ensureEntityChangeLogsTable() {
  if (ensured) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS entity_change_logs (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      entity_type ENUM('product', 'category', 'customer', 'banner') NOT NULL,
      entity_id VARCHAR(80) NOT NULL,
      entity_name VARCHAR(255) NULL,
      action ENUM('create', 'update', 'delete') NOT NULL,
      summary VARCHAR(255) NOT NULL,
      changes JSON NOT NULL DEFAULT (JSON_OBJECT()),
      actor_id VARCHAR(80) NULL,
      actor_name VARCHAR(160) NOT NULL DEFAULT 'Quản trị viên',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

      INDEX idx_entity_change_logs_entity (entity_type, entity_id, created_at),
      INDEX idx_entity_change_logs_action (action, created_at),
      CHECK (JSON_VALID(changes))
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  const [columns] = await pool.query<any[]>(
    `SELECT COLUMN_TYPE
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'entity_change_logs'
       AND COLUMN_NAME = 'entity_type'
     LIMIT 1`
  );

  const columnType = String(columns[0]?.COLUMN_TYPE || '');
  if (!columnType.includes("'banner'")) {
    await pool.query(
      "ALTER TABLE entity_change_logs MODIFY entity_type ENUM('product', 'category', 'customer', 'banner') NOT NULL"
    );
  }

  ensured = true;
}

export async function recordEntityChangeLog(payload: ChangeLogPayload, executor: QueryExecutor = pool) {
  await ensureEntityChangeLogsTable();

  await executor.query(
    `INSERT INTO entity_change_logs
      (entity_type, entity_id, entity_name, action, summary, changes, actor_id, actor_name)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.entityType,
      String(payload.entityId),
      payload.entityName || null,
      payload.action,
      payload.summary,
      JSON.stringify(payload.changes || {}),
      payload.actorId == null ? null : String(payload.actorId),
      payload.actorName || 'Quản trị viên',
    ]
  );
}

export async function listEntityChangeLogs(entityType: ChangeLogEntityType, entityId: string | number) {
  await ensureEntityChangeLogsTable();

  const [rows] = await pool.query<any[]>(
    `SELECT id, entity_type, entity_id, entity_name, action, summary, changes,
            actor_id, actor_name, created_at
     FROM entity_change_logs
     WHERE entity_type = ? AND entity_id = ?
     ORDER BY created_at DESC, id DESC`,
    [entityType, String(entityId)]
  );

  return rows.map((row) => ({
    id: String(row.id),
    entityType: row.entity_type,
    entityId: row.entity_id,
    entityName: row.entity_name || undefined,
    action: row.action,
    summary: row.summary,
    changes: typeof row.changes === 'string' ? JSON.parse(row.changes) : row.changes,
    actorId: row.actor_id || undefined,
    actorName: row.actor_name,
    createdAt: row.created_at,
  }));
}
