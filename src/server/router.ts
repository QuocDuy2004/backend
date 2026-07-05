import { Router } from 'express';
import * as ai from './ai';
import * as auth from './auth';
import * as banners from './banners';
import * as categories from './categories';
import * as notifications from './notifications';
import * as orderSync from './order-sync';
import * as payments from './payments';
import * as products from './products';
import * as settings from './settings';
import * as users from './users';
import { testDatabaseConnection } from '../lib/mysql';

export const apiRouter = Router();

apiRouter.get('/health/db', async (_req, res) => {
  try {
    const [database] = (await testDatabaseConnection()) as any[];
    res.json({ ok: true, database });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Database connection failed';
    res.status(500).json({ ok: false, message });
  }
});

apiRouter.post('/auth/register', auth.register);
apiRouter.post('/auth/login', auth.login);

apiRouter.get('/users/email/:email', users.getUserByEmail);
apiRouter.get('/users', users.getUsers);
apiRouter.post('/users', users.createUserHandler);
apiRouter.put('/users/:id', users.updateUserHandler);
apiRouter.delete('/users/:id', users.deleteUserHandler);

apiRouter.get('/categories', categories.getCategories);
apiRouter.post('/categories', categories.createCategoryHandler);
apiRouter.put('/categories/:id', categories.updateCategoryHandler);
apiRouter.delete('/categories/:id', categories.deleteCategoryHandler);

apiRouter.get('/banners', banners.getBanners);
apiRouter.post('/banners', banners.createBannerHandler);
apiRouter.put('/banners/:id', banners.updateBannerHandler);
apiRouter.patch('/banners/:id/toggle', banners.toggleBannerStatusHandler);
apiRouter.delete('/banners/:id', banners.deleteBannerHandler);

apiRouter.get('/products', products.getProducts);
apiRouter.post('/products', products.createProductHandler);
apiRouter.put('/products/:id', products.updateProductHandler);
apiRouter.delete('/products/:id', products.deleteProductHandler);

apiRouter.get('/payments', payments.getPayments);
apiRouter.put('/payments/:code', payments.updatePaymentHandler);

apiRouter.get('/settings', settings.getSettings);
apiRouter.put('/settings/:key', settings.upsertSettingHandler);

apiRouter.get('/notifications', notifications.getNotifications);
apiRouter.post('/notifications', notifications.createNotificationHandler);
apiRouter.patch('/notifications/:id/read', notifications.markReadHandler);
apiRouter.delete('/notifications/:id', notifications.archiveNotificationHandler);

apiRouter.post('/ai/describe-product', ai.describeProduct);
apiRouter.post('/ai/seo-optimize', ai.optimizeSeo);
apiRouter.post('/ai/suggest-reply', ai.suggestReply);
apiRouter.post('/ai/demand-forecast', ai.forecastDemand);

apiRouter.get('/order-sync/list-order', orderSync.listOrders);
apiRouter.get('/order-sync/preview', orderSync.previewSheetRows);
apiRouter.get('/order-sync/sheet-orders', orderSync.getSheetOrders);
apiRouter.post('/order-sync/append-list-orders-to-sheet', orderSync.appendListOrders);
apiRouter.post('/order-sync/list-order-to-sheet', orderSync.syncListOrder);
