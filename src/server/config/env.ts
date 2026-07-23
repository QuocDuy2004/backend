import dotenv from 'dotenv';

dotenv.config({ path: '.env.local', quiet: true });
dotenv.config({ quiet: true });

export const env = {
  port: Number(process.env.PORT || 3000),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'omnishop-local-dev-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  smmkayApiUrl: process.env.SMMKAY_API_URL || 'https://smmkay.com/api/adminv1',
  smmkayApiKey: process.env.SMMKAY_API_KEY || '',
  smmkayServiceId: process.env.SMMKAY_SERVICE_ID || '1944',
  googleSpreadsheetId:
    process.env.GOOGLE_SPREADSHEET_ID || '1a1RbH5pvRwDF_mUrwcJWDTwcR3XCJv8fh3Pmy8-VtdM',
  googleSheetGid: process.env.GOOGLE_SHEET_GID || '1590614847',
  googleClientEmail: process.env.GOOGLE_CLIENT_EMAIL || '',
  googlePrivateKey: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
};
