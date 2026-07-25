
import type {
  Product, Category, Banner, Customer, Order,
  SupportTicket, AppNotification, ProductReview,
} from '../types';


const normalizeBaseApiUrl = (value?: string) => {
  const raw = (value || '').trim().replace(/\/+$/, '');
  if (!raw) return '/api';
  return raw.endsWith('/api') ? raw : `${raw}/api`;
};

export const BASE_API_URL = normalizeBaseApiUrl(
  (import.meta.env.VITE_APP_URL || import.meta.env.VITE_API_BASE_URL) as string | undefined,
);
export const BASE = BASE_API_URL;

export const API_BASE_URL = BASE_API_URL;

export const getAppBaseUrl = () => {
  if (typeof window === 'undefined') return '';
  return window.location.origin;
};


type QueryValue = string | number | boolean | null | undefined;

type ApiRequestOptions = RequestInit & {
  query?: Record<string, QueryValue>;
};

export type ApiListResponse<TName extends string, TItem> = {
  ok: boolean;
  message?: string;
} & Record<TName, TItem[]>;

export type ApiItemResponse<TName extends string, TItem> = {
  ok: boolean;
  message?: string;
} & Record<TName, TItem>;

export type ApiOkResponse = { ok: boolean; message?: string };


export type PaymentPayload = {
  code?: string;
  title?: string;
  status?: 'active' | 'inactive' | string;
  logoUri?: string | null;
  logo_uri?: string | null;
  config?: Record<string, unknown>;
};

export type SettingPayload = {
  settingGroup: string;
  title: string;
  value: Record<string, unknown>;
  status?: 'active' | 'inactive' | string;
};

export type BannerPayload = Partial<Banner>;

export type EntityChangeLog = {
  id: string;
  entityType: 'product' | 'category' | 'customer' | 'banner';
  entityId: string;
  entityName?: string;
  action: 'create' | 'update' | 'delete';
  summary: string;
  changes: Record<string, unknown>;
  actorId?: string;
  actorName: string;
  createdAt: string;
};

export type NotificationCreatePayload = Partial<AppNotification> & {
  userIds?: string[];
};


export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}


const buildUrl = (path: string, query?: Record<string, QueryValue>): string => {
  const endpoint = path.replace(/^\/+/, '').replace(/^api\/+/, '');
  const params = new URLSearchParams();
  Object.entries(query ?? {}).forEach(([k, v]) => {
    if (v !== null && v !== undefined && v !== '') params.set(k, String(v));
  });

  const qs = params.toString();
  return `${BASE_API_URL}/${endpoint}${qs ? `?${qs}` : ''}`;
};

const readJson = async (res: Response): Promise<unknown> => {
  if (res.status === 204) return null;
  const text = await res.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return text; }
};

const withBody = (body?: unknown) =>
  body === undefined ? undefined : JSON.stringify(body);

export async function apiFetch<T = unknown>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { query, headers, body, ...rest } = options;
  const response = await fetch(buildUrl(path, query), {
    ...rest,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body,
  });

  const payload = await readJson(response);

  if (!response.ok) {
    const message =
      typeof payload === 'object' && payload && 'message' in payload
        ? String((payload as { message?: unknown }).message)
        : `API error ${response.status}`;
    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}


export const http = {
  get:    <T = unknown>(path: string, query?: Record<string, QueryValue>) =>
    apiFetch<T>(path, { method: 'GET', query }),

  post:   <T = unknown>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: 'POST', body: withBody(body) }),

  put:    <T = unknown>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: 'PUT', body: withBody(body) }),

  patch:  <T = unknown>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: 'PATCH', body: withBody(body) }),

  delete: <T = unknown>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: 'DELETE', body: withBody(body) }),
};

export const adminApi = http;


const enc = (s: string) => encodeURIComponent(s);

export const authApi = {
  login: (payload: { usernameOrEmail: string; password: string }) =>
    http.post<any>('/auth/login', payload),
};

export const productsApi = {
  list:       (query?: Record<string, QueryValue>) =>
    http.get<ApiListResponse<'products', Product>>('/products', query),
  create:     (payload: Partial<Product>) =>
    http.post<ApiItemResponse<'product', Product>>('/products', payload),
  update:     (id: string, payload: Partial<Product>) =>
    http.put<ApiItemResponse<'product', Product>>(`/products/${enc(id)}`, payload),
  remove:     (id: string) =>
    http.delete<ApiOkResponse>(`/products/${enc(id)}`),
  changeLogs: (id: string) =>
    http.get<ApiListResponse<'logs', EntityChangeLog>>(`/products/${enc(id)}/change-logs`),
};

export const categoriesApi = {
  list:       () =>
    http.get<ApiListResponse<'categories', Category>>('/categories'),
  create:     (payload: Partial<Category>) =>
    http.post<ApiItemResponse<'category', Category>>('/categories', payload),
  update:     (id: string, payload: Partial<Category>) =>
    http.put<ApiItemResponse<'category', Category>>(`/categories/${enc(id)}`, payload),
  remove:     (id: string, transferTarget = 'Uncategorized') =>
    apiFetch<ApiOkResponse>(`/categories/${enc(id)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: withBody({ transferTarget }),
    }),
  changeLogs: (id: string) =>
    http.get<ApiListResponse<'logs', EntityChangeLog>>(`/categories/${enc(id)}/change-logs`),
};

export const bannersApi = {
  list:       (includeInactive = false) =>
    http.get<ApiListResponse<'banners', Banner>>('/banners', { includeInactive }),
  create:     (payload: BannerPayload) =>
    http.post<ApiItemResponse<'banner', Banner>>('/banners', payload),
  update:     (id: string, payload: BannerPayload) =>
    http.put<ApiItemResponse<'banner', Banner>>(`/banners/${enc(id)}`, payload),
  remove:     (id: string) =>
    http.delete<ApiOkResponse>(`/banners/${enc(id)}`),
  toggle:     (id: string) =>
    http.patch<ApiItemResponse<'banner', Banner>>(`/banners/${enc(id)}/toggle`),
  changeLogs: (id: string) =>
    http.get<ApiListResponse<'logs', EntityChangeLog>>(`/banners/${enc(id)}/change-logs`),
};

export const usersApi = {
  list:       (query?: Record<string, QueryValue>) =>
    http.get<ApiListResponse<'users', Customer>>('/users', query),
  getByEmail: (email: string) =>
    http.get<ApiItemResponse<'user', Customer>>(`/users/email/${enc(email)}`),
  create:     (payload: Partial<Customer>) =>
    http.post<ApiItemResponse<'user', Customer>>('/users', payload),
  update:     (id: string, payload: Partial<Customer>) =>
    http.put<ApiItemResponse<'user', Customer>>(`/users/${enc(id)}`, payload),
  remove:     (id: string) =>
    http.delete<ApiOkResponse>(`/users/${enc(id)}`),
  changeLogs: (id: string) =>
    http.get<ApiListResponse<'logs', EntityChangeLog>>(`/users/${enc(id)}/change-logs`),
};

export const ordersApi = {
  list:   (query?: Record<string, QueryValue>) =>
    http.get<ApiListResponse<'orders', Order>>('/orders', query),
  get:    (id: string) =>
    http.get<ApiItemResponse<'order', Order>>(`/orders/${enc(id)}`),
  create: (payload: Partial<Order>) =>
    http.post<ApiItemResponse<'order', Order>>('/orders', payload),
};

export const notificationsApi = {
  list:     (userId?: string) =>
    http.get<ApiListResponse<'notifications', AppNotification>>(
      '/notifications', userId ? { userId } : undefined,
    ),
  create:   (payload: NotificationCreatePayload) =>
    http.post<ApiItemResponse<'notification', AppNotification>>('/notifications', payload),
  markRead: (id: string, payload: Record<string, unknown>) =>
    http.patch<ApiOkResponse>(`/notifications/${enc(id)}/read`, payload),
  archive:  (id: string) =>
    http.delete<ApiOkResponse>(`/notifications/${enc(id)}`),
};

export const supportApi = {
  listTickets:  () =>
    http.get<ApiListResponse<'tickets', SupportTicket>>('/support/tickets'),
  getTicket:    (id: string) =>
    http.get<ApiItemResponse<'ticket', SupportTicket>>(`/support/tickets/${enc(id)}`),
  saveTicket:   (payload: Partial<SupportTicket>) =>
    http.post<ApiItemResponse<'ticket', SupportTicket>>('/support/tickets', payload),
  updateTicket: (id: string, payload: Partial<SupportTicket>) =>
    http.put<ApiItemResponse<'ticket', SupportTicket>>(`/support/tickets/${enc(id)}`, payload),
  addMessage:   (ticketId: string, message: Record<string, unknown>) =>
    http.post<ApiItemResponse<'ticket', SupportTicket>>(
      `/support/tickets/${enc(ticketId)}/messages`, message,
    ),
};

export const settingsApi = {
  list: (includeInactive = false) =>
    http.get<ApiListResponse<'settings', any>>('/settings', { includeInactive }),
  save: (key: string, payload: SettingPayload) =>
    http.put<ApiItemResponse<'setting', any>>(`/settings/${enc(key)}`, payload),
};

export const paymentsApi = {
  list:         (includeInactive = false) =>
    http.get<ApiListResponse<'payments', any>>('/payments', { includeInactive }),
  create:       (payload: PaymentPayload & { code: string; title: string }) =>
    http.post<ApiItemResponse<'payment', any>>('/payments', payload),
  save:         (code: string, payload: PaymentPayload) =>
    http.put<ApiItemResponse<'payment', any>>(`/payments/${enc(code)}`, payload),
  remove:       (code: string) =>
    http.delete<ApiOkResponse>(`/payments/${enc(code)}`),
  validateVnpay: (payload: Record<string, unknown>) =>
    http.post<any>('/payments/vnpay/validate-config', payload),
};

export const aiApi = {
  describeProduct: (payload: Record<string, unknown>) =>
    http.post<any>('/ai/describe-product', payload),
  optimizeSeo:     (payload: Record<string, unknown>) =>
    http.post<any>('/ai/seo-optimize', payload),
  suggestReply:    (payload: Record<string, unknown>) =>
    http.post<any>('/ai/suggest-reply', payload),
  forecastDemand:  (payload: Record<string, unknown>) =>
    http.post<any>('/ai/demand-forecast', payload),
};

export const marketingApi = {
  sendPromotionalEmail: (payload: Record<string, unknown>) =>
    http.post<{
      ok: boolean;
      accepted: string[];
      rejected: string[];
      sent: number;
      failed: number;
      recipients: number;
    }>('/marketing/email/send', payload),
};

export const reviewsApi = {
  list:   (query?: Record<string, QueryValue>) =>
    http.get<ApiListResponse<'reviews', ProductReview>>('/reviews', query),
  update: (id: string, payload: Partial<ProductReview>) =>
    http.put<ApiItemResponse<'review', ProductReview>>(`/reviews/${enc(id)}`, payload),
  remove: (id: string) =>
    http.delete<ApiOkResponse>(`/reviews/${enc(id)}`),
};

const _bootstrap = () =>
  Promise.all([
    settingsApi.list(true),
    paymentsApi.list(true),
    usersApi.list(),
    notificationsApi.list(),
  ]);

export const dashboardApi = {
  bootstrap: _bootstrap,
  bootstrapSettings: _bootstrap,
};
