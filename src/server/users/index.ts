import type { Request, Response } from 'express';
import {
  createUser,
  deleteUser,
  findUserByEmail,
  listUsers,
  publicUser,
  toUserRole,
  updateUser,
} from '../services/users.service';
import { normalizeText } from '../utils/text';

export async function getUserByEmail(req: Request, res: Response) {
  const email = normalizeText(req.params.email).toLowerCase();

  if (!email) {
    return res.status(400).json({
      ok: false,
      message: 'Email is required.',
    });
  }

  try {
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({
        ok: false,
        message: 'User not found.',
      });
    }

    return res.json({
      ok: true,
      user: publicUser(user),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch user';
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
    const message = error instanceof Error ? error.message : 'Failed to fetch users';
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
      message: 'username, password, name, email are required.',
    });
  }

  try {
    const user = await createUser({ username, password, name, email, phone, address, role });
    res.status(201).json({ ok: true, user });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create user';
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
    const message = error instanceof Error ? error.message : 'Failed to update user';
    res.status(500).json({ ok: false, message });
  }
}

export async function deleteUserHandler(req: Request, res: Response) {
  try {
    await deleteUser(req.params.id);
    res.json({ ok: true, message: 'User deleted successfully.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete user';
    res.status(500).json({ ok: false, message });
  }
}
