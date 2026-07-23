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
    provider: row.code,
    logoType: logoUri ? 'image' : 'text',
    logoText: style.logoText,
    logoUri,
    logoBgClassName: style.logoBg,
    toneClassName: style.tone,
    status: row.status,
    config,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listPayments(includeInactive = false) {
  const [rows] = await pool.query<any[]>(
    `SELECT
       id, code, title, logo_uri,
       status, config, created_at, updated_at
     FROM payments
     ${includeInactive ? '' : "WHERE status = 'active'"}
     ORDER BY id ASC`
  );

  return rows.map(publicPayment);
}

export async function updatePayment(
  code: string,
  payload: {
    title?: string;
    status?: string;
    logoUri?: string;
    config?: Record<string, unknown>;
  }
) {
  const status = payload.status === 'inactive' ? 'inactive' : 'active';
  const config = payload.config && typeof payload.config === 'object' ? payload.config : {};
  const hasLogoUri = typeof payload.logoUri === 'string';
  const logoUri = hasLogoUri ? payload.logoUri!.trim() || null : null;
  const title = typeof payload.title === 'string' && payload.title.trim() ? payload.title.trim() : undefined;
  const updates = ['status = ?', 'config = ?'];
  const params: unknown[] = [status, JSON.stringify(config)];

  if (title !== undefined) {
    updates.push('title = ?');
    params.push(title);
  }

  if (hasLogoUri) {
    updates.push('logo_uri = ?');
    params.push(logoUri);
  }

  updates.push('updated_at = NOW()');
  params.push(code);

  await pool.query(
    `UPDATE payments
     SET ${updates.join(', ')}
     WHERE code = ?`,
    params
  );

  const [rows] = await pool.query<any[]>(
    `SELECT
       id, code, title, logo_uri,
       status, config, created_at, updated_at
     FROM payments
     WHERE code = ?
     LIMIT 1`,
    [code]
  );

  return rows[0] ? publicPayment(rows[0]) : null;
}

export async function createPayment(payload: {
  code: string;
  title: string;
  logoUri?: string;
  status?: string;
  config?: Record<string, unknown>;
}) {
  const code = payload.code.trim();
  const title = payload.title.trim();
  const logoUri = typeof payload.logoUri === 'string' ? payload.logoUri.trim() || null : null;
  const status = payload.status === 'inactive' ? 'inactive' : 'active';
  const config = payload.config && typeof payload.config === 'object' ? payload.config : {};

  await pool.query(
    `INSERT INTO payments
       (code, title, logo_uri, status, config)
     VALUES (?, ?, ?, ?, ?)`,
    [code, title, logoUri, status, JSON.stringify(config)]
  );

  const [rows] = await pool.query<any[]>(
    `SELECT
       id, code, title, logo_uri,
       status, config, created_at, updated_at
     FROM payments
     WHERE code = ?
     LIMIT 1`,
    [code]
  );

  return rows[0] ? publicPayment(rows[0]) : null;
}

export async function deletePayment(code: string) {
  const [result] = await pool.query<any>(
    'DELETE FROM payments WHERE code = ?',
    [code]
  );

  return Number(result?.affectedRows || 0) > 0;
}
