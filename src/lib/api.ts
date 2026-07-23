type QueryValue = string | number | boolean | null | undefined;

type ApiRequestOptions = RequestInit & {
  query?: Record<string, QueryValue>;
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

const buildUrl = (path: string, query?: Record<string, QueryValue>) => {
  const basePath = path.startsWith('/api') ? path : `/api${path.startsWith('/') ? path : `/${path}`}`;
  const params = new URLSearchParams();

  Object.entries(query || {}).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') return;
    params.set(key, String(value));
  });

  const queryString = params.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
};

const readJson = async (response: Response) => {
  if (response.status === 204) return null;

  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

export async function apiFetch<T = unknown>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { query, headers, body, ...requestOptions } = options;
  const response = await fetch(buildUrl(path, query), {
    ...requestOptions,
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
        : `API request failed with status ${response.status}`;

    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}

const withJsonBody = (body?: unknown) => (body === undefined ? undefined : JSON.stringify(body));

export const adminApi = {
  get: <T = unknown>(path: string, query?: Record<string, QueryValue>) => apiFetch<T>(path, { method: 'GET', query }),
  post: <T = unknown>(path: string, body?: unknown) => apiFetch<T>(path, { method: 'POST', body: withJsonBody(body) }),
  put: <T = unknown>(path: string, body?: unknown) => apiFetch<T>(path, { method: 'PUT', body: withJsonBody(body) }),
  patch: <T = unknown>(path: string, body?: unknown) => apiFetch<T>(path, { method: 'PATCH', body: withJsonBody(body) }),
  delete: <T = unknown>(path: string) => apiFetch<T>(path, { method: 'DELETE' }),
};

export type ApiListResponse<TName extends string, TItem> = {
  ok: boolean;
} & Record<TName, TItem[]>;

export type ApiItemResponse<TName extends string, TItem> = {
  ok: boolean;
} & Record<TName, TItem>;

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

export type BannerPayload = Record<string, unknown>;

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

export const authApi = {
  login: (payload: { usernameOrEmail: string; password: string }) =>
    adminApi.post<any>('/auth/login', payload),
};

export const settingsApi = {
  list: (includeInactive = false) =>
    adminApi.get<ApiListResponse<'settings', any>>('/settings', { includeInactive }),
  save: (key: string, payload: SettingPayload) =>
    adminApi.put<ApiItemResponse<'setting', any>>(`/settings/${encodeURIComponent(key)}`, payload),
};

export const paymentsApi = {
  list: (includeInactive = false) =>
    adminApi.get<ApiListResponse<'payments', any>>('/payments', { includeInactive }),
  create: (payload: PaymentPayload & { code: string; title: string }) =>
    adminApi.post<ApiItemResponse<'payment', any>>('/payments', payload),
  save: (code: string, payload: PaymentPayload) =>
    adminApi.put<ApiItemResponse<'payment', any>>(`/payments/${encodeURIComponent(code)}`, payload),
  remove: (code: string) =>
    adminApi.delete<{ ok: boolean }>(`/payments/${encodeURIComponent(code)}`),
  validateVnpay: (payload: Record<string, unknown>) =>
    adminApi.post<any>('/payments/vnpay/validate-config', payload),
};

export const aiApi = {
  describeProduct: (payload: Record<string, unknown>) =>
    adminApi.post<any>('/ai/describe-product', payload),
  optimizeSeo: (payload: Record<string, unknown>) =>
    adminApi.post<any>('/ai/seo-optimize', payload),
  suggestReply: (payload: Record<string, unknown>) =>
    adminApi.post<any>('/ai/suggest-reply', payload),
};

export const categoriesApi = {
  create: (payload: Record<string, unknown>) =>
    adminApi.post<ApiItemResponse<'category', any>>('/categories', payload),
  update: (id: string, payload: Record<string, unknown>) =>
    adminApi.put<ApiItemResponse<'category', any>>(`/categories/${encodeURIComponent(id)}`, payload),
  changeLogs: (id: string) =>
    adminApi.get<ApiListResponse<'logs', EntityChangeLog>>(`/categories/${encodeURIComponent(id)}/change-logs`),
  remove: (id: string, transferTarget = 'Uncategorized') =>
    apiFetch<{ ok: boolean }>(`/categories/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: withJsonBody({ transferTarget }),
    }),
};

export const productsApi = {
  changeLogs: (id: string) =>
    adminApi.get<ApiListResponse<'logs', EntityChangeLog>>(`/products/${encodeURIComponent(id)}/change-logs`),
};

export const usersApi = {
  changeLogs: (id: string) =>
    adminApi.get<ApiListResponse<'logs', EntityChangeLog>>(`/users/${encodeURIComponent(id)}/change-logs`),
};

export const bannersApi = {
  list: (includeInactive = false) =>
    adminApi.get<ApiListResponse<'banners', any>>('/banners', { includeInactive }),
  create: (payload: BannerPayload) =>
    adminApi.post<ApiItemResponse<'banner', any>>('/banners', payload),
  update: (id: string, payload: BannerPayload) =>
    adminApi.put<ApiItemResponse<'banner', any>>(`/banners/${encodeURIComponent(id)}`, payload),
  remove: (id: string) =>
    adminApi.delete<{ ok: boolean }>(`/banners/${encodeURIComponent(id)}`),
  toggle: (id: string) =>
    adminApi.patch<ApiItemResponse<'banner', any>>(`/banners/${encodeURIComponent(id)}/toggle`),
  changeLogs: (id: string) =>
    adminApi.get<ApiListResponse<'logs', EntityChangeLog>>(`/banners/${encodeURIComponent(id)}/change-logs`),
};

export const notificationsApi = {
  list: (userId?: string) =>
    adminApi.get<ApiListResponse<'notifications', any>>('/notifications', userId ? { userId } : undefined),
  create: (payload: Record<string, unknown>) =>
    adminApi.post<ApiItemResponse<'notification', any>>('/notifications', payload),
  archive: (id: string) =>
    adminApi.delete<{ ok: boolean }>(`/notifications/${encodeURIComponent(id)}`),
  markRead: (id: string, payload: Record<string, unknown>) =>
    adminApi.patch<{ ok: boolean }>(`/notifications/${encodeURIComponent(id)}/read`, payload),
};

export const marketingApi = {
  sendPromotionalEmail: (payload: Record<string, unknown>) =>
    adminApi.post<{
      ok: boolean;
      messageId?: string;
      accepted: string[];
      rejected: string[];
      sent: number;
      failed: number;
      recipients: number;
    }>('/marketing/email/send', payload),
};

export const supportApi = {
  listTickets: () =>
    adminApi.get<ApiListResponse<'tickets', any>>('/support/tickets'),
  saveTicket: (ticket: Record<string, unknown>) =>
    adminApi.post<ApiItemResponse<'ticket', any>>('/support/tickets', ticket),
  updateTicket: (id: string, payload: Record<string, unknown>) =>
    adminApi.put<ApiItemResponse<'ticket', any>>(`/support/tickets/${encodeURIComponent(id)}`, payload),
  addMessage: (ticketId: string, message: Record<string, unknown>) =>
    adminApi.post<ApiItemResponse<'ticket', any>>(`/support/tickets/${encodeURIComponent(ticketId)}/messages`, message),
};

export const dashboardApi = {
  bootstrapSettings: () => Promise.all([
    settingsApi.list(true),
    paymentsApi.list(true),
    adminApi.get<ApiListResponse<'users', any>>('/users'),
    adminApi.get<ApiListResponse<'notifications', any>>('/notifications'),
  ]),
};
