import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import net from 'net';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { ensureDatabaseSchema } from '../../database/ensure-database';
import { env } from './config/env';
import { bankTransferWebhookHandler } from './payments';
import { apiRouter } from './router';
import { ensureEntityChangeLogsTable } from './services/change-logs.service';
import { ensureSupportTables } from './services/support.service';

export const app = express();

// CORS: đọc toàn bộ từ env, không hardcode bất kỳ domain nào
function buildAllowedOrigins(): (RegExp | string)[] {
  const origins: (RegExp | string)[] = [];

  // Local dev: bật khi NODE_ENV !== production
  if (process.env.NODE_ENV !== 'production') {
    origins.push(
      /^https?:\/\/localhost:\d+$/,
      /^https?:\/\/127\.0\.0\.1:\d+$/,
      /^https?:\/\/192\.168\.\d+\.\d+:\d+$/,
      /^https?:\/\/10\.\d+\.\d+\.\d+:\d+$/,
    );
  }

  // APP_URL và FRONTEND_URL luôn được phép
  [process.env.APP_URL, process.env.FRONTEND_URL].forEach((u) => {
    const trimmed = u?.replace(/\/$/, '');
    if (trimmed) origins.push(trimmed);
  });

  // EXTRA_CORS_ORIGINS: danh sách phân cách bằng dấu phẩy
  process.env.EXTRA_CORS_ORIGINS?.split(',').forEach((o) => {
    const trimmed = o.trim().replace(/\/$/, '');
    if (trimmed) origins.push(trimmed);
  });

  return origins;
}

const allowedOrigins = buildAllowedOrigins();

app.use((req, res, next) => {
  const origin = req.headers.origin;

  const isAllowed = origin && allowedOrigins.some((allowedOrigin) =>
    allowedOrigin instanceof RegExp ? allowedOrigin.test(origin) : allowedOrigin === origin
  );

  if (isAllowed) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin');
  }

  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, jwt-token');
  res.header('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }

  next();
});

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use((error: any, _req: Request, res: Response, next: NextFunction) => {
  if (error?.type === 'entity.too.large') {
    res.status(413).json({
      ok: false,
      message: 'Dung lượng dữ liệu gửi lên quá lớn. Vui lòng dùng ảnh tối đa 5MB.',
    });
    return;
  }

  next(error);
});

app.post('/webhook/sieuthicode', bankTransferWebhookHandler);
app.use('/api', apiRouter);

function isPortAvailable(port: number) {
  return new Promise<boolean>((resolve) => {
    const tester = net
      .createServer()
      .once('error', () => resolve(false))
      .once('listening', () => {
        tester.close(() => resolve(true));
      })
      .listen(port, '0.0.0.0');
  });
}

async function findAvailablePort(preferredPort: number) {
  for (let port = preferredPort; port < preferredPort + 50; port += 1) {
    if (await isPortAvailable(port)) return port;
  }

  throw new Error(`No available port found from ${preferredPort} to ${preferredPort + 49}.`);
}

async function mountFrontend(hmrPort: number) {
  if (env.nodeEnv !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : { port: hmrPort },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    return;
  }

  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

export async function startServer() {
  await ensureDatabaseSchema();
  await ensureEntityChangeLogsTable();
  await ensureSupportTables();

  const appPort = await findAvailablePort(env.port);
  const requestedHmrPort = Number(process.env.HMR_PORT || appPort + 1000);
  const hmrPort = env.nodeEnv === 'production' ? requestedHmrPort : await findAvailablePort(requestedHmrPort);

  await mountFrontend(hmrPort);

  if (appPort !== env.port) {
    console.warn(`Port ${env.port} is already in use. Using http://localhost:${appPort} instead.`);
  }

  if (env.nodeEnv !== 'production') {
    console.log(`Vite HMR running on port ${hmrPort}`);
  }

  app.listen(appPort, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${appPort}`);
  });
}
