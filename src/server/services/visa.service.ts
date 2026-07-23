import { pool } from '../../lib/mysql';
import { createVNPayPaymentUrl, verifyVNPayReturn } from './vnpay.service';

export type VisaGatewayConfig = {
  merchantId: string;
  secretKey: string;
  endpoint: string;
  returnUrl: string;
  provider: 'vnpay' | 'custom';
  environment?: string;
};

function parseConfig(value: unknown): Record<string, any> {
  if (!value) return {};
  if (typeof value === 'object' && !Array.isArray(value)) return value as Record<string, any>;
  if (typeof value !== 'string') return {};

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

async function getVisaGatewayConfig(): Promise<VisaGatewayConfig> {
  try {
    const [settingsRows] = await pool.query<any[]>(
      `SELECT value FROM settings WHERE setting_key = 'visa_config' LIMIT 1`
    );
    const config = parseConfig(settingsRows[0]?.value);
    const merchantId = String(config.merchantId || config.tmnCode || config.vnp_TmnCode || '').trim();
    const secretKey = String(config.secretKey || config.hashSecret || config.vnp_HashSecret || '').trim();

    if (merchantId && secretKey) {
      return {
        merchantId,
        secretKey,
        endpoint: config.endpoint || config.urlEndpoint || config.url || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
        returnUrl: config.returnUrl || 'http://localhost:3000/api/payments/visa/return',
        provider: config.provider === 'custom' ? 'custom' : 'vnpay',
        environment: config.environment || 'sandbox',
      };
    }
  } catch (error) {
    console.error('Error reading Visa config from settings table:', error);
  }

  try {
    const [paymentRows] = await pool.query<any[]>(
      `SELECT config FROM payments WHERE code = 'visa' LIMIT 1`
    );
    const config = parseConfig(paymentRows[0]?.config);
    const merchantId = String(config.merchantId || config.tmnCode || config.vnp_TmnCode || '').trim();
    const secretKey = String(config.secretKey || config.hashSecret || config.vnp_HashSecret || '').trim();

    if (merchantId && secretKey) {
      return {
        merchantId,
        secretKey,
        endpoint: config.endpoint || config.urlEndpoint || config.url || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
        returnUrl: config.returnUrl || 'http://localhost:3000/api/payments/visa/return',
        provider: config.provider === 'custom' ? 'custom' : 'vnpay',
        environment: config.environment || 'sandbox',
      };
    }
  } catch (error) {
    console.error('Error reading Visa config from payments table:', error);
  }

  try {
    const [settingsRows] = await pool.query<any[]>(
      `SELECT value FROM settings WHERE setting_key = 'vnpay_config' LIMIT 1`
    );
    const config = parseConfig(settingsRows[0]?.value);
    const merchantId = String(config.tmnCode || config.vnp_TmnCode || '').trim();
    const secretKey = String(config.hashSecret || config.vnp_HashSecret || '').trim();

    if (merchantId && secretKey) {
      return {
        merchantId,
        secretKey,
        endpoint: config.url || config.urlEndpoint || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
        returnUrl: 'http://localhost:3000/api/payments/visa/return',
        provider: 'vnpay',
        environment: config.environment || 'sandbox',
      };
    }
  } catch (error) {
    console.error('Error reading Visa fallback config from vnpay_config:', error);
  }

  try {
    const [paymentRows] = await pool.query<any[]>(
      `SELECT config FROM payments WHERE code = 'vnpay' LIMIT 1`
    );
    const config = parseConfig(paymentRows[0]?.config);
    const merchantId = String(config.tmnCode || config.vnp_TmnCode || '').trim();
    const secretKey = String(config.hashSecret || config.vnp_HashSecret || '').trim();

    if (merchantId && secretKey) {
      return {
        merchantId,
        secretKey,
        endpoint: config.url || config.urlEndpoint || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
        returnUrl: 'http://localhost:3000/api/payments/visa/return',
        provider: 'vnpay',
        environment: config.environment || 'sandbox',
      };
    }
  } catch (error) {
    console.error('Error reading Visa fallback config from vnpay payment:', error);
  }

  return {
    merchantId: String(process.env.VISA_MERCHANT_ID || process.env.VNPAY_TMN_CODE || '').trim(),
    secretKey: String(process.env.VISA_SECRET_KEY || process.env.VNPAY_HASH_SECRET || '').trim(),
    endpoint: process.env.VISA_ENDPOINT || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
    returnUrl: process.env.VISA_RETURN_URL || 'http://localhost:3000/api/payments/visa/return',
    provider: 'vnpay',
    environment: process.env.VISA_ENVIRONMENT || 'sandbox',
  };
}

export async function createVisaPayment(params: {
  orderId: string;
  amount: number;
  orderInfo: string;
  ipAddr: string;
  returnUrl?: string;
}) {
  const config = await getVisaGatewayConfig();

  if (!config.merchantId || !config.secretKey) {
    throw new Error('Visa / Mastercard chua duoc cau hinh. Vui long vao Settings > Payments de nhap Merchant ID va Secret Key.');
  }

  if (config.provider !== 'vnpay') {
    throw new Error('Gateway Visa custom chua co endpoint chuan. Hay cau hinh provider=vnpay hoac bo sung API gateway rieng.');
  }

  return createVNPayPaymentUrl({
    orderId: params.orderId,
    amount: params.amount,
    orderInfo: params.orderInfo,
    ipAddr: params.ipAddr,
    bankCode: 'INTCARD',
    returnUrl: params.returnUrl || config.returnUrl,
    useTryItNow: false,
    configOverride: {
      tmnCode: config.merchantId,
      hashSecret: config.secretKey,
      url: config.endpoint,
      returnUrl: params.returnUrl || config.returnUrl,
      environment: config.environment,
    },
  });
}

export async function verifyVisaReturn(params: Record<string, string>) {
  const config = await getVisaGatewayConfig();
  return verifyVNPayReturn(params, {
    tmnCode: config.merchantId,
    hashSecret: config.secretKey,
    url: config.endpoint,
    returnUrl: config.returnUrl,
    environment: config.environment,
  });
}
