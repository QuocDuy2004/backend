import jwt from 'jsonwebtoken';
import type { ResultSetHeader } from 'mysql2';
import { pool } from '../../lib/mysql';
import { env } from '../config/env';
import { UserRole, validRoles } from '../config/auth';
import { md5 } from '../utils/password';

export function toUserRole(value: unknown): UserRole {
  return validRoles.includes(value as UserRole) ? (value as UserRole) : 'member';
}

export function publicUser(row: any) {
  const cart = typeof row.cart === 'string' ? JSON.parse(row.cart || '[]') : row.cart;

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

const publicUserFields = `
  id, username, name, email, phone, image, cart, role, status,
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
      (username, password, name, email, phone, cart, favorites, role, status, password_changed_at)
     VALUES
      (?, ?, ?, ?, ?, JSON_ARRAY(), JSON_ARRAY(), ?, 'active', NOW())`,
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
  return publicUser(user);
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
  await pool.query('DELETE FROM users WHERE id = ?', [id]);
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
