import type { Request, Response } from 'express';
import { createPayment, deletePayment, listPayments, updatePayment } from '../services/payments.service';
import { normalizeText } from '../utils/text';
import { createVNPayPaymentUrl, createVNPayTokenUrl, parseVNPayTryItNowReturn, validateVNPayMerchantConfig, verifyVNPayReturn, verifyVNPayTokenReturn } from '../services/vnpay.service';
import { createMoMoPayment, verifyMoMoCallback } from '../services/momo.service';
import { createVisaPayment, verifyVisaReturn } from '../services/visa.service';
import { createBankTransferPayment, fetchBankTransactionsFromProvider, getBankTransferConfig, processBankTransactions } from '../services/bank-transfer.service';

const vnpayClientReturnUrls = new Map<string, string>();
const visaClientReturnUrls = new Map<string, string>();

export async function getPayments(req: Request, res: Response) {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    res.json({ ok: true, payments: await listPayments(includeInactive) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch payments';
    res.status(500).json({ ok: false, message });
  }
}

export async function updatePaymentHandler(req: Request, res: Response) {
  try {
    const payment = await updatePayment(normalizeText(req.params.code), {
      title: typeof req.body.title === 'string' ? req.body.title : undefined,
      status: normalizeText(req.body.status),
      logoUri: typeof req.body.logoUri === 'string'
        ? req.body.logoUri
        : typeof req.body.logo_uri === 'string'
          ? req.body.logo_uri
          : undefined,
      config: req.body.config && typeof req.body.config === 'object' && !Array.isArray(req.body.config)
        ? req.body.config
        : {},
    });

    if (!payment) {
      return res.status(404).json({ ok: false, message: 'Payment method not found.' });
    }

    res.json({ ok: true, payment });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update payment';
    res.status(500).json({ ok: false, message });
  }
}

export async function createPaymentHandler(req: Request, res: Response) {
  const code = normalizeText(req.body.code);
  const title = normalizeText(req.body.title);

  if (!code || !title) {
    return res.status(400).json({ ok: false, message: 'Payment code and title are required.' });
  }

  try {
    const payment = await createPayment({
      code,
      title,
      status: normalizeText(req.body.status),
      logoUri: typeof req.body.logoUri === 'string'
        ? req.body.logoUri
        : typeof req.body.logo_uri === 'string'
          ? req.body.logo_uri
          : '',
      config: req.body.config && typeof req.body.config === 'object' && !Array.isArray(req.body.config)
        ? req.body.config
        : {},
    });

    res.status(201).json({ ok: true, payment });
  } catch (error: any) {
    const message = error?.code === 'ER_DUP_ENTRY'
      ? 'Payment method code already exists.'
      : error instanceof Error
        ? error.message
        : 'Failed to create payment';
    res.status(error?.code === 'ER_DUP_ENTRY' ? 409 : 500).json({ ok: false, message });
  }
}

export async function deletePaymentHandler(req: Request, res: Response) {
  try {
    const deleted = await deletePayment(normalizeText(req.params.code));

    if (!deleted) {
      return res.status(404).json({ ok: false, message: 'Payment method not found.' });
    }

    res.json({ ok: true });
  } catch (error: any) {
    const message = error?.code === 'ER_ROW_IS_REFERENCED_2'
      ? 'Payment method is being used by orders and cannot be deleted.'
      : error instanceof Error
        ? error.message
        : 'Failed to delete payment';
    res.status(error?.code === 'ER_ROW_IS_REFERENCED_2' ? 409 : 500).json({ ok: false, message });
  }
}

export async function createVNPayPaymentHandler(req: Request, res: Response) {
  try {
    const { orderId, amount, orderInfo, useTryItNow, clientReturnUrl } = req.body;

    if (!orderId || !amount || amount <= 0) {
      return res.status(400).json({
        ok: false,
        message: 'Missing or invalid orderId or amount.',
      });
    }

    const ipAddr = req.headers['x-forwarded-for']?.toString().split(',')[0] ||
      req.socket.remoteAddress ||
      '127.0.0.1';

    const result = await createVNPayPaymentUrl({
      orderId,
      amount,
      orderInfo: orderInfo || `Thanh toan don hang ${orderId}`,
      ipAddr,
      useTryItNow: Boolean(useTryItNow),
    });

    if (typeof clientReturnUrl === 'string' && clientReturnUrl.trim()) {
      vnpayClientReturnUrls.set(String(orderId), clientReturnUrl.trim());
    }

    res.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create VNPay payment';
    res.status(500).json({ ok: false, message });
  }
}

export async function createVNPayTokenHandler(req: Request, res: Response) {
  try {
    const { orderId, userId, amount, clientReturnUrl } = req.body;

    if (!orderId || !userId || !amount || Number(amount) <= 0) {
      return res.status(400).json({
        ok: false,
        message: 'Missing or invalid orderId, userId or amount.',
      });
    }

    const ipAddr = req.headers['x-forwarded-for']?.toString().split(',')[0] ||
      req.socket.remoteAddress ||
      '127.0.0.1';
    const backendBaseUrl = getBackendBaseUrl(req);

    const result = await createVNPayTokenUrl({
      orderId: String(orderId),
      userId: String(userId),
      amount: Number(amount),
      ipAddr,
      returnUrl: `${backendBaseUrl}/api/payments/vnpay/token/return?orderId=${encodeURIComponent(String(orderId))}`,
      cancelUrl: `${backendBaseUrl}/api/payments/vnpay/token/cancel?orderId=${encodeURIComponent(String(orderId))}`,
    });

    if (typeof clientReturnUrl === 'string' && clientReturnUrl.trim()) {
      vnpayClientReturnUrls.set(String(orderId), clientReturnUrl.trim());
    }

    if (result.tokenConfigError) {
      const fallback = await createVNPayPaymentUrl({
        orderId: String(orderId),
        amount: Number(amount),
        orderInfo: `Thanh toan don hang ${orderId}`,
        ipAddr,
        useTryItNow: false,
      });

      return res.json({
        ok: true,
        ...fallback,
        warning: result.tokenConfigError,
      });
    }

    res.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create VNPay token payment';
    res.status(500).json({ ok: false, message });
  }
}

export async function validateVNPayConfigHandler(req: Request, res: Response) {
  try {
    const result = await validateVNPayMerchantConfig({
      tmnCode: req.body?.tmnCode || req.body?.vnp_TmnCode,
      hashSecret: req.body?.hashSecret || req.body?.vnp_HashSecret,
      url: req.body?.url || req.body?.urlEndpoint,
      returnUrl: req.body?.returnUrl || 'http://localhost:3000/api/payments/vnpay/return',
      environment: req.body?.environment || 'sandbox',
    });

    res.status(result.ok ? 200 : 400).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'KhÃ´ng thá»ƒ kiá»ƒm tra cáº¥u hÃ¬nh VNPay.';
    res.status(500).json({ ok: false, message });
  }
}

export async function vnpayReturnHandler(req: Request, res: Response) {
  try {
    const params = req.query as Record<string, string>;
    const result = await verifyVNPayReturn(params);

    if (result.orderId) {
      await updateOrderPaymentStatus(result.orderId, result.isSuccess ? 'paid' : 'failed', result.transactionId);
    }

    const total = Number(params.vnp_Amount || 0) > 0 ? String(Math.round(Number(params.vnp_Amount) / 100)) : '';
    const clientReturnUrl = result.orderId ? vnpayClientReturnUrls.get(result.orderId) : undefined;
    if (result.orderId) vnpayClientReturnUrls.delete(result.orderId);

    res.redirect(buildPaymentRedirectUrl(clientReturnUrl, {
      orderId: result.orderId || '',
      total,
      paymentMethod: 'vnpay',
      status: result.isSuccess ? 'success' : 'failed',
      message: result.message,
    }));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'VNPay return handler failed';
    res.redirect(buildPaymentRedirectUrl(undefined, {
      paymentMethod: 'vnpay',
      status: 'failed',
      message,
    }));
  }
}

export async function vnpayTokenReturnHandler(req: Request, res: Response) {
  try {
    const params = req.query as Record<string, string>;
    const result = await verifyVNPayTokenReturn(params);

    if (result.orderId) {
      await updateOrderPaymentStatus(result.orderId, result.isSuccess ? 'paid' : 'failed', result.transactionId);
    }

    const clientReturnUrl = result.orderId ? vnpayClientReturnUrls.get(result.orderId) : undefined;
    if (result.orderId) vnpayClientReturnUrls.delete(result.orderId);

    res.redirect(buildPaymentRedirectUrl(clientReturnUrl, {
      orderId: result.orderId || '',
      paymentMethod: 'vnpay',
      status: result.isSuccess ? 'success' : 'failed',
      message: result.message,
    }));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'VNPay token return handler failed';
    res.redirect(buildPaymentRedirectUrl(undefined, {
      paymentMethod: 'vnpay',
      status: 'failed',
      message,
    }));
  }
}

export async function vnpayTokenCancelHandler(req: Request, res: Response) {
  const orderId = typeof req.query.orderId === 'string' ? req.query.orderId : '';
  res.redirect(buildPaymentRedirectUrl(undefined, {
    orderId,
    paymentMethod: 'vnpay',
    status: 'failed',
    message: 'Khach hang da huy thanh toan VNPay.',
  }));
}

export async function confirmVNPayTryItNowHandler(req: Request, res: Response) {
  try {
    const params = req.body?.params && typeof req.body.params === 'object'
      ? req.body.params as Record<string, string>
      : req.body as Record<string, string>;
    const result = parseVNPayTryItNowReturn(params);

    if (!result.orderId) {
      return res.status(400).json({ ok: false, message: 'KhÃ´ng tÃ¬m tháº¥y mÃ£ Ä‘Æ¡n hÃ ng trong pháº£n há»“i VNPay sandbox.' });
    }

    await updateOrderPaymentStatus(result.orderId, result.isSuccess ? 'paid' : 'failed', result.transactionId);

    res.json({
      ok: true,
      orderId: result.orderId,
      transactionId: result.transactionId,
      status: result.isSuccess ? 'success' : 'failed',
      message: result.message,
      total: Number(params.vnp_Amount || 0) > 0 ? Math.round(Number(params.vnp_Amount) / 100) : undefined,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to confirm VNPay sandbox payment';
    res.status(500).json({ ok: false, message });
  }
}

export async function confirmVNPayTryItNowRedirectHandler(req: Request, res: Response) {
  const redirectUrl = process.env.FRONTEND_URL || 'http://localhost:8081';

  try {
    const params = req.query as Record<string, string>;
    const result = parseVNPayTryItNowReturn(params);

    if (!result.orderId) {
      const message = 'Khong tim thay ma don hang trong phan hoi VNPay sandbox.';
      return res.redirect(`${redirectUrl}/order-success?status=failed&paymentMethod=vnpay&message=${encodeURIComponent(message)}`);
    }

    const paymentStatus = result.isSuccess ? 'paid' : 'failed';
    const total = Number(params.vnp_Amount || 0) > 0 ? Math.round(Number(params.vnp_Amount) / 100) : undefined;
    await updateOrderPaymentStatus(result.orderId, paymentStatus, result.transactionId);

    return res.redirect(`${redirectUrl}/order-success?orderId=${result.orderId}&total=${total || ''}&paymentMethod=vnpay&status=${result.isSuccess ? 'success' : 'failed'}&message=${encodeURIComponent(result.message)}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to confirm VNPay sandbox payment';
    return res.redirect(`${redirectUrl}/order-success?status=failed&paymentMethod=vnpay&message=${encodeURIComponent(message)}`);
  }
}

export async function createMoMoPaymentHandler(req: Request, res: Response) {
  try {
    const { orderId, amount, orderInfo, extraData } = req.body;

    if (!orderId || !amount || amount <= 0) {
      return res.status(400).json({
        ok: false,
        message: 'Missing or invalid orderId or amount.',
      });
    }

    const result = await createMoMoPayment({
      orderId,
      amount,
      orderInfo: orderInfo || `Thanh toan don hang ${orderId}`,
      extraData,
    });

    res.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create MoMo payment';
    res.status(500).json({ ok: false, message });
  }
}

export async function momoReturnHandler(req: Request, res: Response) {
  try {
    const params = req.query as Record<string, string>;
    const result = await verifyMoMoCallback(params);

    if (result.isSuccess && result.orderId) {
      await updateOrderPaymentStatus(result.orderId, 'paid', result.transactionId);
    }

    const redirectUrl = process.env.FRONTEND_URL || 'http://localhost:8081';
    res.redirect(`${redirectUrl}/order-success?orderId=${result.orderId || ''}&status=${result.isSuccess ? 'success' : 'failed'}&message=${encodeURIComponent(result.message)}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'MoMo return handler failed';
    const redirectUrl = process.env.FRONTEND_URL || 'http://localhost:8081';
    res.redirect(`${redirectUrl}/order-success?status=failed&message=${encodeURIComponent(message)}`);
  }
}

export async function momoIpnHandler(req: Request, res: Response) {
  try {
    const params = req.body as Record<string, string>;
    const result = await verifyMoMoCallback(params);

    if (result.isSuccess && result.orderId) {
      await updateOrderPaymentStatus(result.orderId, 'paid', result.transactionId);
    }

    res.status(204).send();
  } catch (error) {
    res.status(204).send();
  }
}

export async function createVisaPaymentHandler(req: Request, res: Response) {
  try {
    const { orderId, amount, orderInfo, clientReturnUrl } = req.body;

    if (!orderId || !amount || Number(amount) <= 0) {
      return res.status(400).json({
        ok: false,
        message: 'Missing or invalid orderId or amount.',
      });
    }

    const ipAddr = req.headers['x-forwarded-for']?.toString().split(',')[0] ||
      req.socket.remoteAddress ||
      '127.0.0.1';
    const backendBaseUrl = getBackendBaseUrl(req);

    const result = await createVisaPayment({
      orderId: String(orderId),
      amount: Number(amount),
      orderInfo: orderInfo || `Thanh toan the quoc te don hang ${orderId}`,
      ipAddr,
      returnUrl: `${backendBaseUrl}/api/payments/visa/return`,
    });

    if (typeof clientReturnUrl === 'string' && clientReturnUrl.trim()) {
      visaClientReturnUrls.set(String(orderId), clientReturnUrl.trim());
    }

    res.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create Visa / Mastercard payment';
    res.status(500).json({ ok: false, message });
  }
}

export async function visaReturnHandler(req: Request, res: Response) {
  try {
    const params = req.query as Record<string, string>;
    const result = await verifyVisaReturn(params);

    if (result.orderId) {
      await updateOrderPaymentStatus(result.orderId, result.isSuccess ? 'paid' : 'failed', result.transactionId);
    }

    const total = Number(params.vnp_Amount || 0) > 0 ? String(Math.round(Number(params.vnp_Amount) / 100)) : '';
    const clientReturnUrl = result.orderId ? visaClientReturnUrls.get(result.orderId) : undefined;
    if (result.orderId) visaClientReturnUrls.delete(result.orderId);

    res.redirect(buildPaymentRedirectUrl(clientReturnUrl, {
      orderId: result.orderId || '',
      total,
      paymentMethod: 'visa',
      status: result.isSuccess ? 'success' : 'failed',
      message: result.message,
    }));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Visa / Mastercard return handler failed';
    res.redirect(buildPaymentRedirectUrl(undefined, {
      paymentMethod: 'visa',
      status: 'failed',
      message,
    }));
  }
}

export async function visaIpnHandler(req: Request, res: Response) {
  try {
    const params = (Object.keys(req.body || {}).length ? req.body : req.query) as Record<string, string>;
    const result = await verifyVisaReturn(params);

    if (result.orderId) {
      await updateOrderPaymentStatus(result.orderId, result.isSuccess ? 'paid' : 'failed', result.transactionId);
    }

    res.status(204).send();
  } catch {
    res.status(204).send();
  }
}

export async function createBankTransferPaymentHandler(req: Request, res: Response) {
  try {
    const { orderId, amount, payerName } = req.body;

    if (!orderId || !amount || Number(amount) <= 0) {
      return res.status(400).json({
        ok: false,
        message: 'Missing or invalid orderId or amount.',
      });
    }

    const result = await createBankTransferPayment({
      orderId: String(orderId),
      amount: Number(amount),
      payerName: String(payerName || 'Khach hang'),
    });

    res.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create bank transfer payment';
    res.status(500).json({ ok: false, message });
  }
}

export async function bankTransferWebhookHandler(req: Request, res: Response) {
  try {
    const config = await getBankTransferConfig();
    const signature = String(req.headers.signature || req.headers.Signature || '').trim();

    if (!config.webhookSignature || signature !== config.webhookSignature) {
      return res.status(401).send('Chu ky khong hop le.');
    }

    const transactions = Array.isArray(req.body?.transactions) ? req.body.transactions : [];
    const matched = await processBankTransactions(transactions);

    for (const transaction of matched) {
      await updateOrderPaymentStatus(transaction.orderId, 'paid', transaction.transactionId);
    }

    res.json({ status: true, msg: 'OK', matched: matched.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to process bank transfer webhook';
    res.status(500).json({ status: false, msg: message });
  }
}

export async function syncBankTransferTransactionsHandler(_req: Request, res: Response) {
  try {
    const transactions = await fetchBankTransactionsFromProvider();
    const matched = await processBankTransactions(transactions);

    for (const transaction of matched) {
      await updateOrderPaymentStatus(transaction.orderId, 'paid', transaction.transactionId);
    }

    res.json({ ok: true, matched: matched.length, transactions: transactions.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to sync bank transfer transactions';
    res.status(500).json({ ok: false, message });
  }
}

export async function bankTransferStatusHandler(req: Request, res: Response) {
  try {
    const { pool } = await import('../../lib/mysql');
    const orderId = String(req.params.orderId || '').trim();
    const [rows] = await pool.query<any[]>(
      `SELECT order_code, total_amount, payment_status, order_status
       FROM orders
       WHERE id = ? OR order_code = ?
       LIMIT 1`,
      [orderId, orderId]
    );

    if (!rows[0]) {
      return res.status(404).json({ ok: false, message: 'Order not found.' });
    }

    const order = rows[0];
    res.json({
      ok: true,
      orderId: order.order_code || orderId,
      total: Number(order.total_amount || 0),
      paymentStatus: order.payment_status,
      orderStatus: order.order_status,
      paid: order.payment_status === 'paid' || order.order_status === 'completed',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get bank transfer status';
    res.status(500).json({ ok: false, message });
  }
}

async function updateOrderPaymentStatus(orderId: string, paymentStatus: string, transactionId?: string) {
  const { pool } = await import('../../lib/mysql');
  const orderStatus = paymentStatus === 'paid' ? 'completed' : 'pending';
  const [result] = await pool.query<any>(
    `UPDATE orders
     SET payment_status = ?,
         order_status = ?,
         timeline = JSON_ARRAY_APPEND(
           COALESCE(timeline, JSON_ARRAY()),
           '$',
           JSON_OBJECT('status', ?, 'label', ?, 'transactionId', ?, 'createdAt', NOW())
         ),
         updated_at = NOW()
     WHERE (id = ? OR order_code = ?)
       AND (payment_status <> ? OR order_status <> ?)`,
    [
      paymentStatus,
      orderStatus,
      paymentStatus,
      paymentStatus === 'paid' ? 'Payment confirmed' : 'Payment failed',
      transactionId || null,
      orderId,
      orderId,
      paymentStatus,
      orderStatus,
    ]
  );

  if (paymentStatus === 'paid' && Number(result?.affectedRows || 0) > 0) {
    await pool.query(
      `UPDATE users u
       INNER JOIN orders o ON o.user_id = u.id
       SET u.orders_count = u.orders_count + 1
       WHERE o.id = ? OR o.order_code = ?`,
      [orderId, orderId]
    ).catch(() => undefined);

    await pool.query(
      `DELETE uc
       FROM user_cart uc
       INNER JOIN orders o ON o.user_id = uc.user_id
       WHERE o.id = ? OR o.order_code = ?`,
      [orderId, orderId]
    ).catch(() => undefined);
  }

  return Number(result?.affectedRows || 0) > 0;
}

function buildPaymentRedirectUrl(clientReturnUrl: string | undefined, params: Record<string, string>) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8081';
  const base = clientReturnUrl?.trim()
    || `${frontendUrl.replace(/\/$/, '')}/order-success`;
  const target = new URL(base);

  for (const [key, value] of Object.entries(params)) {
    target.searchParams.set(key, value);
  }

  return target.toString();
}

function getBackendBaseUrl(req: Request) {
  const configured = process.env.BACKEND_URL || process.env.PUBLIC_BACKEND_URL;
  if (configured) return configured.replace(/\/$/, '');

  const proto = (req.headers['x-forwarded-proto']?.toString().split(',')[0] || req.protocol || 'http').trim();
  const host = req.headers.host || 'localhost:3000';
  return `${proto}://${host}`;
}

async function validateVNPayPaymentUrl(paymentUrl: string) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(paymentUrl, { redirect: 'manual', signal: controller.signal });
    clearTimeout(timeout);
    const location = response.headers.get('location') || '';
    return {
      invalidSignature: location.includes('/paymentv2/Payment/Error.html?code=70'),
    };
  } catch {
    return { invalidSignature: false };
  }
}
