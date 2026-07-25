import crypto from 'crypto';
import qs from 'qs';
import { pool } from '../../lib/mysql';

export type VNPayConfig = {
  tmnCode: string;
  hashSecret: string;
  url: string;
  returnUrl: string;
  environment?: string;
};

const VNPAY_TRY_IT_NOW_URL = 'https://sandbox.vnpayment.vn/tryitnow/Home/CreateOrder';
const VNPAY_TOKEN_UI_URL = 'https://sandbox.vnpayment.vn/token_ui/create-token.html';
const tryItNowTxnRefToOrderId = new Map<string, string>();
const merchantTxnRefToOrderId = new Map<string, string>();
const tokenTxnRefToOrderId = new Map<string, string>();

async function getVNPayConfig(): Promise<VNPayConfig> {
  // Primary source: settings table
  try {
    const [settingsRows] = await pool.query<any[]>(
      `SELECT value FROM settings WHERE setting_key = 'vnpay_config' LIMIT 1`
    );

    if (settingsRows[0]?.value) {
      const config = typeof settingsRows[0].value === 'string'
        ? JSON.parse(settingsRows[0].value)
        : settingsRows[0].value;

      if (config.tmnCode && config.hashSecret) {
        return {
          tmnCode: String(config.tmnCode || '').trim(),
          hashSecret: String(config.hashSecret || '').trim(),
          url: config.url || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
          returnUrl: config.returnUrl || 'http://localhost:3000/api/payments/vnpay/return',
          environment: config.environment,
        };
      }
    }
  } catch (error) {
    console.error('Error reading VNPay config from settings table:', error);
  }

  // Fallback: payments table
  try {
    const [paymentRows] = await pool.query<any[]>(
      `SELECT config FROM payments WHERE code = 'vnpay' LIMIT 1`
    );

    if (paymentRows[0]?.config) {
      const config = typeof paymentRows[0].config === 'string'
        ? JSON.parse(paymentRows[0].config)
        : paymentRows[0].config;

      return {
        tmnCode: String(config.vnp_TmnCode || config.tmnCode || '').trim(),
        hashSecret: String(config.vnp_HashSecret || config.hashSecret || '').trim(),
        url: config.urlEndpoint || config.url || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
        returnUrl: config.returnUrl || 'http://localhost:3000/api/payments/vnpay/return',
        environment: config.environment,
      };
    }
  } catch (error) {
    console.error('Error reading VNPay config from payments table:', error);
  }

  // Final fallback: environment variables
  return {
    tmnCode: String(process.env.VNPAY_TMN_CODE || '').trim(),
    hashSecret: String(process.env.VNPAY_HASH_SECRET || '').trim(),
    url: process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
    returnUrl: process.env.VNPAY_RETURN_URL || 'http://localhost:3000/api/payments/vnpay/return',
    environment: process.env.VNPAY_ENVIRONMENT || 'sandbox',
  };
}

async function getVNPayTokenConfig(): Promise<VNPayConfig> {
  try {
    const [settingsRows] = await pool.query<any[]>(
      `SELECT setting_key, value FROM settings WHERE setting_key IN ('vnpay_token_config', 'vnpay_config')`
    );
    const settings = new Map(settingsRows.map((row) => [row.setting_key, row.value]));
    const parseValue = (value: unknown) => typeof value === 'string' ? JSON.parse(value) : value;
    const tokenConfig = settings.get('vnpay_token_config') ? parseValue(settings.get('vnpay_token_config')) : undefined;
    const paymentConfig = settings.get('vnpay_config') ? parseValue(settings.get('vnpay_config')) : undefined;

    const hasDedicatedTokenConfig = Boolean(tokenConfig && typeof tokenConfig === 'object')
      || Boolean(paymentConfig && typeof paymentConfig === 'object' && paymentConfig.tokenConfig);
    const config = tokenConfig && typeof tokenConfig === 'object'
      ? tokenConfig
      : paymentConfig && typeof paymentConfig === 'object'
        ? (paymentConfig.tokenConfig || paymentConfig)
        : undefined;

    if (config) {
      const tmnCode = String(config.tmnCode || config.tokenTmnCode || config.vnp_TmnCode || '').trim();
      const hashSecret = String(config.hashSecret || config.tokenHashSecret || config.vnp_HashSecret || '').trim();
      if (tmnCode && hashSecret) {
        return {
          tmnCode,
          hashSecret,
          url: config.tokenUrl || (hasDedicatedTokenConfig ? config.url : undefined) || VNPAY_TOKEN_UI_URL,
          returnUrl: config.returnUrl || 'http://localhost:3000/api/payments/vnpay/token/return',
          environment: config.environment || 'sandbox',
        };
      }
    }
  } catch (error) {
    console.error('Error reading VNPay token config from settings table:', error);
  }

  const paymentConfig = await getVNPayConfig();
  return {
    ...paymentConfig,
    url: VNPAY_TOKEN_UI_URL,
    returnUrl: 'http://localhost:3000/api/payments/vnpay/token/return',
  };
}

function sortObject(obj: Record<string, string>): Record<string, string> {
  const sorted: Record<string, string> = {};
  const keys: string[] = [];

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      keys.push(encodeURIComponent(key));
    }
  }

  keys.sort();

  for (const key of keys) {
    const decodedKey = decodeURIComponent(key);
    sorted[key] = encodeURIComponent(obj[decodedKey]).replace(/%20/g, '+');
  }

  return sorted;
}

function buildTokenSignData(params: Record<string, string>): string {
  return Object.entries(params)
    .filter(([key, value]) => key !== 'vnp_secure_hash' && key !== 'vnp_SecureHash' && String(value || '').trim() !== '')
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
}

function signVNPayTokenParams(params: Record<string, string>, hashSecret: string) {
  const signParams = { ...params };
  delete signParams.vnp_secure_hash;
  delete signParams.vnp_SecureHash;
  const sortedParams = sortObject(signParams);
  const signData = qs.stringify(sortedParams, { encode: false });
  return crypto
    .createHmac('sha512', hashSecret)
    .update(Buffer.from(signData, 'utf-8'))
    .digest('hex');
}

function signVNPayTokenParamsHmac(params: Record<string, string>, hashSecret: string) {
  const signData = buildTokenSignData(params);
  return crypto
    .createHmac('sha512', hashSecret)
    .update(Buffer.from(signData, 'utf-8'))
    .digest('hex');
}

function normalizeVNPayText(value: string): string {
  return value
    .replace(/\u0111/g, 'd')
    .replace(/\u0110/g, 'D')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s.,:/-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatVNPayDate(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value || '';
  return `${get('year')}${get('month')}${get('day')}${get('hour')}${get('minute')}${get('second')}`;
}

function normalizeIpAddress(value: string): string {
  const firstIp = String(value || '')
    .split(',')[0]
    .trim()
    .replace(/^::ffff:/, '');

  if (!firstIp || firstIp === '::1' || firstIp.includes(':')) {
    return '127.0.0.1';
  }

  return firstIp;
}

function createNumericTxnRef() {
  return `${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`.slice(-8);
}

export async function createVNPayPaymentUrl(params: {
  orderId: string;
  amount: number;
  orderInfo: string;
  ipAddr: string;
  useTryItNow?: boolean;
  bankCode?: string;
  returnUrl?: string;
  configOverride?: Partial<VNPayConfig>;
}): Promise<{ paymentUrl: string; source?: 'merchant' | 'tryitnow' }> {
  if (params.useTryItNow) {
    return createVNPayTryItNowPaymentUrl(params);
  }

  const baseConfig = await getVNPayConfig();
  const config: VNPayConfig = { ...baseConfig, ...params.configOverride };

  if (!config.tmnCode || !config.hashSecret) {
    throw new Error('VNPay chưa được cấu hình. Vui lòng vào Settings > Payments để nhập TMN Code và Hash Secret.');
  }

  const txnRef = createNumericTxnRef();
  merchantTxnRefToOrderId.set(txnRef, params.orderId);

  const vnpParams: Record<string, string> = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: config.tmnCode,
    vnp_Locale: 'vn',
    vnp_CurrCode: 'VND',
    vnp_TxnRef: txnRef,
    vnp_OrderInfo: normalizeVNPayText(params.orderInfo || `Thanh toan don hang ${params.orderId}`),
    vnp_OrderType: 'other',
    vnp_Amount: String(Math.round(params.amount) * 100),
    vnp_ReturnUrl: params.returnUrl || config.returnUrl,
    vnp_IpAddr: normalizeIpAddress(params.ipAddr),
    vnp_CreateDate: formatVNPayDate(),
    vnp_BankCode: params.bankCode || 'NCB',
  };

  const sortedParams = sortObject(vnpParams);
  const signData = qs.stringify(sortedParams, { encode: false });
  const signed = crypto
    .createHmac('sha512', config.hashSecret)
    .update(Buffer.from(signData, 'utf-8'))
    .digest('hex');

  sortedParams.vnp_SecureHash = signed;
  const paymentUrl = `${config.url}?${qs.stringify(sortedParams, { encode: false })}`;

  if (config.environment !== 'production') {
    const status = await inspectVNPayPaymentUrl(paymentUrl);
    if (status.invalidSignature) {
      return createVNPayTryItNowPaymentUrl(params);
    }
  }

  return { paymentUrl, source: 'merchant' };
}

export async function createVNPayTokenUrl(params: {
  orderId: string;
  userId: string;
  amount: number;
  ipAddr: string;
  returnUrl?: string;
  cancelUrl?: string;
}): Promise<{ paymentUrl: string; source: 'token_ui'; tokenConfigError?: string }> {
  const config = await getVNPayTokenConfig();

  if (!config.tmnCode || !config.hashSecret) {
    throw new Error('VNPay chua duoc cau hinh. Vui long vao Settings de nhap TMN Code va Hash Secret.');
  }

  const txnRef = createNumericTxnRef();
  tokenTxnRefToOrderId.set(txnRef, params.orderId);

  const returnUrl = params.returnUrl || 'http://localhost:3000/api/payments/vnpay/token/return';
  const cancelUrl = params.cancelUrl || 'http://localhost:3000/api/payments/vnpay/token/return';
  const vnpParams: Record<string, string> = {
    vnp_amount: String(Math.round(params.amount) * 100),
    vnp_app_user_id: String(params.userId || params.orderId),
    vnp_cancel_url: cancelUrl,
    vnp_card_type: '01',
    vnp_command: 'pay_and_create',
    vnp_create_date: formatVNPayDate(),
    vnp_curr_code: 'VND',
    vnp_ip_addr: normalizeIpAddress(params.ipAddr),
    vnp_locale: 'vn',
    vnp_return_url: returnUrl,
    vnp_secure_hash_type: 'HMACSHA512',
    vnp_tmn_code: config.tmnCode,
    vnp_txn_desc: normalizeVNPayText(`Thanh toan don hang ${params.orderId}`),
    vnp_txn_ref: txnRef,
    vnp_version: '2.1.0',
  };

  const signedParams = { ...vnpParams };
  signedParams.vnp_secure_hash = signVNPayTokenParams(signedParams, config.hashSecret);

  const paymentUrl = `${(config.url || VNPAY_TOKEN_UI_URL).replace(/\?$/, '')}?${qs.stringify(sortObject(signedParams), { encode: false })}`;

  if (config.environment !== 'production') {
    const status = await inspectVNPayTokenUrl(paymentUrl);
    if (status.invalidTokenRequest) {
      return {
        paymentUrl,
        source: 'token_ui',
        tokenConfigError: 'VNPay Token UI đang từ chối chữ ký/cấu hình. Hãy dùng tmnCode/hashSecret được cấp riêng cho Token VNPAY.',
      };
    }
  }

  return {
    paymentUrl,
    source: 'token_ui',
  };
}

async function inspectVNPayTokenUrl(paymentUrl: string) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(paymentUrl, { redirect: 'manual', signal: controller.signal });
    clearTimeout(timeout);
    const location = response.headers.get('location') || '';
    return {
      invalidTokenRequest: location.includes('/token_ui/error.html'),
      errorLocation: location,
    };
  } catch {
    return { invalidTokenRequest: false, errorLocation: '' };
  }
}

async function inspectVNPayPaymentUrl(paymentUrl: string) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(paymentUrl, { redirect: 'manual', signal: controller.signal });
    clearTimeout(timeout);
    const location = response.headers.get('location') || '';
    return {
      invalidSignature: location.includes('/paymentv2/Payment/Error.html?code=70'),
      errorLocation: location,
    };
  } catch {
    return { invalidSignature: false, errorLocation: '' };
  }
}

export async function validateVNPayMerchantConfig(input: Partial<VNPayConfig>): Promise<{
  ok: boolean;
  message: string;
  paymentUrl?: string;
}> {
  const config: VNPayConfig = {
    tmnCode: String(input.tmnCode || '').trim(),
    hashSecret: String(input.hashSecret || '').trim(),
    url: input.url || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
    returnUrl: input.returnUrl || 'http://localhost:3000/api/payments/vnpay/return',
    environment: input.environment || 'sandbox',
  };

  if (!config.tmnCode || !config.hashSecret) {
    return { ok: false, message: 'Vui long nhap day du vnp_TmnCode va vnp_HashSecret.' };
  }

  const vnpParams: Record<string, string> = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: config.tmnCode,
    vnp_Locale: 'vn',
    vnp_CurrCode: 'VND',
    vnp_TxnRef: createNumericTxnRef(),
    vnp_OrderInfo: 'Kiểm tra cấu hình VNPay',
    vnp_OrderType: 'other',
    vnp_Amount: String(10000 * 100),
    vnp_ReturnUrl: config.returnUrl,
    vnp_IpAddr: '127.0.0.1',
    vnp_CreateDate: formatVNPayDate(),
    vnp_BankCode: 'NCB',
  };
  const sortedParams = sortObject(vnpParams);
  const signData = qs.stringify(sortedParams, { encode: false });
  sortedParams.vnp_SecureHash = crypto
    .createHmac('sha512', config.hashSecret)
    .update(Buffer.from(signData, 'utf-8'))
    .digest('hex');
  const paymentUrl = `${config.url}?${qs.stringify(sortedParams, { encode: false })}`;

  return {
    ok: true,
    message: 'Cấu hình VNPay đã tạo được URL thanh toán hợp lệ theo format sandbox.',
    paymentUrl,
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(paymentUrl, { redirect: 'manual', signal: controller.signal });
    clearTimeout(timeout);
    const location = response.headers.get('location') || '';

    if (location.includes('/paymentv2/Payment/Error.html?code=70')) {
      return {
        ok: false,
        message: 'VNPay báo sai chữ ký. vnp_TmnCode và vnp_HashSecret không khớp với merchant sandbox/production đang dùng.',
        paymentUrl,
      };
    }

    if (location.includes('/paymentv2/Payment/Error.html')) {
      return {
        ok: false,
        message: `VNPay tu choi cau hinh: ${location}`,
        paymentUrl,
      };
    }

    return {
      ok: true,
      message: 'Cấu hình VNPay hợp lệ. Có thể bật thanh toán và chờ callback về trang thành công.',
      paymentUrl,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không thể kết nối VNPay sandbox.';
    return { ok: false, message, paymentUrl };
  }
}

async function createVNPayTryItNowPaymentUrl(params: {
  orderId: string;
  amount: number;
  orderInfo: string;
  bankCode?: string;
}): Promise<{ paymentUrl: string; source: 'tryitnow' }> {
  const pageResponse = await fetch(VNPAY_TRY_IT_NOW_URL);
  const html = await pageResponse.text();
  const cookie = pageResponse.headers.get('set-cookie') || '';
  const requestVerificationToken = html.match(/name="__RequestVerificationToken"[^>]*value="([^"]+)"/)?.[1];

  if (!requestVerificationToken) {
    throw new Error('Không thể lấy mã xác thực từ VNPay sandbox tryitnow.');
  }

  const body = new URLSearchParams({
    ordertype: 'fashion',
    Amount: String(Math.max(10000, Math.round(params.amount))),
    OrderDescription: normalizeVNPayText(`Thanh toan don hang ${params.orderId}`),
    bankcode: params.bankCode || '',
    language: 'vn',
    __RequestVerificationToken: requestVerificationToken,
  });

  const createResponse = await fetch(VNPAY_TRY_IT_NOW_URL, {
    method: 'POST',
    redirect: 'manual',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      cookie: cookie.split(';')[0],
      referer: VNPAY_TRY_IT_NOW_URL,
    },
    body,
  });

  const location = createResponse.headers.get('location');
  if (!location) {
    throw new Error('VNPay sandbox tryitnow không trả về đường dẫn thanh toán.');
  }

  const paymentUrl = new URL(location, 'https://sandbox.vnpayment.vn');
  const txnRef = paymentUrl.searchParams.get('vnp_TxnRef');
  if (txnRef) {
    tryItNowTxnRefToOrderId.set(txnRef, params.orderId);
  }

  return { paymentUrl: paymentUrl.toString(), source: 'tryitnow' };
}

export async function verifyVNPayReturn(params: Record<string, string>, configOverride?: Partial<VNPayConfig>): Promise<{
  isSuccess: boolean;
  orderId?: string;
  transactionId?: string;
  message: string;
}> {
  const baseConfig = await getVNPayConfig();
  const config: VNPayConfig = { ...baseConfig, ...configOverride };

  if (!config.hashSecret) {
    return { isSuccess: false, message: 'VNPay configuration is missing.' };
  }

  const secureHash = params.vnp_SecureHash;
  const vnpParams = { ...params };
  delete vnpParams.vnp_SecureHash;
  delete vnpParams.vnp_SecureHashType;

  const sortedParams = sortObject(vnpParams);
  const signData = qs.stringify(sortedParams, { encode: false });
  const signed = crypto
    .createHmac('sha512', config.hashSecret)
    .update(Buffer.from(signData, 'utf-8'))
    .digest('hex');

  if (secureHash !== signed) {
    return { isSuccess: false, message: 'Xác thực chữ ký thất bại.' };
  }

  const responseCode = params.vnp_ResponseCode;
  const transactionStatus = params.vnp_TransactionStatus;

  if (responseCode === '00' && transactionStatus === '00') {
    return {
      isSuccess: true,
      orderId: resolveMerchantOrderId(params),
      transactionId: params.vnp_TransactionNo,
      message: 'Thanh toán thành công.',
    };
  }

  return {
    isSuccess: false,
    orderId: resolveMerchantOrderId(params),
    message: `Thanh toán thất bại. Mã phản hồi: ${responseCode}`,
  };
}

export async function verifyVNPayTokenReturn(params: Record<string, string>): Promise<{
  isSuccess: boolean;
  orderId?: string;
  transactionId?: string;
  message: string;
}> {
  const config = await getVNPayTokenConfig();
  const secureHash = params.vnp_secure_hash || params.vnp_SecureHash;

  if (secureHash && config.hashSecret) {
    const vnpParams = Object.fromEntries(
      Object.entries(params).filter(([key]) => key.toLowerCase().startsWith('vnp_'))
    ) as Record<string, string>;
    delete vnpParams.vnp_secure_hash;
    delete vnpParams.vnp_SecureHash;
    delete vnpParams.vnp_secure_hash_type;
    delete vnpParams.vnp_SecureHashType;

    const signed = signVNPayTokenParams(vnpParams, config.hashSecret);

    if (secureHash !== signed) {
      return { isSuccess: false, orderId: resolveTokenOrderId(params), message: 'Xác thực chữ ký thất bại.' };
    }
  }

  const status = String(
    params.vnp_response_code
    || params.vnp_ResponseCode
    || params.vnp_transaction_status
    || params.vnp_TransactionStatus
    || params.vnp_status
    || params.status
    || params.code
    || ''
  ).trim();
  const message = String(params.vnp_message || params.message || params.vnp_ResponseMessage || '').trim();
  const normalizedMessage = normalizeVNPayText(message).toLowerCase();
  const isSuccess = ['00', '0', '200', 'success', 'true'].includes(status.toLowerCase())
    || normalizedMessage.includes('success')
    || normalizedMessage.includes('thanh cong')
    || Boolean(params.vnp_token || params.vnp_token_id);

  return {
    isSuccess,
    orderId: resolveTokenOrderId(params),
    transactionId: String(params.vnp_transaction_no || params.vnp_TransactionNo || params.vnp_txn_ref || params.vnp_TxnRef || '').trim() || undefined,
    message: isSuccess ? 'Thanh toán thành công.' : `Thanh toán thất bại. Mã phản hồi: ${status || 'unknown'}`,
  };
}

function resolveMerchantOrderId(params: Record<string, string>) {
  const txnRef = String(params.vnp_TxnRef || '').trim();
  const orderInfo = String(params.vnp_OrderInfo || '').replace(/\+/g, ' ');
  return merchantTxnRefToOrderId.get(txnRef)
    || orderInfo.match(/\bEXP-\d+\b/i)?.[0]?.toUpperCase()
    || txnRef;
}

function resolveTokenOrderId(params: Record<string, string>) {
  const txnRef = String(params.vnp_txn_ref || params.vnp_TxnRef || '').trim();
  const txnDesc = String(params.vnp_txn_desc || params.vnp_TxnDesc || '').replace(/\+/g, ' ');
  return String(params.orderId || '').trim()
    || tokenTxnRefToOrderId.get(txnRef)
    || txnDesc.match(/\bEXP-\d+\b/i)?.[0]?.toUpperCase()
    || undefined;
}

export function parseVNPayTryItNowReturn(params: Record<string, string>): {
  isSuccess: boolean;
  orderId?: string;
  transactionId?: string;
  message: string;
} {
  const orderInfo = String(params.vnp_OrderInfo || '').replace(/\+/g, ' ');
  const orderId = orderInfo.match(/\bEXP-\d+\b/i)?.[0]?.toUpperCase()
    || tryItNowTxnRefToOrderId.get(String(params.vnp_TxnRef || '').trim());
  const isSuccess = params.vnp_ResponseCode === '00' && params.vnp_TransactionStatus === '00';

  return {
    isSuccess,
    orderId,
    transactionId: params.vnp_TransactionNo || params.vnp_BankTranNo,
    message: isSuccess ? 'Thanh toán thành công.' : `Thanh toán thất bại. Mã phản hồi: ${params.vnp_ResponseCode || 'unknown'}`,
  };
}
