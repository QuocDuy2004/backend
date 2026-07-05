import { pool } from '../../lib/mysql';
import type { ResultSetHeader } from 'mysql2';
import { slugify } from '../utils/slug';

type CategoryStatus = 'active' | 'inactive';

function publicCategory(row: any) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    image: row.image || undefined,
    status: row.status as CategoryStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listCategories() {
  const [rows] = await pool.query<any[]>(
    `SELECT id, name, slug, image, status, created_at, updated_at
     FROM categories
     ORDER BY sort_order ASC, created_at DESC`
  );

  return rows.map(publicCategory);
}

export async function findCategoryById(id: string) {
  const [rows] = await pool.query<any[]>(
    `SELECT id, name, slug, image, status, created_at, updated_at
     FROM categories
     WHERE id = ?
     LIMIT 1`,
    [id]
  );

  return rows[0] ? publicCategory(rows[0]) : null;
}

export async function findCategoryRowByName(name: string) {
  const [rows] = await pool.query<any[]>(
    'SELECT id, name FROM categories WHERE LOWER(name) = LOWER(?) LIMIT 1',
    [name]
  );
  return rows[0] || null;
}

export async function createCategory(payload: {
  name: string;
  image?: string;
  status?: CategoryStatus;
}) {
  const slug = slugify(payload.name);

  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO categories (name, slug, image, status)
     VALUES (?, ?, ?, ?)`,
    [payload.name, slug, payload.image || null, payload.status || 'active']
  );

  return findCategoryById(String(result.insertId));
}

export async function updateCategory(
  id: string,
  payload: {
    name: string;
    image?: string;
    status?: CategoryStatus;
  }
) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [oldRows] = await connection.query<any[]>('SELECT name FROM categories WHERE id = ? LIMIT 1', [id]);
    const oldName = oldRows[0]?.name;
    const slug = slugify(payload.name);

    await connection.query(
      `UPDATE categories
       SET name = ?, slug = ?, image = ?, status = ?, updated_at = NOW()
       WHERE id = ?`,
      [payload.name, slug, payload.image || null, payload.status || 'active', id]
    );

    if (oldName && oldName !== payload.name) {
      await connection.query('UPDATE products SET updated_at = NOW() WHERE category_id = ?', [id]);
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  return findCategoryById(id);
}

export async function deleteCategory(id: string, transferTarget?: string) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    let targetCategoryId: string | null = null;
    if (transferTarget && transferTarget !== 'Uncategorized') {
      const [targetRows] = await connection.query<any[]>(
        'SELECT id FROM categories WHERE name = ? AND id <> ? LIMIT 1',
        [transferTarget, id]
      );
      targetCategoryId = targetRows[0]?.id || null;
    }

    await connection.query('UPDATE products SET category_id = ?, updated_at = NOW() WHERE category_id = ?', [
      targetCategoryId,
      id,
    ]);
    await connection.query('DELETE FROM categories WHERE id = ?', [id]);

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
