import { pool } from '../../lib/mysql';

export type BankTransferConfig = {
  bankType: string;
  accountNumber: string;
  accountName: string;
  webhookSignature: string;
  webhookUrl?: string;
  apiToken?: string;
  transactionsEndpoint: string;
};

export type IncomingBankTransaction = {
  type?: string;
  transactionID?: string;
  amount?: string | number;
  description?: string;
};

function parseConfig(value: unknown): Record<string, any> {
  if (!value) return {};
  if (typeof value === 'object' && !Array.isArray(value)) return value as Record<string, any>;
  if (typeof value !== 'string') return {};

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function normalizeBankName(value: string) {
  const normalized = String(value || '').trim();
  const aliases: Record<string, string> = {
    MBBank: 'MBbank',
    MB: 'MBbank',
    Vietcombank: 'Vietcombank',
    Techcombank: 'Techcombank',
    ACB: 'ACB',
    OCB: 'OCB',
    TPBank: 'TPBank',
    BIDV: 'BIDV',
    Agribank: 'Agribank',
  };
  return aliases[normalized] || normalized || 'MBbank';
}

function normalizeTransferText(value: string) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s.-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function getBankTransferConfig(): Promise<BankTransferConfig> {
  const [rows] = await pool.query<any[]>(
    `SELECT code, config
     FROM payments
     WHERE status = 'active'
       AND (code = 'bank_transfer' OR code LIKE 'bank\\_%')
     ORDER BY code = 'bank_transfer' DESC, updated_at DESC, id DESC`
  );
  const configured = rows
    .map((row) => parseConfig(row.config))
    .find((item) => item.bankType && item.accountNumber && item.accountName);
  const fallback = rows.length > 0 ? parseConfig(rows[0]?.config) : {};
  const config = configured || fallback;

  return {
    bankType: normalizeBankName(config.bankType || config.bankName || 'MBbank'),
    accountNumber: String(config.accountNumber || '').trim(),
    accountName: String(config.accountName || 'VELOCart').trim(),
    webhookSignature: String(config.webhookSignature || config.apiSignature || '').trim(),
    webhookUrl: String(config.webhookUrl || '').trim() || undefined,
    apiToken: String(config.apiToken || config.webhookSignature || config.apiSignature || '').trim(),
    transactionsEndpoint: String(config.transactionsEndpoint || 'https://api.sieuthicode.net/v1/transactions/list').trim(),
  };
}

export async function createBankTransferPayment(params: {
  orderId: string;
  amount: number;
  payerName: string;
}) {
  const config = await getBankTransferConfig();

  if (!config.accountNumber || !config.accountName) {
    throw new Error('Chuyen khoan ngan hang chua duoc cau hinh. Vui long vao Settings de nhap ngan hang, so tai khoan va chu tai khoan.');
  }

  const transferContent = normalizeTransferText(`${params.payerName} ${params.orderId}`);
  const qrUrl = `https://api.vietqr.io/${encodeURIComponent(config.bankType)}/${encodeURIComponent(config.accountNumber)}/${Math.round(params.amount)}/${encodeURIComponent(transferContent)}/qronly2.jpg?accountName=${encodeURIComponent(config.accountName)}`;

  return {
    orderId: params.orderId,
    amount: Math.round(params.amount),
    bankName: config.bankType,
    accountNumber: config.accountNumber,
    accountName: config.accountName,
    transferContent,
    qrUrl,
  };
}

async function ensureBankTransactionsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS bank_transfer_transactions (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      transaction_id VARCHAR(120) NOT NULL,
      order_code VARCHAR(80) NULL,
      type VARCHAR(20) NULL,
      amount DECIMAL(14,2) NOT NULL DEFAULT 0,
      description TEXT NULL,
      matched TINYINT(1) NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_bank_transfer_transaction_id (transaction_id),
      INDEX idx_bank_transfer_order_code (order_code)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

async function findMatchingOrder(transaction: IncomingBankTransaction) {
  const description = String(transaction.description || '');
  const amount = Number(transaction.amount || 0);

  if (!description || amount <= 0) return null;

  const [rows] = await pool.query<any[]>(
    `SELECT id, order_code, total_amount, payment_status, order_status
     FROM orders
     WHERE payment_method = 'bank_transfer'
       AND payment_status <> 'paid'
       AND order_status <> 'completed'
       AND ? LIKE CONCAT('%', order_code, '%')
       AND ? >= total_amount
     ORDER BY created_at DESC
     LIMIT 1`,
    [description, amount]
  );

  return rows[0] || null;
}

export async function processBankTransactions(transactions: IncomingBankTransaction[]) {
  await ensureBankTransactionsTable();

  const matched: Array<{
    orderId: string;
    transactionId: string;
    amount: number;
    description: string;
  }> = [];

  for (const transaction of transactions) {
    const transactionId = String(transaction.transactionID || '').trim();
    const type = String(transaction.type || '').trim().toUpperCase();
    const amount = Number(transaction.amount || 0);
    const description = String(transaction.description || '').trim();

    if (!transactionId) continue;

    const [existing] = await pool.query<any[]>(
      'SELECT id, matched FROM bank_transfer_transactions WHERE transaction_id = ? LIMIT 1',
      [transactionId]
    );
    if (existing[0]?.matched) continue;

    const order = type === 'IN' ? await findMatchingOrder(transaction) : null;
    const orderCode = order?.order_code || null;

    await pool.query(
      `INSERT INTO bank_transfer_transactions
        (transaction_id, order_code, type, amount, description, matched)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         order_code = VALUES(order_code),
         type = VALUES(type),
         amount = VALUES(amount),
         description = VALUES(description),
         matched = GREATEST(matched, VALUES(matched))`,
      [transactionId, orderCode, type || null, amount, description || null, order ? 1 : 0]
    );

    if (order) {
      matched.push({
        orderId: String(order.order_code || order.id),
        transactionId,
        amount,
        description,
      });
    }
  }

  return matched;
}

export async function fetchBankTransactionsFromProvider() {
  const config = await getBankTransferConfig();

  if (!config.apiToken) {
    throw new Error('Chua cau hinh API token giao dich ngan hang.');
  }

  const response = await fetch(config.transactionsEndpoint, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${config.apiToken}`,
      Accept: 'application/json',
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.status === 'error') {
    throw new Error(data?.message || `Không thể lấy danh sách giao dịch (${response.status}).`);
  }

  return Array.isArray(data?.transactions) ? data.transactions as IncomingBankTransaction[] : [];
}
