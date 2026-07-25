import type { Request, Response } from 'express';
import {
  createProduct,
  deleteProduct,
  listProducts,
  updateProduct,
} from '../services/products.service';
import { listEntityChangeLogs } from '../services/change-logs.service';
import { normalizeText } from '../utils/text';

function productErrorMessage(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : fallback;
  if (message.includes('max_allowed_packet') || message.includes('packet bigger')) {
    return 'Dung lượng ảnh sản phẩm quá lớn. Vui lòng chọn ít ảnh hơn hoặc dùng ảnh nhẹ hơn.';
  }

  return message;
}

export async function getProducts(_req: Request, res: Response) {
  try {
    res.json({ ok: true, products: await listProducts() });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không thể lấy danh sách sản phẩm.';
    res.status(500).json({ ok: false, message });
  }
}

export async function createProductHandler(req: Request, res: Response) {
  const name = normalizeText(req.body.name);
  const sku = normalizeText(req.body.sku);

  if (!name || !sku) {
    return res.status(400).json({ ok: false, message: 'Tên sản phẩm và SKU là bắt buộc.' });
  }

  try {
    const product = await createProduct({ ...req.body, name, sku });
    res.status(201).json({ ok: true, product });
  } catch (error) {
    const message = productErrorMessage(error, 'Không thể tạo sản phẩm.');
    res.status(500).json({ ok: false, message });
  }
}

export async function getProductChangeLogs(req: Request, res: Response) {
  try {
    const logs = await listEntityChangeLogs('product', req.params.id);
    res.json({ ok: true, logs });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không thể lấy lịch sử thay đổi của sản phẩm.';
    res.status(500).json({ ok: false, message });
  }
}

export async function updateProductHandler(req: Request, res: Response) {
  try {
    const product = await updateProduct(req.params.id, req.body);
    if (!product) {
      return res.status(404).json({ ok: false, message: 'Không tìm thấy sản phẩm.' });
    }

    res.json({ ok: true, product });
  } catch (error) {
    const message = productErrorMessage(error, 'Không thể cập nhật sản phẩm.');
    res.status(500).json({ ok: false, message });
  }
}

export async function deleteProductHandler(req: Request, res: Response) {
  try {
    await deleteProduct(req.params.id);
    res.json({ ok: true, message: 'Product deleted successfully.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không thể xóa sản phẩm.';
    res.status(500).json({ ok: false, message });
  }
}
