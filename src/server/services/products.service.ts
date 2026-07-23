import { pool } from '../../lib/mysql';
import type { ResultSetHeader } from 'mysql2';
import { parseJsonField } from '../utils/json';
import { slugify } from '../utils/slug';
import { findCategoryRowByName } from './categories.service';
import { recordEntityChangeLog } from './change-logs.service';

type ProductStatus = 'active' | 'draft' | 'archived';
const maxProductImagesPayloadBytes = 3 * 1024 * 1024;

function toMoney(value: unknown, fallback = 0) {
  const amount = Number(value ?? fallback);
  return Number.isFinite(amount) ? amount : fallback;
}

function normalizeProductImages(payload: any) {
  const legacyImage = payload.image || payload.imageUrl || '';
  const images = Array.isArray(payload.images) && payload.images.length
    ? payload.images
    : legacyImage
      ? [legacyImage]
      : [];
  const normalized = images.map((image: unknown) => String(image || '').trim()).filter(Boolean);
  const payloadBytes = Buffer.byteLength(JSON.stringify(normalized), 'utf8');

  if (payloadBytes > maxProductImagesPayloadBytes) {
    throw new Error('Dung lượng ảnh sản phẩm quá lớn. Vui lòng chọn ít ảnh hơn hoặc dùng ảnh nhẹ hơn.');
  }

  return normalized;
}

function productForChangeLog(product: any) {
  if (!product) return product;
  const imageCount = Array.isArray(product.images) ? product.images.length : 0;

  return {
    ...product,
    image: product.image ? '[product image]' : '',
    images: imageCount > 0 ? [`${imageCount} ảnh sản phẩm`] : [],
  };
}

function toProduct(row: any) {
  const images = parseJsonField<string[]>(row.images, []);
  const attributes = parseJsonField<any[]>(row.attributes, []);
  const specification = parseJsonField<Record<string, string>>(row.specification, {});
  const stock = Number(row.stock || 0);
  const price = toMoney(row.discount_price ?? row.original_price);

  return {
    id: row.id,
    categoryId: row.category_id || undefined,
    sku: row.sku,
    name: row.name,
    slug: row.slug,
    category: row.category_name || 'Uncategorized',
    brand: row.brand,
    price,
    originalPrice: toMoney(row.original_price),
    discountPrice: toMoney(row.discount_price),
    flashSalePrice: row.flash_sale_price == null ? undefined : Number(row.flash_sale_price),
    discountPercent: Number(row.discount_percent || 0),
    cost: 0,
    inventory: stock,
    stock,
    warehouseStock: {
      MAIN: stock,
    },
    rating: Number(row.rating || 0),
    sales: 0,
    sold: 0,
    reviewCount: Number(row.review_count || 0),
    status: row.status as ProductStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    description: row.description || '',
    attributes,
    specification,
    tags: [],
    images,
    image: images[0] || '',
    isNew: Boolean(row.is_new),
    isBestSeller: Boolean(row.is_best_seller),
  };
}

const productFields = `
  p.id, p.category_id, p.sku, p.name, p.slug, p.brand,
  p.images, p.original_price, p.discount_price, p.flash_sale_price,
  p.discount_percent, p.stock, p.rating, p.review_count, p.is_new,
  p.is_best_seller, p.attributes, p.specification, p.description, p.status,
  p.created_at, p.updated_at, c.name AS category_name
`;

export async function listProducts() {
  const [rows] = await pool.query<any[]>(
    `SELECT ${productFields}
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     ORDER BY p.created_at DESC`
  );

  return rows.map(toProduct);
}

export async function findProductById(id: string) {
  const [rows] = await pool.query<any[]>(
    `SELECT ${productFields}
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     WHERE p.id = ?
     LIMIT 1`,
    [id]
  );

  return rows[0] ? toProduct(rows[0]) : null;
}

async function resolveCategoryId(categoryName?: string) {
  if (!categoryName || categoryName === 'Uncategorized') return null;
  const category = await findCategoryRowByName(categoryName);
  return category?.id || null;
}

async function resolveWritableCategoryId(payload: any) {
  if (payload.categoryId) return payload.categoryId;
  const categoryId = await resolveCategoryId(payload.category);
  if (categoryId) return categoryId;

  const [rows] = await pool.query<any[]>('SELECT id FROM categories ORDER BY sort_order ASC, id ASC LIMIT 1');
  return rows[0]?.id || null;
}

export async function createProduct(payload: any) {
  const categoryId = await resolveWritableCategoryId(payload);
  if (!categoryId) {
    throw new Error('At least one category is required before creating products.');
  }
  const price = toMoney(payload.price ?? payload.originalPrice ?? payload.discountPrice);
  const stock = Number(payload.inventory ?? payload.stock ?? 0);
  const images = normalizeProductImages(payload);

  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO products
      (category_id, sku, name, slug, brand, images,
       original_price, discount_price, flash_sale_price, discount_percent, stock,
       rating, review_count, is_new, is_best_seller, attributes, specification,
       description, status)
     VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      categoryId,
      payload.sku,
      payload.name,
      slugify(payload.name),
      payload.brand || 'InHouse',
      JSON.stringify(images),
      price,
      toMoney(payload.discountPrice, price),
      payload.flashSalePrice ?? null,
      Number(payload.discountPercent || 0),
      stock,
      Number(payload.rating || 0),
      Number(payload.reviewCount || 0),
      Boolean(payload.isNew),
      Boolean(payload.isBestSeller),
      JSON.stringify(payload.attributes || []),
      JSON.stringify(payload.specification || {}),
      payload.description || '',
      payload.status || 'draft',
    ]
  );

  const product = await findProductById(String(result.insertId));
  if (product) {
    await recordEntityChangeLog({
      entityType: 'product',
      entityId: product.id,
      entityName: product.name,
      action: 'create',
      summary: `Tạo sản phẩm ${product.name}`,
      changes: { after: productForChangeLog(product) },
    });
  }

  return product;
}

export async function updateProduct(id: string, payload: any) {
  const existing = await findProductById(id);
  if (!existing) return null;

  const next = { ...existing, ...payload };
  const categoryId = await resolveWritableCategoryId(next);
  if (!categoryId) {
    throw new Error('At least one category is required before updating products.');
  }
  const price = toMoney(next.price ?? next.originalPrice ?? next.discountPrice);
  const stock = Number(next.inventory ?? next.stock ?? 0);
  const images = normalizeProductImages(next);

  await pool.query(
    `UPDATE products
     SET category_id = ?, sku = ?, name = ?, slug = ?, brand = ?,
         images = ?, original_price = ?,
         discount_price = ?, flash_sale_price = ?, discount_percent = ?,
         stock = ?, rating = ?, review_count = ?, is_new = ?,
         is_best_seller = ?, attributes = ?, specification = ?,
         description = ?, status = ?, updated_at = NOW()
     WHERE id = ?`,
    [
      categoryId,
      next.sku,
      next.name,
      slugify(next.name),
      next.brand || 'InHouse',
      JSON.stringify(images),
      toMoney(next.originalPrice, price),
      toMoney(next.discountPrice, price),
      next.flashSalePrice ?? null,
      Number(next.discountPercent || 0),
      stock,
      Number(next.rating || 0),
      Number(next.reviewCount || 0),
      Boolean(next.isNew),
      Boolean(next.isBestSeller),
      JSON.stringify(next.attributes || []),
      JSON.stringify(next.specification || {}),
      next.description || '',
      next.status || 'draft',
      id,
    ]
  );

  const updated = await findProductById(id);
  if (updated) {
    await recordEntityChangeLog({
      entityType: 'product',
      entityId: id,
      entityName: updated.name,
      action: 'update',
      summary: `Cập nhật sản phẩm ${updated.name}`,
      changes: {
        before: productForChangeLog(existing),
        after: productForChangeLog(updated),
      },
    });
  }

  return updated;
}

export async function deleteProduct(id: string) {
  const existing = await findProductById(id);
  await pool.query('DELETE FROM products WHERE id = ?', [id]);

  if (existing) {
    await recordEntityChangeLog({
      entityType: 'product',
      entityId: id,
      entityName: existing.name,
      action: 'delete',
      summary: `Xóa sản phẩm ${existing.name}`,
      changes: { before: productForChangeLog(existing) },
    });
  }
}
