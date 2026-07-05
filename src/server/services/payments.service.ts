import { pool } from '../../lib/mysql';

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

function publicPayment(row: any) {
  const config = parseJsonObject(row.config);
  const logoUri = row.logo_uri || (typeof config.bankLogo === 'string' ? config.bankLogo : null);
  const styleByCode: Record<string, { tone: string; logoBg: string; logoText: string }> = {
    COD: { tone: 'bg-amber-50 border-amber-200', logoBg: 'bg-amber-500', logoText: 'COD' },
    momo: { tone: 'bg-fuchsia-50 border-fuchsia-200', logoBg: 'bg-fuchsia-600', logoText: 'MoMo' },
    vnpay: { tone: 'bg-sky-50 border-sky-200', logoBg: 'bg-sky-600', logoText: 'VNPay' },
    visa: { tone: 'bg-indigo-50 border-indigo-200', logoBg: 'bg-indigo-600', logoText: 'VISA' },
    bank_transfer: { tone: 'bg-emerald-50 border-emerald-200', logoBg: 'bg-emerald-600', logoText: 'BANK' },
  };
  const style = styleByCode[row.code] || { tone: 'bg-zinc-50 border-zinc-200', logoBg: 'bg-zinc-900', logoText: row.code };

  return {
    id: String(row.id),
    code: row.code,
    name: row.title,
    title: row.title,
    subtitle: row.subtitle,
    provider: row.code,
    logoType: logoUri ? 'image' : 'text',
    logoText: style.logoText,
    logoUri,
    logoBgClassName: style.logoBg,
    toneClassName: style.tone,
    paymentStatusOnOrder: row.payment_status_on_order,
    status: row.status,
    sortOrder: row.sort_order,
    config,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listPayments(includeInactive = false) {
  const [rows] = await pool.query<any[]>(
    `SELECT
       id, code, title, subtitle, logo_uri,
       payment_status_on_order, status, sort_order, config, created_at, updated_at
     FROM payments
     ${includeInactive ? '' : "WHERE status = 'active'"}
     ORDER BY sort_order ASC, id ASC`
  );

  return rows.map(publicPayment);
}

export async function updatePayment(
  code: string,
  payload: {
    status?: string;
    paymentStatusOnOrder?: string;
    config?: Record<string, unknown>;
  }
) {
  const status = payload.status === 'inactive' ? 'inactive' : 'active';
  const paymentStatusOnOrder = payload.paymentStatusOnOrder === 'paid' ? 'paid' : 'pending';
  const config = payload.config && typeof payload.config === 'object' ? payload.config : {};

  await pool.query(
    `UPDATE payments
     SET status = ?, payment_status_on_order = ?, config = ?, updated_at = NOW()
     WHERE code = ?`,
    [status, paymentStatusOnOrder, JSON.stringify(config), code]
  );

  const [rows] = await pool.query<any[]>(
    `SELECT
       id, code, title, subtitle, logo_uri,
       payment_status_on_order, status, sort_order, config, created_at, updated_at
     FROM payments
     WHERE code = ?
     LIMIT 1`,
    [code]
  );

  return rows[0] ? publicPayment(rows[0]) : null;
}
