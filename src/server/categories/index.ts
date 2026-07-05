import type { Request, Response } from 'express';
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from '../services/categories.service';
import { normalizeText } from '../utils/text';

export async function getCategories(_req: Request, res: Response) {
  try {
    res.json({ ok: true, categories: await listCategories() });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch categories';
    res.status(500).json({ ok: false, message });
  }
}

export async function createCategoryHandler(req: Request, res: Response) {
  const name = normalizeText(req.body.name);
  const status = normalizeText(req.body.status) === 'inactive' ? 'inactive' : 'active';

  if (!name) {
    return res.status(400).json({ ok: false, message: 'Category name is required.' });
  }

  try {
    const category = await createCategory({
      name,
      status,
      image: normalizeText(req.body.image || req.body.imageUrl),
    });
    res.status(201).json({ ok: true, category });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create category';
    res.status(500).json({ ok: false, message });
  }
}

export async function updateCategoryHandler(req: Request, res: Response) {
  const name = normalizeText(req.body.name);
  const status = normalizeText(req.body.status) === 'inactive' ? 'inactive' : 'active';

  if (!name) {
    return res.status(400).json({ ok: false, message: 'Category name is required.' });
  }

  try {
    const category = await updateCategory(req.params.id, {
      name,
      status,
      image: normalizeText(req.body.image || req.body.imageUrl),
    });
    res.json({ ok: true, category });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update category';
    res.status(500).json({ ok: false, message });
  }
}

export async function deleteCategoryHandler(req: Request, res: Response) {
  try {
    await deleteCategory(req.params.id, normalizeText(req.body.transferTarget));
    res.json({ ok: true, message: 'Category deleted successfully.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete category';
    res.status(500).json({ ok: false, message });
  }
}
