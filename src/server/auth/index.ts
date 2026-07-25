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

/** Phát hiện lỗi kết nối DB để trả về message thân thiện, không lộ thông tin nội bộ. */
function isDbConnectionError(message: string) {
  return /ECONNREFUSED|ETIMEDOUT|ENOTFOUND|PROTOCOL_CONNECTION_LOST|ER_ACCESS_DENIED/i.test(message);
}

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
      message: 'username, password, name, email là bắt buộc.',
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      ok: false,
      message: 'password phải có ít nhất 6 ký tự.',
    });
  }

  try {
    if (await usernameOrEmailExists(username, email)) {
      return res.status(409).json({
        ok: false,
        message: 'Username hoặc email đã tồn tại.',
      });
    }

    const user = await createUser({ username, password, name, email, phone, address, role });
    return res.status(201).json({
      ok: true,
      message: 'Đăng ký thành công.',
      user,
    });
  } catch (error) {
    const raw = error instanceof Error ? error.message : 'Đăng ký thất bại';
    const message = isDbConnectionError(raw)
      ? 'Không thể kết nối cơ sở dữ liệu. Vui lòng thử lại sau.'
      : raw;
    return res.status(500).json({ ok: false, message });
  }
}

export async function login(req: Request, res: Response) {
  const usernameOrEmail = normalizeText(req.body.usernameOrEmail || req.body.username || req.body.email).toLowerCase();
  const password = normalizeText(req.body.password);

  if (!usernameOrEmail || !password) {
    return res.status(400).json({
      ok: false,
      message: 'usernameOrEmail và password là bắt buộc.',
    });
  }

  try {
    const user = await findLoginUser(usernameOrEmail, password);

    if (!user) {
      return res.status(401).json({
        ok: false,
        message: 'Sai tài khoản hoặc mật khẩu.',
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        ok: false,
        message: 'Tài khoản không hoạt động.',
      });
    }

    await markUserLoggedIn(user.id);

    return res.json({
      ok: true,
      message: 'Đăng nhập thành công.',
      'jwt-token': signAuthToken(user),
      tokenType: 'Bearer',
      expiresIn: env.jwtExpiresIn,
      user: publicUser(user),
    });
  } catch (error) {
    const raw = error instanceof Error ? error.message : 'Đăng nhập thất bại';
    const message = isDbConnectionError(raw)
      ? 'Không thể kết nối cơ sở dữ liệu. Vui lòng thử lại sau.'
      : raw;
    return res.status(500).json({ ok: false, message });
  }
}
