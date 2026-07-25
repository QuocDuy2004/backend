import dotenv from 'dotenv';

dotenv.config({ path: '.env.local', quiet: true });
dotenv.config({ quiet: true });

const int = (v: string | undefined, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const appUrl = (process.env.APP_URL || process.env.VITE_APP_URL || '').replace(/\/$/, '');

export const env = {
  port:    int(process.env.PORT, 3000),
  nodeEnv: process.env.NODE_ENV || 'development',
  appUrl,
  frontendUrl: (process.env.FRONTEND_URL || process.env.VITE_APP_URL || '').replace(/\/$/, ''),

  jwtSecret:   process.env.JWT_SECRET   || 'dev-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  geminiApiKey: process.env.GEMINI_API_KEY || '',

  database: {
    host:            process.env.DB_HOST     || '',
    port:            int(process.env.DB_PORT, 3306),
    user:            process.env.DB_USER     || '',
    password:        process.env.DB_PASSWORD || '',
    name:            process.env.DB_DATABASE || '',
    ssl:             process.env.DB_SSL === 'true',
    connectionLimit: int(process.env.DB_CONNECTION_LIMIT, 5),
  },

  vnpay: {
    tmnCode:   process.env.VNPAY_TMN_CODE   || '',
    hashSecret: process.env.VNPAY_HASH_SECRET || '',
    url:       process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
    returnUrl: process.env.VNPAY_RETURN_URL || `${appUrl}/api/payments/vnpay/return`,
  },

  momo: {
    partnerCode: process.env.MOMO_PARTNER_CODE || '',
    accessKey:   process.env.MOMO_ACCESS_KEY   || '',
    secretKey:   process.env.MOMO_SECRET_KEY   || '',
    endpoint:    process.env.MOMO_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/create',
    returnUrl:   process.env.MOMO_RETURN_URL || `${appUrl}/api/payments/momo/return`,
    ipnUrl:      process.env.MOMO_IPN_URL    || `${appUrl}/api/payments/momo/ipn`,
  },
};
