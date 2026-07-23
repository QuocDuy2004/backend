import type { ResultSetHeader } from 'mysql2';
import { pool } from '../../lib/mysql';
import { parseJsonField } from '../utils/json';

const paymentMethods = ['COD', 'vnpay', 'momo', 'visa', 'bank_transfer'] as const;
const paymentStatuses = ['pending', 'paid', 'failed', 'refunded'] as const;
const orderStatuses = ['pending', 'processing', 'shipping', 'completed', 'delivered', 'cancelled', 'refunded'] as const;
const onlinePaymentMethods = ['vnpay', 'momo', 'visa', 'bank_transfer'] as const;

type PaymentMethod = (typeof paymentMethods)[number];
type PaymentStatus = (typeof paymentStatuses)[number];
type OrderStatus = (typeof orderStatuses)[number];

function pickEnum<T extends readonly string[]>(value: unknown, values: T, fallback: T[number]) {
  return values.includes(value as T[number]) ? (value as T[number]) : fallback;
}

function toMoney(value: unknown) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
}

function normalizeItems(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function itemProductId(item: any) {
  return String(item?.productId || item?.product_id || '').trim();
}

function normalizeOptionalId(value: unknown) {
  const id = String(value || '').trim();
  return id || null;
}

function itemQuantity(item: any) {
  const quantity = Number(item?.quantity || 1);
  return Math.max(1, Number.isFinite(quantity) ? Math.floor(quantity) : 1);
}

async function resolveExistingUserId(value: unknown) {
  const userId = normalizeOptionalId(value);
  if (!userId) return null;

  const [rows] = await pool.query<any[]>('SELECT id FROM users WHERE id = ? LIMIT 1', [userId]);
  return rows[0] ? String(rows[0].id) : null;
}

async function ensureOrdersTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      order_code VARCHAR(80) NULL,
      user_id INT UNSIGNED NULL,
      primary_product_id VARCHAR(80) NULL,
      payment_id INT UNSIGNED NULL,
      customer_name VARCHAR(160) NOT NULL,
      customer_phone VARCHAR(40) NOT NULL,
      customer_email VARCHAR(255) NULL,
      customer_address TEXT NOT NULL,
      items JSON NOT NULL,
      subtotal DECIMAL(14,2) NOT NULL DEFAULT 0,
      shipping_fee DECIMAL(14,2) NOT NULL DEFAULT 0,
      discount_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
      total_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
      voucher_code_used VARCHAR(80) NULL,
      shipping_unit VARCHAR(120) NOT NULL DEFAULT 'standard',
      payment_method ENUM('COD', 'vnpay', 'momo', 'visa', 'bank_transfer') NOT NULL DEFAULT 'COD',
      payment_status ENUM('pending', 'paid', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
      order_status ENUM('pending', 'processing', 'shipping', 'completed', 'delivered', 'cancelled', 'refunded') NOT NULL DEFAULT 'pending',
      note TEXT NULL,
      timeline JSON NOT NULL DEFAULT (JSON_ARRAY()),
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_orders_order_code (order_code),
      INDEX idx_orders_user (user_id),
      INDEX idx_orders_primary_product (primary_product_id),
      INDEX idx_orders_payment (payment_id),
      INDEX idx_orders_status_date (order_status, created_at),
      INDEX idx_orders_phone (customer_phone),
      CONSTRAINT fk_orders_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
      CONSTRAINT fk_orders_payment
        FOREIGN KEY (payment_id) REFERENCES payments(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
      CHECK (JSON_VALID(items)),
      CHECK (JSON_VALID(timeline))
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      order_id INT UNSIGNED NOT NULL,
      product_id VARCHAR(80) NOT NULL,
      product_name VARCHAR(255) NOT NULL,
      product_image TEXT NULL,
      quantity INT UNSIGNED NOT NULL DEFAULT 1,
      price DECIMAL(14,2) NOT NULL DEFAULT 0,
      selected_color VARCHAR(120) NULL,
      selected_size VARCHAR(120) NULL,
      selected_version VARCHAR(120) NULL,
      line_total DECIMAL(14,2) NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_order_items_order (order_id),
      INDEX idx_order_items_product (product_id),
      CONSTRAINT fk_order_items_order
        FOREIGN KEY (order_id) REFERENCES orders(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  const [columns] = await pool.query<any[]>(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'orders'
       AND COLUMN_NAME IN ('order_code', 'primary_product_id', 'payment_id')`
  );
  const columnNames = new Set(columns.map((item) => item.COLUMN_NAME));

  if (!columnNames.has('order_code')) {
    await pool.query('ALTER TABLE orders ADD COLUMN order_code VARCHAR(80) NULL AFTER id');
    await pool.query('ALTER TABLE orders ADD UNIQUE KEY uq_orders_order_code (order_code)');
  }
  if (!columnNames.has('primary_product_id')) {
    await pool.query('ALTER TABLE orders ADD COLUMN primary_product_id VARCHAR(80) NULL AFTER user_id');
    await pool.query('ALTER TABLE orders ADD INDEX idx_orders_primary_product (primary_product_id)');
  }
  if (!columnNames.has('payment_id')) {
    await pool.query('ALTER TABLE orders ADD COLUMN payment_id INT UNSIGNED NULL AFTER primary_product_id');
    await pool.query('ALTER TABLE orders ADD INDEX idx_orders_payment (payment_id)');
  }
}

async function reserveProductStock(connection: any, items: any[]) {
  const quantitiesByProduct = new Map<string, number>();

  for (const item of items) {
    const productId = itemProductId(item);
    if (!productId) continue;
    quantitiesByProduct.set(productId, (quantitiesByProduct.get(productId) || 0) + itemQuantity(item));
  }

  for (const [productId, quantity] of quantitiesByProduct) {
    const [rows] = await connection.query(
      'SELECT id, name, stock FROM products WHERE id = ? LIMIT 1 FOR UPDATE',
      [productId]
    );
    const product = rows[0];

    if (!product) {
      throw new Error(`Product ${productId} not found.`);
    }

    const currentStock = Number(product.stock || 0);
    if (currentStock < quantity) {
      throw new Error(`Product ${product.name || productId} does not have enough stock. Current stock: ${currentStock}.`);
    }

    await connection.query(
      'UPDATE products SET stock = stock - ?, updated_at = NOW() WHERE id = ?',
      [quantity, productId]
    );
  }
}

function publicOrder(row: any) {
  const items = parseJsonField<any[]>(row.items, []);

  return {
    id: row.order_code || String(row.id),
    numericId: String(row.id),
    userId: row.user_id == null ? undefined : String(row.user_id),
    primaryProductId: row.primary_product_id || undefined,
    paymentId: row.payment_id == null ? undefined : String(row.payment_id),
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerEmail: row.customer_email || undefined,
    customerAddress: row.customer_address,
    items,
    subtotal: Number(row.subtotal || 0),
    shippingFee: Number(row.shipping_fee || 0),
    discountAmount: Number(row.discount_amount || 0),
    voucherCodeUsed: row.voucher_code_used || undefined,
    totalAmount: Number(row.total_amount || 0),
    shippingUnit: row.shipping_unit,
    paymentMethod: row.payment_method as PaymentMethod,
    paymentStatus: row.payment_status as PaymentStatus,
    orderStatus: row.order_status as OrderStatus,
    note: row.note || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createOrder(payload: any) {
  await ensureOrdersTable();

  const items = normalizeItems(payload.items);
  if (items.length === 0) {
    throw new Error('Order items are required.');
  }

  const customerName = String(payload.customerName || payload.customer_name || '').trim();
  const customerPhone = String(payload.customerPhone || payload.customer_phone || '').trim();
  const customerAddress = String(payload.customerAddress || payload.customer_address || '').trim();

  if (!customerName || !customerPhone || !customerAddress) {
    throw new Error('customerName, customerPhone and customerAddress are required.');
  }

  const subtotal = toMoney(payload.subtotal ?? items.reduce((sum, item) => {
    return sum + toMoney(item.price) * Math.max(1, Number(item.quantity || 1));
  }, 0));
  const shippingFee = toMoney(payload.shippingFee ?? payload.shipping_fee);
  const discountAmount = toMoney(payload.discountAmount ?? payload.discount_amount);
  const totalAmount = toMoney(payload.totalAmount ?? payload.total_amount ?? subtotal + shippingFee - discountAmount);
  const userId = await resolveExistingUserId(payload.userId || payload.user_id);
  const orderCode = String(payload.id || payload.orderCode || payload.order_code || `EXP-${Date.now()}`).trim();
  const paymentMethod = pickEnum(payload.paymentMethod || payload.payment_method, paymentMethods, 'COD');
  const paymentStatus = pickEnum(payload.paymentStatus || payload.payment_status, paymentStatuses, 'pending');
  const waitsForOnlinePayment = onlinePaymentMethods.includes(paymentMethod as (typeof onlinePaymentMethods)[number])
    && paymentStatus !== 'paid';
  const primaryProductId = itemProductId(items[0]) || null;
  const [paymentRows] = await pool.query<any[]>(
    'SELECT id FROM payments WHERE code = ? LIMIT 1',
    [paymentMethod]
  );
  const paymentId = paymentRows[0]?.id || payload.paymentId || payload.payment_id || null;

  const connection = await pool.getConnection();
  let orderId = 0;

  try {
    await connection.beginTransaction();
    await reserveProductStock(connection, items);

    const [result] = await connection.query<ResultSetHeader>(
      `INSERT INTO orders
        (order_code, user_id, primary_product_id, payment_id, customer_name, customer_phone, customer_email, customer_address,
         items, subtotal, shipping_fee, discount_amount, total_amount, voucher_code_used,
         shipping_unit, payment_method, payment_status, order_status, note, timeline)
       VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, JSON_ARRAY(JSON_OBJECT('status', 'pending', 'label', 'Order created', 'createdAt', NOW())))`,
      [
        orderCode || null,
        userId,
        primaryProductId,
        paymentId,
        customerName,
        customerPhone,
        payload.customerEmail || payload.customer_email || null,
        customerAddress,
        JSON.stringify(items),
        subtotal,
        shippingFee,
        discountAmount,
        totalAmount,
        payload.voucherCodeUsed || payload.voucher_code_used || null,
        payload.shippingUnit || payload.shipping_unit || 'standard',
        paymentMethod,
        paymentStatus,
        pickEnum(payload.orderStatus || payload.order_status, orderStatuses, 'pending'),
        payload.note || payload.notes || null,
      ]
    );
    orderId = result.insertId;

    for (const item of items) {
      const productId = itemProductId(item);
      if (!productId) continue;
      const quantity = itemQuantity(item);
      const price = toMoney(item.price);

      await connection.query(
        `INSERT INTO order_items
          (order_id, product_id, product_name, product_image, quantity, price,
           selected_color, selected_size, selected_version, line_total)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          productId,
          String(item.productName || item.product_name || ''),
          item.productImage || item.product_image || null,
          quantity,
          price,
          item.selectedColor || item.selected_color || null,
          item.selectedSize || item.selected_size || null,
          item.selectedVersion || item.selected_version || null,
          price * quantity,
        ]
      );
    }

    if (userId && !waitsForOnlinePayment) {
      await connection.query('UPDATE users SET orders_count = orders_count + 1 WHERE id = ?', [userId]);
      await connection.query('DELETE FROM user_cart WHERE user_id = ?', [userId]).catch(() => undefined);
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  return findOrderById(String(orderId));
}

export async function findOrderById(id: string) {
  await ensureOrdersTable();

  const [rows] = await pool.query<any[]>(
    `SELECT *
     FROM orders
     WHERE id = ? OR order_code = ?
     LIMIT 1`,
    [id, id]
  );

  return rows[0] ? publicOrder(rows[0]) : null;
}

export async function listOrders(userId?: string, email?: string) {
  await ensureOrdersTable();

  const whereParts: string[] = [];
  const params: string[] = [];

  if (userId) {
    whereParts.push('user_id = ?');
    params.push(userId);
  }

  if (email) {
    whereParts.push('(customer_email = ? OR user_id IN (SELECT id FROM users WHERE email = ?))');
    params.push(email, email);
  }

  const [rows] = await pool.query<any[]>(
    `SELECT *
     FROM orders
     ${whereParts.length > 0 ? `WHERE ${whereParts.join(' OR ')}` : ''}
     ORDER BY created_at DESC, id DESC`,
    params
  );

  return rows.map(publicOrder);
}
