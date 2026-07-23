import crypto from 'crypto';
import { pool } from '../../lib/mysql';

export type MoMoConfig = {
  partnerCode: string;
  accessKey: string;
  secretKey: string;
  endpoint: string;
  returnUrl: string;
  ipnUrl: string;
};

async function getMoMoConfig(): Promise<MoMoConfig> {
  // Primary source: settings table
  try {
    const [settingsRows] = await pool.query<any[]>(
      `SELECT value FROM settings WHERE setting_key = 'momo_config' LIMIT 1`
    );

    if (settingsRows[0]?.value) {
      const config = typeof settingsRows[0].value === 'string'
        ? JSON.parse(settingsRows[0].value)
        : settingsRows[0].value;

      if (config.partnerCode && config.accessKey && config.secretKey) {
        return {
          partnerCode: config.partnerCode || '',
          accessKey: config.accessKey || '',
          secretKey: config.secretKey || '',
          endpoint: config.endpoint || 'https://test-payment.momo.vn/v2/gateway/api/create',
          returnUrl: config.returnUrl || 'http://localhost:3000/api/payments/momo/return',
          ipnUrl: config.ipnUrl || 'http://localhost:3000/api/payments/momo/ipn',
        };
      }
    }
  } catch (error) {
    console.error('Error reading MoMo config from settings table:', error);
  }

  // Fallback: payments table
  try {
    const [paymentRows] = await pool.query<any[]>(
      `SELECT config FROM payments WHERE code = 'momo' LIMIT 1`
    );

    if (paymentRows[0]?.config) {
      const config = typeof paymentRows[0].config === 'string'
        ? JSON.parse(paymentRows[0].config)
        : paymentRows[0].config;

      return {
        partnerCode: config.partnerCode || '',
        accessKey: config.accessKey || '',
        secretKey: config.secretKey || '',
        endpoint: config.urlEndpoint || config.endpoint || 'https://test-payment.momo.vn/v2/gateway/api/create',
        returnUrl: config.returnUrl || 'http://localhost:3000/api/payments/momo/return',
        ipnUrl: config.ipnUrl || 'http://localhost:3000/api/payments/momo/ipn',
      };
    }
  } catch (error) {
    console.error('Error reading MoMo config from payments table:', error);
  }

  // Final fallback: environment variables
  return {
    partnerCode: process.env.MOMO_PARTNER_CODE || '',
    accessKey: process.env.MOMO_ACCESS_KEY || '',
    secretKey: process.env.MOMO_SECRET_KEY || '',
    endpoint: process.env.MOMO_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/create',
    returnUrl: process.env.MOMO_RETURN_URL || 'http://localhost:3000/api/payments/momo/return',
    ipnUrl: process.env.MOMO_IPN_URL || 'http://localhost:3000/api/payments/momo/ipn',
  };
}

export async function createMoMoPayment(params: {
  orderId: string;
  amount: number;
  orderInfo: string;
  extraData?: string;
}): Promise<{
  payUrl: string;
  qrCodeUrl?: string;
  deeplink?: string;
  requestId: string;
}> {
  const config = await getMoMoConfig();

  if (!config.partnerCode || !config.accessKey || !config.secretKey) {
    throw new Error('MoMo chưa được cấu hình. Vui lòng vào Settings > Payments để nhập Partner Code, Access Key và Secret Key.');
  }

  const requestId = `${params.orderId}-${Date.now()}`;
  const requestType = 'captureWallet';
  const extraDataEncoded = params.extraData ? Buffer.from(params.extraData).toString('base64') : '';

  const rawSignature = `accessKey=${config.accessKey}&amount=${params.amount}&extraData=${extraDataEncoded}&ipnUrl=${config.ipnUrl}&orderId=${params.orderId}&orderInfo=${params.orderInfo}&partnerCode=${config.partnerCode}&redirectUrl=${config.returnUrl}&requestId=${requestId}&requestType=${requestType}`;

  const signature = crypto
    .createHmac('sha256', config.secretKey)
    .update(rawSignature)
    .digest('hex');

  const requestBody = {
    partnerCode: config.partnerCode,
    partnerName: 'VeloCart',
    storeId: 'VelocartStore',
    requestId,
    amount: params.amount,
    orderId: params.orderId,
    orderInfo: params.orderInfo,
    redirectUrl: config.returnUrl,
    ipnUrl: config.ipnUrl,
    lang: 'vi',
    extraData: extraDataEncoded,
    requestType,
    signature,
  };

  const response = await fetch(config.endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  const result = await response.json();

  if (result.resultCode !== 0) {
    throw new Error(result.message || 'Failed to create MoMo payment.');
  }

  return {
    payUrl: result.payUrl,
    qrCodeUrl: result.qrCodeUrl,
    deeplink: result.deeplink,
    requestId,
  };
}

export async function verifyMoMoCallback(params: Record<string, string>): Promise<{
  isSuccess: boolean;
  orderId?: string;
  requestId?: string;
  transactionId?: string;
  message: string;
}> {
  const config = await getMoMoConfig();

  if (!config.secretKey) {
    return { isSuccess: false, message: 'MoMo configuration is missing.' };
  }

  const {
    partnerCode,
    orderId,
    requestId,
    amount,
    orderInfo,
    orderType,
    transId,
    resultCode,
    message,
    responseTime,
    extraData,
    signature,
  } = params;

  const rawSignature = `accessKey=${config.accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

  const expectedSignature = crypto
    .createHmac('sha256', config.secretKey)
    .update(rawSignature)
    .digest('hex');

  if (signature !== expectedSignature) {
    return { isSuccess: false, message: 'Signature validation failed.' };
  }

  if (resultCode === '0') {
    return {
      isSuccess: true,
      orderId,
      requestId,
      transactionId: transId,
      message: 'Payment successful.',
    };
  }

  return {
    isSuccess: false,
    orderId,
    requestId,
    message: `Payment failed. Result code: ${resultCode}`,
  };
}
