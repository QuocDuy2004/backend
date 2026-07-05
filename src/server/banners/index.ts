import type { Request, Response } from 'express';
import {
  createBanner,
  deleteBanner,
  listBanners,
  toggleBannerStatus,
  updateBanner,
} from '../services/banners.service';
import { normalizeText } from '../utils/text';

function requiredText(value: unknown) {
  return normalizeText(value).trim();
}

export async function getBanners(req: Request, res: Response) {
  try {
    const includeInactive = req.query.includeInactive !== 'false';
    res.json({ ok: true, banners: await listBanners(includeInactive) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch banners';
    res.status(500).json({ ok: false, message });
  }
}

export async function createBannerHandler(req: Request, res: Response) {
  if (!requiredText(req.body.tag) || !requiredText(req.body.title) || !requiredText(req.body.cta)) {
    return res.status(400).json({ ok: false, message: 'Tag, title and CTA are required.' });
  }

  try {
    const banner = await createBanner(req.body);
    res.status(201).json({ ok: true, banner });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create banner';
    res.status(500).json({ ok: false, message });
  }
}

export async function updateBannerHandler(req: Request, res: Response) {
  if (!requiredText(req.body.tag) || !requiredText(req.body.title) || !requiredText(req.body.cta)) {
    return res.status(400).json({ ok: false, message: 'Tag, title and CTA are required.' });
  }

  try {
    const banner = await updateBanner(req.params.id, req.body);
    if (!banner) {
      return res.status(404).json({ ok: false, message: 'Banner not found.' });
    }

    res.json({ ok: true, banner });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update banner';
    res.status(500).json({ ok: false, message });
  }
}

export async function toggleBannerStatusHandler(req: Request, res: Response) {
  try {
    const banner = await toggleBannerStatus(req.params.id);
    if (!banner) {
      return res.status(404).json({ ok: false, message: 'Banner not found.' });
    }

    res.json({ ok: true, banner });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to toggle banner status';
    res.status(500).json({ ok: false, message });
  }
}

export async function deleteBannerHandler(req: Request, res: Response) {
  try {
    await deleteBanner(req.params.id);
    res.json({ ok: true, message: 'Banner deleted successfully.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete banner';
    res.status(500).json({ ok: false, message });
  }
}
