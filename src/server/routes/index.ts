import { Router } from 'express';
import * as ai from '../ai';
import * as auth from '../auth';
import * as banners from '../banners';
import * as categories from '../categories';
import * as notifications from '../notifications';
import * as orders from '../orders';
import * as orderSync from '../order-sync';
import * as marketing from '../marketing';
import * as payments from '../payments';
import * as products from '../products';
import * as settings from '../settings';
import * as support from '../support';
import * as users from '../users';
import * as vouchers from '../vouchers';
import { testDatabaseConnection } from '../../lib/mysql';

const routeGroups = [
  { basePath: '/health', module: 'health', database: true },
  { basePath: '/auth', module: 'auth', database: true },
  { basePath: '/users', module: 'users', database: true },
  { basePath: '/categories', module: 'categories', database: true },
  { basePath: '/banners', module: 'banners', database: true },
  { basePath: '/products', module: 'products', database: true },
  { basePath: '/payments', module: 'payments', database: true },
  { basePath: '/settings', module: 'settings', database: true },
  { basePath: '/support', module: 'support', database: true },
  { basePath: '/notifications', module: 'notifications', database: true },
  { basePath: '/marketing', module: 'marketing', database: true },
  { basePath: '/orders', module: 'orders', database: true },
  { basePath: '/vouchers', module: 'vouchers', database: true },
  { basePath: '/ai', module: 'ai', database: true },
  { basePath: '/order-sync', module: 'order-sync', database: true },
];

const healthRouter = Router();
healthRouter.get('/db', async (_req, res) => {
  try {
    const [database] = (await testDatabaseConnection()) as any[];
    res.json({ ok: true, database });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Database connection failed';
    res.status(500).json({ ok: false, message });
  }
});

const authRouter = Router();
authRouter.post('/register', auth.register);
authRouter.post('/login', auth.login);

const usersRouter = Router();
usersRouter.get('/email/:email', users.getUserByEmail);
usersRouter.get('/', users.getUsers);
usersRouter.post('/', users.createUserHandler);
usersRouter.get('/:id/change-logs', users.getUserChangeLogs);
usersRouter.get('/:id/cart', users.getUserCartHandler);
usersRouter.post('/:id/cart/:productId', users.addUserCartProductHandler);
usersRouter.delete('/:id/cart/:productId', users.removeUserCartProductHandler);
usersRouter.get('/:id/favorites', users.getUserFavoritesHandler);
usersRouter.post('/:id/favorites/:productId', users.addUserFavoriteProductHandler);
usersRouter.delete('/:id/favorites/:productId', users.removeUserFavoriteProductHandler);
usersRouter.put('/:id', users.updateUserHandler);
usersRouter.delete('/:id', users.deleteUserHandler);

const categoriesRouter = Router();
categoriesRouter.get('/', categories.getCategories);
categoriesRouter.get('/:id/change-logs', categories.getCategoryChangeLogs);
categoriesRouter.post('/', categories.createCategoryHandler);
categoriesRouter.put('/:id', categories.updateCategoryHandler);
categoriesRouter.delete('/:id', categories.deleteCategoryHandler);

const bannersRouter = Router();
bannersRouter.get('/', banners.getBanners);
bannersRouter.get('/:id/change-logs', banners.getBannerChangeLogs);
bannersRouter.post('/', banners.createBannerHandler);
bannersRouter.put('/:id', banners.updateBannerHandler);
bannersRouter.patch('/:id/toggle', banners.toggleBannerStatusHandler);
bannersRouter.delete('/:id', banners.deleteBannerHandler);

const productsRouter = Router();
productsRouter.get('/', products.getProducts);
productsRouter.get('/:id/change-logs', products.getProductChangeLogs);
productsRouter.post('/', products.createProductHandler);
productsRouter.put('/:id', products.updateProductHandler);
productsRouter.delete('/:id', products.deleteProductHandler);

const paymentsRouter = Router();
paymentsRouter.get('/', payments.getPayments);
paymentsRouter.post('/', payments.createPaymentHandler);
paymentsRouter.put('/:code', payments.updatePaymentHandler);
paymentsRouter.delete('/:code', payments.deletePaymentHandler);
paymentsRouter.post('/vnpay/create', payments.createVNPayPaymentHandler);
paymentsRouter.post('/vnpay/token/create', payments.createVNPayTokenHandler);
paymentsRouter.post('/vnpay/validate-config', payments.validateVNPayConfigHandler);
paymentsRouter.get('/vnpay/return', payments.vnpayReturnHandler);
paymentsRouter.get('/vnpay/token/return', payments.vnpayTokenReturnHandler);
paymentsRouter.get('/vnpay/token/cancel', payments.vnpayTokenCancelHandler);
paymentsRouter.get('/vnpay/tryitnow/confirm', payments.confirmVNPayTryItNowRedirectHandler);
paymentsRouter.post('/vnpay/tryitnow/confirm', payments.confirmVNPayTryItNowHandler);
paymentsRouter.post('/momo/create', payments.createMoMoPaymentHandler);
paymentsRouter.get('/momo/return', payments.momoReturnHandler);
paymentsRouter.post('/momo/ipn', payments.momoIpnHandler);
paymentsRouter.post('/visa/create', payments.createVisaPaymentHandler);
paymentsRouter.get('/visa/return', payments.visaReturnHandler);
paymentsRouter.post('/visa/ipn', payments.visaIpnHandler);
paymentsRouter.post('/bank-transfer/create', payments.createBankTransferPaymentHandler);
paymentsRouter.post('/bank-transfer/webhook', payments.bankTransferWebhookHandler);
paymentsRouter.post('/bank-transfer/sync', payments.syncBankTransferTransactionsHandler);
paymentsRouter.get('/bank-transfer/status/:orderId', payments.bankTransferStatusHandler);

const settingsRouter = Router();
settingsRouter.get('/', settings.getSettings);
settingsRouter.put('/:key', settings.upsertSettingHandler);

const supportRouter = Router();
supportRouter.get('/tickets', support.getSupportTickets);
supportRouter.get('/tickets/:id', support.getSupportTicket);
supportRouter.post('/tickets', support.upsertSupportTicketHandler);
supportRouter.put('/tickets/:id', support.updateSupportTicketHandler);
supportRouter.post('/tickets/:id/messages', support.addSupportMessageHandler);

const notificationsRouter = Router();
notificationsRouter.get('/', notifications.getNotifications);
notificationsRouter.post('/', notifications.createNotificationHandler);
notificationsRouter.patch('/:id/read', notifications.markReadHandler);
notificationsRouter.delete('/:id', notifications.archiveNotificationHandler);

const marketingRouter = Router();
marketingRouter.post('/email/send', marketing.sendMarketingEmailHandler);

const ordersRouter = Router();
ordersRouter.get('/', orders.getOrders);
ordersRouter.post('/', orders.createOrderHandler);
ordersRouter.get('/:id', orders.getOrder);

const vouchersRouter = Router();
vouchersRouter.get('/', vouchers.getVouchers);

const aiRouter = Router();
aiRouter.post('/describe-product', ai.describeProduct);
aiRouter.post('/seo-optimize', ai.optimizeSeo);
aiRouter.post('/suggest-reply', ai.suggestReply);
aiRouter.post('/customer-support', ai.customerSupportChat);
aiRouter.post('/demand-forecast', ai.forecastDemand);

const orderSyncRouter = Router();
orderSyncRouter.get('/list-order', orderSync.listOrders);
orderSyncRouter.get('/preview', orderSync.previewSheetRows);
orderSyncRouter.get('/sheet-orders', orderSync.getSheetOrders);
orderSyncRouter.post('/append-list-orders-to-sheet', orderSync.appendListOrders);
orderSyncRouter.post('/list-order-to-sheet', orderSync.syncListOrder);

export const apiRouter = Router();

apiRouter.get('/meta/routes', (_req, res) => {
  res.json({ ok: true, groups: routeGroups });
});

apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/users', usersRouter);
apiRouter.use('/categories', categoriesRouter);
apiRouter.use('/banners', bannersRouter);
apiRouter.use('/products', productsRouter);
apiRouter.use('/payments', paymentsRouter);
apiRouter.use('/settings', settingsRouter);
apiRouter.use('/support', supportRouter);
apiRouter.use('/notifications', notificationsRouter);
apiRouter.use('/marketing', marketingRouter);
apiRouter.use('/orders', ordersRouter);
apiRouter.use('/vouchers', vouchersRouter);
apiRouter.use('/ai', aiRouter);
apiRouter.use('/order-sync', orderSyncRouter);
