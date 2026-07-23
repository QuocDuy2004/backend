import { pool } from '../../lib/mysql';

type VoucherStatus = 'active' | 'used' | 'expired' | 'disabled';

async function ensureUserVouchersTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_vouchers (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id INT UNSIGNED NOT NULL,
      code VARCHAR(80) NOT NULL,
      title VARCHAR(160) NULL,
      description TEXT NULL,
      discount_type ENUM('fixed', 'percent') NOT NULL,
      discount_value DECIMAL(14,2) NOT NULL,
      min_order_value DECIMAL(14,2) NOT NULL DEFAULT 0.00,
      max_discount DECIMAL(14,2) NULL,
      status ENUM('active', 'used', 'expired', 'disabled') NOT NULL DEFAULT 'active',
      used_at DATETIME NULL,
      starts_at DATETIME NULL,
      expires_at DATETIME NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_user_vouchers_user_code (user_id, code),
      INDEX idx_user_vouchers_user_status (user_id, status),
      INDEX idx_user_vouchers_code (code),
      INDEX idx_user_vouchers_expires_at (expires_at),
      CONSTRAINT fk_user_vouchers_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

function publicVoucher(row: any) {
  return {
    id: String(row.id),
    userId: row.user_id == null ? undefined : String(row.user_id),
    code: row.code,
    title: row.title,
    description: row.description,
    discountType: row.discount_type,
    discountValue: Number(row.discount_value || 0),
    minOrderValue: Number(row.min_order_value || 0),
    maxDiscount: row.max_discount == null ? undefined : Number(row.max_discount),
    status: row.status as VoucherStatus,
    startsAt: row.starts_at,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function resolveVoucherUserIdByEmail(email: string) {
  const [rows] = await pool.query<any[]>(
    'SELECT id FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1',
    [email]
  );
  return rows[0]?.id ? String(rows[0].id) : '';
}

export async function listUserVouchers(userId?: string) {
  await ensureUserVouchersTable();

  const params: unknown[] = [];
  const where: string[] = [
    "status = 'active'",
    '(starts_at IS NULL OR starts_at <= NOW())',
    '(expires_at IS NULL OR expires_at >= NOW())',
  ];

  if (userId) {
    where.push('user_id = ?');
    params.push(userId);
  }

  const [rows] = await pool.query<any[]>(
    `SELECT id, user_id, code, title, description, discount_type, discount_value,
            min_order_value, max_discount, status, starts_at, expires_at,
            created_at, updated_at
     FROM user_vouchers
     WHERE ${where.join(' AND ')}
     ORDER BY created_at DESC, id DESC`,
    params
  );

  return rows.map(publicVoucher);
}
