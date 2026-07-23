import jwt from 'jsonwebtoken';
import type { ResultSetHeader } from 'mysql2';
import { pool } from '../../lib/mysql';
import { env } from '../config/env';
import { UserRole, validRoles } from '../config/auth';
import { parseJsonField } from '../utils/json';
import { md5 } from '../utils/password';
import { recordEntityChangeLog } from './change-logs.service';

export function toUserRole(value: unknown): UserRole {
  return validRoles.includes(value as UserRole) ? (value as UserRole) : 'member';
}

export function publicUser(row: any) {
  const cart = parseJsonField<unknown[]>(row.cart, []);

  return {
    id: String(row.id),
    username: row.username,
    name: row.name,
    email: row.email,
    phone: row.phone,
    address: row.address,
    image: row.image,
    cart: Array.isArray(cart) ? cart : [],
    role: row.role,
    status: row.status,
    ordersCount: row.orders_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function signAuthToken(row: any) {
  const userId = String(row.id);

  return jwt.sign(
    {
      userId,
      username: row.username,
      email: row.email,
      role: row.role as UserRole,
    },
    env.jwtSecret,
    {
      subject: userId,
      expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'],
    }
  );
}

async function ensureUserCartTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_cart (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id INT UNSIGNED NOT NULL,
      product_id VARCHAR(80) NOT NULL,
      quantity INT UNSIGNED NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_user_cart_user_product (user_id, product_id),
      INDEX idx_user_cart_user (user_id),
      INDEX idx_user_cart_product (product_id),
      CONSTRAINT fk_user_cart_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await addColumnIfMissing('user_cart', 'quantity', 'ALTER TABLE user_cart ADD COLUMN quantity INT UNSIGNED NOT NULL DEFAULT 1 AFTER product_id');
  await dropColumnsIfExists('user_cart', ['selected_color', 'selected_size', 'selected_version', 'metadata']);
}

async function ensureUserFavoritesTable() {
  const [columns] = await pool.query<any[]>(
    `SELECT DATA_TYPE
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'user_favorites'
       AND COLUMN_NAME = 'product_id'
     LIMIT 1`
  );

  if (columns[0] && !['varchar', 'char', 'text'].includes(String(columns[0].DATA_TYPE).toLowerCase())) {
    await pool.query('DROP TABLE IF EXISTS user_favorites');
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_favorites (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id INT UNSIGNED NOT NULL,
      product_id VARCHAR(80) NOT NULL,
      quantity INT UNSIGNED NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_user_favorites_user_product (user_id, product_id),
      INDEX idx_user_favorites_user (user_id),
      INDEX idx_user_favorites_product (product_id),
      CONSTRAINT fk_user_favorites_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await addColumnIfMissing('user_favorites', 'quantity', 'ALTER TABLE user_favorites ADD COLUMN quantity INT UNSIGNED NOT NULL DEFAULT 1 AFTER product_id');
  await dropColumnsIfExists('user_favorites', ['metadata']);
}

async function addColumnIfMissing(tableName: string, columnName: string, statement: string) {
  const [rows] = await pool.query<any[]>(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?
     LIMIT 1`,
    [tableName, columnName]
  );

  if (!rows[0]) {
    await pool.query(statement);
  }
}

async function dropColumnsIfExists(tableName: string, columnNames: string[]) {
  if (columnNames.length === 0) return;

  const [rows] = await pool.query<any[]>(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME IN (${columnNames.map(() => '?').join(',')})`,
    [tableName, ...columnNames]
  );

  for (const row of rows) {
    await pool.query(`ALTER TABLE \`${tableName}\` DROP COLUMN \`${row.COLUMN_NAME}\``);
  }
}

const publicUserFields = `
  id, username, name, email, phone, image, role, status,
  loyalty_points, orders_count, created_at, updated_at,
  (
    SELECT ua.address_detail
    FROM user_address ua
    WHERE ua.user_id = users.id
    ORDER BY ua.id ASC
    LIMIT 1
  ) AS address
`;

export async function findUserByEmail(email: string) {
  const [rows] = await pool.query<any[]>(
    `SELECT ${publicUserFields}
     FROM users
     WHERE LOWER(email) = ?
     LIMIT 1`,
    [email]
  );
  return rows[0] || null;
}

export async function findLoginUser(usernameOrEmail: string, password: string) {
  const [rows] = await pool.query<any[]>(
    `SELECT ${publicUserFields}
     FROM users
     WHERE (LOWER(username) = ? OR LOWER(email) = ?)
       AND password = ?
     LIMIT 1`,
    [usernameOrEmail, usernameOrEmail, md5(password)]
  );
  return rows[0] || null;
}

export async function listUsers() {
  const [rows] = await pool.query<any[]>(`SELECT ${publicUserFields} FROM users`);
  return rows.map(publicUser);
}

export async function createUser(payload: {
  username: string;
  password: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  role?: UserRole;
}) {
  const role = toUserRole(payload.role);

  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO users
      (username, password, name, email, phone, role, status, password_changed_at)
     VALUES
      (?, ?, ?, ?, ?, ?, 'active', NOW())`,
    [
      payload.username,
      md5(payload.password),
      payload.name,
      payload.email,
      payload.phone || null,
      role,
    ]
  );

  if (payload.address) {
    await pool.query(
      `INSERT INTO user_address (user_id, city, district, ward, address_detail)
       VALUES (?, ?, ?, ?, ?)`,
      [result.insertId, 'Unknown', 'Unknown', 'Unknown', payload.address]
    );
  }

  const user = await findUserById(String(result.insertId));
  const publicCreatedUser = publicUser(user);
  await recordEntityChangeLog({
    entityType: 'customer',
    entityId: publicCreatedUser.id,
    entityName: publicCreatedUser.name,
    action: 'create',
    summary: `Tạo khách hàng ${publicCreatedUser.name}`,
    changes: { after: publicCreatedUser },
  });

  return publicCreatedUser;
}

export async function findUserById(id: string) {
  const [rows] = await pool.query<any[]>(
    `SELECT ${publicUserFields}
     FROM users
     WHERE id = ?
     LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

export async function findUserByIdentifier(identifier: string) {
  const value = String(identifier || '').trim();
  if (!value) return null;

  const [rows] = await pool.query<any[]>(
    `SELECT ${publicUserFields}
     FROM users
     WHERE id = ?
        OR LOWER(email) = ?
        OR LOWER(username) = ?
     LIMIT 1`,
    [value, value.toLowerCase(), value.toLowerCase()]
  );
  return rows[0] || null;
}

function isEmailIdentifier(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function usernameFromEmail(email: string) {
  const localPart = email.split('@')[0] || 'member';
  return localPart.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/^_+|_+$/g, '') || 'member';
}

async function findUserByIdentifierWithConnection(connection: any, identifier: string) {
  const value = String(identifier || '').trim();
  if (!value) return null;

  const [rows] = await connection.query(
    `SELECT ${publicUserFields}
     FROM users
     WHERE id = ?
        OR LOWER(email) = ?
        OR LOWER(username) = ?
     LIMIT 1`,
    [value, value.toLowerCase(), value.toLowerCase()]
  );
  return rows[0] || null;
}

async function createMemberUserForEmail(connection: any, email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const usernameBase = usernameFromEmail(normalizedEmail);
  let username = usernameBase;

  for (let index = 2; index <= 20; index += 1) {
    const [existing] = await connection.query('SELECT id FROM users WHERE username = ? LIMIT 1', [username]);
    if (!existing[0]) break;
    username = `${usernameBase}_${index}`;
  }

  const displayName = usernameBase
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ') || normalizedEmail;

  const [result] = await connection.query(
    `INSERT INTO users
      (username, password, name, email, phone, role, status, password_changed_at)
     VALUES
      (?, ?, ?, ?, ?, 'member', 'active', NOW())`,
    [username, md5('member123'), displayName, normalizedEmail, '']
  );

  return findUserByIdentifierWithConnection(connection, String((result as ResultSetHeader).insertId));
}

async function resolveUserForCartOrFavorites(identifier: string, connection?: any) {
  const value = String(identifier || '').trim();
  if (!value) return null;

  const activeConnection = connection || pool;
  const user = await findUserByIdentifierWithConnection(activeConnection, value);
  if (user) return user;

  if (!isEmailIdentifier(value)) return null;
  return createMemberUserForEmail(activeConnection, value);
}

export async function updateUser(
  id: string,
  payload: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    role?: UserRole;
    status?: string;
  }
) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const oldUser = await findUserByIdentifierWithConnection(connection, id);

    await connection.query(
      `UPDATE users
       SET name = ?, email = ?, phone = ?, role = ?, status = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        payload.name,
        payload.email,
        payload.phone || null,
        toUserRole(payload.role),
        payload.status || 'active',
        id,
      ]
    );

    if (payload.address !== undefined) {
      await connection.query('DELETE FROM user_address WHERE user_id = ?', [id]);
      if (payload.address) {
        await connection.query(
          `INSERT INTO user_address (user_id, city, district, ward, address_detail)
           VALUES (?, ?, ?, ?, ?)`,
          [id, 'Unknown', 'Unknown', 'Unknown', payload.address]
        );
      }
    }

    const updatedUser = await findUserByIdentifierWithConnection(connection, id);
    await recordEntityChangeLog(
      {
        entityType: 'customer',
        entityId: id,
        entityName: updatedUser?.name || payload.name,
        action: 'update',
        summary: `Cập nhật khách hàng ${updatedUser?.name || payload.name}`,
        changes: {
          before: oldUser ? publicUser(oldUser) : null,
          after: updatedUser ? publicUser(updatedUser) : null,
        },
      },
      connection
    );

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  const user = await findUserById(id);
  return publicUser(user);
}

export async function deleteUser(id: string) {
  const existing = await findUserById(id);
  await pool.query('DELETE FROM users WHERE id = ?', [id]);

  if (existing) {
    const publicDeletedUser = publicUser(existing);
    await recordEntityChangeLog({
      entityType: 'customer',
      entityId: id,
      entityName: publicDeletedUser.name,
      action: 'delete',
      summary: `Xóa khách hàng ${publicDeletedUser.name}`,
      changes: { before: publicDeletedUser },
    });
  }
}

export async function getUserCart(userIdentifier: string) {
  await ensureUserCartTable();

  const user = await resolveUserForCartOrFavorites(userIdentifier);
  if (!user) {
    const error = new Error('User not found.');
    (error as Error & { statusCode?: number }).statusCode = 404;
    throw error;
  }
  const userId = String(user.id);

  const [rows] = await pool.query<any[]>(
    `SELECT product_id, quantity
     FROM user_cart
     WHERE user_id = ?
     ORDER BY created_at ASC, id ASC`,
    [userId]
  );

  return rows.map((row) => ({
    productId: String(row.product_id),
    quantity: Math.max(1, Number(row.quantity || 1)),
  }));
}

export async function addProductToUserCart(userId: string, productId: string, quantity = 1) {
  await ensureUserCartTable();
  const nextQuantity = Math.max(1, Number(quantity || 1));

  const connection = await pool.getConnection();
  let resolvedUser: any = null;
  try {
    await connection.beginTransaction();

    resolvedUser = await resolveUserForCartOrFavorites(userId, connection);
    if (!resolvedUser) {
      const error = new Error('User not found.');
      (error as Error & { statusCode?: number }).statusCode = 404;
      throw error;
    }
    const resolvedUserId = String(resolvedUser.id);

    const [productRows] = await connection.query(
      'SELECT name, stock FROM products WHERE id = ? LIMIT 1',
      [productId]
    );
    const productRow = productRows[0];
    if (!productRow) {
      const error = new Error('Product not found.');
      (error as Error & { statusCode?: number }).statusCode = 404;
      throw error;
    }

    const stock = Math.max(0, Number(productRow.stock || 0));
    const [cartRows] = await connection.query(
      'SELECT quantity FROM user_cart WHERE user_id = ? AND product_id = ? LIMIT 1',
      [resolvedUserId, productId]
    );
    const currentQuantity = Math.max(0, Number(cartRows[0]?.quantity || 0));
    const allowedQuantity = Math.min(nextQuantity, Math.max(0, stock - currentQuantity));
    if (allowedQuantity <= 0) {
      const error = new Error(`Sản phẩm "${productRow.name}" chỉ còn ${stock} trong kho.`);
      (error as Error & { statusCode?: number }).statusCode = 400;
      throw error;
    }

    await connection.query(
      `INSERT INTO user_cart
        (user_id, product_id, quantity)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE
         quantity = quantity + VALUES(quantity),
         updated_at = NOW()`,
      [resolvedUserId, productId, allowedQuantity]
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  const user = resolvedUser || (await findUserByIdentifier(userId));
  const cart = await getUserCart(String(user.id));
  return publicUser({ ...user, cart });
}

export async function removeProductFromUserCart(userId: string, productId: string) {
  await ensureUserCartTable();

  const connection = await pool.getConnection();
  let resolvedUser: any = null;
  try {
    await connection.beginTransaction();

    resolvedUser = await resolveUserForCartOrFavorites(userId, connection);
    if (!resolvedUser) {
      const error = new Error('User not found.');
      (error as Error & { statusCode?: number }).statusCode = 404;
      throw error;
    }
    const resolvedUserId = String(resolvedUser.id);

    await connection.query(
      'DELETE FROM user_cart WHERE user_id = ? AND product_id = ?',
      [resolvedUserId, productId]
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  const user = resolvedUser || (await findUserByIdentifier(userId));
  const cart = await getUserCart(String(user.id));
  return publicUser({ ...user, cart });
}

export async function getUserFavorites(userIdentifier: string) {
  await ensureUserFavoritesTable();

  const user = await resolveUserForCartOrFavorites(userIdentifier);
  if (!user) {
    const error = new Error('User not found.');
    (error as Error & { statusCode?: number }).statusCode = 404;
    throw error;
  }
  const userId = String(user.id);

  const [rows] = await pool.query<any[]>(
    `SELECT product_id, quantity
     FROM user_favorites
     WHERE user_id = ?
     ORDER BY created_at ASC, id ASC`,
    [userId]
  );

  return rows.map((row) => ({
    productId: String(row.product_id),
    quantity: Math.max(1, Number(row.quantity || 1)),
  }));
}

export async function addProductToUserFavorites(userId: string, productId: string, quantity = 1) {
  await ensureUserFavoritesTable();
  const nextQuantity = Math.max(1, Number(quantity || 1));

  const user = await resolveUserForCartOrFavorites(userId);
  if (!user) {
    const error = new Error('User not found.');
    (error as Error & { statusCode?: number }).statusCode = 404;
    throw error;
  }
  const resolvedUserId = String(user.id);

  await pool.query(
    `INSERT INTO user_favorites (user_id, product_id, quantity)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE
       quantity = quantity + VALUES(quantity),
       updated_at = NOW()`,
    [resolvedUserId, productId, nextQuantity]
  );

  return getUserFavorites(resolvedUserId);
}

export async function removeProductFromUserFavorites(userId: string, productId: string) {
  await ensureUserFavoritesTable();

  const user = await resolveUserForCartOrFavorites(userId);
  if (!user) {
    const error = new Error('User not found.');
    (error as Error & { statusCode?: number }).statusCode = 404;
    throw error;
  }
  const resolvedUserId = String(user.id);

  await pool.query('DELETE FROM user_favorites WHERE user_id = ? AND product_id = ?', [resolvedUserId, productId]);

  return getUserFavorites(resolvedUserId);
}

export async function usernameOrEmailExists(username: string, email: string) {
  const [rows] = await pool.query<any[]>(
    'SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1',
    [username, email]
  );
  return rows.length > 0;
}

export async function markUserLoggedIn(id: string) {
  await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [id]);
}
