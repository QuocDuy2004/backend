import type { Request, Response } from 'express';
import { listSettings, upsertSetting } from '../services/settings.service';
import { normalizeText } from '../utils/text';

function normalizeValue(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

export async function getSettings(req: Request, res: Response) {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    res.json({ ok: true, settings: await listSettings(includeInactive) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch settings';
    res.status(500).json({ ok: false, message });
  }
}

export async function upsertSettingHandler(req: Request, res: Response) {
  const settingKey = normalizeText(req.params.key || req.body.settingKey || req.body.key);
  const settingGroup = normalizeText(req.body.settingGroup || req.body.group) || 'general';
  const title = normalizeText(req.body.title) || settingKey;

  if (!settingKey) {
    return res.status(400).json({ ok: false, message: 'settingKey is required.' });
  }

  try {
    const setting = await upsertSetting({
      settingKey,
      settingGroup,
      title,
      value: normalizeValue(req.body.value),
      status: normalizeText(req.body.status) === 'inactive' ? 'inactive' : 'active',
    });

    res.json({ ok: true, setting });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save setting';
    res.status(500).json({ ok: false, message });
  }
}
