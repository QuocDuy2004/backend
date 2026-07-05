import jwt from 'jsonwebtoken';
import { env } from '../config/env';

const sheetsScope = 'https://www.googleapis.com/auth/spreadsheets';
const tokenUrl = 'https://oauth2.googleapis.com/token';
const sheetsApiUrl = 'https://sheets.googleapis.com/v4/spreadsheets';

export const orderSheetHeaders = [
  'ID',
  'UID',
  'Đường dẫn',
  'Ban đầu',
  'Số lượng',
  'Target',
  'Thời gian',
  'Status',
  'Dữ liệu gốc',
];

type TokenCache = {
  accessToken: string;
  expiresAt: number;
};

let tokenCache: TokenCache | null = null;
let sheetTitleCache: string | null = null;

function assertGoogleConfig() {
  if (!env.googleSpreadsheetId) {
    throw new Error('Missing GOOGLE_SPREADSHEET_ID.');
  }

  if (!env.googleClientEmail || !env.googlePrivateKey) {
    throw new Error(
      'Missing GOOGLE_CLIENT_EMAIL or GOOGLE_PRIVATE_KEY. Share the spreadsheet with the service account email before syncing.'
    );
  }
}

function quoteSheetTitle(title: string) {
  return `'${title.replace(/'/g, "''")}'`;
}

async function getGoogleAccessToken() {
  assertGoogleConfig();

  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) {
    return tokenCache.accessToken;
  }

  const now = Math.floor(Date.now() / 1000);
  const assertion = jwt.sign(
    {
      iss: env.googleClientEmail,
      scope: sheetsScope,
      aud: tokenUrl,
      iat: now,
      exp: now + 3600,
    },
    env.googlePrivateKey,
    { algorithm: 'RS256' }
  );

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error_description || data.error || 'Failed to get Google access token.');
  }

  tokenCache = {
    accessToken: data.access_token,
    expiresAt: Date.now() + Number(data.expires_in || 3600) * 1000,
  };

  return tokenCache.accessToken;
}

async function sheetsRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const accessToken = await getGoogleAccessToken();
  const response = await fetch(`${sheetsApiUrl}/${env.googleSpreadsheetId}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(data.error?.message || 'Google Sheets request failed.');
  }

  return data as T;
}

export async function resolveOrderSheetTitle() {
  if (sheetTitleCache) return sheetTitleCache;

  const spreadsheet = await sheetsRequest<{
    sheets?: Array<{ properties?: { sheetId?: number; title?: string } }>;
  }>('?fields=sheets.properties(sheetId,title)');

  const gid = Number(env.googleSheetGid || 0);
  const sheet =
    spreadsheet.sheets?.find((item) => item.properties?.sheetId === gid) || spreadsheet.sheets?.[0];

  if (!sheet?.properties?.title) {
    throw new Error(`Sheet tab with gid ${env.googleSheetGid} was not found.`);
  }

  sheetTitleCache = sheet.properties.title;
  return sheetTitleCache;
}

export async function ensureOrderSheetHeaders() {
  const title = await resolveOrderSheetTitle();
  const range = `${quoteSheetTitle(title)}!A1:I1`;

  const data = await sheetsRequest<{ values?: string[][] }>(
    `/values/${encodeURIComponent(range)}?majorDimension=ROWS`
  );

  const currentHeaders = data.values?.[0] || [];
  const hasIdHeader = currentHeaders[0] === orderSheetHeaders[0];

  if (hasIdHeader) {
    return;
  }

  await sheetsRequest(`/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    body: JSON.stringify({ values: [orderSheetHeaders] }),
  });
}

export async function getOrderSheetRows() {
  await ensureOrderSheetHeaders();
  const title = await resolveOrderSheetTitle();
  const range = `${quoteSheetTitle(title)}!A2:I`;

  const data = await sheetsRequest<{ values?: any[][] }>(
    `/values/${encodeURIComponent(range)}?majorDimension=ROWS`
  );

  return (data.values || []).map((values, index) => ({
    rowNumber: index + 2,
    values,
    id: String(values[0] || '').trim(),
  }));
}

export async function upsertOrderSheetRow(orderId: string, values: any[]) {
  await ensureOrderSheetHeaders();
  const title = await resolveOrderSheetTitle();
  const rows = await getOrderSheetRows();
  const existing = rows.find((row) => row.id === orderId);
  const range = existing
    ? `${quoteSheetTitle(title)}!A${existing.rowNumber}:I${existing.rowNumber}`
    : `${quoteSheetTitle(title)}!A:I`;
  const method = existing ? 'PUT' : 'POST';
  const suffix = existing ? '?valueInputOption=USER_ENTERED' : ':append?valueInputOption=USER_ENTERED';

  return sheetsRequest(`/values/${encodeURIComponent(range)}${suffix}`, {
    method,
    body: JSON.stringify({ values: [values] }),
  });
}

export async function appendOrderSheetRows(values: any[][]) {
  if (!values.length) {
    return { updates: { updatedRows: 0 } };
  }

  await ensureOrderSheetHeaders();
  const title = await resolveOrderSheetTitle();
  const range = `${quoteSheetTitle(title)}!A:I`;

  return sheetsRequest(`/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`, {
    method: 'POST',
    body: JSON.stringify({ values }),
  });
}
