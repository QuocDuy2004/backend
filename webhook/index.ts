import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { app } = require('../dist/vercel-app.cjs');

function restoreWebhookPath(req: any) {
  const url = new URL(req.url || '/webhook', 'http://localhost');
  const path = url.searchParams.get('path');
  if (!path) return;

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  url.searchParams.delete('path');
  const query = url.searchParams.toString();
  req.url = `/webhook${normalizedPath}${query ? `?${query}` : ''}`;
}

export default function handler(req: any, res: any) {
  restoreWebhookPath(req);
  return app(req, res);
}
