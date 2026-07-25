import mysql from 'mysql2/promise';
import { env } from '../server/config/env';

const { url, host, port, user, password, name: database, ssl, connectionLimit } = env.database;

function buildDatabaseConfig() {
  if (url) {
    const parsed = new URL(url);
    const urlSsl = parsed.searchParams.get('ssl');
    const shouldUseSsl =
      urlSsl === 'true' || urlSsl === '1' || ssl;

    return {
      host: parsed.hostname,
      port: Number(parsed.port) || 3306,
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database: parsed.pathname.replace(/^\/+/, '') || database,
      waitForConnections: true,
      connectionLimit,
      queueLimit: 0,
      namedPlaceholders: true,
      ...(shouldUseSsl && { ssl: { rejectUnauthorized: false } }),
    };
  }

  return {
    host, port, user, password, database,
    waitForConnections: true,
    connectionLimit,
    queueLimit: 0,
    namedPlaceholders: true,
    ...(ssl && { ssl: { rejectUnauthorized: false } }),
  };
}

export const databaseConfig = buildDatabaseConfig();

export const pool = mysql.createPool(databaseConfig);

export async function testDatabaseConnection() {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query('SELECT DATABASE() AS databaseName, NOW() AS serverTime');
    return rows;
  } finally {
    connection.release();
  }
}
