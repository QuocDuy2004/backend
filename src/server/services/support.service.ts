import { pool } from '../../lib/mysql';

type SupportSender = 'customer' | 'ai' | 'agent';

type SupportTicketPayload = {
  id: string;
  customerName: string;
  customerEmail: string;
  lastMessage?: string;
  status?: 'open' | 'pending' | 'solved';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  sentiment?: 'positive' | 'neutral' | 'negative';
  sentimentScore?: number;
  intent?: string;
  confidenceScore?: number;
  assignedToAI?: boolean;
  notes?: string;
  slaMinutesRemaining?: number;
  messages?: Array<{
    id: string;
    sender: SupportSender;
    text: string;
    timestamp?: string;
    metadata?: Record<string, unknown>;
  }>;
};

type SupportMessagePayload = {
  id: string;
  ticketId: string;
  sender: SupportSender;
  text: string;
  timestamp?: string;
  metadata?: Record<string, unknown>;
};

function parseJson(value: unknown) {
  if (!value) return undefined;
  if (typeof value === 'object') return value as Record<string, unknown>;
  try {
    return JSON.parse(String(value));
  } catch {
    return undefined;
  }
}

function normalizeDate(value?: string) {
  if (!value) return new Date();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function formatMysqlDateTime(value?: string) {
  return normalizeDate(value).toISOString().slice(0, 23).replace('T', ' ');
}

function toTicket(row: any, messages: any[] = []) {
  return {
    id: String(row.id),
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    lastMessage: row.last_message || '',
    updatedAt: row.updated_at,
    status: row.status,
    priority: row.priority,
    sentiment: row.sentiment,
    sentimentScore: Number(row.sentiment_score || 0),
    intent: row.intent,
    confidenceScore: Number(row.confidence_score || 0),
    assignedToAI: Boolean(row.assigned_to_ai),
    notes: row.notes || undefined,
    slaMinutesRemaining: Number(row.sla_minutes_remaining || 0),
    messages: messages.map(toMessage),
  };
}

function toMessage(row: any) {
  return {
    id: String(row.id),
    sender: row.sender as SupportSender,
    text: row.message_text,
    timestamp: row.created_at,
    metadata: parseJson(row.metadata),
  };
}

export async function ensureSupportTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS support_tickets (
      id VARCHAR(80) PRIMARY KEY,
      customer_name VARCHAR(160) NOT NULL,
      customer_email VARCHAR(255) NOT NULL,
      last_message TEXT NULL,
      status ENUM('open', 'pending', 'solved') NOT NULL DEFAULT 'open',
      priority ENUM('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium',
      sentiment ENUM('positive', 'neutral', 'negative') NOT NULL DEFAULT 'neutral',
      sentiment_score DECIMAL(5,2) NOT NULL DEFAULT 0,
      intent VARCHAR(160) NOT NULL DEFAULT 'General Support',
      confidence_score INT UNSIGNED NOT NULL DEFAULT 0,
      assigned_to_ai TINYINT(1) NOT NULL DEFAULT 1,
      notes TEXT NULL,
      sla_minutes_remaining INT NOT NULL DEFAULT 0,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      INDEX idx_support_tickets_customer_email (customer_email),
      INDEX idx_support_tickets_status (status, updated_at),
      INDEX idx_support_tickets_priority (priority, updated_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS support_messages (
      id VARCHAR(80) PRIMARY KEY,
      ticket_id VARCHAR(80) NOT NULL,
      sender ENUM('customer', 'ai', 'agent') NOT NULL,
      message_text TEXT NOT NULL,
      metadata JSON NULL,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      INDEX idx_support_messages_ticket_time (ticket_id, created_at),
      INDEX idx_support_messages_sender (sender, created_at),
      CONSTRAINT fk_support_messages_ticket
        FOREIGN KEY (ticket_id) REFERENCES support_tickets(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  const [columns] = await pool.query<any[]>(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'support_messages'
       AND COLUMN_NAME = 'metadata'`
  );
  if (columns.length === 0) {
    await pool.query('ALTER TABLE support_messages ADD COLUMN metadata JSON NULL AFTER message_text');
  }

  await pool.query('ALTER TABLE support_tickets MODIFY created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)');
  await pool.query('ALTER TABLE support_tickets MODIFY updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)');
  await pool.query('ALTER TABLE support_messages MODIFY created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)');
}

export async function listSupportTickets() {
  await ensureSupportTables();

  const [ticketRows] = await pool.query<any[]>(
    `SELECT *
     FROM support_tickets
     ORDER BY updated_at DESC, id DESC`
  );

  if (ticketRows.length === 0) return [];

  const ids = ticketRows.map((row) => String(row.id));
  const [messageRows] = await pool.query<any[]>(
    `SELECT *
     FROM support_messages
     WHERE ticket_id IN (${ids.map(() => '?').join(',')})
     ORDER BY created_at ASC, FIELD(sender, 'customer', 'ai', 'agent'), id ASC`,
    ids
  );
  const messagesByTicket = new Map<string, any[]>();
  messageRows.forEach((row) => {
    const ticketId = String(row.ticket_id);
    messagesByTicket.set(ticketId, [...(messagesByTicket.get(ticketId) || []), row]);
  });

  return ticketRows.map((row) => toTicket(row, messagesByTicket.get(String(row.id)) || []));
}

export async function upsertSupportTicket(payload: SupportTicketPayload) {
  await ensureSupportTables();

  await pool.query(
    `INSERT INTO support_tickets
      (id, customer_name, customer_email, last_message, status, priority, sentiment,
       sentiment_score, intent, confidence_score, assigned_to_ai, notes, sla_minutes_remaining, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       customer_name = VALUES(customer_name),
       customer_email = VALUES(customer_email),
       last_message = VALUES(last_message),
       status = VALUES(status),
       priority = VALUES(priority),
       sentiment = VALUES(sentiment),
       sentiment_score = VALUES(sentiment_score),
       intent = VALUES(intent),
       confidence_score = VALUES(confidence_score),
       assigned_to_ai = VALUES(assigned_to_ai),
       notes = VALUES(notes),
       sla_minutes_remaining = VALUES(sla_minutes_remaining),
       updated_at = VALUES(updated_at)`,
    [
      payload.id,
      payload.customerName || 'Khách hàng',
      payload.customerEmail || '',
      payload.lastMessage || payload.messages?.at(-1)?.text || '',
      payload.status || 'open',
      payload.priority || 'medium',
      payload.sentiment || 'neutral',
      Number(payload.sentimentScore || 0),
      payload.intent || 'General Support',
      Number(payload.confidenceScore || 0),
      payload.assignedToAI === false ? 0 : 1,
      payload.notes || null,
      Number(payload.slaMinutesRemaining || 0),
      formatMysqlDateTime(payload.messages?.at(-1)?.timestamp),
    ]
  );

  for (const message of payload.messages || []) {
    await addSupportMessage({
      id: message.id,
      ticketId: payload.id,
      sender: message.sender,
      text: message.text,
      timestamp: message.timestamp,
      metadata: message.metadata,
    }, false);
  }

  return findSupportTicket(payload.id);
}

export async function findSupportTicket(id: string) {
  await ensureSupportTables();

  const [ticketRows] = await pool.query<any[]>('SELECT * FROM support_tickets WHERE id = ? LIMIT 1', [id]);
  if (!ticketRows[0]) return null;

  const [messageRows] = await pool.query<any[]>(
    `SELECT *
     FROM support_messages
     WHERE ticket_id = ?
     ORDER BY created_at ASC, FIELD(sender, 'customer', 'ai', 'agent'), id ASC`,
    [id]
  );

  return toTicket(ticketRows[0], messageRows);
}

export async function updateSupportTicket(id: string, payload: Partial<SupportTicketPayload>) {
  const existing = await findSupportTicket(id);
  if (!existing) return null;
  return upsertSupportTicket({ ...existing, ...payload, id, messages: existing.messages });
}

export async function addSupportMessage(payload: SupportMessagePayload, touchTicket = true) {
  await ensureSupportTables();

  await pool.query(
    `INSERT INTO support_messages (id, ticket_id, sender, message_text, metadata, created_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       sender = VALUES(sender),
       message_text = VALUES(message_text),
       metadata = VALUES(metadata),
       created_at = VALUES(created_at)`,
    [
      payload.id,
      payload.ticketId,
      payload.sender,
      payload.text,
      payload.metadata ? JSON.stringify(payload.metadata) : null,
      formatMysqlDateTime(payload.timestamp),
    ]
  );

  if (touchTicket) {
    await pool.query(
      `UPDATE support_tickets
       SET last_message = ?, updated_at = ?, status = IF(status = 'solved', 'solved', 'open')
       WHERE id = ?`,
      [
        payload.text,
        formatMysqlDateTime(payload.timestamp),
        payload.ticketId,
      ]
    );
  }

  return findSupportTicket(payload.ticketId);
}
