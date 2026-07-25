import type { Request, Response } from 'express';
import {
  addProductToUserFavorites,
  addProductToUserCart,
  createUser,
  deleteUser,
  findUserByEmail,
  getUserFavorites,
  getUserCart,
  listUsers,
  publicUser,
  removeProductFromUserFavorites,
  removeProductFromUserCart,
  toUserRole,
  updateUser,
} from '../services/users.service';
import { listEntityChangeLogs } from '../services/change-logs.service';
import { normalizeText } from '../utils/text';

function normalizeQuantity(value: unknown) {
  const quantity = Number(value);
  return Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 1;
}

function productIdsFromItems(items: Array<string | { productId?: unknown }>) {
  return items
    .map((item) => {
      if (item && typeof item === 'object') return normalizeText(item.productId);
      return normalizeText(item);
    })
    .filter(Boolean);
}

export async function getUserByEmail(req: Request, res: Response) {
  const email = normalizeText(req.params.email).toLowerCase();

  if (!email) {
    return res.status(400).json({
      ok: false,
      message: 'Email là bắt buộc.',
    });
  }

  try {
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({
        ok: false,
        message: 'Không tìm thấy người dùng.',
      });
    }

    return res.json({
      ok: true,
      user: publicUser(user),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không thể lấy người dùng.';
    return res.status(500).json({ ok: false, message });
  }
}

export async function getUsers(_req: Request, res: Response) {
  try {
    res.json({
      ok: true,
      users: await listUsers(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không thể lấy danh sách người dùng.';
    res.status(500).json({ ok: false, message });
  }
}

export async function createUserHandler(req: Request, res: Response) {
  const username = normalizeText(req.body.username);
  const password = normalizeText(req.body.password);
  const name = normalizeText(req.body.name);
  const email = normalizeText(req.body.email).toLowerCase();
  const phone = normalizeText(req.body.phone);
  const address = normalizeText(req.body.address);
  const role = toUserRole(req.body.role);

  if (!username || !password || !name || !email) {
    return res.status(400).json({
      ok: false,
      message: 'username, password, name, email là bắt buộc.',
    });
  }

  try {
    const user = await createUser({ username, password, name, email, phone, address, role });
    res.status(201).json({ ok: true, user });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không thể tạo người dùng.';
    res.status(500).json({ ok: false, message });
  }
}

export async function updateUserHandler(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const user = await updateUser(id, {
      name: normalizeText(req.body.name),
      email: normalizeText(req.body.email).toLowerCase(),
      phone: normalizeText(req.body.phone),
      address: normalizeText(req.body.address),
      role: toUserRole(req.body.role),
      status: normalizeText(req.body.status),
    });

    res.json({ ok: true, user });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không thể cập nhật người dùng.';
    res.status(500).json({ ok: false, message });
  }
}

export async function getUserChangeLogs(req: Request, res: Response) {
  try {
    const logs = await listEntityChangeLogs('customer', req.params.id);
    res.json({ ok: true, logs });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không thể lấy lịch sử thay đổi của khách hàng.';
    res.status(500).json({ ok: false, message });
  }
}

export async function deleteUserHandler(req: Request, res: Response) {
  try {
    await deleteUser(req.params.id);
    res.json({ ok: true, message: 'Xóa người dùng thành công.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không thể xóa người dùng.';
    res.status(500).json({ ok: false, message });
  }
}

export async function getUserCartHandler(req: Request, res: Response) {
  const userId = normalizeText(req.params.id);

  if (!userId) {
    return res.status(400).json({ ok: false, message: 'userId là bắt buộc.' });
  }

  try {
    const cart = await getUserCart(userId);
    return res.json({ ok: true, cart, productIds: productIdsFromItems(cart) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không thể lấy giỏ hàng của người dùng.';
    const statusCode = error instanceof Error && 'statusCode' in error ? Number(error.statusCode) : 500;
    return res.status(statusCode || 500).json({ ok: false, message });
  }
}

export async function addUserCartProductHandler(req: Request, res: Response) {
  const userId = normalizeText(req.params.id);
  const productId = normalizeText(req.params.productId || req.body.productId);

  if (!userId || !productId) {
    return res.status(400).json({ ok: false, message: 'userId và productId là bắt buộc.' });
  }

  try {
    const user = await addProductToUserCart(
      userId,
      productId,
      normalizeQuantity(req.body.quantity ?? req.query.quantity)
    );
    return res.json({ ok: true, user });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không thể thêm sản phẩm vào giỏ hàng.';
    const statusCode = error instanceof Error && 'statusCode' in error ? Number(error.statusCode) : 500;
    return res.status(statusCode || 500).json({ ok: false, message });
  }
}

export async function removeUserCartProductHandler(req: Request, res: Response) {
  const userId = normalizeText(req.params.id);
  const productId = normalizeText(req.params.productId || req.body.productId);

  if (!userId || !productId) {
    return res.status(400).json({ ok: false, message: 'userId và productId là bắt buộc.' });
  }

  try {
    const user = await removeProductFromUserCart(userId, productId);
    return res.json({ ok: true, user });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không thể xóa sản phẩm khỏi giỏ hàng.';
    const statusCode = error instanceof Error && 'statusCode' in error ? Number(error.statusCode) : 500;
    return res.status(statusCode || 500).json({ ok: false, message });
  }
}

export async function getUserFavoritesHandler(req: Request, res: Response) {
  const userId = normalizeText(req.params.id);

  if (!userId) {
    return res.status(400).json({ ok: false, message: 'userId là bắt buộc.' });
  }

  try {
    const productIds = await getUserFavorites(userId);
    return res.json({ ok: true, favorites: productIds, productIds: productIdsFromItems(productIds) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không thể lấy danh sách yêu thích của người dùng.';
    const statusCode = error instanceof Error && 'statusCode' in error ? Number(error.statusCode) : 500;
    return res.status(statusCode || 500).json({ ok: false, message });
  }
}

export async function addUserFavoriteProductHandler(req: Request, res: Response) {
  const userId = normalizeText(req.params.id);
  const productId = normalizeText(req.params.productId || req.body.productId);

  if (!userId || !productId) {
    return res.status(400).json({ ok: false, message: 'userId và productId là bắt buộc.' });
  }

  try {
    const favorites = await addProductToUserFavorites(
      userId,
      productId,
      normalizeQuantity(req.body.quantity ?? req.query.quantity)
    );
    return res.json({ ok: true, favorites, productIds: productIdsFromItems(favorites) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không thể thêm sản phẩm vào danh sách yêu thích.';
    const statusCode = error instanceof Error && 'statusCode' in error ? Number(error.statusCode) : 500;
    return res.status(statusCode || 500).json({ ok: false, message });
  }
}

export async function removeUserFavoriteProductHandler(req: Request, res: Response) {
  const userId = normalizeText(req.params.id);
  const productId = normalizeText(req.params.productId || req.body.productId);

  if (!userId || !productId) {
    return res.status(400).json({ ok: false, message: 'userId và productId là bắt buộc.' });
  }

  try {
    const favorites = await removeProductFromUserFavorites(userId, productId);
    return res.json({ ok: true, favorites, productIds: productIdsFromItems(favorites) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không thể xóa sản phẩm khỏi danh sách yêu thích.';
    const statusCode = error instanceof Error && 'statusCode' in error ? Number(error.statusCode) : 500;
    return res.status(statusCode || 500).json({ ok: false, message });
  }
}
