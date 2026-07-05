import { pool } from '../../lib/mysql';
import type { ResultSetHeader } from 'mysql2';
import { parseJsonField } from '../utils/json';

type BannerStatus = 'active' | 'inactive' | 'scheduled';

const bannerFields = `
  b.id, b.category_id, c.name AS category_name, c.slug AS category_slug,
  b.tag, b.title, b.description, b.note, b.cta, b.target_path, b.target_params,
  b.bg_class_name, b.chip_class_name, b.chip_text_class_name,
  b.button_class_name, b.button_text_color, b.icon_name, b.detail_icon_name, b.detail_label,
  b.status, b.sort_order, b.starts_at, b.expires_at, b.created_at, b.updated_at
`;

function toBanner(row: any) {
  return {
    id: String(row.id),
    categoryId: row.category_id == null ? undefined : String(row.category_id),
    categoryName: row.category_name || undefined,
    categorySlug: row.category_slug || undefined,
    tag: row.tag,
    title: row.title,
    description: row.description,
    note: row.note || undefined,
    cta: row.cta,
    targetPath: row.target_path,
    targetParams: parseJsonField<Record<string, unknown>>(row.target_params, {}),
    bgClassName: row.bg_class_name,
    chipClassName: row.chip_class_name,
    chipTextClassName: row.chip_text_class_name,
    buttonClassName: row.button_class_name,
    buttonTextColor: row.button_text_color,
    iconName: row.icon_name,
    detailIconName: row.detail_icon_name,
    detailLabel: row.detail_label,
    status: row.status as BannerStatus,
    sortOrder: Number(row.sort_order || 0),
    startsAt: row.starts_at || undefined,
    expiresAt: row.expires_at || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeDate(value: unknown) {
  if (!value) return null;
  const text = String(value).trim();
  if (!text) return null;
  return text.length === 16 ? `${text}:00` : text;
}

function normalizePayload(payload: any) {
  const targetParams =
    payload.targetParams && typeof payload.targetParams === 'object' && !Array.isArray(payload.targetParams)
      ? payload.targetParams
      : {};

  return {
    categoryId: payload.categoryId || payload.category_id || null,
    tag: payload.tag || '',
    title: payload.title || '',
    description: payload.description || '',
    note: payload.note || null,
    cta: payload.cta || '',
    targetPath: payload.targetPath || payload.target_path || '/(tabs)/catalog',
    targetParams,
    bgClassName: payload.bgClassName || payload.bg_class_name || 'bg-amber-700',
    chipClassName: payload.chipClassName || payload.chip_class_name || 'bg-amber-300',
    chipTextClassName: payload.chipTextClassName || payload.chip_text_class_name || 'text-amber-950',
    buttonClassName: payload.buttonClassName || payload.button_class_name || 'bg-white',
    buttonTextColor: payload.buttonTextColor || payload.button_text_color || '#18181b',
    iconName: payload.iconName || payload.icon_name || 'BadgePercent',
    detailIconName: payload.detailIconName || payload.detail_icon_name || 'ShieldCheck',
    detailLabel: payload.detailLabel || payload.detail_label || 'Ưu đãi nổi bật',
    status: ['active', 'inactive', 'scheduled'].includes(payload.status) ? payload.status : 'active',
    sortOrder: Number(payload.sortOrder ?? payload.sort_order ?? 0),
    startsAt: normalizeDate(payload.startsAt || payload.starts_at),
    expiresAt: normalizeDate(payload.expiresAt || payload.expires_at),
  };
}

export async function listBanners(includeInactive = true) {
  const where = includeInactive ? '' : "WHERE b.status = 'active'";
  const [rows] = await pool.query<any[]>(
    `SELECT ${bannerFields}
     FROM banners b
     LEFT JOIN categories c ON c.id = b.category_id
     ${where}
     ORDER BY b.sort_order ASC, b.created_at DESC`
  );

  return rows.map(toBanner);
}

export async function findBannerById(id: string) {
  const [rows] = await pool.query<any[]>(
    `SELECT ${bannerFields}
     FROM banners b
     LEFT JOIN categories c ON c.id = b.category_id
     WHERE b.id = ?
     LIMIT 1`,
    [id]
  );

  return rows[0] ? toBanner(rows[0]) : null;
}

export async function createBanner(payload: any) {
  const banner = normalizePayload(payload);

  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO banners (
       category_id, tag, title, description, note, cta, target_path, target_params,
       bg_class_name, chip_class_name, chip_text_class_name,
       button_class_name, button_text_color, icon_name, detail_icon_name, detail_label,
       status, sort_order, starts_at, expires_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      banner.categoryId,
      banner.tag,
      banner.title,
      banner.description,
      banner.note,
      banner.cta,
      banner.targetPath,
      JSON.stringify(banner.targetParams),
      banner.bgClassName,
      banner.chipClassName,
      banner.chipTextClassName,
      banner.buttonClassName,
      banner.buttonTextColor,
      banner.iconName,
      banner.detailIconName,
      banner.detailLabel,
      banner.status,
      banner.sortOrder,
      banner.startsAt,
      banner.expiresAt,
    ]
  );

  return findBannerById(String(result.insertId));
}

export async function updateBanner(id: string, payload: any) {
  const existing = await findBannerById(id);
  if (!existing) return null;
  const banner = normalizePayload({ ...existing, ...payload });

  await pool.query(
    `UPDATE banners
     SET category_id = ?, tag = ?, title = ?, description = ?, note = ?, cta = ?,
         target_path = ?, target_params = ?, bg_class_name = ?, chip_class_name = ?,
         chip_text_class_name = ?, button_class_name = ?, button_text_color = ?,
         icon_name = ?, detail_icon_name = ?, detail_label = ?, status = ?,
         sort_order = ?, starts_at = ?, expires_at = ?, updated_at = NOW()
     WHERE id = ?`,
    [
      banner.categoryId,
      banner.tag,
      banner.title,
      banner.description,
      banner.note,
      banner.cta,
      banner.targetPath,
      JSON.stringify(banner.targetParams),
      banner.bgClassName,
      banner.chipClassName,
      banner.chipTextClassName,
      banner.buttonClassName,
      banner.buttonTextColor,
      banner.iconName,
      banner.detailIconName,
      banner.detailLabel,
      banner.status,
      banner.sortOrder,
      banner.startsAt,
      banner.expiresAt,
      id,
    ]
  );

  return findBannerById(id);
}

export async function toggleBannerStatus(id: string) {
  const banner = await findBannerById(id);
  if (!banner) return null;

  const status = banner.status === 'active' ? 'inactive' : 'active';
  await pool.query('UPDATE banners SET status = ?, updated_at = NOW() WHERE id = ?', [status, id]);

  return findBannerById(id);
}

export async function deleteBanner(id: string) {
  await pool.query('DELETE FROM banners WHERE id = ?', [id]);
}
