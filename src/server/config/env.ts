import dotenv from 'dotenv';

dotenv.config({ path: '.env.local', quiet: true });
dotenv.config({ quiet: true });

const numberFromEnv = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const env = {
  port: numberFromEnv(process.env.PORT, 3000),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'omnishop-local-dev-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  database: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: numberFromEnv(process.env.DB_PORT, 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_DATABASE || 'demo',
    connectionLimit: numberFromEnv(process.env.DB_CONNECTION_LIMIT, 10),
  },
  smmkayApiUrl: process.env.SMMKAY_API_URL || 'https://smmkay.com/api/adminv1',
  smmkayApiKey: process.env.SMMKAY_API_KEY || '',
  smmkayServiceId: process.env.SMMKAY_SERVICE_ID || '1944',
  googleSpreadsheetId: process.env.GOOGLE_SPREADSHEET_ID || '1a1RbH5pvRwDF_mUrwcJWDTwcR3XCJv8fh3Pmy8-VtdM',
  googleSheetGid: process.env.GOOGLE_SHEET_GID || '1590614847',
  googleClientEmail: process.env.GOOGLE_CLIENT_EMAIL || '',
  googlePrivateKey: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
};
