import type { Request, Response } from 'express';
import {
  createProduct,
  deleteProduct,
  listProducts,
  updateProduct,
} from '../services/products.service';
import { normalizeText } from '../utils/text';

export async function getProducts(_req: Request, res: Response) {
  try {
    res.json({ ok: true, products: await listProducts() });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch products';
    res.status(500).json({ ok: false, message });
  }
}

export async function createProductHandler(req: Request, res: Response) {
  const name = normalizeText(req.body.name);
  const sku = normalizeText(req.body.sku);

  if (!name || !sku) {
    return res.status(400).json({ ok: false, message: 'Product name and SKU are required.' });
  }

  try {
    const product = await createProduct({ ...req.body, name, sku });
    res.status(201).json({ ok: true, product });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create product';
    res.status(500).json({ ok: false, message });
  }
}

export async function updateProductHandler(req: Request, res: Response) {
  try {
    const product = await updateProduct(req.params.id, req.body);
    if (!product) {
      return res.status(404).json({ ok: false, message: 'Product not found.' });
    }

    res.json({ ok: true, product });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update product';
    res.status(500).json({ ok: false, message });
  }
}

export async function deleteProductHandler(req: Request, res: Response) {
  try {
    await deleteProduct(req.params.id);
    res.json({ ok: true, message: 'Product deleted successfully.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete product';
    res.status(500).json({ ok: false, message });
  }
}
