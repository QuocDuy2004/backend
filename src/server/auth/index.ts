import type { Request, Response } from 'express';
import { env } from '../config/env';
import {
  createUser,
  findLoginUser,
  markUserLoggedIn,
  publicUser,
  signAuthToken,
  toUserRole,
  usernameOrEmailExists,
} from '../services/users.service';
import { normalizeText } from '../utils/text';

export async function register(req: Request, res: Response) {
  const username = normalizeText(req.body.username);
  const password = normalizeText(req.body.password);
  const name = normalizeText(req.body.name);
  const email = normalizeText(req.body.email).toLowerCase();
  const phone = normalizeText(req.body.phone);
  const address = normalizeText(req.body.address);
  const role = toUserRole(normalizeText(req.body.role));

  if (!username || !password || !name || !email) {
    return res.status(400).json({
      ok: false,
      message: 'username, password, name, email la bat buoc.',
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      ok: false,
      message: 'password phai co it nhat 6 ky tu.',
    });
  }

  try {
    if (await usernameOrEmailExists(username, email)) {
      return res.status(409).json({
        ok: false,
        message: 'Username hoac email da ton tai.',
      });
    }

    const user = await createUser({ username, password, name, email, phone, address, role });
    return res.status(201).json({
      ok: true,
      message: 'Dang ky thanh cong.',
      user,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Register failed';
    return res.status(500).json({ ok: false, message });
  }
}

export async function login(req: Request, res: Response) {
  const usernameOrEmail = normalizeText(req.body.usernameOrEmail || req.body.username || req.body.email).toLowerCase();
  const password = normalizeText(req.body.password);

  if (!usernameOrEmail || !password) {
    return res.status(400).json({
      ok: false,
      message: 'usernameOrEmail va password la bat buoc.',
    });
  }

  try {
    const user = await findLoginUser(usernameOrEmail, password);

    if (!user) {
      return res.status(401).json({
        ok: false,
        message: 'Sai tai khoan hoac mat khau.',
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        ok: false,
        message: 'Tai khoan khong hoat dong.',
      });
    }

    await markUserLoggedIn(user.id);

    return res.json({
      ok: true,
      message: 'Dang nhap thanh cong.',
      'jwt-token': signAuthToken(user),
      tokenType: 'Bearer',
      expiresIn: env.jwtExpiresIn,
      user: publicUser(user),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed';
    return res.status(500).json({ ok: false, message });
  }
}
